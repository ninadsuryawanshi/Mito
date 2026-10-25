'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/db/client';
import { Button, Input } from '@/components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24, delay: d } }),
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    setTimeout(() => { window.location.href = '/dashboard'; }, 500);
  }

  return (
    <div
      className="min-h-dvh flex flex-col px-6 py-10 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Ambient morning-light glow */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(249,199,79,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Food scatter decoration — top-right, clipped */}
      <div
        className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'url(/food-scatter.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '0 0 0 100%',
        }}
      />

      {/* Logo */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-2.5 mb-10">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[var(--text)] font-extrabold text-base"
          style={{ background: 'var(--gold-gradient)', fontFamily: 'var(--font-display)' }}
        >
          M
        </div>
        <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>mito</span>
      </motion.div>

      {/* Heading */}
      <motion.div custom={0.06} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
        <h1
          className="text-[34px] font-extrabold leading-tight mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          Welcome back
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
          Your mirror is waiting.
        </p>
      </motion.div>

      {/* Form — floats on bg, no card box */}
      <motion.form
        custom={0.12} variants={fadeUp} initial="hidden" animate="show"
        onSubmit={handleLogin}
        className="flex flex-col gap-4 flex-1"
      >
        <Input
          label="Email"
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            id="login-password"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            suffix={
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="p-0 border-none bg-transparent cursor-pointer"
              >
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            }
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium"
              style={{ color: 'var(--gold-2)', fontFamily: 'var(--font-body)' }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl px-4 py-3 text-[13px]"
            style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(224,92,92,0.2)', fontFamily: 'var(--font-body)' }}
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <motion.div whileTap={{ scale: 0.97 }} className="mt-2">
          <Button type="submit" variant="gold" size="lg" loading={loading}>
            Sign in →
          </Button>
        </motion.div>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-[12px]" style={{ color: 'var(--muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <p className="text-center text-[14px]" style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
          New to Mito?{' '}
          <Link
            href="/signup"
            className="font-semibold"
            style={{ color: 'var(--gold-2)' }}
          >
            Create account
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
