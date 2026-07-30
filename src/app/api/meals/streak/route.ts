import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { subDays, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch logged_at for recent meals
    const { data, error } = await supabase
      .from('meal_logs')
      .select('logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ streak_days: 0 });
    }

    // Set of distinct dates formatted as YYYY-MM-DD
    const loggedDates = new Set<string>();
    data.forEach((row: { logged_at: string }) => {
      if (row.logged_at) {
        loggedDates.add(format(new Date(row.logged_at), 'yyyy-MM-dd'));
      }
    });

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(now, 1), 'yyyy-MM-dd');

    let streak = 0;
    let currDate = now;

    // Check if today or yesterday has a log
    if (loggedDates.has(todayStr)) {
      currDate = now;
    } else if (loggedDates.has(yesterdayStr)) {
      currDate = subDays(now, 1);
    } else {
      return NextResponse.json({ streak_days: 0 });
    }

    // Count backwards consecutively
    while (loggedDates.has(format(currDate, 'yyyy-MM-dd'))) {
      streak++;
      currDate = subDays(currDate, 1);
    }

    return NextResponse.json({ streak_days: streak });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
