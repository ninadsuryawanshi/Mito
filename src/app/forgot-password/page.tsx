'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/db/client';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

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

          {sent ? (
            /* Success state */
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[rgba(92,184,138,0.12)] border border-[var(--green)] flex items-center justify-center text-2xl animate-scale-in">
                ✓
              </div>
              <div>
                <h1 className="text-xl font-bold mb-2" style={{ fontFamily: 'Syne, serif' }}>Check your inbox</h1>
                <p className="text-sm text-[var(--muted)]">
                  We sent a password reset link to<br />
                  <span className="text-[var(--text)] font-mono">{email}</span>
                </p>
              </div>
              <p className="text-xs font-mono text-[var(--muted)] mt-2">
                Didn&apos;t get it? Check your spam folder.
              </p>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Reset password</h1>
              <p className="text-sm text-[var(--muted)] mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                {error && (
                  <div className="text-[var(--red)] text-xs bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.2)] rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" loading={loading} className="mt-2 font-mono tracking-wide">
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          <Link href="/login" className="text-[var(--accent)] hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
