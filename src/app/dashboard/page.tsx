'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { format, startOfWeek, addDays, startOfMonth, getDaysInMonth } from 'date-fns';
import { MealLog, TimelineView, DashboardStats, MOOD_MAP } from '@/types';
import { computeStats } from '@/lib/services/mealService';
import { MonoLabel, Badge, DayRingsChart, WeekBarChart, MonthLineChart, LogoMark, AnimatedTypewriterPrompt } from '@/components/ui';

const VIEWS: TimelineView[] = ['day', 'week', 'month'];

const WHO_LIMITS = {
  sugar_g: 50,
  sodium_mg: 2300,
  fiber_g: 25,
};

const WITTY_PROMPTS = [
  "what chaos did you call lunch today?",
  "spill the tea... or the calories.",
  "what did you eat? no judgment (mostly).",
  "confess your latest snack...",
  "was it fuel or pure temptation?",
  "tell us about that sneaky late night bite.",
  "what fueled that big brain of yours today?",
  "log it before your memory edits the portion size...",
  "did you eat a real meal or just vibes?",
  "what culinary masterpiece (or disaster) was it?",
  "spill the beans... literally or metaphorically.",
  "what did you just feed your body?",
  "what culinary adventure did you just survive?",
  "is that post-meal food coma hitting yet?",
  "honest answers only: what was on the plate?",
  "did you conquer dinner or did dinner conquer you?",
  "what unexpected snack made a guest appearance?",
  "time to account for those delicious decisions.",
  "what fueled your engine today?",
  "any high-protein victories to report?",
  "drop the food log and step away from the pantry.",
  "what did you feast on?",
  "what's the total damage from your last meal?",
  "give your macros something fresh to calculate.",
  "what did you eat? your dietitian wants to know.",
  "what plate just got wiped clean?",
  "what's on your plate today?",
  "dish the details...",
  "what did you eat today?",
  "track your latest fuel...",
  "what's cooking?",
  "log your last bite...",
  "did you eat a salad or just stare at one?",
  "was that snack planned or a spontaneous plot twist?",
  "what delicious crime was committed in the kitchen?",
];

