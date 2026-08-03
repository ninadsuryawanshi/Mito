// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  weight_kg?: number;
  height_cm?: number;
  age?: number;
  sex?: 'male' | 'female' | 'other';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active';
  recommended_calories?: number;
  recommended_protein_g?: number;
  ai_computed_goals: boolean;
  currency: string;
  timezone: string;
  weekly_digest_email: boolean;
  created_at: string;
}

// ─── Food Entity ─────────────────────────────────────────────────────────────

export interface FoodEntity {
  food_id: string;
  name: string;
  brand?: string;
  cuisine?: string;
  region?: string;
  standard_unit: string;
  standard_unit_weight_g?: number;
  calories_per_unit?: number;
  protein_g_per_unit?: number;
  carbs_g_per_unit?: number;
  fat_g_per_unit?: number;
  fiber_g_per_unit?: number;
  sugar_g_per_unit?: number;
  sodium_mg_per_unit?: number;
  typical_context?: 'restaurant' | 'home' | 'packaged' | 'street';
  common_allergens?: string[];
  times_logged: number;
  created_at: string;
}

// ─── Meal Log ────────────────────────────────────────────────────────────────

export interface MealLog {
  log_id: string;
  user_id: string;
  logged_at: string;
  description_text?: string;
  photo_url?: string;
  input_method: 'text' | 'photo' | 'quick_reuse';
  reused_from_log_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  eating_context?: 'home' | 'restaurant' | 'ordered_in' | 'street' | 'packaged';
  total_calories?: number;
  total_protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  total_fiber_g?: number;
  total_sugar_g?: number;
  total_sodium_mg?: number;
  user_edited: boolean;
  price?: number;
  currency: string;
  ai_note?: string;
  created_at: string;
  // Joined
  items?: MealLogItem[];
  mood?: MoodLog;
}

export interface MealLogItem {
  item_id: string;
  log_id: string;
  food_entity_id: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  // Joined
  food_entity?: FoodEntity;
}

// ─── AI Response Types ───────────────────────────────────────────────────────

export interface AIFoodItem {
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  cuisine?: string;
  region?: string;
  typical_context?: 'restaurant' | 'home' | 'packaged' | 'street';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

export interface AIMealAnalysis {
  items: AIFoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sugar_g: number;
  total_sodium_mg: number;
  eating_context: 'restaurant' | 'home' | 'ordered_in' | 'street' | 'packaged';
  ai_note: string;
  serving_assumption?: string;
}

// ─── Personal Rules ──────────────────────────────────────────────────────────

export interface PersonalRule {
  rule_id: string;
  user_id: string;
  description: string;
  keywords: string[];
  active: boolean;
  created_at: string;
  monthly_breaches_count?: number;
}

export interface RuleTrace {
  trace_id: string;
  rule_id: string;
  user_id: string;
  log_id: string;
  item_id: string;
  matched_keyword: string;
  estimated_quantity?: string;
  triggered_at: string;
  // Joined
  rule?: PersonalRule;
  meal?: MealLog;
}

// ─── Mood ────────────────────────────────────────────────────────────────────

export interface MoodLog {
  mood_id: string;
  user_id: string;
  log_id: string;
  mood_score: 1 | 2 | 3 | 4; // 1=sluggish 2=neutral 3=energetic 4=unwell
  logged_at: string;
}

export const MOOD_MAP = {
  1: { emoji: '😴', label: 'Sluggish' },
  2: { emoji: '😐', label: 'Neutral' },
  3: { emoji: '💪', label: 'Energetic' },
  4: { emoji: '🤢', label: 'Unwell' },
} as const;

// ─── Daily Insight ───────────────────────────────────────────────────────────

export interface DailyInsight {
  insight_id: string;
  user_id: string;
  insight_date: string;
  insight_text: string;
  generated_at: string;
}

// ─── Viewer Access ───────────────────────────────────────────────────────────

export interface ViewerAccess {
  access_id: string;
  owner_user_id: string;
  viewer_name: string;
  viewer_email: string;
  access_token: string;
  permission_level: 'summary' | 'detailed';
  can_see_price: boolean;
  created_at: string;
  expires_at?: string;
  active: boolean;
  last_accessed_at?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export type TimelineView = 'day' | 'week' | 'month';

export interface DashboardStats {
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sugar_g: number;
  total_sodium_mg: number;
  total_spend: number;
  meals_eaten_out: number;
  meals_home_cooked: number;
  total_meals: number;
  streak_days: number;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type EatingContext = 'home' | 'restaurant' | 'ordered_in' | 'street' | 'packaged';
