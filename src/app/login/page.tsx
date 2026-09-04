'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/db/client';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err, data } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    // Wait for the cookie to be available
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="animate-fade-up mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[#0a0908] font-bold text-sm" style={{ fontFamily: 'Syne, serif' }}>M</span>
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: 'Syne, serif' }}>Mito</span>
        </div>
        <p className="text-[var(--muted)] text-sm font-mono tracking-wide">POWERHOUSE OF YOU</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm animate-fade-up delay-1">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Welcome back</h1>
          <p className="text-sm text-[var(--muted)] mb-8">Your mirror is waiting.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" className="text-xs font-mono text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-[var(--red)] text-xs bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.2)] rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="mt-2 font-mono tracking-wide">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          New to Mito?{' '}
          <Link href="/signup" className="text-[var(--accent)] hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
