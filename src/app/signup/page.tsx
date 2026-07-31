'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/db/client';
import { Button, Input } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="animate-fade-up mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[#0a0908] font-bold text-sm" style={{ fontFamily: 'Syne, serif' }}>M</span>
          </div>
          <span className="text-2xl font-bold" style={{ fontFamily: 'Syne, serif' }}>Mito</span>
        </div>
        <p className="text-[var(--muted)] text-sm font-mono tracking-wide">POWERHOUSE OF YOU</p>
      </div>

      <div className="w-full max-w-sm animate-fade-up delay-1">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Start your mirror</h1>
          <p className="text-sm text-[var(--muted)] mb-8">No judgment. Just clarity.</p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input label="Your name" type="text" placeholder="Ninad" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Password" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />

            {error && (
              <div className="text-[var(--red)] text-xs bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.2)] rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="mt-2 font-mono tracking-wide">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--muted)] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
