'use client';
import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getSWRegistration(): Promise<ServiceWorkerRegistration> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported on this browser');
  }
  let reg = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!reg) {
    reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }
  return reg;
}

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      const perm = Notification.permission;
      setPermission(perm);
      try {
        const reg = await getSWRegistration();
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);

        // Auto-subscribe by default if browser permission is already granted and no active sub exists
        if (perm === 'granted' && !sub) {
          const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (publicVapidKey) {
            const newSub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
            });
            await fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: newSub }),
            });
            setIsSubscribed(true);
          }
        }
      } catch (err) {
        console.error('Error checking push subscription:', err);
      }
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported on this browser');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        throw new Error('Notification permission was denied. Please check your browser site settings.');
      }

      // 2. Get SW registration directly (does not hang)
      const reg = await getSWRegistration();

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error('VAPID public key missing from environment');
      }

      // 3. Unsubscribe any old/stale token to get fresh subscription
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        try {
          await existingSub.unsubscribe();
        } catch (e) {
          console.warn('Unsubscribe stale token:', e);
        }
      }

      // 4. Create fresh PushManager subscription
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      // 5. Save fresh subscription to server
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save push subscription on server');
      }

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      console.error('Subscribe error:', err);
      setError(err.message || 'Failed to subscribe');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;
    setLoading(true);

    try {
      const reg = await getSWRegistration();
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      console.error('Unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const sendTestNotification = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
