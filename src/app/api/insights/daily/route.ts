import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_insights')
      .select('insight_text')
      .eq('user_id', user.id)
      .eq('insight_date', today)
      .single();

    return NextResponse.json({ insight: data?.insight_text || '' });
  } catch {
    return NextResponse.json({ insight: '' });
  }
}