export default function DashboardPage() {
  const [view, setView] = useState<TimelineView>('day');
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ruleTraces, setRuleTraces] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [promptIndex, setPromptIndex] = useState(0);

  const [ruleStreak, setRuleStreak] = useState<number>(0);

  // Static user data fetched once on mount
  useEffect(() => {
    setPromptIndex(Math.floor(Math.random() * WITTY_PROMPTS.length));
    Promise.all([
      fetch('/api/profile').then(r => r.json()).catch(() => ({})),
      fetch('/api/insights/daily').then(r => r.json()).catch(() => ({ insight: '' })),
      fetch('/api/meals/streak').then(r => r.json()).catch(() => ({ streak_days: 0 })),
      fetch('/api/rules/streak').then(r => r.json()).catch(() => ({ rule_streak: 0 })),
    ]).then(([pRes, iRes, sRes, rRes]) => {
      setProfile(pRes.profile || null);
      setInsight(iRes.insight || '');
      setStreak(sRes.streak_days || 0);
      setRuleStreak(rRes.rule_streak || 0);
    });
  }, []);

  const [tabLoading, setTabLoading] = useState(false);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setTabLoading(true);

    try {
      const [mealsRes, tracesRes] = await Promise.all([
        fetch(`/api/meals?view=${view}`),
        fetch(`/api/rules/traces?view=${view}`),
      ]);
      const { meals: m } = await mealsRes.json();
      const { traces: t } = await tracesRes.json().catch(() => ({ traces: [] }));
      setMeals(m || []);
      setStats(computeStats(m || []));
      setRuleTraces(t || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTabLoading(false);
    }
  }, [view]);

  // Initial load
  useEffect(() => {
    fetchData(true);
  }, []); // Run once on mount

  // View switch
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    fetchData(false);
  }, [view, fetchData]);

  const today = format(new Date(), 'EEEE, d MMM');
  const viewMultiplier = view === 'day' ? 1 : view === 'week' ? 7 : 30;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div className="flex flex-col justify-center">
          <LogoMark showText size={28} />
          <p className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Logging Streak badge */}
          {streak > 0 && (
            <div
              title={`${streak}-day meal logging streak`}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-[rgba(244,162,77,0.08)] border border-[rgba(244,162,77,0.25)] shrink-0 select-none"
            >
              <svg className="w-3.5 h-3.5 text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.05v2.24c-1.78 1.13-3 3.12-3 5.81 0 3.87 3.13 7 7 7s7-3.13 7-7c0-2.69-1.22-4.68-3-5.81V5.95c2.96 1.47 5 4.52 5 8.05 0 4.97-4.03 9-9 9z" />
                <path d="M12 17c-2.21 0-4-1.79-4-4 0-1.5 0.8-2.8 2-3.46v1.73c-0.58 0.44-1 1.12-1 1.73 0 1.66 1.34 3 3 3s3-1.34 3-3c0-0.61-0.42-1.29-1-1.73V9.54c1.2 0.66 2 1.96 2 3.46 0 2.21-1.79 4-4 4z" />
              </svg>
              <span className="text-xs font-mono font-bold text-[var(--accent)]">{streak}d Log</span>
            </div>
          )}
          {/* Clean Streak badge */}
          {ruleStreak > 0 && (
            <Link
              href="/rules"
              title={`${ruleStreak}-day Clean Streak (unbroken discipline)`}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-[rgba(91,184,212,0.08)] border border-[rgba(91,184,212,0.3)] shrink-0 hover:scale-105 transition-all select-none"
            >
              <svg className="w-3.5 h-3.5 text-[#5BB8D4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="text-xs font-mono font-bold text-[#5BB8D4]">{ruleStreak}d Clean</span>
            </Link>
          )}
          {profile?.name && (
            <p className="text-sm text-[var(--text2)] font-mono hidden sm:block">Hey, {profile.name.split(' ')[0]}</p>
          )}
          {/* Settings / Profile link — mobile only, desktop uses sidebar */}
          <Link href="/settings"
            aria-label="Settings"
            className="md:hidden w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all active:scale-95">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Quick-Log Prompt Box with glowing moving gradient border */}
      <div className="moving-gradient-border-wrapper mb-7 animate-fade-up">
        <div className="bg-[#12100e] rounded-[1.6rem] p-7 sm:p-8 flex flex-col gap-5">
          {/* Main prompt input preview -> opens /log with autoFocus */}
          <Link href="/log?autoFocus=true" className="flex items-center justify-between group py-1 gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'Syne, serif' }}>
                {profile?.name
                  ? `Hey ${profile.name.split(' ')[0]}, ${WITTY_PROMPTS[promptIndex]}`
                  : `Hey, ${WITTY_PROMPTS[promptIndex]}`}
              </h2>
              <AnimatedTypewriterPrompt className="text-xs text-[var(--text2)] font-mono" />
            </div>
            <div className="w-11 h-11 rounded-full bg-[var(--accent)] text-[#0a0908] flex items-center justify-center font-bold text-lg shadow-[0_0_22px_var(--accent-glow)] group-hover:scale-105 transition-transform shrink-0">
              ➔
            </div>
          </Link>

          {/* Quick action chips matching reference design with direct tab deep-linking */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-[#1f1b16]">
            <Link href="/log?mode=photo"
              className="text-xs font-mono text-[var(--text2)] bg-[var(--surface2)] border border-[var(--border)] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              📷 Photo log
            </Link>
            <Link href="/log?mode=voice"
              className="text-xs font-mono text-[var(--text2)] bg-[var(--surface2)] border border-[var(--border)] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              🎙️ Voice log
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline toggle */}
      <div className="flex w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 mb-6 animate-fade-up delay-1">
        {VIEWS.map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-mono uppercase tracking-widest transition-all
              ${view === v ? 'bg-[var(--accent)] text-[#0a0908] font-bold shadow-[0_0_12px_var(--accent-glow)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}>
            {v}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 animate-pulse">
          {/* Left skeleton */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            {[80, 64, 64, 64, 64].map((h, i) => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
                <div className="skeleton h-3 w-20 mb-3" />
                <div className={`skeleton mb-3`} style={{ height: h === 80 ? '2rem' : '1.75rem', width: '6rem' }} />
                <div className="skeleton h-1.5 w-full rounded-full mb-2" />
                <div className="skeleton h-3 w-28" />
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2.5">
                  <div className="skeleton h-5 w-8 mx-auto mb-2" />
                  <div className="skeleton h-2 w-6 mx-auto" />
                </div>
              ))}
            </div>
          </div>
          {/* Right skeleton */}
          <div className="lg:col-span-2 flex flex-col gap-3 mt-4 lg:mt-0">
            <div className="skeleton h-3 w-24 mb-1" />
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
                <div className="skeleton h-4 w-48 mb-2" />
                <div className="skeleton h-3 w-32 mb-3" />
                <div className="flex gap-2">
                  <div className="skeleton h-5 w-20" />
                  <div className="skeleton h-5 w-14" />
                  <div className="skeleton h-5 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">

          {/* LEFT COLUMN: Stats + Insight + Rules */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Insight */}
            {insight && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 animate-fade-up delay-2">
                <MonoLabel className="mb-1 block">Today&apos;s observation</MonoLabel>
                <p className="text-sm text-[var(--text)] italic">{insight}</p>
              </div>
            )}

            {/* Rule traces */}
            {ruleTraces.length > 0 && (
              <div className="bg-[rgba(224,92,92,0.06)] border border-[rgba(224,92,92,0.2)] rounded-xl px-4 py-3 animate-fade-up delay-2">
                <MonoLabel className="mb-2 block" style={{ color: 'var(--red)' }}>Rules triggered</MonoLabel>
                <div className="flex flex-col gap-2">
                  {ruleTraces.map((t: any) => (
                    <div key={t.trace_id} className="flex items-center justify-between">
                      <p className="text-xs text-[var(--text2)]">
                        <span className="text-[var(--red)]">⊘ </span>
                        {t.rule?.description}
                        <span className="text-[var(--muted)]"> · &quot;{t.matched_keyword}&quot;</span>
                      </p>
                      <span className="text-[10px] font-mono text-[var(--muted)] shrink-0 ml-2">
                        {format(new Date(t.triggered_at), 'h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats — real data or static skeleton placeholders */}
            {stats && stats.total_meals > 0 ? (
              <div className="animate-fade-up delay-2 flex flex-col gap-3">

                {/* ── Chart — view-aware ── */}
                {view === 'day' && (
                  <DayRingsChart
                    calories={Math.round(stats.total_calories)}
                    calorieGoal={profile?.recommended_calories || 0}
                    protein={Math.round(stats.total_protein_g)}
                    proteinGoal={profile?.recommended_protein_g || 0}
                  />
                )}

                {view === 'week' && (() => {
                  const today = new Date();
                  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
                  const chartData = Array.from({ length: 7 }, (_, idx) => {
                    const d = addDays(weekStart, idx);
                    const dayStr = format(d, 'yyyy-MM-dd');
                    const isToday = format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                    const dayLabel = isToday ? 'Today' : format(d, 'EEE');
                    const dayMeals = meals.filter(m => format(new Date(m.logged_at), 'yyyy-MM-dd') === dayStr);
                    return {
                      dayLabel,
                      calories: Math.round(dayMeals.reduce((s, m) => s + (m.total_calories || 0), 0)),
                      protein: Math.round(dayMeals.reduce((s, m) => s + (m.total_protein_g || 0), 0)),
                    };
                  });
                  return <WeekBarChart data={chartData} />;
                })()}

                {view === 'month' && (() => {
                  const today = new Date();
                  const monthStart = startOfMonth(today);
                  const totalDays = getDaysInMonth(today);
                  const chartData = Array.from({ length: totalDays }, (_, idx) => {
                    const d = addDays(monthStart, idx);
                    const dayStr = format(d, 'yyyy-MM-dd');
                    const dayLabel = format(d, 'd MMM');
                    const dayMeals = meals.filter(m => format(new Date(m.logged_at), 'yyyy-MM-dd') === dayStr);
                    return {
                      dayLabel,
                      calories: Math.round(dayMeals.reduce((s, m) => s + (m.total_calories || 0), 0)),
                      protein: Math.round(dayMeals.reduce((s, m) => s + (m.total_protein_g || 0), 0)),
                    };
                  });
                  return <MonthLineChart data={chartData} />;
                })()}

                {/* Calories */}
                <GoalCard label="Calories" value={Math.round(stats.total_calories)} unit="kcal"
                  goal={profile?.recommended_calories ? profile.recommended_calories * viewMultiplier : undefined} color="var(--accent)" mode="goal"
                  showMacroBar stats={stats} />

                {/* Protein */}
                <GoalCard label="Protein" value={Math.round(stats.total_protein_g)} unit="g"
                  goal={profile?.recommended_protein_g ? profile.recommended_protein_g * viewMultiplier : undefined} color="var(--blue)" mode="goal"
                  sub={`Builds & repairs muscle · target ${viewMultiplier} day${viewMultiplier > 1 ? 's' : ''}`} />

                {/* Fiber */}
                <GoalCard label="Fiber" value={Math.round(stats.total_fiber_g)} unit="g"
                  goal={WHO_LIMITS.fiber_g * viewMultiplier} color="var(--green)" mode="reach"
                  sub={`WHO target: ${WHO_LIMITS.fiber_g}g/day`} />

                {/* Sugar */}
                <GoalCard label="Sugar" value={Math.round(stats.total_sugar_g)} unit="g"
                  goal={WHO_LIMITS.sugar_g * viewMultiplier} color="var(--red)" mode="limit"
                  sub={`WHO limit: ${WHO_LIMITS.sugar_g}g/day`} />

                {/* Sodium */}
                <GoalCard label="Sodium" value={Math.round(stats.total_sodium_mg)} unit="mg"
                  goal={WHO_LIMITS.sodium_mg * viewMultiplier} color="var(--muted)" mode="limit"
                  sub={`WHO limit: ${WHO_LIMITS.sodium_mg}mg/day`} />

                {/* Quick stats row */}
                <div className="grid grid-cols-4 gap-2">
                  <StatPill label="Spent" value={`₹${Math.round(stats.total_spend)}`} color="var(--green)" />
                  <StatPill label="Meals" value={String(stats.total_meals)} />
                  <StatPill label="Out" value={String(stats.meals_eaten_out)} color="var(--accent)" />
                  <StatPill label="Streak" value={`${streak}d`} color="var(--accent)" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-6 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl gap-5 text-center animate-fade-up delay-2 relative overflow-hidden min-h-[340px]">
                {/* Ambient glow */}
                <div className="absolute inset-0 bg-[var(--accent)] opacity-[0.025] blur-3xl pointer-events-none rounded-3xl" />

                {/* Professional Macro Ring SVG Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface2)] border border-[rgba(244,162,77,0.25)] flex items-center justify-center select-none animate-float shrink-0 shadow-[0_0_20px_rgba(244,162,77,0.08)]">
                  <svg className="w-7 h-7 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
                    <path d="M12 7v10M7 12h10" />
                  </svg>
                </div>

                {/* Text */}
                <div className="relative z-10">
                  <p className="text-base font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Syne, serif' }}>
                    No stats to display
                  </p>
                  <p className="text-xs font-mono text-[var(--muted)] leading-relaxed max-w-[220px]">
                    Your daily calories, macros, and nutrients will appear here as soon as you log your first meal.
                  </p>
                </div>

                {/* Subtle stat labels to show what will appear */}
                <div className="flex gap-2 flex-wrap justify-center relative z-10">
                  {['Calories', 'Protein', 'Fiber', 'Sugar', 'Sodium'].map(l => (
                    <span key={l} className="text-[9px] font-mono uppercase tracking-widest text-[var(--muted2)] border border-[var(--border)] rounded-full px-2.5 py-1">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Meal list */}
          <div className="lg:col-span-2 flex flex-col gap-3 animate-fade-up delay-3 mt-4 lg:mt-0">
            <MonoLabel className="mb-1">
              {view === 'day' ? "Today's meals" : view === 'week' ? 'This week' : 'This month'}
            </MonoLabel>

            {meals.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border)] rounded-2xl gap-5 text-center overflow-hidden min-h-[320px]">
                {/* Floating bowl illustration */}
                <div className="animate-float">
                  <div className="w-20 h-20 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(244,162,77,0.08)]">
                    🍽
                  </div>
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--text2)]" style={{ fontFamily: 'Syne, serif' }}>
                    Nothing logged {view === 'day' ? 'today' : view === 'week' ? 'this week' : 'this month'}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-2 font-mono max-w-xs">
                    Your meal log is empty — tap <span className="text-[var(--accent)] font-bold">+</span> to log your first meal
                  </p>
                </div>
                {/* Decorative blurred glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[var(--accent)] opacity-[0.04] blur-3xl rounded-full pointer-events-none" />
              </div>
            ) : (
              meals.map((meal, i) => <MealCard key={meal.log_id} meal={meal} index={i} onDelete={() => fetchData(false)} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({ label, value, unit, goal, color, mode, sub, showMacroBar, stats }: {
  label: string; value: number; unit: string; goal?: number;
  color: string; mode: 'goal' | 'reach' | 'limit';
  sub?: string; showMacroBar?: boolean; stats?: DashboardStats;
}) {
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;
  const exceeded = goal ? value > goal : false;

  const barColor = mode === 'limit' && exceeded ? 'var(--red)'
    : mode === 'reach' && pct >= 100 ? 'var(--green)'
      : color;

  const badge = mode === 'limit' && exceeded ? { text: 'Over limit', bg: 'rgba(224,92,92,0.1)', c: 'var(--red)' }
    : mode === 'reach' && pct >= 100 ? { text: '✓ Met', bg: 'rgba(92,184,138,0.1)', c: 'var(--green)' }
      : mode === 'goal' && pct >= 100 ? { text: 'Reached', bg: 'rgba(244,162,77,0.1)', c: 'var(--accent)' }
        : null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <MonoLabel className="block mb-1">{label}</MonoLabel>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ fontFamily: 'Syne, serif', color }}>{value}</span>
            <span className="text-xs font-mono text-[var(--muted)]">{unit}</span>
            {goal && <span className="text-xs font-mono text-[var(--muted)]">/ {goal}{unit}</span>}
          </div>
        </div>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-1 rounded-lg mt-1"
            style={{ background: badge.bg, color: badge.c }}>{badge.text}</span>
        )}
      </div>

      {goal && (
        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
        </div>
      )}

      {showMacroBar && stats && (() => {
        const total = stats.total_protein_g * 4 + stats.total_carbs_g * 4 + stats.total_fat_g * 9;
        if (total === 0) return null;
        return (
          <>
            <div className="macro-bar mb-2 mt-1">
              <div className="macro-bar-protein" style={{ flex: stats.total_protein_g * 4 / total }} />
              <div className="macro-bar-carbs" style={{ flex: stats.total_carbs_g * 4 / total }} />
              <div className="macro-bar-fat" style={{ flex: stats.total_fat_g * 9 / total }} />
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono mt-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[rgba(92,156,224,0.08)] text-[var(--blue)] border border-[rgba(92,156,224,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] shrink-0" />
                Protein {Math.round(stats.total_protein_g)}g
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[rgba(244,162,77,0.08)] text-[var(--accent)] border border-[rgba(244,162,77,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                Carbs {Math.round(stats.total_carbs_g)}g
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[rgba(232,136,90,0.08)] text-[#e8885a] border border-[rgba(232,136,90,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8885a] shrink-0" />
                Fats {Math.round(stats.total_fat_g)}g
              </span>
            </div>
          </>
        );
      })()}

      {sub && <p className="text-[10px] font-mono text-[var(--muted)] mt-1">{sub}</p>}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-center">
      <div className="text-lg font-bold" style={{ fontFamily: 'Syne, serif', color: color || 'var(--text)' }}>{value}</div>
      <MonoLabel>{label}</MonoLabel>
    </div>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────
function MealCard({ meal, index, onDelete }: { meal: MealLog; index: number; onDelete: () => void }) {
  const [showMood, setShowMood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const foodNames = meal.items?.map(i => i.food_entity?.name).filter(Boolean).join(', ') || 'Meal';
  const time = format(new Date(meal.logged_at), 'h:mm a');
  const moodScore = meal.mood?.mood_score;

  async function logMood(score: 1 | 2 | 3 | 4) {
    await fetch('/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log_id: meal.log_id, mood_score: score }),
    });
    setShowMood(false);
    onDelete();
  }

  async function deleteMeal() {
    setDeleting(true);
    await fetch(`/api/meals/${meal.log_id}`, { method: 'DELETE' });
    onDelete();
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 animate-fade-up transition-all hover:border-[rgba(244,162,77,0.3)]"
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}>
      <div className="relative pl-3 border-l-2 border-[var(--accent)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" style={{ fontFamily: 'Syne, serif' }}>{foodNames}</p>
            <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest mt-0.5 capitalize">
              {meal.meal_type && `${meal.meal_type} · `}{time}
              {meal.eating_context && ` · ${meal.eating_context}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {moodScore ? (
              <span title={MOOD_MAP[moodScore].label}>{MOOD_MAP[moodScore].emoji}</span>
            ) : (
              <button onClick={() => setShowMood(!showMood)}
                className="text-[var(--muted2)] hover:text-[var(--muted)] text-xs font-mono transition-colors">
                mood?
              </button>
            )}
            <button onClick={deleteMeal} disabled={deleting}
              className="text-[var(--muted2)] hover:text-[var(--red)] transition-colors text-sm">
              {deleting ? '…' : '×'}
            </button>
          </div>
        </div>

        {showMood && (
          <div className="flex gap-4 mt-3 animate-fade-in">
            {([1, 2, 3, 4] as const).map(s => (
              <button key={s} onClick={() => logMood(s)}
                className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                <span className="text-2xl">{MOOD_MAP[s].emoji}</span>
                <span className="text-[9px] font-mono text-[var(--muted)]">{MOOD_MAP[s].label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <div className="flex flex-wrap gap-2">
            <Badge color="accent">🔥 {Math.round(meal.total_calories || 0)} kcal</Badge>
            <Badge color="blue">P {Math.round(meal.total_protein_g || 0)}g</Badge>
            <Badge color="muted">C {Math.round(meal.total_carbs_g || 0)}g</Badge>
            {meal.price && meal.price > 0 && <Badge color="green">₹{meal.price}</Badge>}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-mono text-[var(--accent)] hover:underline flex items-center gap-1 transition-colors"
          >
            <span>{expanded ? 'Collapse' : 'Items & Details'}</span>
            <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
          </button>
        </div>

        {meal.ai_note && <p className="text-[11px] text-[var(--muted)] mt-2 italic">{meal.ai_note}</p>}

        {/* Expandable Breakdown */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-[var(--border)] animate-fade-in flex flex-col gap-3">
            {/* Individual Food Items */}
            {meal.items && meal.items.length > 0 && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">Food Breakdown</p>
                <div className="flex flex-col gap-1.5">
                  {meal.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-[var(--surface2)] px-3 py-2 rounded-xl">
                      <div>
                        <span className="font-medium text-[var(--text)]">{item.food_entity?.name || 'Item'}</span>
                        <span className="text-[10px] font-mono text-[var(--muted)] ml-2">
                          ({item.quantity} {item.unit})
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--muted)] flex gap-2">
                        <span>{Math.round(item.calories || 0)} kcal</span>
                        <span className="text-[var(--accent)]">P: {Math.round(item.protein_g || 0)}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Micronutrient Matrix */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">Full Nutrition Matrix</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="bg-[var(--surface2)] p-2 rounded-xl">
                  <p className="text-[9px] text-[var(--muted)] uppercase">Fat</p>
                  <p className="font-bold text-[var(--text)] mt-0.5">{Math.round(meal.total_fat_g || 0)}g</p>
                </div>
                <div className="bg-[var(--surface2)] p-2 rounded-xl">
                  <p className="text-[9px] text-[var(--muted)] uppercase">Fiber</p>
                  <p className="font-bold text-[var(--green)] mt-0.5">{Math.round(meal.total_fiber_g || 0)}g</p>
                </div>
                <div className="bg-[var(--surface2)] p-2 rounded-xl">
                  <p className="text-[9px] text-[var(--muted)] uppercase">Sugar</p>
                  <p className="font-bold text-[var(--red)] mt-0.5">{Math.round(meal.total_sugar_g || 0)}g</p>
                </div>
                <div className="bg-[var(--surface2)] p-2 rounded-xl">
                  <p className="text-[9px] text-[var(--muted)] uppercase">Sodium</p>
                  <p className="font-bold text-[var(--muted)] mt-0.5">{Math.round(meal.total_sodium_mg || 0)}mg</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}