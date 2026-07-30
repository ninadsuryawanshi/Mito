'use client';
import { useState, useEffect } from 'react';
import { Button, LogoMark } from '@/components/ui';

export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Hide if desktop or already running as standalone app
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isMobile = window.innerWidth < 768;
    const dismissed = localStorage.getItem('mito_pwa_dismissed') === 'true';

    if (isStandalone || !isMobile || dismissed) return;

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    // Android/Chrome beforeinstallprompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  function handleDismiss() {
    localStorage.setItem('mito_pwa_dismissed', 'true');
    setVisible(false);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        localStorage.setItem('mito_pwa_dismissed', 'true');
      }
      setDeferredPrompt(null);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-40 bg-[var(--surface)] border border-[var(--accent)] rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-fade-up md:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <h4 className="text-sm font-bold text-[var(--text)]" style={{ fontFamily: 'Syne, serif' }}>
              Add Mito to Home Screen
            </h4>
            <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">
              {isIOS
                ? 'Tap Share ⎋ → "Add to Home Screen"'
                : 'Instant access right from your phone'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[var(--muted)] hover:text-[var(--text)] text-xs font-mono shrink-0 p-1"
        >
          ✕
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleInstall} className="flex-1 font-mono text-xs">
            Install App
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs font-mono">
            Not now
          </Button>
        </div>
      )}
    </div>
  );
}
