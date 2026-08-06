import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/server';
import { sendPushNotification, WITTY_NOTIFICATIONS } from '@/lib/services/push';

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mealTypeParam = searchParams.get('type') as 'breakfast' | 'lunch' | 'snack' | 'dinner' | null;

    // Determine current meal type if not explicitly provided
    let mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner' = mealTypeParam || 'lunch';

    if (!mealTypeParam) {
      // Calculate hour in Indian Standard Time (IST - Asia/Kolkata)
      const istHourStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit' });
      const hour = parseInt(istHourStr, 10);

      if (hour >= 6 && hour < 11) mealType = 'breakfast';
      else if (hour >= 11 && hour < 15) mealType = 'lunch';
      else if (hour >= 15 && hour < 18) mealType = 'snack';
      else mealType = 'dinner';
    }

    const serviceClient = createServiceClient();

    // Get all subscriptions with user details
    const { data: subs, error } = await serviceClient
      .from('push_subscriptions')
      .select('user_id, endpoint, subscription');

    if (error || !subs || subs.length === 0) {
      return NextResponse.json({ count: 0, message: 'No subscriptions found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const pool = WITTY_NOTIFICATIONS[mealType] || WITTY_NOTIFICATIONS.lunch;

    let sent = 0;
    let skipped = 0;

    for (const row of subs) {
      // Check if user already logged a meal today
      const { data: logs } = await serviceClient
        .from('meal_logs')
        .select('log_id')
        .eq('user_id', row.user_id)
        .gte('logged_at', `${todayStr}T00:00:00.000Z`)
        .eq('meal_type', mealType)
        .limit(1);

      if (logs && logs.length > 0) {
        skipped++;
        continue; // User already logged meal, don't spam them!
      }

      // User hasn't logged — pick witty prompt and send
      const prompt = pool[Math.floor(Math.random() * pool.length)];
      const subObj = typeof row.subscription === 'string' ? JSON.parse(row.subscription) : row.subscription;

      const res = await sendPushNotification(subObj, {
        title: prompt.title,
        body: prompt.body,
        url: '/log',
        tag: `mito-${mealType}-reminder`,
      });

      if (res.success) sent++;
    }

    return NextResponse.json({
      success: true,
      mealType,
      sent,
      skipped,
      totalSubscribers: subs.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
