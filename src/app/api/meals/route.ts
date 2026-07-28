import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { saveMealWithItems, getMealsForTimeline, getRecentMeals } from '@/lib/services/mealService';
import { generateDailyInsight } from '@/lib/ai/gemini';

// GET — fetch meals for timeline or recent meals
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const view = (searchParams.get('view') || 'day') as 'day' | 'week' | 'month';
    const recent = searchParams.get('recent') === 'true';

    if (recent) {
      const meals = await getRecentMeals(supabase, user.id);
      return NextResponse.json({ meals });
    }

    const meals = await getMealsForTimeline(supabase, user.id, view);
    return NextResponse.json({ meals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — save a new meal
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { analysis, description, photo_url, input_method, meal_type, price, currency, user_edited, logged_at } = body;

    if (!analysis) return NextResponse.json({ error: 'analysis required' }, { status: 400 });

    // Save meal + items
    const logId = await saveMealWithItems(supabase, user.id, analysis, {
      description,
      photo_url,
      input_method: input_method || 'text',
      meal_type,
      price: price ? parseFloat(price) : undefined,
      currency: currency || '₹',
      user_edited: user_edited || false,
      logged_at: logged_at || undefined,
    });

    // Fire-and-forget: regenerate daily insight
    // We don't await these — user gets fast response, background work continues
    Promise.all([
      refreshDailyInsight(supabase, user.id),
    ]).catch(console.error);

    return NextResponse.json({ log_id: logId, success: true });
  } catch (error: any) {
    console.error('Save meal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Regenerate today's daily insight after a new meal is logged
async function refreshDailyInsight(supabase: any, userId: string) {
  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0));
  const end = new Date(today.setHours(23, 59, 59, 999));

  const { data: todayMeals } = await supabase
    .from('meal_logs')
    .select('*, items:meal_log_items(food_entity:food_entities(name))')
    .eq('user_id', userId)
    .gte('logged_at', start.toISOString())
    .lte('logged_at', end.toISOString());

  if (!todayMeals || todayMeals.length === 0) return;

  const insight = await generateDailyInsight(todayMeals);
  if (!insight) return;

  const insightDate = new Date().toISOString().split('T')[0];
  await supabase
    .from('daily_insights')
    .upsert({ user_id: userId, insight_date: insightDate, insight_text: insight, generated_at: new Date().toISOString() },
      { onConflict: 'user_id,insight_date' });
}
