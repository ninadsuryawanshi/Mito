import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { getMealsForTimeline, computeStats } from '@/lib/services/mealService';
import { generateDailyInsight } from '@/lib/ai/gemini';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Last week's Monday
        const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
        const weekKey = format(lastWeekStart, 'yyyy-MM-dd');

        // Check if already generated
        const { data: existing } = await supabase
            .from('weekly_digests')
            .select('*')
            .eq('user_id', user.id)
            .eq('week_start', weekKey)
            .single();

        if (existing) return NextResponse.json({ digest: existing });

        // Generate fresh digest from last week's meals
        const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
        const { data: meals } = await supabase
            .from('meal_logs')
            .select('*, items:meal_log_items(*, food_entity:food_entities(name))')
            .eq('user_id', user.id)
            .gte('logged_at', lastWeekStart.toISOString())
            .lte('logged_at', lastWeekEnd.toISOString());

        if (!meals || meals.length === 0) return NextResponse.json({ digest: null });

        const stats = computeStats(meals as any);

        // Use AI to generate plain-language paragraph
        const digestText = await generateWeeklyDigestText(meals as any, stats);

        const digestRow = {
            user_id: user.id,
            week_start: weekKey,
            week_end: format(lastWeekEnd, 'yyyy-MM-dd'),
            digest_text: digestText,
            total_meals: stats.total_meals,
            total_calories: stats.total_calories,
            avg_daily_calories: Math.round(stats.total_calories / 7),
            total_protein_g: stats.total_protein_g,
            total_sugar_g: stats.total_sugar_g,
            total_sodium_mg: stats.total_sodium_mg,
            total_spend: stats.total_spend,
            meals_eaten_out: stats.meals_eaten_out,
            meals_home_cooked: stats.meals_home_cooked,
        };

        const { data: saved } = await supabase
            .from('weekly_digests')
            .upsert(digestRow, { onConflict: 'user_id,week_start' })
            .select()
            .single();

        return NextResponse.json({ digest: saved || digestRow });
    } catch (error: any) {
        return NextResponse.json({ digest: null });
    }
}

async function generateWeeklyDigestText(meals: any[], stats: any): Promise<string> {
    // Build compact meal summary — minimize tokens
    const topFoods = Object.entries(
        meals.flatMap((m: any) => m.items?.map((i: any) => i.food_entity?.name) || [])
            .filter(Boolean)
            .reduce((acc: any, name: any) => { acc[name] = (acc[name] || 0) + 1; return acc; }, {})
    ).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([name]) => name).join(', ');

    const summary = `${stats.total_meals} meals over 7 days. Avg ${Math.round(stats.total_calories / 7)} kcal/day. Total protein ${Math.round(stats.total_protein_g)}g, sugar ${Math.round(stats.total_sugar_g)}g, sodium ${Math.round(stats.total_sodium_mg)}mg. ${stats.meals_eaten_out} meals eaten out, ${stats.meals_home_cooked} home cooked. Total spent ₹${Math.round(stats.total_spend)}. Most frequent foods: ${topFoods}.`;

    // Reuse the daily insight generator with week framing
    const prompt_override = `Weekly food data: ${summary}

Write a 2-3 sentence observational paragraph about this week's eating patterns.
Rules: purely observational, no advice, no judgment, warm tone, mention specific foods if notable.
Return JSON: {"insight": "your paragraph here"}`;

    try {
        const { callGeminiRaw } = await import('@/lib/ai/gemini-raw');
        const text = await callGeminiRaw(prompt_override);
        const clean = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(clean);
        return parsed.insight || summary;
    } catch {
        return `This week you logged ${stats.total_meals} meals averaging ${Math.round(stats.total_calories / 7)} kcal per day. ${stats.meals_eaten_out > stats.meals_home_cooked ? 'Most meals were eaten out.' : 'Most meals were home cooked.'} Top foods: ${topFoods}.`;
    }
}