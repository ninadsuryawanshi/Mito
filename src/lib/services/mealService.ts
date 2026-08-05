// Meal Service — handles all DB operations for meals
// Called by API routes, never directly from the frontend

import { AIMealAnalysis, MealLog, DashboardStats, TimelineView } from '@/types';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

type SavedMealItemForRules = {
  item_id: string;
  food_entity?: { name: string } | { name: string }[] | null;
};

type MealLogItemInsert = {
  log_id: string;
  food_entity_id: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
};

// ─── Find or Create Food Entity ───────────────────────────────────────────────
// Core of the FoodEntity intelligence layer
// Tries to match existing entity by name, creates if not found

export async function findOrCreateFoodEntity(
  supabase: any,
  itemName: string,
  aiItem: any,
  userId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('food_entities')
    .select('food_id, times_logged, calories_per_unit')
    .textSearch('name', itemName.split(' ').join(' & '), { type: 'plain' })
    .limit(1)
    .single();

  if (existing) {
    const newCalories =
      existing.calories_per_unit != null
        ? (existing.calories_per_unit * existing.times_logged + aiItem.calories) /
        (existing.times_logged + 1)
        : aiItem.calories;

    await supabase
      .from('food_entities')
      .update({
        times_logged: existing.times_logged + 1,
        calories_per_unit: Math.round(newCalories * 10) / 10,
        updated_at: new Date().toISOString(),
      })
      .eq('food_id', existing.food_id);

    return existing.food_id;
  }

  const { data: created, error } = await supabase
    .from('food_entities')
    .insert({
      name: itemName,
      brand: aiItem.brand || null,
      cuisine: aiItem.cuisine || null,
      region: aiItem.region || null,
      standard_unit: aiItem.unit,
      typical_context: aiItem.typical_context || null,
      calories_per_unit: aiItem.calories,
      protein_g_per_unit: aiItem.protein_g,
      carbs_g_per_unit: aiItem.carbs_g,
      fat_g_per_unit: aiItem.fat_g,
      fiber_g_per_unit: aiItem.fiber_g,
      sugar_g_per_unit: aiItem.sugar_g,
      sodium_mg_per_unit: aiItem.sodium_mg,
      times_logged: 1,
      first_logged_by: userId,
    })
    .select('food_id')
    .single();

  if (error) {
    throw new Error(`Failed to create food entity: ${error.message}`);
  }

  return created.food_id;
}

// ─── Save Full Meal ───────────────────────────────────────────────────────────
// Saves meal_log + all meal_log_items in sequence
// Returns the complete saved meal log ID

export async function saveMealWithItems(
  supabase: any,
  userId: string,
  analysis: AIMealAnalysis,
  opts: {
    description?: string;
    photo_url?: string;
    input_method: 'text' | 'photo' | 'quick_reuse';
    meal_type?: string;
    price?: number;
    currency?: string;
    user_edited?: boolean;
    reused_from_log_id?: string;
    logged_at?: string;
  }
): Promise<string> {
  const { data: mealLog, error: mealError } = await supabase
    .from('meal_logs')
    .insert({
      user_id: userId,
      logged_at: opts.logged_at || new Date().toISOString(),
      description_text: opts.description || null,
      photo_url: opts.photo_url || null,
      input_method: opts.input_method,
      reused_from_log_id: opts.reused_from_log_id || null,
      meal_type: opts.meal_type || null,
      eating_context: analysis.eating_context,
      total_calories: Math.round(analysis.total_calories * 10) / 10,
      total_protein_g: Math.round(analysis.total_protein_g * 10) / 10,
      total_carbs_g: Math.round(analysis.total_carbs_g * 10) / 10,
      total_fat_g: Math.round(analysis.total_fat_g * 10) / 10,
      total_fiber_g: Math.round(analysis.total_fiber_g * 10) / 10,
      total_sugar_g: Math.round(analysis.total_sugar_g * 10) / 10,
      total_sodium_mg: Math.round(analysis.total_sodium_mg * 10) / 10,
      user_edited: opts.user_edited || false,
      price: opts.price || null,
      currency: opts.currency || '₹',
      ai_note: analysis.ai_note,
    })
    .select('log_id')
    .single();

  if (mealError) {
    throw new Error(`Failed to save meal: ${mealError.message}`);
  }

  const logId = mealLog.log_id;

  const itemInserts: MealLogItemInsert[] = [];

  for (const item of analysis.items) {
    const foodEntityId = await findOrCreateFoodEntity(supabase, item.name, item, userId);

    itemInserts.push({
      log_id: logId,
      food_entity_id: foodEntityId,
      quantity: item.quantity,
      unit: item.unit,
      calories: Math.round(item.calories * 10) / 10,
      protein_g: Math.round(item.protein_g * 10) / 10,
      carbs_g: Math.round(item.carbs_g * 10) / 10,
      fat_g: Math.round(item.fat_g * 10) / 10,
      fiber_g: Math.round(item.fiber_g * 10) / 10,
      sugar_g: Math.round(item.sugar_g * 10) / 10,
      sodium_mg: Math.round(item.sodium_mg * 10) / 10,
    });
  }

  const { data: savedItems, error: itemsError } = await supabase
    .from('meal_log_items')
    .insert(itemInserts)
    .select(`
      item_id,
      food_entity:food_entities(name)
    `);

  if (itemsError) {
    throw new Error(`Failed to save meal items: ${itemsError.message}`);
  }

  Promise.all([
    savedItems?.length
      ? checkRulesAgainstMeal(
        supabase,
        userId,
        logId,
        (savedItems as SavedMealItemForRules[]).map((item) => ({
          item_id: String(item.item_id),
          food_entity: Array.isArray(item.food_entity)
            ? item.food_entity[0]
            : item.food_entity || undefined,
        }))
      )
      : Promise.resolve(),
  ]).catch(console.error);

  return logId;
}

