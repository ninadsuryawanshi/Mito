import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { computeWHORecommendations } from '@/lib/ai/gemini';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ profile: { ...profile, email: user.email } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, weight_kg, height_cm, age, sex, activity_level,
            recommended_calories, recommended_protein_g, currency, weekly_digest_email } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (weight_kg !== undefined) updates.weight_kg = weight_kg;
    if (height_cm !== undefined) updates.height_cm = height_cm;
    if (age !== undefined) updates.age = age;
    if (sex !== undefined) updates.sex = sex;
    if (activity_level !== undefined) updates.activity_level = activity_level;
    if (currency !== undefined) updates.currency = currency;
    if (weekly_digest_email !== undefined) updates.weekly_digest_email = weekly_digest_email;

    // If physical profile is complete, auto-compute WHO recommendations
    if (weight_kg && height_cm && age && sex && activity_level) {
      const recs = computeWHORecommendations(weight_kg, height_cm, age, sex, activity_level);
      // Only auto-set if user hasn't manually overridden
      updates.recommended_calories = recommended_calories ?? recs.recommended_calories;
      updates.recommended_protein_g = recommended_protein_g ?? recs.recommended_protein_g;
      updates.ai_computed_goals = recommended_calories === undefined && recommended_protein_g === undefined;
    } else {
      // Manual override
      if (recommended_calories !== undefined) { updates.recommended_calories = recommended_calories; updates.ai_computed_goals = false; }
      if (recommended_protein_g !== undefined) { updates.recommended_protein_g = recommended_protein_g; updates.ai_computed_goals = false; }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
