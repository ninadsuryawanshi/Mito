import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { sendPushToUser, WITTY_NOTIFICATIONS } from '@/lib/services/push';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pick a random witty breakfast/lunch notification for test
    const pool = [...WITTY_NOTIFICATIONS.breakfast, ...WITTY_NOTIFICATIONS.lunch, ...WITTY_NOTIFICATIONS.snack];
    const pick = pool[Math.floor(Math.random() * pool.length)];

    const result = await sendPushToUser(user.id, {
      title: pick.title,
      body: pick.body,
      url: '/log',
      tag: 'test-notification',
    });

    if (result.count === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active push subscriptions found for your device. Enable notifications first!'
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, sent: result.count, title: pick.title, body: pick.body });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