// ─── Get Meals for Timeline ───────────────────────────────────────────────────
// Used by dashboard — fetches meals for day/week/month view

export async function getMealsForTimeline(
  supabase: any,
  userId: string,
  view: TimelineView,
  date: Date = new Date()
): Promise<MealLog[]> {
  let from: Date;
  let to: Date;

  if (view === 'day') {
    from = startOfDay(date);
    to = endOfDay(date);
  } else if (view === 'week') {
    from = startOfWeek(date, { weekStartsOn: 1 });
    to = endOfWeek(date, { weekStartsOn: 1 });
  } else {
    from = startOfMonth(date);
    to = endOfMonth(date);
  }

  const { data, error } = await supabase
    .from('meal_logs')
    .select(`
      *,
      items:meal_log_items(
        *,
        food_entity:food_entities(food_id, name, brand, cuisine)
      ),
      mood:mood_logs(mood_id, mood_score, logged_at)
    `)
    .eq('user_id', userId)
    .gte('logged_at', from.toISOString())
    .lte('logged_at', to.toISOString())
    .order('logged_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch meals: ${error.message}`);
  }

  return (data || []) as MealLog[];
}

// ─── Get Recent Meals ─────────────────────────────────────────────────────────
// Used for quick-reuse chips on the log screen

export async function getRecentMeals(
  supabase: any,
  userId: string,
  limit: number = 8
): Promise<MealLog[]> {
  const { data, error } = await supabase
    .from('meal_logs')
    .select(`
      log_id,
      meal_type,
      eating_context,
      total_calories,
      logged_at,
      ai_note,
      items:meal_log_items(
        food_entity:food_entities(name)
      )
    `)
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent meals: ${error.message}`);
  }

  return (data || []) as MealLog[];
}

// ─── Compute Dashboard Stats ──────────────────────────────────────────────────
// Aggregates meals array into summary stats for dashboard

export function computeStats(meals: MealLog[]): DashboardStats {
  const stats = meals.reduce<DashboardStats>(
    (acc, m) => ({
      total_calories: acc.total_calories + (m.total_calories || 0),
      total_protein_g: acc.total_protein_g + (m.total_protein_g || 0),
      total_carbs_g: acc.total_carbs_g + (m.total_carbs_g || 0),
      total_fat_g: acc.total_fat_g + (m.total_fat_g || 0),
      total_fiber_g: acc.total_fiber_g + (m.total_fiber_g || 0),
      total_sugar_g: acc.total_sugar_g + (m.total_sugar_g || 0),
      total_sodium_mg: acc.total_sodium_mg + (m.total_sodium_mg || 0),
      total_spend: acc.total_spend + (m.price || 0),
      meals_eaten_out:
        acc.meals_eaten_out +
        (['restaurant', 'ordered_in', 'street'].includes(m.eating_context || '') ? 1 : 0),
      meals_home_cooked:
        acc.meals_home_cooked + (m.eating_context === 'home' ? 1 : 0),
      total_meals: acc.total_meals + 1,
      streak_days: 0,
    }),
    {
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      total_fiber_g: 0,
      total_sugar_g: 0,
      total_sodium_mg: 0,
      total_spend: 0,
      meals_eaten_out: 0,
      meals_home_cooked: 0,
      total_meals: 0,
      streak_days: 0,
    }
  );

  return Object.fromEntries(
    Object.entries(stats).map(([k, v]) => [
      k,
      typeof v === 'number' ? Math.round(v * 10) / 10 : v,
    ])
  ) as DashboardStats;
}

// ─── Check Rules Against Meal ─────────────────────────────────────────────────
// Runs after every meal save — checks item names against user's personal rules
// Inserts rule_traces silently for any matches

export async function checkRulesAgainstMeal(
  supabase: any,
  userId: string,
  logId: string,
  items: Array<{ item_id: string; food_entity?: { name: string } }>
): Promise<any[]> {
  const { data: rules } = await supabase
    .from('personal_rules')
    .select('rule_id, keywords')
    .eq('user_id', userId)
    .eq('active', true);

  if (!rules || rules.length === 0) {
    return [];
  }

  const traces: Array<{
    rule_id: string;
    user_id: string;
    log_id: string;
    item_id: string;
    matched_keyword: string;
  }> = [];

  for (const item of items) {
    const itemName = item.food_entity?.name?.toLowerCase() || '';
    if (!itemName) continue;

    for (const rule of rules) {
      const keywords: string[] = Array.isArray(rule.keywords) ? rule.keywords : [];
      const matchedKeyword = keywords.find((kw) =>
        itemName.includes(kw.toLowerCase())
      );

      if (matchedKeyword) {
        traces.push({
          rule_id: rule.rule_id,
          user_id: userId,
          log_id: logId,
          item_id: item.item_id,
          matched_keyword: matchedKeyword,
        });
      }
    }
  }

  if (traces.length > 0) {
    await supabase.from('rule_traces').insert(traces);
  }
  return traces;
}
