import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { createClient } from '@supabase/supabase-js';

/**
 * DELETE /api/account/delete
 *
 * Authenticated endpoint — verifies the caller's session first, then uses
 * the service-role admin client to delete the auth.users row.
 *
 * Because every public table has ON DELETE CASCADE chained through profiles:
 *   profiles, meal_logs, meal_log_items, rule_traces, mood_logs,
 *   personal_rules, daily_insights, viewer_access, push_subscriptions
 *
 * food_entities is intentionally preserved — it is a shared crowdsourced
 * table with no user_id FK, so no action is needed there.
 */
export async function DELETE() {
  try {
    // 1. Verify caller is authenticated via their session cookie (RLS-scoped)
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = user.id;

    // 2. Use service-role admin client — bypasses RLS, can delete from auth.users
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3. Delete auth user — ON DELETE CASCADE handles all app data automatically
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(uid);

    if (deleteError) {
      console.error('[account/delete] Auth user deletion failed:', deleteError.message);
      return NextResponse.json(
        { error: 'Account deletion failed. Please try again or contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[account/delete] Unexpected error:', error.message);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
