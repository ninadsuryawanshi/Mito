'use client';
import { useState } from 'react';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface DailyPoint {
  dayLabel: string;
  calories: number;
  protein?: number;
}

// ─── Day View: Dual Progress Rings ───────────────────────────────────────────
// Shows calorie and protein progress against daily goals as rich SVG rings.
// No bar chart — 3-4 meals don't give comparison value; rings give goal clarity.

interface DayRingsProps {
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
}

export function DayRingsChart({ calories, calorieGoal, protein, proteinGoal }: DayRingsProps) {
  const SIZE = 130;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  // Outer ring — calories (amber)
  const outerR = 52;
  const outerStroke = 10;
  const outerCirc = 2 * Math.PI * outerR;
  const calPct = calorieGoal > 0 ? Math.min(calories / calorieGoal, 1) : 0;
  const calDash = calPct * outerCirc;
  const calOver = calories > calorieGoal;

  // Inner ring — protein (blue)
  const innerR = 36;
  const innerStroke = 9;
  const innerCirc = 2 * Math.PI * innerR;
  const protPct = proteinGoal > 0 ? Math.min(protein / proteinGoal, 1) : 0;
  const protDash = protPct * innerCirc;
  const protOver = protein > proteinGoal;

  // Start rings from top (-90deg = -π/2)
  const startOffset = 0;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 animate-fade-up">
      <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest block mb-4">
        Today&apos;s Progress
      </span>

      <div className="flex items-center gap-5">
        {/* SVG Rings */}
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ transform: 'rotate(-90deg)' }}
          >
            <defs>
              {/* Outer glow gradient — amber */}
              <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F4A24D" />
                <stop offset="100%" stopColor="#e8885a" />
              </linearGradient>
              {/* Inner glow gradient — blue */}
              <linearGradient id="protGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5BB8D4" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>
              {/* Outer track */}
              <filter id="ringGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer track (background ring) */}
            <circle
              cx={CX} cy={CY} r={outerR}
              fill="none"
              stroke="rgba(244,162,77,0.1)"
              strokeWidth={outerStroke}
            />
            {/* Outer progress arc */}
            {calDash > 0 && (
              <circle
                cx={CX} cy={CY} r={outerR}
                fill="none"
                stroke={calOver ? 'var(--red)' : 'url(#calGrad)'}
                strokeWidth={outerStroke}
                strokeLinecap="round"
                strokeDasharray={`${calDash} ${outerCirc}`}
                strokeDashoffset={startOffset}
                style={{
                  filter: 'drop-shadow(0 0 5px rgba(244,162,77,0.6))',
                  transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            )}

            {/* Inner track */}
            <circle
              cx={CX} cy={CY} r={innerR}
              fill="none"
              stroke="rgba(91,184,212,0.1)"
              strokeWidth={innerStroke}
            />
            {/* Inner progress arc */}
            {protDash > 0 && (
              <circle
                cx={CX} cy={CY} r={innerR}
                fill="none"
                stroke={protOver ? 'var(--green)' : 'url(#protGrad)'}
                strokeWidth={innerStroke}
                strokeLinecap="round"
                strokeDasharray={`${protDash} ${innerCirc}`}
                strokeDashoffset={startOffset}
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(91,184,212,0.5))',
                  transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            )}
          </svg>

          {/* Center label — calories remaining */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ transform: 'rotate(0deg)' }}
          >
            {calorieGoal > 0 ? (
              <>
                <span className="text-[10px] font-mono text-[var(--muted)] leading-none">
                  {calOver ? 'over' : 'left'}
                </span>
                <span
                  className="text-xl font-bold leading-none mt-0.5"
                  style={{
                    fontFamily: 'Syne, serif',
                    color: calOver ? 'var(--red)' : 'var(--accent)',
                  }}
                >
                  {Math.abs(Math.round(calorieGoal - calories))}
                </span>
                <span className="text-[9px] font-mono text-[var(--muted)] leading-none mt-0.5">
                  kcal
                </span>
              </>
            ) : (
              <span className="text-lg font-bold" style={{ fontFamily: 'Syne, serif', color: 'var(--accent)' }}>
                {Math.round(calories)}
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Calories */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #F4A24D, #e8885a)', boxShadow: '0 0 6px rgba(244,162,77,0.5)' }} />
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Calories</span>
            </div>
            <p className="font-bold text-lg leading-none" style={{ fontFamily: 'Syne, serif', color: calOver ? 'var(--red)' : 'var(--text)' }}>
              {Math.round(calories)}
              {calorieGoal > 0 && <span className="text-xs font-mono text-[var(--muted)] font-normal"> / {calorieGoal}</span>}
            </p>
            <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">
              {calorieGoal > 0 ? `${Math.round(calPct * 100)}% of goal` : 'no goal set'}
            </p>
          </div>

          {/* Protein */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #5BB8D4, #7dd3fc)', boxShadow: '0 0 6px rgba(91,184,212,0.45)' }} />
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Protein</span>
            </div>
            <p className="font-bold text-lg leading-none" style={{ fontFamily: 'Syne, serif', color: protOver ? 'var(--green)' : 'var(--text)' }}>
              {Math.round(protein)}g
              {proteinGoal > 0 && <span className="text-xs font-mono text-[var(--muted)] font-normal"> / {proteinGoal}g</span>}
            </p>
            <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">
              {proteinGoal > 0 ? `${Math.round(protPct * 100)}% of goal` : 'no goal set'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Week View: Bar Chart (Calories or Protein) ───────────────────────────────
// 7-day discrete bars — best for comparing individual days side by side.

export function WeekBarChart({ data }: { data: DailyPoint[] }) {
  const [metric, setMetric] = useState<'calories' | 'protein'>('calories');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const values = data.map(d => metric === 'calories' ? (d.calories || 0) : (d.protein || 0));
  const maxVal = Math.max(...values, metric === 'calories' ? 500 : 20);

  const isCalories = metric === 'calories';
  const color = isCalories ? '#F4A24D' : '#5BB8D4';
  const glowColor = isCalories ? 'rgba(244,162,77,0.5)' : 'rgba(91,184,212,0.5)';
  const unit = isCalories ? 'kcal' : 'g';

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">
          This Week
        </span>
        {/* Toggle */}
        <div className="flex items-center bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-0.5">
          {(['calories', 'protein'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                metric === m
                  ? 'text-[#0a0908] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              style={metric === m ? { background: color } : {}}
            >
              {m === 'calories' ? 'Cal' : 'Pro'}
            </button>
          ))}
        </div>
      </div>

      {/* Hovered value */}
      <div className="h-5 mb-2">
        {hoveredIdx !== null && (
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {data[hoveredIdx].dayLabel}: {Math.round(values[hoveredIdx])}{unit}
          </span>
        )}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5 h-[90px]">
        {data.map((d, i) => {
          const pct = maxVal > 0 ? values[i] / maxVal : 0;
          const isHovered = hoveredIdx === i;
          const isToday = d.dayLabel === 'Today';
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onTouchStart={() => setHoveredIdx(i)}
            >
              <div className="w-full flex items-end" style={{ height: 72 }}>
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${Math.max(pct * 100, values[i] > 0 ? 4 : 0)}%`,
                    background: values[i] === 0
                      ? 'var(--surface2)'
                      : isHovered || isToday
                        ? color
                        : `${color}99`,
                    boxShadow: (isHovered || isToday) && values[i] > 0
                      ? `0 0 10px ${glowColor}`
                      : 'none',
                  }}
                />
              </div>
              <span
                className="text-[9px] font-mono"
                style={{ color: isToday ? color : 'var(--muted)' }}
              >
                {d.dayLabel === 'Today' ? 'Now' : d.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month View: Line Chart (Calories or Protein) ─────────────────────────────
// 30-day smooth line — trend matters more than individual day at this scale.

export function MonthLineChart({ data }: { data: DailyPoint[] }) {
  const [metric, setMetric] = useState<'calories' | 'protein'>('calories');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const values = data.map(d => metric === 'calories' ? (d.calories || 0) : (d.protein || 0));
  const maxVal = Math.max(...values, metric === 'calories' ? 500 : 20);

  const isCalories = metric === 'calories';
  const color = isCalories ? '#F4A24D' : '#5BB8D4';
  const gradId = isCalories ? 'monthCalGrad' : 'monthProtGrad';
  const unit = isCalories ? 'kcal' : 'g';

  const W = 300;
  const H = 100;
  const PAD = { top: 12, bottom: 20, left: 6, right: 6 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const points = values.map((v, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + (1 - (maxVal > 0 ? v / maxVal : 0)) * chartH,
    value: v,
    label: data[i].dayLabel,
  }));

  // Smooth cubic bezier path
  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
  }, '');

  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${H - PAD.bottom} L ${points[0].x} ${H - PAD.bottom} Z`
    : '';

  // Show label every ~5 days to avoid clutter
  const labelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">
          This Month
        </span>
        <div className="flex items-center bg-[var(--surface2)] border border-[var(--border)] rounded-lg p-0.5">
          {(['calories', 'protein'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                metric === m ? 'text-[#0a0908] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              style={metric === m ? { background: color } : {}}
            >
              {m === 'calories' ? 'Cal' : 'Pro'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-5 mb-1">
        {hoveredIdx !== null && (
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {data[hoveredIdx].dayLabel}: {Math.round(values[hoveredIdx])}{unit}
          </span>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Baseline */}
          <line
            x1={PAD.left} y1={H - PAD.bottom}
            x2={W - PAD.right} y2={H - PAD.bottom}
            stroke="var(--border)" strokeWidth="1"
          />

          {/* Area */}
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

          {/* Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
            />
          )}

          {/* Hover dots — only render if hovered */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Invisible hit area */}
              <rect
                x={p.x - 8} y={PAD.top}
                width={16} height={chartH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
              {/* Visible dot only on hover */}
              {hoveredIdx === i && p.value > 0 && (
                <circle
                  cx={p.x} cy={p.y} r={4}
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth="2.5"
                  style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />
              )}
              {/* Day labels — every N days */}
              {i % labelStep === 0 && (
                <text
                  x={p.x} y={H - 4}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Legacy export — kept so any remaining import doesn't break ───────────────
export function CalorieTrendChart({ data }: { data: DailyPoint[] }) {
  return <WeekBarChart data={data} />;
}
