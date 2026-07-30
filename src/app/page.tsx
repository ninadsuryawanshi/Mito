import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/db/server';

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0a0908] text-[var(--text)] flex flex-col justify-between selection:bg-[var(--accent)] selection:text-[#0a0908] relative overflow-hidden">

      {/* Glow overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--accent)] opacity-15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--blue)] opacity-10 blur-[160px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)]">
            <span className="text-[#0a0908] font-bold text-sm" style={{ fontFamily: 'Syne, serif' }}>M</span>
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'Syne, serif' }}>mito</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#0a0908] font-mono text-xs font-bold hover:bg-[var(--accent2)] transition-all"
          >
            Get Started →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full px-6 py-16 flex flex-col items-center text-center relative z-10 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-widest">
            A Mirror, Not an Instructor
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1] mb-6 animate-fade-up delay-1" style={{ fontFamily: 'Syne, serif' }}>
          Your food, reflected. <br />
          <span className="text-[var(--accent)] italic">Without the guilt.</span>
        </h1>

        <p className="text-base md:text-lg text-[var(--muted)] max-w-xl mb-10 leading-relaxed font-mono animate-fade-up delay-2">
          Mito is a personal food mirror. Log what you eat in plain natural language, see objective nutrition trends, and stay in total control.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-fade-up delay-3">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--accent)] text-[#0a0908] font-mono font-bold text-sm hover:bg-[var(--accent2)] shadow-[0_0_30px_var(--accent-glow)] transition-all active:scale-95 text-center"
          >
            Start your food mirror →
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 hover:border-[var(--accent)] transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(244,162,77,0.1)] border border-[rgba(244,162,77,0.2)] flex items-center justify-center mb-4 text-lg">
              🗣️
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'Syne, serif' }}>
              Natural Logging
            </h3>
            <p className="text-xs font-mono text-[var(--muted)] leading-relaxed">
              Describe meals casually: &quot;2 idlis and a filter coffee&quot; or snap a quick photo. AI extracts full macro breakdowns instantly.
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 hover:border-[var(--accent)] transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(91,184,212,0.1)] border border-[rgba(91,184,212,0.2)] flex items-center justify-center mb-4 text-lg">
              🛡️
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'Syne, serif' }}>
              Personal Rule Engine
            </h3>
            <p className="text-xs font-mono text-[var(--muted)] leading-relaxed">
              Set dietary rules like &quot;avoid maida&quot; or &quot;no sugar after 8 PM&quot;. Mito silently highlights rule matches without judging.
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 hover:border-[var(--accent)] transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(92,184,138,0.1)] border border-[rgba(92,184,138,0.2)] flex items-center justify-center mb-4 text-lg">
              📊
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
      <footer className="max-w-6xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[var(--muted2)] border-t border-[var(--border)] relative z-10 gap-4">
        <span>© {new Date().getFullYear()} Mito — Powerhouse of You</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-[var(--muted)] transition-colors">Sign In</Link>
          <Link href="/login" className="hover:text-[var(--muted)] transition-colors">Register</Link>
        </div>
      </footer>

    </div>
  );
}
