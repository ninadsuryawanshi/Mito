import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch existing active/inactive personal rules for keywords
    const { data: existingRules } = await supabase
      .from('personal_rules')
      .select('keywords')
      .eq('user_id', user.id);

    const existingKeywords = new Set<string>();
    (existingRules || []).forEach((r: any) => {
      if (Array.isArray(r.keywords)) {
        r.keywords.forEach((k: string) => existingKeywords.add(k.toLowerCase()));
      }
    });

    // Fetch recent meal items (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: mealLogs, error } = await supabase
      .from('meal_logs')
      .select('log_id, meal_log_items(food_entity:food_entities(name))')
      .eq('user_id', user.id)
      .gte('logged_at', thirtyDaysAgo.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    (mealLogs || []).forEach((log: any) => {
      (log.meal_log_items || []).forEach((item: any) => {
        const name = item.food_entity?.name?.trim();
        if (name) {
          const lowerName = name.toLowerCase();
          // Skip if already covered by an existing rule keyword
          let covered = false;
          for (const kw of existingKeywords) {
            if (lowerName.includes(kw) || kw.includes(lowerName)) {
              covered = true;
              break;
            }
          }
          if (!covered) {
            counts[name] = (counts[name] || 0) + 1;
          }
        }
      });
    });

    // Sort by count desc and take top 5 (only items logged at least 2 times)
    const suggestions = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .filter(s => s.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({ suggestions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
