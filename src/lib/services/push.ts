import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Initialize web-push with VAPID details
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@mito.app';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
}

// ── Witty Smart Notification Pools ─────────────────────────────────────
export const WITTY_NOTIFICATIONS = {
  breakfast: [
    { title: '🍳 Breakfast Check', body: "Coffee is an emotion, not a breakfast. What did you actually eat?" },
    { title: '🍳 Morning Fuel', body: "Skipping breakfast won't make your morning emails any less painful. Log food." },
    { title: '🍳 Stomach Alert', body: "Your stomach is making loud noises. We both know you ate. Confess." },
    { title: '🍳 Fuel Up', body: "Fuel up or prepare to fight your colleagues at noon. Log breakfast." },
    { title: '🍳 Honest Question', body: "Did you eat breakfast or are you surviving on sheer spite today?" },
  ],
  lunch: [
    { title: '🥗 1:00 PM Lunch Nudge', body: "It's 1 PM. Step away from your desk and log your lunch." },
    { title: '🥗 Keyboard Dining?', body: "Did you eat a balanced meal or just inhale chips over your keyboard?" },
    { title: '🥗 Clean Streak Watching', body: "Your clean streak is watching you right now. Don't disappoint it." },
    { title: '🥗 Food Coma Warning', body: "Log your lunch before your brain enters a afternoon food coma." },
    { title: '🥗 Vibe Check', body: "Be honest... was it a real meal or just vibes?" },
  ],
  snack: [
    { title: '🍿 5 PM Pantry Raid', body: "5:00 PM pantry raid detected. Be honest... almonds or cookies?" },
    { title: '🍿 Fridge Inspection', body: "The fridge isn't going to inspect itself. Confess your snack." },
    { title: '🍿 Boredom vs Hunger', body: "Did you need that 5 PM snack or were you just bored?" },
    { title: '🍿 Snack Patrol', body: "Drop the snack wrapper and step away from the kitchen." },
    { title: '🍿 Macro Calculator', body: "Your macros are calculating your choices right now." },
  ],
  dinner: [
    { title: '🍷 8:00 PM Night Call', body: "8:00 PM. Don't go to sleep lying to your macro log." },
    { title: '🍷 Streak Keeper', body: "Last call for logging! Don't let your streak die while you sleep." },
    { title: '🍷 Dinner Verdict', body: "Did you conquer dinner or did dinner conquer you?" },
    { title: '🍷 Bedtime Nudge', body: "Your bed is calling, but your food log is screaming. Log dinner." },
    { title: '🍷 Portion Control', body: "Log your meals before your memory edits the portion sizes." },
  ],
  rule_break: [
    { title: '🚨 Rule Broken!', body: "A personal rule was triggered. Your clean streak is crying in a corner." },
    { title: '🚨 Busted by Mito AI', body: "R.I.P. clean streak. Don't worry, even superheroes have bad meal days." },
    { title: '🚨 Rule Alert', body: "Rule broken! Pick yourself up and bounce back with your next meal." },
  ],
  milestone: [
    { title: '✦ MILESTONE UNLOCKED!', body: "Look at you acting like a disciplined adult! Streak milestone reached." },
    { title: '✦ STREAK POWER', body: "You changed a habit! Keep this clean streak going strong." },
  ],
};

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  if (!publicVapidKey || !privateVapidKey) {
    console.warn('VAPID keys not configured in environment variables');
    return { success: false, error: 'VAPID keys missing' };
  }

  try {
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/log',
      tag: payload.tag || 'mito-push',
    });

    await webpush.sendNotification(subscription, pushPayload);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending web push:', error);
    // If endpoint expired or unsubscribed (404 or 410)
    if (error.statusCode === 404 || error.statusCode === 410) {
      const supabase = getServiceClient();
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    }
    return { success: false, error: error.message || 'Push failed' };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const supabase = getServiceClient();
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', userId);

  if (error || !subs || subs.length === 0) {
    return { count: 0 };
  }

  let sentCount = 0;
  for (const subRow of subs) {
    const subObj = typeof subRow.subscription === 'string' ? JSON.parse(subRow.subscription) : subRow.subscription;
    const res = await sendPushNotification(subObj, payload);
    if (res.success) sentCount++;
  }

  return { count: sentCount };
}
