import React from 'react';

interface LogoMarkProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function LogoMark({ size = 34, className = '', showText = false }: LogoMarkProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="shrink-0 rounded-xl bg-[#141210] border border-[rgba(244,162,77,0.35)] flex items-center justify-center shadow-[0_0_20px_rgba(244,162,77,0.2)] transition-all hover:scale-105 hover:border-[var(--accent)]"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span
          className="text-[var(--accent)] font-bold tracking-tighter select-none"
          style={{
            fontFamily: 'Syne, serif',
            fontSize: `${Math.round(size * 0.55)}px`,
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>
      {showText && (
        <span
          className="font-bold text-xl tracking-tight text-[var(--text)] select-none"
          style={{ fontFamily: 'Syne, serif' }}
        >
          Mito
        </span>
      )}
    </div>
  );
}
