import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { log_id, mood_score } = await req.json();
    if (!log_id || !mood_score) return NextResponse.json({ error: 'log_id and mood_score required' }, { status: 400 });

    const { data, error } = await supabase
      .from('mood_logs')
      .upsert({ user_id: user.id, log_id, mood_score, logged_at: new Date().toISOString() },
        { onConflict: 'log_id' })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ mood: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
