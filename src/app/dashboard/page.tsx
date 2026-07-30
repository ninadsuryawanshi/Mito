'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { MealLog, TimelineView, DashboardStats, MOOD_MAP } from '@/types';
import { computeStats } from '@/lib/services/mealService';
import { MonoLabel, Badge, CalorieTrendChart, LogoMark } from '@/components/ui';

const VIEWS: TimelineView[] = ['day', 'week', 'month'];

const WHO_LIMITS = {
  sugar_g: 50,
  sodium_mg: 2300,
  fiber_g: 25,
};

export default function DashboardPage() {
  const [view, setView] = useState<TimelineView>('day');
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ruleTraces, setRuleTraces] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [mealsRes, profileRes, insightRes, tracesRes, streakRes] = await Promise.all([
      fetch(`/api/meals?view=${view}`),
      fetch('/api/profile'),
      fetch('/api/insights/daily'),
      fetch(`/api/rules/traces?view=${view}`),
      fetch('/api/meals/streak'),
    ]);
    const { meals: m } = await mealsRes.json();
    const { profile: p } = await profileRes.json();
    const { insight: i } = await insightRes.json().catch(() => ({ insight: '' }));
    const { traces: t } = await tracesRes.json().catch(() => ({ traces: [] }));
    const { streak_days: s } = await streakRes.json().catch(() => ({ streak_days: 0 }));
    setMeals(m || []);
    setStats(computeStats(m || []));
    setProfile(p);
    setInsight(i || '');
    setRuleTraces(t || []);
    setStreak(s || 0);
    setLoading(false);
  }, [view]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = format(new Date(), 'EEEE, d MMM');
  const viewMultiplier = view === 'day' ? 1 : view === 'week' ? 7 : 30;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <div className="mb-1">
            <LogoMark showText size={28} />
          </div>
          <p className="text-xs font-mono text-[var(--muted)] uppercase tracking-widest">{today}</p>
        </div>
        {profile?.name && (
          <p className="text-sm text-[var(--text2)]">Hey, {profile.name.split(' ')[0]}</p>
        )}
      </div>

      {/* Timeline toggle */}
      <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 mb-6 animate-fade-up delay-1 max-w-xs">
        {VIEWS.map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all
              ${view === v ? 'bg-[var(--accent)] text-[#0a0908] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}>
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
              {[0,1,2,3].map(i => (
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
            {[0,1,2].map(i => (
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
                <p className="text-sm text-[var(--text)] italic">&quot;{insight}&quot;</p>
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

                {/* Calorie Trend Chart */}
                {(() => {
                  const today = new Date();
                  const chartData = Array.from({ length: 7 }, (_, idx) => {
                    const d = subDays(today, 6 - idx);
                    const dayStr = format(d, 'yyyy-MM-dd');
                    const dayLabel = idx === 6 ? 'Today' : format(d, 'EEE');
                    const cals = meals
                      .filter(m => format(new Date(m.logged_at), 'yyyy-MM-dd') === dayStr)
                      .reduce((sum, m) => sum + (m.total_calories || 0), 0);
                    return { dayLabel, calories: Math.round(cals) };
                  });
                  return <CalorieTrendChart data={chartData} />;
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
              <div className="flex flex-col gap-3 animate-fade-up delay-2">
                {/* Static (non-animated) skeleton goal cards — no data yet */}
                {['Calories', 'Protein', 'Fiber', 'Sugar', 'Sodium'].map((label) => (
                  <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
                    <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest mb-3">{label}</p>
                    <div className="skeleton-static h-8 w-24 mb-3" />
                    <div className="skeleton-static h-1.5 w-full rounded-full mb-2" />
                    <div className="skeleton-static h-3 w-32" />
                  </div>
                ))}
                {/* Quick stats static skeleton */}
                <div className="grid grid-cols-4 gap-2">
                  {['Spent', 'Meals', 'Out', 'Streak'].map(l => (
                    <div key={l} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2.5 text-center">
                      <div className="skeleton-static h-5 w-8 mx-auto mb-2" />
                      <p className="text-[9px] font-mono text-[var(--muted)] uppercase tracking-widest">{l}</p>
                    </div>
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
                    Your nutrition mirror is empty — tap <span className="text-[var(--accent)] font-bold">+</span> to log your first meal
                  </p>
                </div>
                {/* Decorative blurred glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[var(--accent)] opacity-[0.04] blur-3xl rounded-full pointer-events-none" />
              </div>
            ) : (
              meals.map((meal, i) => <MealCard key={meal.log_id} meal={meal} index={i} onDelete={fetchData} />)
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
            <div className="flex gap-3 text-[10px] font-mono">
              <span className="text-[var(--blue)]">P {Math.round(stats.total_protein_g)}g</span>
              <span className="text-[var(--accent)]">C {Math.round(stats.total_carbs_g)}g</span>
              <span style={{ color: '#e8885a' }}>F {Math.round(stats.total_fat_g)}g</span>
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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 animate-fade-up"
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

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge color="accent">🔥 {Math.round(meal.total_calories || 0)} kcal</Badge>
          <Badge color="blue">P {Math.round(meal.total_protein_g || 0)}g</Badge>
          <Badge color="muted">C {Math.round(meal.total_carbs_g || 0)}g</Badge>
          {meal.price && meal.price > 0 && <Badge color="green">₹{meal.price}</Badge>}
        </div>

        {meal.ai_note && <p className="text-[11px] text-[var(--muted)] mt-2 italic">{meal.ai_note}</p>}
      </div>
    </div>
  );
}