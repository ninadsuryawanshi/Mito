'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogoMark, AnimatedTypewriterPrompt } from '@/components/ui';


/* ─── Bento item types ─────────────────────────────────── */
type BentoItem =
  | { kind: 'wide'; file: string; label: string; sub: string; accent: string }
  | { kind: 'pair'; items: { file: string; label: string; sub: string; accent: string }[] };

const BENTO: BentoItem[] = [
  {
    kind: 'wide',
    file: '/screenshots/voice-log.png',
    label: 'Just say it.',
    sub: 'Talk, type, or snap a photo. Done in seconds.',
    accent: 'var(--accent)',
  },
  {
    kind: 'pair',
    items: [
      {
        file: '/screenshots/progress.png',
        label: 'See where you stand.',
        sub: 'Calories & protein, at a glance.',
        accent: 'var(--blue)',
      },
      {
        file: '/screenshots/nutrients.png',
        label: 'The full picture.',
        sub: 'Fiber, sugar, sodium — all tracked.',
        accent: 'var(--green)',
      },
    ],
  },
  {
    kind: 'wide',
    file: '/screenshots/rules.png',
    label: 'Your rules. Your call.',
    sub: 'Set them once. Mito watches quietly — no scolding.',
    accent: 'var(--accent)',
  },
  {
    kind: 'wide',
    file: '/screenshots/log.png',
    label: 'A month of meals.',
    sub: 'Every meal logged. Every pattern visible.',
    accent: 'var(--blue)',
  },
];

/* ─── Per-row animated bento card ──────────────────────── */
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
  src, alt, width, height, priority,
}: {
  src: string; alt: string; width: number; height: number; priority?: boolean;
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
      // how far the card centre is from viewport centre, normalised -1..1
      const progress = ((rect.top + rect.height / 2) - viewH / 2) / viewH;
      const shift = progress * 18; // max 18px parallax
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
  item, dir = 'up', delay = 0,
}: {
  item: Extract<BentoItem, { kind: 'wide' }>; dir?: AnimDir; delay?: number;
}) {
  const { ref, revealed, glowing } = useBentoReveal();

  const hiddenTransform =
    dir === 'left' ? 'translateX(-32px)' :
    dir === 'right' ? 'translateX(32px)' :
    'translateY(28px)';

  return (
    <div
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translate(0)' : hiddenTransform,
        transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {/* Label */}
      <div
        className="mb-3 px-1"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateX(0)' : 'translateX(-10px)',
          transition: `opacity 0.5s ease ${delay + 150}ms, transform 0.5s ease ${delay + 150}ms`,
        }}
      >
        <p className="text-base font-bold mb-0.5" style={{ fontFamily: 'Syne, serif', color: item.accent }}>
          {item.label}
        </p>
        <p className="text-xs font-mono text-[var(--muted)]">{item.sub}</p>
      </div>

      {/* Image frame */}
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
  p, dir, delay = 0,
}: {
  p: { file: string; label: string; sub: string; accent: string }; dir: AnimDir; delay?: number;
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
        <p className="text-sm font-bold mb-0.5" style={{ fontFamily: 'Syne, serif', color: p.accent }}>
          {p.label}
        </p>
        <p className="text-xs font-mono text-[var(--muted)] leading-snug hidden sm:block">{p.sub}</p>
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
      ([entry]) => { if (entry.isIntersecting) setHeaderVisible(true); },
      { threshold: 0.2 }
    );
    if (headerRef.current) obs.observe(headerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="w-full">
      {/* Section divider */}
      <div
        ref={headerRef}
        className="flex items-center justify-center gap-3 mb-12 text-xs font-mono uppercase tracking-widest text-[var(--muted2)]"
        style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <span className="w-10 h-px bg-[var(--border)]" />
        <span>Inside Mito</span>
        <span className="w-10 h-px bg-[var(--border)]" />
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-6">
        {BENTO.map((item, rowIdx) => {
          if (item.kind === 'wide') {
            return (
              <WideCard key={item.file} item={item} dir="up" delay={0} />
            );
          }

          // pair: left slides from left, right from right
          return (
            <div key={`pair-${rowIdx}`} className="grid grid-cols-2 gap-4">
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
    <div className="min-h-screen bg-[#0a0908] text-[var(--text)] flex flex-col selection:bg-[var(--accent)] selection:text-[#0a0908] relative overflow-x-hidden">

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[var(--accent)] opacity-10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--blue)] opacity-5 blur-[180px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full px-6 py-8 flex items-center justify-between relative z-10">
        <LogoMark showText size={36} />
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[#0a0908] font-mono text-xs font-bold hover:bg-[var(--accent2)] transition-all shadow-[0_0_20px_var(--accent-glow)] active:scale-95"
          >
            Get Started →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto w-full px-6 py-12 sm:py-20 flex flex-col items-center text-center relative z-10">

        <h1
          className="text-5xl sm:text-7xl font-black tracking-tight max-w-3xl leading-[1.05] mb-8 animate-fade-up"
          style={{ fontFamily: 'Syne, serif' }}
        >
          Your food,{' '}
          <span className="text-[var(--accent)] italic font-normal drop-shadow-[0_0_35px_rgba(244,162,77,0.3)]">
            reflected.
          </span>
          <br />
          Without judgment.
        </h1>

        <div className="max-w-xl mb-10 animate-fade-up delay-1">
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-mono">
            Log what you ate in under 30 seconds. No menus, no searching databases.
            Just you and what you ate — reflected back clearly.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5 text-xs font-mono uppercase tracking-widest text-[var(--muted2)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>A mirror, not an instructor</span>
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          </div>
        </div>

        {/* Prompt box */}
        <div className="w-full max-w-2xl mb-16 sm:mb-24 animate-fade-up delay-2">
          <div className="moving-gradient-border-wrapper shadow-[0_0_50px_rgba(244,162,77,0.25)]">
            <Link
              href="/signup"
              className="w-full bg-[#12100e] rounded-[1.6rem] p-5 sm:p-7 flex items-center justify-between text-left group transition-all gap-4"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <h2 className="text-sm sm:text-lg font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'Syne, serif' }}>
                  Hey there, what fueled you today?
                </h2>
                <AnimatedTypewriterPrompt className="text-xs sm:text-sm text-[var(--text2)] font-mono truncate" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[#0a0908] font-mono text-xs font-bold shadow-[0_0_20px_var(--accent-glow)] group-hover:scale-105 transition-transform shrink-0">
                <span>Try Mito</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Bento screenshot grid */}
        <BentoSection />

      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full px-6 py-8 mt-16 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[var(--muted2)] border-t border-[var(--border)] relative z-10 gap-4">
        <span>© {new Date().getFullYear()} Mito — Powerhouse of You</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-[var(--muted)] transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-[var(--muted)] transition-colors">Register</Link>
        </div>
      </footer>

    </div>
  );
}
