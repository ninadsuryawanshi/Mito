-- ============================================================
-- NourishLog — Complete Database Schema
-- Paste this entire file into Supabase SQL Editor and run it
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS PROFILE ──────────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
-- auth.users is managed by Supabase Auth automatically
-- We store extra profile data here

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL DEFAULT '',
  
  -- Physical profile for WHO calorie/protein recommendations
  weight_kg       DECIMAL(5,2),
  height_cm       DECIMAL(5,2),
  age             INTEGER,
  sex             VARCHAR(10) CHECK (sex IN ('male', 'female', 'other')),
  activity_level  VARCHAR(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active')),
  
  -- Goals — computed by AI from physical profile, but user-editable
  recommended_calories  INTEGER,
  recommended_protein_g INTEGER,
  ai_computed_goals     BOOLEAN DEFAULT true,
  
  -- Preferences
  currency        VARCHAR(5) DEFAULT '₹',
  timezone        VARCHAR(50) DEFAULT 'Asia/Kolkata',
  weekly_digest_email BOOLEAN DEFAULT false,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can only see and edit their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── FOOD ENTITIES ───────────────────────────────────────────────────────────
-- The quietly-built Indian food intelligence layer
-- Never shown directly to users — fills itself from their meal logs

CREATE TABLE IF NOT EXISTS public.food_entities (
  food_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name            VARCHAR(200) NOT NULL,
  brand           VARCHAR(100),           -- e.g. "Katraj Dairy", "Amul"
  cuisine         VARCHAR(50),            -- 'South Indian', 'Punjabi', etc.
  region          VARCHAR(50),            -- 'Maharashtra', 'Tamil Nadu', etc.
  
  -- What one standard unit means for this food
  standard_unit        VARCHAR(20) DEFAULT 'piece',  -- piece|bowl|glass|plate|g|ml
  standard_unit_weight_g DECIMAL(7,2),
  
  -- Nutrition per standard unit — averages improve as more users log this food
  calories_per_unit     DECIMAL(7,2),
  protein_g_per_unit    DECIMAL(7,2),
  carbs_g_per_unit      DECIMAL(7,2),
  fat_g_per_unit        DECIMAL(7,2),
  fiber_g_per_unit      DECIMAL(7,2),
  sugar_g_per_unit      DECIMAL(7,2),
  sodium_mg_per_unit    DECIMAL(7,2),
  
  -- Inferred context — powers eating out vs home breakdown
  typical_context  VARCHAR(20) CHECK (typical_context IN ('restaurant','home','packaged','street')),
  
  -- Allergen awareness (AI-inferred, not verified — for future use)
  common_allergens TEXT[] DEFAULT '{}',
  
  -- Reliability tracking — more logs = more reliable averages
  times_logged    INTEGER DEFAULT 1,
  first_logged_by UUID REFERENCES public.profiles(user_id),
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Full text search index for fuzzy food name matching
CREATE INDEX IF NOT EXISTS idx_food_entities_name_fts 
  ON public.food_entities USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_food_entities_name 
  ON public.food_entities(name);

-- Food entities are readable by all authenticated users
-- (it's a shared crowd-sourced table)
ALTER TABLE public.food_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read food entities"
  ON public.food_entities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert food entities"
  ON public.food_entities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update food entities"
  ON public.food_entities FOR UPDATE
  TO authenticated
  USING (true);


-- ─── MEAL LOGS ───────────────────────────────────────────────────────────────
-- One row per eating occasion — the heart of everything

CREATE TABLE IF NOT EXISTS public.meal_logs (
  log_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  -- When was this eaten (user's local time stored as timestamptz)
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Original input — preserved exactly, never modified after save
  description_text TEXT,
  photo_url        TEXT,
  input_method     VARCHAR(20) NOT NULL DEFAULT 'text'
                   CHECK (input_method IN ('text','photo','quick_reuse')),
  
  -- If this was a quick reuse, which previous log it came from
  reused_from_log_id UUID REFERENCES public.meal_logs(log_id),
  
  -- Meal context
  meal_type       VARCHAR(20) CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  
  -- AI-inferred from description — powers eating out vs home breakdown
  eating_context  VARCHAR(20) CHECK (eating_context IN ('home','restaurant','ordered_in','street','packaged')),
  
  -- Totals — sum of all meal_log_items
  -- Stored here for fast dashboard queries (avoids joining items every time)
  total_calories      DECIMAL(7,2),
  total_protein_g     DECIMAL(7,2),
  total_carbs_g       DECIMAL(7,2),
  total_fat_g         DECIMAL(7,2),
  total_fiber_g       DECIMAL(7,2),
  total_sugar_g       DECIMAL(7,2),
  total_sodium_mg     DECIMAL(7,2),
  
  -- Did the user edit AI values before confirming?
  -- Useful signal for model improvement later
  user_edited     BOOLEAN DEFAULT false,
  
  -- Price tracking
  price           DECIMAL(8,2),
  currency        VARCHAR(5) DEFAULT '₹',
  
  -- AI one-liner about this meal
  ai_note         TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Fast queries: user's meals in a time range (used by dashboard constantly)
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_time 
  ON public.meal_logs(user_id, logged_at DESC);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal logs"
  ON public.meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON public.meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON public.meal_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON public.meal_logs FOR DELETE
  USING (auth.uid() = user_id);


-- ─── MEAL LOG ITEMS ──────────────────────────────────────────────────────────
-- One row per food item within a meal
-- This is where individual food tracking lives

CREATE TABLE IF NOT EXISTS public.meal_log_items (
  item_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id          UUID NOT NULL REFERENCES public.meal_logs(log_id) ON DELETE CASCADE,
  food_entity_id  UUID NOT NULL REFERENCES public.food_entities(food_id),
  
  quantity        DECIMAL(7,2) NOT NULL,
  unit            VARCHAR(20) NOT NULL,  -- piece|bowl|glass|g|ml
  
  -- Nutrition contribution of this item to the meal total
  -- = food_entity nutrition_per_unit × quantity
  calories        DECIMAL(7,2),
  protein_g       DECIMAL(7,2),
  carbs_g         DECIMAL(7,2),
  fat_g           DECIMAL(7,2),
  fiber_g         DECIMAL(7,2),
  sugar_g         DECIMAL(7,2),
  sodium_mg       DECIMAL(7,2),
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup of all items in a meal
CREATE INDEX IF NOT EXISTS idx_meal_log_items_log 
  ON public.meal_log_items(log_id);

-- Fast lookup of all logs containing a specific food
-- Powers "how much taak did I have this month" queries
CREATE INDEX IF NOT EXISTS idx_meal_log_items_entity 
  ON public.meal_log_items(food_entity_id);

ALTER TABLE public.meal_log_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal log items"
  ON public.meal_log_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_logs 
      WHERE meal_logs.log_id = meal_log_items.log_id 
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meal log items"
  ON public.meal_log_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_logs 
      WHERE meal_logs.log_id = meal_log_items.log_id 
      AND meal_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meal log items"
  ON public.meal_log_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_logs 
      WHERE meal_logs.log_id = meal_log_items.log_id 
      AND meal_logs.user_id = auth.uid()
    )
  );


-- ─── PERSONAL RULES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personal_rules (
  rule_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  description     TEXT NOT NULL,    -- "no chocolate", "limit fried food"
  keywords        TEXT[] NOT NULL,  -- AI-expanded: ["chocolate","cocoa","nutella",...]
  active          BOOLEAN DEFAULT true,
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_rules_user 
  ON public.personal_rules(user_id);

ALTER TABLE public.personal_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rules"
  ON public.personal_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── RULE TRACES ─────────────────────────────────────────────────────────────
-- Silent log of every rule trigger — never shown as alert

CREATE TABLE IF NOT EXISTS public.rule_traces (
  trace_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         UUID NOT NULL REFERENCES public.personal_rules(rule_id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  log_id          UUID NOT NULL REFERENCES public.meal_logs(log_id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES public.meal_log_items(item_id) ON DELETE CASCADE,
  
  matched_keyword     VARCHAR(100),
  estimated_quantity  TEXT,   -- "~30g", "1 piece", stored as text because precision varies
  
  triggered_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rule_traces_rule_time 
  ON public.rule_traces(rule_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_rule_traces_user_time 
  ON public.rule_traces(user_id, triggered_at DESC);

ALTER TABLE public.rule_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rule traces"
  ON public.rule_traces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rule traces"
  ON public.rule_traces FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ─── MOOD LOGS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mood_logs (
  mood_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  log_id          UUID NOT NULL REFERENCES public.meal_logs(log_id) ON DELETE CASCADE,
  
  -- 1=😴 sluggish | 2=😐 neutral | 3=💪 energetic | 4=🤢 unwell
  mood_score      SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 4),
  
  logged_at       TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(log_id)  -- one mood per meal
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user 
  ON public.mood_logs(user_id, logged_at DESC);

ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mood logs"
  ON public.mood_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── DAILY INSIGHTS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_insights (
  insight_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  insight_date    DATE NOT NULL,
  insight_text    TEXT NOT NULL,
  generated_at    TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, insight_date)
);

ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily insights"
  ON public.daily_insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── VIEWER ACCESS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.viewer_access (
  access_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  viewer_name     VARCHAR(100) NOT NULL,
  viewer_email    VARCHAR(255) NOT NULL,
  
  -- Unique token used by viewer to authenticate
  access_token    TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  
  -- 'summary' = meal names + totals | 'detailed' = items + full macros + rule traces
  permission_level VARCHAR(10) DEFAULT 'summary' CHECK (permission_level IN ('summary','detailed')),
  can_see_price   BOOLEAN DEFAULT false,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,   -- null = never expires
  active          BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_viewer_access_owner 
  ON public.viewer_access(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_viewer_access_token 
  ON public.viewer_access(access_token);

ALTER TABLE public.viewer_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their viewer access grants"
  ON public.viewer_access FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);
