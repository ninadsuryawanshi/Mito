'use client';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ─── Gold sparkle dots ─────────────────────────────────── */
function Sparkle({ x, y, delay, size }: { x: string; y: string; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x, top: y,
        width: size, height: size,
        background: 'radial-gradient(circle, #FDE68A 0%, #F9C74F 50%, transparent 100%)',
        boxShadow: `0 0 ${size * 2}px ${size}px rgba(253,230,138,0.6)`,
      }}
      animate={{ scale: [0.6, 1.3, 0.6], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2.2, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ─── Animated number count-up ──────────────────────────── */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  return <motion.span className={className}>{display}</motion.span>;
}

/* ─── Main CalorieRing component ────────────────────────── */
interface CalorieRingProps {
  calories: number;
  goal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  fat: number;
}

export function CalorieRing({ calories, goal, protein, proteinGoal, carbs, fat }: CalorieRingProps) {
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(calories / goal, 1) : 0;

  return (
    <div className="mito-card p-5 flex flex-col items-center gap-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <MonoLabel>Calories Today</MonoLabel>
        {goal > 0 && (
          <span className="text-[12px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            Goal {goal.toLocaleString()} kcal
          </span>
        )}
      </div>

      {/* Ring */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Sparkles */}
        <Sparkle x="12%" y="10%" delay={0}    size={5} />
        <Sparkle x="80%" y="18%" delay={0.7}  size={4} />
        <Sparkle x="88%" y="70%" delay={1.4}  size={5} />
        <Sparkle x="8%"  y="72%" delay={2.1}  size={3} />

        {/* SVG ring */}
        <svg
          width={size} height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#C8820A" />
              <stop offset="30%"  stopColor="#E8A030" />
              <stop offset="60%"  stopColor="#F9C74F" />
              <stop offset="85%"  stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#E8A030" />
            </linearGradient>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="var(--surface2)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Animated fill */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="url(#goldRingGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            filter="url(#ringGlow)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ type: 'spring', stiffness: 55, damping: 18, delay: 0.35 }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'rotate(0deg)' }}
        >
          <AnimatedNumber
            value={calories}
            className="font-extrabold leading-none"
            style={{ fontSize: 44, fontFamily: 'var(--font-display)', color: 'var(--text)' } as React.CSSProperties}
          />
          <span className="text-[13px] mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            kcal
          </span>
          {goal > 0 && (
            <span className="text-[11px] mt-1 font-semibold" style={{ color: 'var(--gold-2)', fontFamily: 'var(--font-body)' }}>
              {Math.round(pct * 100)}% of goal
            </span>
          )}
        </div>
      </div>

      {/* Macro pills */}
      <div className="flex w-full gap-2">
        <MacroPill label="Protein" value={protein} goal={proteinGoal} color="var(--blue)" bg="var(--blue-tint)" />
        <MacroPill label="Carbs"   value={carbs}   color="var(--gold-2)"  bg="var(--gold-tint)"  />
        <MacroPill label="Fat"     value={fat}     color="var(--orange)"  bg="var(--orange-tint)" />
      </div>
    </div>
  );
}

function MacroPill({ label, value, goal, color, bg }: {
  label: string; value: number; goal?: number; color: string; bg: string;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-2xl"
      style={{ background: bg }}
    >
      <span className="font-bold text-[15px]" style={{ color, fontFamily: 'var(--font-display)' }}>
        {Math.round(value)}<span className="text-[11px] font-semibold">g</span>
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color, opacity: 0.7 }}>
        {label}
      </span>
      {goal != null && goal > 0 && (
        <div className="w-full px-1 mt-0.5">
          <div className="progress-track" style={{ height: 3 }}>
            <motion.div
              className="progress-fill"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((value / goal) * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.5 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
      {children}
    </span>
  );
}
