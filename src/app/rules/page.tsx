'use client';
import { useState, useEffect, useRef } from 'react';
import { PersonalRule } from '@/types';
import { Button, Input, MonoLabel, Badge, Spinner, useToast } from '@/components/ui';

const MILESTONES = [4, 10, 20, 30, 60, 100, 200, 300, 365];

// ── Confetti particle ─────────────────────────────────────────────────────
function ConfettiParticle({ style }: { style: React.CSSProperties }) {
  return <div className="confetti-particle" style={style} />;
}

// Milestone rank label
const MILESTONE_RANK: Record<number, string> = {
  10: 'Rookie',
  20: 'Committed',
  30: 'Consistent',
  60: 'Disciplined',
  100: 'Elite',
  200: 'Legendary',
  300: 'Immortal',
  365: 'Transcendent',
};
const MILESTONE_MSG: Record<number, string> = {
  10: 'Double digits. The streak is real.',
  20: 'Three weeks of pure discipline.',
  30: 'One full month. A habit is born.',
  60: 'Two months. This is your lifestyle.',
  100: 'Triple digits. Most people quit at ten.',
  200: 'Two hundred days. Legendary territory.',
  300: 'Ten months. You\'re not the same person.',
  365: 'A full year. You built something permanent.',
};

// ── Grand Milestone Celebration ───────────────────────────────────────
function MilestoneCelebration({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const colors = ['#F4A24D', '#f5d76e', '#5BB8D4', '#e05c5c', '#5cb885', '#c97ef5', '#ffffff'];

  // 80 confetti particles — varied sizes, speeds, positions
  const particles = Array.from({ length: 80 }, (_, i) => {
    const big = i < 15;
    const ribbon = i >= 60;
    return {
      left: `${Math.random() * 100}%`,
      top: `${-10 - Math.random() * 20}%`,
      background: colors[i % colors.length],
      width: ribbon ? `${2 + Math.random() * 2}px` : big ? `${10 + Math.random() * 8}px` : `${4 + Math.random() * 6}px`,
      height: ribbon ? `${12 + Math.random() * 16}px` : big ? `${10 + Math.random() * 8}px` : `${4 + Math.random() * 6}px`,
      borderRadius: ribbon ? '1px' : Math.random() > 0.4 ? '50%' : '2px',
      animationDelay: `${Math.random() * 1.2}s`,
      animationDuration: `${1.8 + Math.random() * 2}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
      opacity: 0.85 + Math.random() * 0.15,
    };
  });

  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const rank = MILESTONE_RANK[streak] || '';
  const msg = MILESTONE_MSG[streak] || '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-12 sm:items-center sm:pb-0"
      style={{ background: 'rgba(8,7,6,0.92)', backdropFilter: 'blur(10px)' }}
      onClick={onDismiss}
    >
      {/* Confetti rain */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => <ConfettiParticle key={i} style={p} />)}
      </div>

      {/* Expanding pulse rings from center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 0.6, 1.2].map((delay, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-[rgba(244,162,77,0.25)]"
            style={{
              width: `${180 + i * 120}px`,
              height: `${180 + i * 120}px`,
              animation: `milestoneRing 2.4s ease-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div
        className="relative z-10 flex flex-col items-center mx-4 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'milestoneBounceIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        {/* Outer glow blob */}
        <div className="absolute inset-0 rounded-3xl bg-[var(--accent)] opacity-[0.07] blur-3xl scale-110 pointer-events-none" />

        {/* Diamond — large hero element */}
        <div className="relative mb-2" style={{ animation: 'diamondSpin 0.6s ease-out 0.1s both' }}>
          {/* Glow rings */}
          <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-25 blur-3xl scale-125 animate-pulse" />
          <div className="absolute -inset-4 rounded-full border border-[rgba(244,162,77,0.2)] animate-pulse" style={{ animationDelay: '0.3s' }} />

          <svg viewBox="0 0 140 140" className="w-36 h-36 drop-shadow-[0_0_40px_rgba(244,162,77,1)]" fill="none">
            {/* Base solid fill */}
            <path d="M70 8 L132 70 L70 132 L8 70 Z" fill="#0d0b09" />
            {/* Gradient fill */}
            <path d="M70 8 L132 70 L70 132 L8 70 Z" fill="url(#celebGrad)" />
            {/* Top facet highlight */}
            <path d="M70 8 L132 70 L70 70 Z" fill="rgba(255,220,150,0.12)" />
            {/* Inner glow border */}
            <path d="M70 8 L132 70 L70 132 L8 70 Z" stroke="#F4A24D" strokeWidth="1.5" opacity="0.9" />
            {/* Inner secondary border */}
            <path d="M70 22 L118 70 L70 118 L22 70 Z" stroke="rgba(244,162,77,0.2)" strokeWidth="1" />
            <defs>
              <linearGradient id="celebGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F4A24D" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#d47b25" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#0d0b09" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>

          {/* Number inside diamond */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-bold tabular-nums text-[var(--accent)] leading-none"
              style={{
                fontFamily: 'Syne, serif',
                fontSize: streak >= 100 ? '2.4rem' : '2.8rem',
                textShadow: '0 0 30px rgba(244,162,77,0.8)',
              }}
            >
              {streak}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--muted)] mt-0.5">days</span>
          </div>
        </div>

        {/* Text block */}
        <div
          className="flex flex-col items-center gap-3 w-full px-6 py-7 rounded-3xl border border-[rgba(244,162,77,0.2)] bg-[rgba(13,11,9,0.95)]"
          style={{ animation: 'fadeUp 0.5s ease 0.35s both' }}
        >
          {/* Rank badge */}
          {rank && (
            <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase px-4 py-1 rounded-full border border-[rgba(244,162,77,0.5)] bg-[rgba(244,162,77,0.1)] text-[var(--accent)]">
              {rank}
            </span>
          )}

          <div className="text-center">
            <p
              className="text-2xl font-bold text-[var(--text)] mb-1"
              style={{ fontFamily: 'Syne, serif', textShadow: '0 0 20px rgba(244,162,77,0.15)' }}
            >
              Milestone Unlocked
            </p>
            <p className="text-xs font-mono text-[var(--muted)] leading-relaxed max-w-[220px] mx-auto">
              {msg}
            </p>
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[rgba(244,162,77,0.4)] to-transparent" />

          {/* CTA */}
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-2xl font-mono text-xs uppercase tracking-widest font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(244,162,77,0.15), rgba(212,131,45,0.1))',
              border: '1px solid rgba(244,162,77,0.35)',
              color: 'var(--accent)',
              boxShadow: '0 0 20px rgba(244,162,77,0.12)',
            }}
          >
            Keep the streak alive →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Diamond streak widget ─────────────────────────────────────────────────────
function DiamondStreak({ streak, isMilestone }: { streak: number; isMilestone: boolean }) {
  const size = 96; // px — controls rendered size
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Milestone glow layers */}
      {isMilestone && (
        <>
          <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-20 blur-3xl animate-pulse" />
          <div
            className="absolute rounded-full border border-[rgba(244,162,77,0.4)] animate-ping opacity-50"
            style={{ inset: -8 }}
          />
        </>
      )}

      {/* SVG diamond */}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={`transition-all duration-500 ${isMilestone
          ? 'drop-shadow-[0_0_22px_rgba(244,162,77,0.9)]'
          : 'drop-shadow-[0_0_8px_rgba(244,162,77,0.3)]'
          }`}
        fill="none"
        style={{ display: 'block' }}
      >
        {/* ① Solid background — masks card border behind it */}
        <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="#0d0b09" />
        {/* ② Subtle inner fill */}
        <path
          d="M50 5 L95 50 L50 95 L5 50 Z"
          fill={isMilestone ? 'rgba(244,162,77,0.14)' : 'rgba(244,162,77,0.05)'}
        />
        {/* ③ Amber border */}
        <path
          d="M50 5 L95 50 L50 95 L5 50 Z"
          stroke={isMilestone ? '#F4A24D' : 'rgba(244,162,77,0.5)'}
          strokeWidth="1.5"
        />
        {/* ④ Top shine */}
        <path
          d="M50 5 L95 50 L50 50 Z"
          fill={isMilestone ? 'rgba(244,162,77,0.07)' : 'rgba(255,255,255,0.02)'}
        />
      </svg>

      {/* Number + label — layered on top */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none"
      >
        <span
          className={`font-bold leading-none tabular-nums ${isMilestone ? 'text-[var(--accent)]' : 'text-[var(--text)]'
            }`}
          style={{
            fontFamily: 'Syne, serif',
            fontSize: streak >= 100 ? '1.35rem' : streak >= 10 ? '1.6rem' : '1.8rem',
          }}
        >
          {streak}
        </span>
        <span className="text-[8px] font-mono uppercase tracking-[0.15em] text-[var(--muted)]">
          {streak === 1 ? 'day' : 'days'}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<PersonalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; count: number }>>([]);
  const [ruleStreak, setRuleStreak] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationShown = useRef(false);

  async function fetchRules() {
    const [rulesRes, suggRes, streakRes] = await Promise.all([
      fetch('/api/rules'),
      fetch('/api/rules/suggestions').catch(() => null),
      fetch('/api/rules/streak').catch(() => null),
    ]);
    const { rules: r } = await rulesRes.json();
    if (suggRes) {
      const { suggestions: s } = await suggRes.json().catch(() => ({ suggestions: [] }));
      setSuggestions(s || []);
    }
    if (streakRes) {
      const { rule_streak: st } = await streakRes.json().catch(() => ({ rule_streak: 0 }));
      const streak = st || 0;
      setRuleStreak(streak);
      // Trigger celebration only once per session on milestone
      if (MILESTONES.includes(streak) && !celebrationShown.current) {
        celebrationShown.current = true;
        setShowCelebration(true);
      }
    }
    setRules(r || []);
    setLoading(false);
  }

  useEffect(() => { fetchRules(); }, []);

  const isMilestone = MILESTONES.includes(ruleStreak);

  async function addRule() {
    if (!newRule.trim()) return;
    setSaving(true);
    await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newRule.trim() }),
    });
    setNewRule('');
    setAdding(false);
    setSaving(false);
    toast('Rule added ✓', 'success');
    fetchRules();
  }

  async function toggleRule(rule: PersonalRule) {
    const nextState = !rule.active;
    await fetch('/api/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_id: rule.rule_id, active: nextState }),
    });
    toast(nextState ? 'Rule activated' : 'Rule deactivated', 'info');
    fetchRules();
  }

  async function deleteRule(rule: PersonalRule) {
    // Optimistic removal
    setRules(prev => prev.filter(r => r.rule_id !== rule.rule_id));
    await fetch('/api/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_id: rule.rule_id }),
    });
    toast('Rule removed', 'info');
  }

  return (
    <>
      {showCelebration && (
        <MilestoneCelebration streak={ruleStreak} onDismiss={() => setShowCelebration(false)} />
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-0 animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, serif' }}>Rules</h1>
            <p className="text-xs font-mono text-[var(--muted)] mt-1 uppercase tracking-widest">Your personal food rules</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setAdding(!adding)}>
            {adding ? 'Cancel' : '+ Add rule'}
          </Button>
        </div>

        {/* ── Diamond streak board ─────────────────────────────── */}
        <div className="relative mb-10 animate-fade-up" style={{ marginTop: 64 }}>
          {/* Diamond — centered, half above the card edge */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: -48 }}>
            <DiamondStreak streak={ruleStreak} isMilestone={isMilestone} />
          </div>

          {/* Board card */}
          <div
            className={`bg-[var(--surface)] border rounded-2xl pb-5 px-5 transition-all duration-500 ${isMilestone
              ? 'border-[rgba(244,162,77,0.5)] shadow-[0_0_40px_rgba(244,162,77,0.1)]'
              : 'border-[rgba(244,162,77,0.18)]'
              }`}
            style={{ paddingTop: 60 }}
          >
            <div className="flex flex-col items-center text-center gap-1.5">
              <span className="text-sm font-bold text-[var(--muted)] uppercase tracking-widest font-mono">
                Clean Streak
              </span>
              {isMilestone && (
                <span className="text-[10px] font-mono font-bold bg-[rgba(244,162,77,0.12)] text-[var(--accent)] border border-[rgba(244,162,77,0.3)] px-3 py-0.5 rounded-full">
                  ✦ Milestone Day
                </span>
              )}
              <p className="text-xs text-[var(--muted)] font-mono leading-relaxed max-w-xs">
                {rules.length === 0
                  ? 'Enroll a rule to start your clean streak'
                  : ruleStreak > 0
                    ? `${ruleStreak} consecutive day${ruleStreak > 1 ? 's' : ''} with zero rules broken`
                    : 'No active streak yet — log meals without breaking rules'}
              </p>
              {/* Next milestone hint */}
              {rules.length > 0 && !isMilestone && (() => {
                const next = MILESTONES.find(m => m > ruleStreak);
                return next ? (
                  <p className="text-[10px] font-mono text-[var(--muted2)]">
                    {next - ruleStreak} day{next - ruleStreak !== 1 ? 's' : ''} to next milestone · {next}d
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Add rule form */}
        {adding && (
          <div className="bg-[var(--surface)] border border-[var(--accent)] rounded-2xl p-5 mb-6 animate-scale-in">
            <MonoLabel className="mb-2 block">New rule</MonoLabel>
            <p className="text-xs text-[var(--muted)] mb-4 font-mono">
              Describe it naturally — AI will expand keywords automatically.<br />
              e.g. &quot;no chocolate&quot;, &quot;limit fried food&quot;, &quot;avoid maida&quot;
            </p>
            <Input
              placeholder="e.g. no chocolate"
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRule()}
              autoFocus
            />
            <Button size="lg" className="mt-4 font-mono" loading={saving} onClick={addRule} disabled={!newRule.trim()}>
              {saving ? 'Expanding keywords...' : 'Add Rule'}
            </Button>
          </div>
        )}

        {/* Rules list */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl animate-fade-up">
            <div className="text-4xl mb-3">⊘</div>
            <p className="text-sm text-[var(--muted)]">No rules yet.</p>
            <p className="text-xs text-[var(--muted2)] mt-1 font-mono">Add rules from your doctor, dietitian, or yourself.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-up">
            {rules.map((rule, i) => (
              <div key={rule.rule_id}
                className={`bg-[var(--surface)] border rounded-2xl p-5 transition-all ${rule.active ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50'}`}
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ fontFamily: 'Syne, serif' }}>{rule.description}</p>

                    {/* Monthly Breach Counter Badge */}
                    <div className="mt-2.5 flex items-center gap-2">
                      {rule.monthly_breaches_count === 0 ? (
                        <Badge color="green">✓ 0 breaches this month</Badge>
                      ) : (
                        <Badge color="red">
                          ⊘ {rule.monthly_breaches_count} breach{rule.monthly_breaches_count! > 1 ? 'es' : ''} this month
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {rule.keywords.slice(0, 6).map(kw => (
                        <Badge key={kw} color="muted">{kw}</Badge>
                      ))}
                      {rule.keywords.length > 6 && (
                        <Badge color="muted">+{rule.keywords.length - 6}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button onClick={() => toggleRule(rule)}
                      className={`w-11 h-6 rounded-full transition-all ${rule.active ? 'bg-[var(--accent)]' : 'bg-[var(--muted2)]'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform mx-0.5 ${rule.active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => deleteRule(rule)}
                      title="Delete rule"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted2)] hover:text-[var(--red)] hover:bg-[rgba(224,92,92,0.08)] transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pattern Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-10 animate-fade-up">
            <MonoLabel className="mb-3 block">Patterns in your log</MonoLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((sugg) => (
                <div key={sugg.name} className="bg-[var(--surface2)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--text)] font-medium" style={{ fontFamily: 'Syne, serif' }}>
                      Logged &quot;{sugg.name}&quot; {sugg.count} times
                    </p>
                    <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">Want to track or limit this item?</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewRule(`limit ${sugg.name}`);
                      setAdding(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--accent)] text-[var(--accent)] text-xs font-mono font-medium hover:bg-[var(--accent)] hover:text-[#0a0908] transition-all"
                  >
                    + Rule
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
