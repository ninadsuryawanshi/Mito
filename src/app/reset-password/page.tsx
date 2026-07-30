'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/db/client';
import { Button, Input } from '@/components/ui';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase puts the access token in the URL hash after redirect.
  // We exchange it for a session so updateUser works.
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session || window.location.hash.includes('access_token')) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2000);
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
      <div className="animate-fade-up mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[#0a0908] font-bold text-sm" style={{ fontFamily: 'Syne, serif' }}>M</span>
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: 'Syne, serif' }}>mito</span>
        </div>
        <p className="text-[var(--muted)] text-sm font-mono tracking-wide">POWERHOUSE OF YOU</p>
      </div>

      <div className="w-full max-w-sm animate-fade-up delay-1">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Set new password</h1>
          <p className="text-sm text-[var(--muted)] mb-8">Choose a strong password for your account.</p>

          {!ready ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
              <p className="text-xs font-mono text-[var(--muted)]">Verifying reset link…</p>
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
