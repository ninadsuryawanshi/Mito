import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const view = req.nextUrl.searchParams.get('view') || 'day';
    const now = new Date();

    let from: Date;
    let to: Date;
    if (view === 'day') {
      from = startOfDay(now);
      to = endOfDay(now);
    } else if (view === 'week') {
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      from = startOfMonth(now);
      to = endOfMonth(now);
    }

    const { data: traces, error } = await supabase
      .from('rule_traces')
      .select('*, rule:personal_rules(description)')
      .eq('user_id', user.id)
      .gte('triggered_at', from.toISOString())
      .lte('triggered_at', to.toISOString())
      .order('triggered_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ traces: traces || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
