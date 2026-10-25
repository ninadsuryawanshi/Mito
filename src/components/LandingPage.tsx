'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatedTypewriterPrompt } from '@/components/ui';
import { motion } from 'framer-motion';

type BentoItem =
  | { kind: 'wide'; file: string; label: string; sub: string; accent: string }
  | { kind: 'pair'; items: { file: string; label: string; sub: string; accent: string }[] };

const BENTO: BentoItem[] = [
  {
    kind: 'wide',
    file: '/screenshots/voice-log.png',
    label: 'Just say it.',
    sub: 'Talk, type, or snap a photo. Done in seconds.',
    accent: 'var(--gold-2)',
  },
  {
    kind: 'pair',
    items: [
      {
        file: '/screenshots/progress.png',
        label: 'See where you stand.',
        sub: 'Calories and protein, at a glance.',
        accent: 'var(--blue)',
      },
      {
        file: '/screenshots/nutrients.png',
        label: 'The full picture.',
        sub: 'Fiber, sugar, sodium - all tracked.',
        accent: 'var(--green)',
      },
    ],
  },
  {
    kind: 'wide',
    file: '/screenshots/rules.png',
    label: 'Your rules. Your call.',
    sub: 'Set them once. Mito watches quietly with no scolding.',
    accent: 'var(--gold-2)',
  },
  {
    kind: 'wide',
    file: '/screenshots/log.png',
    label: 'A month of meals.',
    sub: 'Every meal logged. Every pattern visible.',
    accent: 'var(--blue)',
  },
];

type AnimDir = 'up' | 'left' | 'right';

function useBentoReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !revealed) {
          setRevealed(true);
          setGlowing(true);
          setTimeout(() => setGlowing(false), 1200);
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [revealed]);

  return { ref, revealed, glowing };
}

function ParallaxImage({
  src,
  alt,
  width,
  height,
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const wrap = wrapRef.current;
      const img = imgRef.current;
      if (!wrap || !img) return;

      const rect = wrap.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = (rect.top + rect.height / 2 - viewH / 2) / viewH;
      const shift = progress * 18;
      img.style.transform = `translateY(${shift}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={wrapRef} className="w-full overflow-hidden" style={{ borderRadius: 'inherit' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-auto block"
        style={{ willChange: 'transform', transition: 'transform 0.1s linear' }}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}

function WideCard({
  item,
  dir = 'up',
  delay = 0,
}: {
  item: Extract<BentoItem, { kind: 'wide' }>;
  dir?: AnimDir;
  delay?: number;
}) {
  const { ref, revealed, glowing } = useBentoReveal();

  const hiddenTransform =
    dir === 'left' ? 'translateX(-32px)' : dir === 'right' ? 'translateX(32px)' : 'translateY(28px)';

  return (
    <div
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translate(0)' : hiddenTransform,
        transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      <div
        className="mb-3 px-1"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateX(0)' : 'translateX(-10px)',
          transition: `opacity 0.5s ease ${delay + 150}ms, transform 0.5s ease ${delay + 150}ms`,
        }}
      >
        <p className="text-base font-bold mb-0.5" style={{ fontFamily: 'var(--font-display)', color: item.accent }}>
          {item.label}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
          {item.sub}
        </p>
      </div>

      <div
        style={{
          borderRadius: '1rem',
          border: `1px solid ${item.accent}35`,
          boxShadow: glowing
            ? `0 4px 30px rgba(0,0,0,0.5), 0 0 60px ${item.accent}25`
            : `0 4px 30px rgba(0,0,0,0.5), 0 0 20px ${item.accent}08`,
          transition: 'box-shadow 0.8s ease',
          overflow: 'hidden',
        }}
      >
        <ParallaxImage src={item.file} alt={item.label} width={1200} height={400} priority={delay === 0} />
      </div>
    </div>
  );
}

function PairCard({
  p,
  dir,
  delay = 0,
}: {
  p: { file: string; label: string; sub: string; accent: string };
  dir: AnimDir;
  delay?: number;
}) {
  const { ref, revealed, glowing } = useBentoReveal();
  const hiddenTransform = dir === 'left' ? 'translateX(-28px)' : 'translateX(28px)';

  return (
    <div
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translate(0)' : hiddenTransform,
        transition: `opacity 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      <div className="mb-3 px-1">
        <p className="text-sm font-bold mb-0.5" style={{ fontFamily: 'var(--font-display)', color: p.accent }}>
          {p.label}
        </p>
        <p className="text-xs leading-snug hidden sm:block" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
          {p.sub}
        </p>
      </div>
      <div
        style={{
          borderRadius: '1rem',
          border: `1px solid ${p.accent}35`,
          boxShadow: glowing
            ? `0 4px 24px rgba(0,0,0,0.5), 0 0 50px ${p.accent}25`
            : `0 4px 24px rgba(0,0,0,0.5), 0 0 16px ${p.accent}08`,
          transition: 'box-shadow 0.8s ease',
          overflow: 'hidden',
        }}
      >
        <ParallaxImage src={p.file} alt={p.label} width={400} height={700} />
      </div>
    </div>
  );
}

function BentoSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHeaderVisible(true);
      },
      { threshold: 0.2 }
    );

    if (headerRef.current) obs.observe(headerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="w-full">
      <div
        ref={headerRef}
        className="flex items-center justify-center gap-3 mb-12 text-xs uppercase tracking-widest"
        style={{
          color: 'var(--muted2)',
          fontFamily: 'var(--font-body)',
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <span className="w-10 h-px bg-[var(--border)]" />
        <span>Inside Mito</span>
        <span className="w-10 h-px bg-[var(--border)]" />
      </div>

      <div className="flex flex-col gap-6">
        {BENTO.map((item, rowIdx) => {
          if (item.kind === 'wide') {
            return <WideCard key={item.file} item={item} dir="up" delay={0} />;
          }

          return (
            <div key={`pair-${rowIdx}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PairCard p={item.items[0]} dir="left" delay={0} />
              <PairCard p={item.items[1]} dir="right" delay={80} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col relative overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <div
        className="absolute top-0 right-0 w-52 h-52 sm:w-72 sm:h-72 pointer-events-none opacity-[0.06] sm:opacity-[0.07]"
        style={{
          backgroundImage: 'url(/food-scatter.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '0 0 0 100%',
        }}
      />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] h-[280px] sm:w-[600px] sm:h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(249,199,79,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <header className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center font-extrabold text-sm" style={{ background: 'var(--gold-gradient)', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            M
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            mito
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/login" className="hidden sm:inline text-[13px] font-medium" style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
            Sign in
          </Link>
          <Link href="/signup" className="gold-btn px-4 sm:px-5 py-2 text-[12px] sm:text-[13px] font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            Get Started -&gt;
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-16 pt-4 sm:pt-8 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 relative z-10">
        <div className="flex-1 flex flex-col gap-4 sm:gap-5 w-full items-center md:items-start text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit border text-[12px] font-semibold"
            style={{ background: 'var(--surface)', borderColor: 'rgba(232,160,48,0.3)', color: 'var(--gold-2)', fontFamily: 'var(--font-body)' }}
          >
            <span className="sparkle-star text-[10px]">✦</span> Built for real people
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.07 }}
            className="text-[32px] sm:text-[46px] lg:text-[54px] font-extrabold leading-[1.06] tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Your food,{' '}
            <span
              className="italic inline-block"
              style={{
                background: 'var(--gold-gradient-text)',
                backgroundSize: '200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              reflected.&#8203;
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.14 }}
            className="text-[15px] sm:text-[16px] leading-relaxed max-w-sm md:max-w-md"
            style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)' }}
          >
            Not a coach. Not a diet plan. A clear mirror for what you eat.
            Log in 30 seconds — talk, type, or snap a photo.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full">
            {['🥑 Mindful logging', '🔥 Calorie goals', '📊 Macro trends', '🌿 Fiber tracking'].map((t) => (
              <span key={t} className="shrink-0 px-3 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                {t}
              </span>
            ))}
          </motion.div>

          <div className="hidden sm:block">
            <AnimatedTypewriterPrompt prefix="Try:" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.28 }}
            className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"
          >
            <Link href="/signup" className="gold-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-bold relative" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              <span>Get Started</span>
              <span>→</span>
              <span className="sparkle-dot absolute -top-1 -right-1" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-full text-[14px] font-medium" style={{ border: '1.5px solid var(--border)', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
              Sign in
            </Link>
          </motion.div>
        </div>

        {/* Food bowl hero — hidden on mobile, shown md+ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.15 }}
          className="hidden md:block relative flex-shrink-0 w-72 h-72 lg:w-88 lg:h-88"
        >
          <div className="w-full h-full rounded-full overflow-hidden" style={{ boxShadow: '0 16px 64px rgba(200,130,10,0.25), 0 4px 20px rgba(28,26,20,0.12)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/food-hero-bowl.png" alt="Healthy meal bowl with fresh ingredients" className="w-full h-full object-cover" />
          </div>

          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-8 top-1/4 px-3 py-2 rounded-2xl text-[12px] font-semibold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', boxShadow: 'var(--shadow-card)', whiteSpace: 'nowrap' }}
          >
            🥑 Fresh Avocado
          </motion.div>

          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -right-6 bottom-1/4 px-3 py-2 rounded-2xl text-[12px] font-semibold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-body)', boxShadow: 'var(--shadow-card)', whiteSpace: 'nowrap' }}
          >
            🐔 Grilled Chicken
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap"
            style={{ background: 'var(--gold-gradient)', color: 'var(--text)', fontFamily: 'var(--font-display)', boxShadow: 'var(--gold-shadow)' }}
          >
            🔥 456 kcal · 38g protein
          </motion.div>
        </motion.div>
      </main>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-16 sm:pb-20 relative z-10">
        <BentoSection />
      </div>

      <footer className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 mt-auto flex flex-col sm:flex-row items-center justify-between text-[12px] relative z-10 gap-4" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
        <span>© {new Date().getFullYear()} Mito - Powerhouse of You</span>
        <div className="flex items-center gap-6">
          <Link href="/login" style={{ color: 'var(--muted)' }}>Sign In</Link>
          <Link href="/signup" style={{ color: 'var(--gold-2)', fontWeight: 600 }}>Get Started -&gt;</Link>
        </div>
      </footer>
    </div>
  );
}
