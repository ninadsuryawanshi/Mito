import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { subDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch rule traces to find dates where rules were broken
    const { data: traces, error: traceErr } = await supabase
      .from('rule_traces')
      .select('triggered_at')
      .eq('user_id', user.id)
      .order('triggered_at', { ascending: false })
      .limit(500);

    if (traceErr) {
      return NextResponse.json({ error: traceErr.message }, { status: 500 });
    }

    // Set of dates where at least one rule was broken
    const breachDates = new Set<string>();
    (traces || []).forEach((t: { triggered_at: string }) => {
      if (t.triggered_at) {
        breachDates.add(format(new Date(t.triggered_at), 'yyyy-MM-dd'));
      }
    });

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    // Fetch user active rules count to ensure user actually has rules setup
    const { count: rulesCount } = await supabase
      .from('personal_rules')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('active', true);

    if (!rulesCount || rulesCount === 0) {
      return NextResponse.json({ rule_streak: 0, broken_today: false, no_rules: true });
    }

    // If a rule was broken today, current rule streak is 0
    if (breachDates.has(todayStr)) {
      return NextResponse.json({ rule_streak: 0, broken_today: true });
    }

    // Otherwise count consecutive clean days backwards from today
    let streak = 0;
    let currDate = now;

    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
      const dateStr = format(currDate, 'yyyy-MM-dd');
      if (breachDates.has(dateStr)) {
        // Streak broken on this day
        break;
      }
      streak++;
      currDate = subDays(currDate, 1);
    }

    return NextResponse.json({
      rule_streak: streak,
      broken_today: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
