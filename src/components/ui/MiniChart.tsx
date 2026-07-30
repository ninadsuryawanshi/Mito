'use client';
import { useState } from 'react';

export interface DailyPoint {
  dayLabel: string;
  calories: number;
}

export function CalorieTrendChart({ data }: { data: DailyPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxCal = Math.max(...data.map(d => d.calories), 2000);
  const height = 110;
  const width = 280;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (d.calories / maxCal) * (height - padding * 2 - 10);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">
          Calorie Mirror (Last 7 Days)
        </span>
        {hoveredIdx !== null && (
          <span className="text-xs font-mono text-[var(--accent)] font-bold">
            {data[hoveredIdx].dayLabel}: {Math.round(data[hoveredIdx].calories)} kcal
          </span>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#chartGrad)" />}

          {/* Line path */}
          {pathD && <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Dots */}
          {points.map((p, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 6 : 4}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth={hoveredIdx === i ? 3 : 2}
                className="transition-all duration-150"
              />
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize="9"
                fontFamily="var(--font-dm-mono)"
              >
                {p.dayLabel}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
