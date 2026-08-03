import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/db/server';
import { LogoMark, AnimatedTypewriterPrompt } from '@/components/ui';

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0a0908] text-[var(--text)] flex flex-col justify-between selection:bg-[var(--accent)] selection:text-[#0a0908] relative overflow-hidden">

      {/* Subtle ambient lighting gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[var(--accent)] opacity-10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--blue)] opacity-5 blur-[180px] rounded-full pointer-events-none" />

      {/* Header Navigation */}
      <header className="max-w-6xl mx-auto w-full px-6 py-8 flex items-center justify-between relative z-10">
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

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto w-full px-6 py-16 sm:py-24 flex flex-col items-center text-center relative z-10 my-auto">

        {/* Main Headline */}
        <h1
          className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight max-w-5xl leading-[1.05] mb-8 animate-fade-up"
          style={{ fontFamily: 'Syne, serif' }}
        >
          Your food, reflected. <br />
          <span className="text-[var(--accent)] italic font-normal drop-shadow-[0_0_35px_rgba(244,162,77,0.3)]">Without judgment.</span>
        </h1>

        {/* Subtitle & Core Philosophy */}
        <div className="max-w-2xl mb-12 animate-fade-up delay-1">
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed font-mono">
            Mito is a personal food mirror - built to reflect, not instruct. Log meals casually in plain language, voice dictation or a simple photo, track real nutrition trends, and stay in total clarity.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5 text-xs font-mono uppercase tracking-widest text-[var(--muted2)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>A mirror, not an instructor</span>
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          </div>
        </div>

        {/* Moving Gradient Interactive Prompt Box Preview */}
        <div className="w-full max-w-3xl mb-16 animate-fade-up delay-2">
          <div className="moving-gradient-border-wrapper shadow-[0_0_50px_rgba(244,162,77,0.25)]">
            <Link
              href="/signup"
              className="w-full bg-[#12100e] rounded-[1.6rem] p-6 sm:p-8 flex items-center justify-between text-left group transition-all gap-4"
            >
              <div className="flex flex-col gap-1.5 flex-1">
                <h2 className="text-base sm:text-xl font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'Syne, serif' }}>
                  Hey there, what fueled you today?
                </h2>
                <AnimatedTypewriterPrompt className="text-xs sm:text-sm text-[var(--text2)] font-mono" />
              </div>
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-[#0a0908] font-mono text-xs sm:text-sm font-bold shadow-[0_0_20px_var(--accent-glow)] group-hover:scale-105 transition-transform shrink-0">
                <span>Try Mito</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">

          {/* Card 1: Natural Logging */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-7 hover:border-[var(--accent)] transition-all group relative overflow-hidden">
            <div className="w-11 h-11 rounded-2xl bg-[rgba(244,162,77,0.08)] border border-[rgba(244,162,77,0.2)] flex items-center justify-center mb-5 text-[var(--accent)] group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'Syne, serif' }}>
              Natural Logging
            </h3>
            <p className="text-xs font-mono text-[var(--muted)] leading-relaxed">
              Describe meals casually: &quot;2 idlis and a filter coffee&quot; or snap a quick photo. AI extracts full macro breakdowns instantly.
            </p>
          </div>

          {/* Card 2: Personal Rule Engine */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-7 hover:border-[var(--accent)] transition-all group relative overflow-hidden">
            <div className="w-11 h-11 rounded-2xl bg-[rgba(91,184,212,0.08)] border border-[rgba(91,184,212,0.2)] flex items-center justify-center mb-5 text-[var(--blue)] group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'Syne, serif' }}>
              Personal Rule Engine
            </h3>
            <p className="text-xs font-mono text-[var(--muted)] leading-relaxed">
              Set dietary rules like &quot;avoid maida&quot; or &quot;no sugar after 8 PM&quot;. Mito silently highlights rule matches without judging.
            </p>
          </div>

          {/* Card 3: Reflective Trends */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-7 hover:border-[var(--accent)] transition-all group relative overflow-hidden">
            <div className="w-11 h-11 rounded-2xl bg-[rgba(92,184,138,0.08)] border border-[rgba(92,184,138,0.2)] flex items-center justify-center mb-5 text-[var(--green)] group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'Syne, serif' }}>
              Reflective Trends
            </h3>
            <p className="text-xs font-mono text-[var(--muted)] leading-relaxed">
              Understand your habits with WHO recommendations context, 7-day calorie trends, and consistency streaks.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[var(--muted2)] border-t border-[var(--border)] relative z-10 gap-4">
        <span>© {new Date().getFullYear()} Mito — Powerhouse of You</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-[var(--muted)] transition-colors">Sign In</Link>
          <Link href="/login" className="hover:text-[var(--muted)] transition-colors">Register</Link>
        </div>
      </footer>

    </div>
  );
}
