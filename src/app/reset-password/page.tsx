'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/db/client';
import { Button, Input, LogoMark } from '@/components/ui';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function initAuth() {
      // 1. Check if PKCE code parameter is in URL
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch (e) {
          console.warn('Code exchange warning:', e);
        }
      }

      // 2. Check current session
      const { data: { session } } = await supabase.auth.getSession();
      const hasHashToken = window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery');

      if (session || hasHashToken) {
        if (mounted) {
          setReady(true);
          setInvalidLink(false);
        }
      } else {
        // Wait briefly for onAuthStateChange to trigger
        setTimeout(async () => {
          if (!mounted) return;
          const { data: { session: recheck } } = await supabase.auth.getSession();
          if (recheck) {
            setReady(true);
            setInvalidLink(false);
          } else {
            // Even if session check fails, unlock form so user can try entering password
            setReady(true);
            // If hash/search had no recovery info, flag as potentially expired
            if (!code && !hasHashToken) {
              setInvalidLink(true);
            }
          }
        }, 1200);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
        if (mounted) {
          setReady(true);
          setInvalidLink(false);
        }
      }
    });

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Failed to update password. Please try again.');
    }
  }

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="text-5xl animate-scale-in">✓</div>
      <p className="font-mono text-[var(--green)] text-sm uppercase tracking-widest animate-fade-up">Password updated</p>
      <p className="text-xs text-[var(--muted)] font-mono animate-fade-up">Redirecting you to the dashboard…</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="animate-fade-up mb-12 text-center flex flex-col items-center gap-2">
        <LogoMark showText size={36} />
        <p className="text-[var(--muted)] text-[11px] font-mono tracking-widest uppercase">POWERHOUSE OF YOU</p>
      </div>

      <div className="w-full max-w-sm animate-fade-up delay-1">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Set new password</h1>
          <p className="text-sm text-[var(--muted)] mb-8">Choose a strong password for your account.</p>

          {!ready ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
              <p className="text-xs font-mono text-[var(--muted)]">Verifying reset link…</p>
            </div>
          ) : invalidLink ? (
            <div className="text-center flex flex-col items-center gap-4 py-2">
              <div className="w-12 h-12 rounded-full bg-[rgba(224,92,92,0.12)] border border-[var(--red)] flex items-center justify-center text-xl text-[var(--red)]">
                !
              </div>
              <div>
                <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Link Expired or Invalid</h3>
                <p className="text-xs text-[var(--muted)] font-mono leading-relaxed">
                  This password reset link has expired or is invalid. Please request a new link.
                </p>
              </div>
              <Link href="/forgot-password" className="w-full">
                <Button size="md" className="w-full font-mono text-xs">
                  Request new reset link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <Input
                label="New password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />

              {error && (
                <div className="text-[var(--red)] text-xs bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.2)] rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" loading={loading} className="mt-2 font-mono tracking-wide">
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
