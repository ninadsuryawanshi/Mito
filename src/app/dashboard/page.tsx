'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { format, startOfWeek, addDays, startOfMonth, getDaysInMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BatteryLow,
  Bell,
  Camera,
  ChevronDown,
  Circle,
  Flame,
  Frown,
  Mic,
  ShieldCheck,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { MealLog, TimelineView, DashboardStats, MOOD_MAP } from '@/types';
import { computeStats } from '@/lib/services/mealService';
import {
  MonoLabel, Badge, WeekBarChart, MonthLineChart,
  AnimatedTypewriterPrompt, OnboardingTour, BottomNav, CalorieRing,
} from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import { useWebPush } from '@/hooks/useWebPush';

const VIEWS: TimelineView[] = ['day', 'week', 'month'];
const WHO_LIMITS = { sugar_g: 50, sodium_mg: 2300, fiber_g: 25 };
const WITTY_PROMPTS = [
  'what chaos did you call lunch today?', 'spill the tea... or the calories.',
  'what did you eat? no judgment (mostly).', 'confess your latest snack...',
  'was it fuel or pure temptation?', 'tell us about that sneaky late night bite.',
  'what fueled that big brain of yours today?', 'log it before your memory edits the portion size...',
  'did you eat a real meal or just vibes?', 'what culinary adventure did you just survive?',
  'is that post-meal food coma hitting yet?', 'honest answers only: what was on the plate?',
  'did you conquer dinner or did dinner conquer you?', 'what unexpected snack made a guest appearance?',
  'what fueled your engine today?', 'any high-protein victories to report?',
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const item = {
  hidden: { y: 18, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { isSubscribed, subscribe, loading: pushLoading } = useWebPush();
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<TimelineView>('day');
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ruleTraces, setRuleTraces] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [ruleStreak, setRuleStreak] = useState<number>(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [tabLoading, setTabLoading] = useState(false);

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

    const introTimer = setTimeout(() => setShowIntro(false), 1000);

    return () => {
      clearTimeout(introTimer);
    };
  }, []);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true); else setTabLoading(true);
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); setTabLoading(false); }
  }, [view]);

  useEffect(() => { fetchData(true); }, []); // eslint-disable-line
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) { initialMount.current = false; return; }
    fetchData(false);
  }, [view, fetchData]);

  const today = format(new Date(), 'EEEE, d MMM');
  const viewMultiplier = view === 'day' ? 1 : view === 'week' ? 7 : 30;

  return (
    <div className="min-h-dvh pb-nav" style={{ background: 'var(--bg)' }}>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="mito-boot-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex items-center gap-3"
            >
              <motion.div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[var(--text)] font-extrabold text-sm"
                style={{ background: 'var(--gold-gradient)', fontFamily: 'var(--font-display)' }}
                animate={{ boxShadow: ['0 0 0 rgba(232,160,48,0)', '0 0 24px rgba(232,160,48,0.45)', '0 0 0 rgba(232,160,48,0)'] }}
                transition={{ duration: 1, times: [0, 0.45, 1], ease: 'easeInOut' }}
              >
                M
              </motion.div>
              <span className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                mito
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OnboardingTour />

      <motion.div
        className="max-w-2xl mx-auto px-4 py-5"
        variants={container} initial="hidden" animate="show"
      >
        {/* ── Header ── */}
        <motion.div variants={item} className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--text)] font-extrabold text-xs"
                style={{ background: 'var(--gold-gradient)', fontFamily: 'var(--font-display)' }}>M</div>
              <span className="text-[17px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>mito</span>
            </div>
            <p className="text-[12px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{today}</p>
          </div>

          <div className="flex items-center gap-2" id="header-streaks">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                style={{ background: 'var(--gold-tint)', color: 'var(--gold-1)', border: '1px solid rgba(232,160,48,0.3)', fontFamily: 'var(--font-body)' }}>
                <Flame className="w-3.5 h-3.5" /> {streak}d
              </div>
            )}
            {ruleStreak > 0 && (
              <Link href="/rules" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                style={{ background: 'var(--blue-tint)', color: 'var(--blue)', border: '1px solid rgba(74,159,196,0.3)', fontFamily: 'var(--font-body)' }}>
                <ShieldCheck className="w-3.5 h-3.5" /> {ruleStreak}d
              </Link>
            )}
            <Link href="/settings" aria-label="Settings"
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px]"
              style={{ background: 'var(--gold-gradient)', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              {profile?.name ? profile.name[0].toUpperCase() : '•'}
            </Link>
          </div>
        </motion.div>

        {/* ── Push Notification Banner ── */}
        {!isSubscribed && (
          <motion.div variants={item}
            className="mb-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: 'var(--gold-tint)', border: '1px solid rgba(232,160,48,0.3)' }}>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" style={{ color: 'var(--gold-1)' }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                  Enable meal reminders
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text2)' }}>Witty nudges &amp; streak alerts</p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.94 }}
              onClick={async () => {
                const ok = await subscribe();
                if (ok) toast('Push notifications enabled.', 'success');
                else toast('Could not enable notifications.', 'error');
              }}
              disabled={pushLoading}
              className="gold-btn px-3.5 py-1.5 text-[12px] font-semibold"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
              Enable
            </motion.button>
          </motion.div>
        )}

        {/* ── Calorie Ring Hero (day view only) ── */}
        {view === 'day' && (
          <motion.div variants={item} className="mb-4">
            {loading
              ? <div className="mito-card p-5 h-72 skeleton" />
              : (
                <CalorieRing
                  calories={stats ? Math.round(stats.total_calories) : 0}
                  goal={profile?.recommended_calories || 0}
                  protein={stats ? Math.round(stats.total_protein_g) : 0}
                  proteinGoal={profile?.recommended_protein_g || 0}
                  carbs={stats ? Math.round(stats.total_carbs_g) : 0}
                  fat={stats ? Math.round(stats.total_fat_g) : 0}
                />
              )
            }
          </motion.div>
        )}

        {/* ── Quick-Log Box ── */}
        <motion.div variants={item} id="quick-log-prompt" className="quicklog-card quicklog-ambient-glow mb-4 p-4">
          <Link href="/log?autoFocus=true" className="flex items-center justify-between gap-4 group">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-[16px] font-bold leading-snug" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                {profile?.name ? `Hey ${profile.name.split(' ')[0]},` : 'Hey,'}{' '}
                <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{WITTY_PROMPTS[promptIndex]}</span>
              </p>
              <AnimatedTypewriterPrompt className="text-[13px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }} />
            </div>
            <motion.div
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="gold-btn w-10 h-10 flex items-center justify-center shrink-0 text-[var(--text)] font-bold text-base"
              style={{ borderRadius: '50%', padding: 0 }}
            ><ChevronDown className="w-4 h-4 -rotate-90" /></motion.div>
          </Link>
          <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(232,160,48,0.2)' }}>
            <Link href="/log?mode=photo"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
              <Camera className="w-3.5 h-3.5" /> Photo
            </Link>
            <Link href="/log?mode=voice"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
              <Mic className="w-3.5 h-3.5" /> Voice
            </Link>
          </div>
        </motion.div>

        {/* ── Timeline Toggle ── */}
        <motion.div variants={item} className="tab-switcher mb-5">
          {VIEWS.map((v) => (
            <button key={v} onClick={() => setView(v)} className={`tab-switcher-item ${view === v ? 'active' : ''}`}>
              {view === v && (
                <motion.div layoutId="tab-pill" className="tab-switcher-pill absolute inset-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
              )}
              <span className="relative z-10 capitalize">{v}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Week/Month Charts ── */}
        {!loading && view !== 'day' && (
          <motion.div variants={item} className="mb-4">
            {view === 'week' && (() => {
              const today2 = new Date();
              const weekStart = startOfWeek(today2, { weekStartsOn: 1 });
              const chartData = Array.from({ length: 7 }, (_, idx) => {
                const d = addDays(weekStart, idx);
                const dayStr = format(d, 'yyyy-MM-dd');
                const isToday = format(d, 'yyyy-MM-dd') === format(today2, 'yyyy-MM-dd');
                const dayMeals = meals.filter(m => format(new Date(m.logged_at), 'yyyy-MM-dd') === dayStr);
                return {
                  dayLabel: isToday ? 'Today' : format(d, 'EEE'),
                  calories: Math.round(dayMeals.reduce((s, m) => s + (m.total_calories || 0), 0)),
                  protein: Math.round(dayMeals.reduce((s, m) => s + (m.total_protein_g || 0), 0)),
                };
              });
              return <WeekBarChart data={chartData} />;
            })()}
            {view === 'month' && (() => {
              const today2 = new Date();
              const monthStart = startOfMonth(today2);
              const totalDays = getDaysInMonth(today2);
              const chartData = Array.from({ length: totalDays }, (_, idx) => {
                const d = addDays(monthStart, idx);
                const dayStr = format(d, 'yyyy-MM-dd');
                const dayMeals = meals.filter(m => format(new Date(m.logged_at), 'yyyy-MM-dd') === dayStr);
                return {
                  dayLabel: format(d, 'd MMM'),
                  calories: Math.round(dayMeals.reduce((s, m) => s + (m.total_calories || 0), 0)),
                  protein: Math.round(dayMeals.reduce((s, m) => s + (m.total_protein_g || 0), 0)),
                };
              });
              return <MonthLineChart data={chartData} />;
            })()}
          </motion.div>
        )}

        {/* ── Insight ── */}
        {insight && !loading && (
          <motion.div variants={item} className="mito-card px-4 py-3 mb-4">
            <MonoLabel className="block mb-1">Today's observation</MonoLabel>
            <p className="text-[14px] italic" style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>{insight}</p>
          </motion.div>
        )}

        {/* ── Rule Traces ── */}
        {ruleTraces.length > 0 && !loading && (
          <motion.div variants={item} className="rounded-2xl px-4 py-3 mb-4"
            style={{ background: 'var(--red-tint)', border: '1px solid rgba(224,92,92,0.2)' }}>
            <MonoLabel className="block mb-2" style={{ color: 'var(--red)' }}>Rules triggered</MonoLabel>
            <div className="flex flex-col gap-1.5">
              {ruleTraces.map((t: any) => (
                <div key={t.trace_id} className="flex items-center justify-between">
                  <p className="text-[13px]" style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                    <span style={{ color: 'var(--red)' }}>⊘ </span>
                    {t.rule?.description}
                    <span style={{ color: 'var(--muted)' }}> · "{t.matched_keyword}"</span>
                  </p>
                  <span className="text-[11px] shrink-0 ml-2" style={{ color: 'var(--muted)' }}>
                    {format(new Date(t.triggered_at), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Meals section ── */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <MonoLabel>
              {view === 'day' ? "Today's meals" : view === 'week' ? 'This week' : 'This month'}
            </MonoLabel>
            {tabLoading && (
              <div className="w-4 h-4 border-2 border-[var(--surface3)] border-t-[var(--gold-2)] rounded-full anim-spin" />
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="mito-card p-4 h-20 skeleton" />)}
            </div>
          ) : meals.length === 0 ? (
            /* Empty state with food illustration */
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-32 h-32 rounded-full overflow-hidden"
                style={{ boxShadow: '0 8px 32px rgba(200,130,10,0.15)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/food-empty-plate.png" alt="Empty plate" className="w-full h-full object-cover" />
              </motion.div>
              <div>
                <p className="text-[16px] font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  Nothing logged {view === 'day' ? 'today' : view === 'week' ? 'this week' : 'this month'}
                </p>
                <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
                  Tap <span style={{ color: 'var(--gold-2)' }}>+</span> to log your first meal
                </p>
              </div>
            </div>
          ) : (
            <motion.div className="flex flex-col gap-3" variants={container} initial="hidden" animate="show">
              {meals.map((meal, i) => (
                <MealCard key={meal.log_id} meal={meal} index={i} onDelete={() => fetchData(false)} />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Stats panels */}
        {!loading && stats && stats.total_meals > 0 && view === 'day' && (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 mt-4">
            <GoalCard label="Fiber" value={Math.round(stats.total_fiber_g)} unit="g"
              goal={WHO_LIMITS.fiber_g} color="var(--green)" mode="reach" />
            <GoalCard label="Sugar" value={Math.round(stats.total_sugar_g)} unit="g"
              goal={WHO_LIMITS.sugar_g} color="var(--red)" mode="limit" />
            <GoalCard label="Sodium" value={Math.round(stats.total_sodium_mg)} unit="mg"
              goal={WHO_LIMITS.sodium_mg} color="var(--muted)" mode="limit" />
            <GoalCard label="Protein" value={Math.round(stats.total_protein_g)} unit="g"
              goal={profile?.recommended_protein_g || undefined} color="var(--blue)" mode="goal" />
          </motion.div>
        )}

        {!loading && stats && stats.total_meals > 0 && view !== 'day' && (
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3 mt-4">
            <GoalCard label="Calories" value={Math.round(stats.total_calories)} unit="kcal"
              goal={profile?.recommended_calories ? profile.recommended_calories * viewMultiplier : undefined}
              color="var(--gold-2)" mode="goal" showMacroBar stats={stats} />
            <div className="grid grid-cols-2 gap-3">
              <GoalCard label="Protein" value={Math.round(stats.total_protein_g)} unit="g"
                goal={profile?.recommended_protein_g ? profile.recommended_protein_g * viewMultiplier : undefined}
                color="var(--blue)" mode="goal" />
              <GoalCard label="Fiber" value={Math.round(stats.total_fiber_g)} unit="g"
                goal={WHO_LIMITS.fiber_g * viewMultiplier} color="var(--green)" mode="reach" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <GoalCard label="Sugar" value={Math.round(stats.total_sugar_g)} unit="g"
                goal={WHO_LIMITS.sugar_g * viewMultiplier} color="var(--red)" mode="limit" />
              <GoalCard label="Sodium" value={Math.round(stats.total_sodium_mg)} unit="mg"
                goal={WHO_LIMITS.sodium_mg * viewMultiplier} color="var(--muted)" mode="limit" />
            </div>
          </motion.div>
        )}
      </motion.div>

      <BottomNav />
    </div>
  );
}

/* ── Goal Card ─────────────────────────────────────────────── */
function GoalCard({ label, value, unit, goal, color, mode, sub, showMacroBar, stats }: {
  label: string; value: number; unit: string; goal?: number;
  color: string; mode: 'goal' | 'reach' | 'limit';
  sub?: string; showMacroBar?: boolean; stats?: DashboardStats;
}) {
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;
  const exceeded = goal ? value > goal : false;
  const barColor = mode === 'limit' && exceeded ? 'var(--red)'
    : mode === 'reach' && pct >= 100 ? 'var(--green)' : color;
  const badge = mode === 'limit' && exceeded ? { text: 'Over limit', c: 'var(--red)', bg: 'var(--red-tint)' }
    : mode === 'reach' && pct >= 100 ? { text: '✓ Met', c: 'var(--green)', bg: 'var(--green-tint)' }
    : mode === 'goal' && pct >= 100 ? { text: 'Reached', c: 'var(--gold-1)', bg: 'var(--gold-tint)' } : null;

  return (
    <div className="mito-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <MonoLabel className="block mb-1">{label}</MonoLabel>
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-extrabold leading-none" style={{ fontFamily: 'var(--font-display)', color }}>
              {value.toLocaleString()}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{unit}</span>
            {goal && <span className="text-[12px]" style={{ color: 'var(--muted)' }}>/ {goal.toLocaleString()}{unit}</span>}
          </div>
        </div>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
            style={{ background: badge.bg, color: badge.c }}>{badge.text}</span>
        )}
      </div>
      {goal && (
        <div className="progress-track mb-2">
          <motion.div className="progress-fill" style={{ background: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.2 }} />
        </div>
      )}
      {showMacroBar && stats && (() => {
        const total = stats.total_protein_g * 4 + stats.total_carbs_g * 4 + stats.total_fat_g * 9;
        if (!total) return null;
        return (
          <>
            <div className="macro-bar mb-2">
              <div className="macro-bar-protein" style={{ flex: stats.total_protein_g * 4 / total }} />
              <div className="macro-bar-carbs"   style={{ flex: stats.total_carbs_g * 4 / total }} />
              <div className="macro-bar-fat"     style={{ flex: stats.total_fat_g * 9 / total }} />
            </div>
            <div className="flex gap-2 flex-wrap text-[11px]">
              {[
                { label: `Protein ${Math.round(stats.total_protein_g)}g`, color: 'var(--blue)', bg: 'var(--blue-tint)' },
                { label: `Carbs ${Math.round(stats.total_carbs_g)}g`,   color: 'var(--gold-2)', bg: 'var(--gold-tint)' },
                { label: `Fats ${Math.round(stats.total_fat_g)}g`,      color: 'var(--orange)', bg: 'var(--orange-tint)' },
              ].map(({ label: l, color: c, bg }) => (
                <span key={l} className="px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: bg, color: c }}>{l}</span>
              ))}
            </div>
          </>
        );
      })()}
      {sub && <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>{sub}</p>}
    </div>
  );
}

/* ── Meal Card ─────────────────────────────────────────────── */
function MealCard({ meal, index, onDelete }: { meal: MealLog; index: number; onDelete: () => void }) {
  const [showMood, setShowMood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const foodNames = meal.items?.map(i => i.food_entity?.name).filter(Boolean).join(', ') || 'Meal';
  const time = format(new Date(meal.logged_at), 'h:mm a');
  const moodScore = meal.mood?.mood_score;

  function renderMoodIcon(score: 1 | 2 | 3 | 4, className = 'w-4 h-4') {
    if (score === 1) return <BatteryLow className={className} />;
    if (score === 2) return <Circle className={className} />;
    if (score === 3) return <Activity className={className} />;
    return <Frown className={className} />;
  }

  async function logMood(score: 1 | 2 | 3 | 4) {
    await fetch('/api/mood', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log_id: meal.log_id, mood_score: score }) });
    setShowMood(false); onDelete();
  }

  async function deleteMeal() { setDeleting(true); await fetch(`/api/meals/${meal.log_id}`, { method: 'DELETE' }); onDelete(); }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, delay: index * 0.06 }}
      className="mito-card p-4 relative overflow-hidden"
    >
      {/* Gold left accent bar */}
      <div className="meal-accent-bar" />

      <div className="pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              {foodNames}
            </p>
            <p className="text-[12px] mt-0.5 capitalize" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              {meal.meal_type && `${meal.meal_type} · `}{time}
              {meal.eating_context && ` · ${meal.eating_context}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {moodScore
              ? <span title={MOOD_MAP[moodScore].label} className="text-[var(--gold-1)]">{renderMoodIcon(moodScore, 'w-4 h-4')}</span>
              : <button onClick={() => setShowMood(!showMood)} className="text-[12px] font-medium border-none bg-transparent cursor-pointer"
                  style={{ color: 'var(--muted)' }}>mood?</button>
            }
            <motion.button whileTap={{ scale: 0.85 }} onClick={deleteMeal} disabled={deleting}
              className="w-7 h-7 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer text-[16px]"
              style={{ color: 'var(--muted2)' }}>
              {deleting ? '…' : <Trash2 className="w-3.5 h-3.5" />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showMood && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="flex gap-4 mt-3 overflow-hidden">
              {([1,2,3,4] as const).map(s => (
                <motion.button key={s} whileTap={{ scale: 0.85 }} onClick={() => logMood(s)}
                  className="flex flex-col items-center gap-1 border-none bg-transparent cursor-pointer">
                  <span className="text-[var(--gold-1)]">{renderMoodIcon(s, 'w-5 h-5')}</span>
                  <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{MOOD_MAP[s].label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge color="gold"><Flame className="w-3 h-3" /> {Math.round(meal.total_calories || 0)} kcal</Badge>
            <Badge color="blue">P {Math.round(meal.total_protein_g || 0)}g</Badge>
            <Badge color="muted">C {Math.round(meal.total_carbs_g || 0)}g</Badge>
            {meal.price && meal.price > 0 && <Badge color="green">₹{meal.price}</Badge>}
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setExpanded(!expanded)}
            className="text-[12px] font-semibold flex items-center gap-1 border-none bg-transparent cursor-pointer"
            style={{ color: 'var(--gold-2)', fontFamily: 'var(--font-body)' }}>
            {expanded ? 'Collapse' : 'Details'}
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}><ChevronDown className="w-3.5 h-3.5" /></motion.span>
          </motion.button>
        </div>

        {meal.ai_note && <p className="text-[12px] mt-2 italic" style={{ color: 'var(--muted)' }}>{meal.ai_note}</p>}

        {/* Expandable breakdown */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden">
              <div className="mt-4 pt-3 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                {meal.items && meal.items.length > 0 && (
                  <div>
                    <MonoLabel className="block mb-2">Food Breakdown</MonoLabel>
                    <div className="flex flex-col gap-1.5">
                      {meal.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[13px] rounded-xl px-3 py-2"
                          style={{ background: 'var(--surface2)' }}>
                          <div>
                            <span className="font-medium" style={{ color: 'var(--text)' }}>{it.food_entity?.name || 'Item'}</span>
                            <span className="text-[11px] ml-2" style={{ color: 'var(--muted)' }}>({it.quantity} {it.unit})</span>
                          </div>
                          <div className="flex gap-3 text-[11px]" style={{ color: 'var(--muted)' }}>
                            <span>{Math.round(it.calories || 0)} kcal</span>
                            <span style={{ color: 'var(--gold-1)' }}>P {Math.round(it.protein_g || 0)}g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <MonoLabel className="block mb-2">Nutrition</MonoLabel>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Fat',    val: meal.total_fat_g,    color: 'var(--orange)' },
                      { label: 'Fiber',  val: meal.total_fiber_g,  color: 'var(--green)'  },
                      { label: 'Sugar',  val: meal.total_sugar_g,  color: 'var(--red)'    },
                      { label: 'Sodium', val: meal.total_sodium_mg, color: 'var(--muted)', unit: 'mg' },
                    ].map(({ label: l, val, color, unit }) => (
                      <div key={l} className="rounded-xl p-2" style={{ background: 'var(--surface2)' }}>
                        <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{l}</p>
                        <p className="text-[13px] font-bold mt-0.5" style={{ color }}>
                          {Math.round(val || 0)}{unit || 'g'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}