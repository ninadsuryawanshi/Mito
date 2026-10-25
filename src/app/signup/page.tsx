'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/db/client';
import { Button, Input } from '@/components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({ opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24, delay: d } }),
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    });
    if (err) {
      const msg = err.message.toLowerCase();
      setError(msg.includes('already') ? 'An account with this email already exists. Sign in instead.' : err.message);
      setLoading(false); return;
    }
    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,199,79,0.16) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Food decoration top right */}
      <div className="absolute top-0 right-0 w-44 h-44 pointer-events-none opacity-10"
        style={{ backgroundImage: 'url(/food-scatter.png)', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '0 0 0 100%' }} />

      {/* Logo */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[var(--text)] font-extrabold text-base"
          style={{ background: 'var(--gold-gradient)', fontFamily: 'var(--font-display)' }}>M</div>
        <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>mito</span>
      </motion.div>

      {/* Heading */}
      <motion.div custom={0.06} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
        <h1 className="text-[34px] font-extrabold leading-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          Start your mirror
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--text2)' }}>No judgment. Just clarity.</p>
      </motion.div>

      <motion.form custom={0.12} variants={fadeUp} initial="hidden" animate="show" onSubmit={handleSignup} className="flex flex-col gap-4 flex-1">
        <Input label="Your name" id="signup-name" type="text" placeholder="Alex" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Email" id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <Input
          label="Password" id="signup-password" type={showPw ? 'text' : 'password'} placeholder="Min 6 characters"
          value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password"
          suffix={
            <button type="button" onClick={() => setShowPw(p => !p)} aria-label="Toggle password" className="border-none bg-transparent cursor-pointer p-0">
              {showPw
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          }
        />

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl px-4 py-3 text-[13px]" role="alert"
            style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(224,92,92,0.2)' }}>
            {error}
          </motion.div>
        )}

        <motion.div whileTap={{ scale: 0.97 }} className="mt-2">
          <Button type="submit" variant="gold" size="lg" loading={loading}>Create account →</Button>
        </motion.div>

        <p className="text-center text-[14px] mt-2" style={{ color: 'var(--text2)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--gold-2)' }}>Sign in</Link>
        </p>
      </motion.form>
    </div>
  );
}
