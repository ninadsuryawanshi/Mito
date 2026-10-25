'use client';
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

/* ═══════════════════════════════════════════════════════════
   BUTTON
   ═══════════════════════════════════════════════════════════ */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'dark' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'gold', size = 'md', loading, children, className = '', disabled, ...props
}: ButtonProps) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-4 text-base w-full',
  };

  if (variant === 'gold') {
    return (
      <button
        className={`gold-btn inline-flex items-center justify-center gap-2 font-semibold
          disabled:opacity-50 disabled:cursor-not-allowed select-none
          ${sizes[size]} ${className}`}
        style={{ fontFamily: 'var(--font-display)' }}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full anim-spin" />}
        {children}
      </button>
    );
  }

  if (variant === 'dark') {
    return (
      <button
        className={`inline-flex items-center justify-center gap-2 font-semibold
          bg-[var(--text)] text-[var(--bg)] rounded-[var(--radius-pill)]
          hover:opacity-90 active:scale-[0.97] transition-all
          disabled:opacity-50 disabled:cursor-not-allowed select-none
          ${sizes[size]} ${className}`}
        style={{ fontFamily: 'var(--font-display)' }}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full anim-spin" />}
        {children}
      </button>
    );
  }

  if (variant === 'danger') {
    return (
      <button
        className={`inline-flex items-center justify-center gap-2 font-semibold
          bg-[var(--red)] text-white rounded-[var(--radius-pill)]
          hover:opacity-90 active:scale-[0.97] transition-all
          disabled:opacity-50 disabled:cursor-not-allowed select-none
          ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full anim-spin" />}
        {children}
      </button>
    );
  }

  // ghost
  return (
    <button
      className={`ghost-btn inline-flex items-center justify-center gap-2 font-medium
        disabled:opacity-50 disabled:cursor-not-allowed select-none transition-all
        ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full anim-spin" />}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   INPUT
   ═══════════════════════════════════════════════════════════ */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: ReactNode;
}

export function Input({ label, error, hint, suffix, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`mito-input ${suffix ? 'pr-12' : ''} ${error ? '!border-[var(--red)] !shadow-none' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-[12px] text-[var(--red)]" role="alert">{error}</p>}
      {hint && !error && <p className="text-[12px]" style={{ color: 'var(--muted)' }}>{hint}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEXTAREA
   ═══════════════════════════════════════════════════════════ */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`mito-input resize-none ${error ? '!border-[var(--red)]' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-[12px] text-[var(--red)]" role="alert">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

/* ═══════════════════════════════════════════════════════════
   CARD
   ═══════════════════════════════════════════════════════════ */
export function Card({ children, className = '', gold = false }: { children: ReactNode; className?: string; gold?: boolean }) {
  return (
    <div
      className={`mito-card ${className}`}
      style={gold ? { background: 'var(--gold-tint)', border: '1.5px solid rgba(232,160,48,0.28)' } : {}}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════════════════ */
type BadgeColor = 'gold' | 'green' | 'red' | 'blue' | 'muted' | 'orange';

export function Badge({ children, color = 'muted' }: { children: ReactNode; color?: BadgeColor }) {
  const colors: Record<BadgeColor, string> = {
    gold:   'bg-[var(--gold-tint)] text-[var(--gold-1)] border-[rgba(232,160,48,0.30)]',
    green:  'bg-[var(--green-tint)] text-[var(--green)] border-[rgba(91,168,122,0.25)]',
    red:    'bg-[var(--red-tint)] text-[var(--red)] border-[rgba(224,92,92,0.25)]',
    blue:   'bg-[var(--blue-tint)] text-[var(--blue)] border-[rgba(74,159,196,0.25)]',
    orange: 'bg-[var(--orange-tint)] text-[var(--orange)] border-[rgba(232,136,90,0.25)]',
    muted:  'bg-[var(--surface2)] text-[var(--muted)] border-[var(--border)]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-badge)]
        text-[11px] font-semibold border ${colors[color]}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   MONO LABEL  (kept for compat, now styled correctly)
   ═══════════════════════════════════════════════════════════ */
type MonoLabelProps = React.HTMLAttributes<HTMLSpanElement>;
export function MonoLabel({ children, className = '', style, ...props }: MonoLabelProps) {
  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-widest ${className}`}
      style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', ...style }}
      {...props}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   SPINNER
   ═══════════════════════════════════════════════════════════ */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div
      className={`${sizes[size]} border-2 border-[var(--surface3)] border-t-[var(--gold-2)] rounded-full anim-spin`}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   DIVIDER
   ═══════════════════════════════════════════════════════════ */
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-[var(--border)] my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[12px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NUTRIENT BOX
   ═══════════════════════════════════════════════════════════ */
export function NutrientBox({
  label, value, unit, color = 'var(--text)', large = false, editable = false, onChange,
}: {
  label: string; value: number; unit: string; color?: string;
  large?: boolean; editable?: boolean; onChange?: (v: number) => void;
}) {
  return (
    <div className="mito-card p-3 flex flex-col gap-1">
      <MonoLabel>{label}</MonoLabel>
      {editable ? (
        <input
          type="number"
          value={value}
          onChange={e => onChange?.(parseFloat(e.target.value) || 0)}
          className={`bg-transparent outline-none border-b-2 border-[var(--gold-2)] w-full font-bold ${large ? 'text-4xl' : 'text-xl'}`}
          style={{ color, fontFamily: 'var(--font-display)' }}
          step="0.1"
        />
      ) : (
        <div className={`font-bold ${large ? 'text-4xl' : 'text-xl'}`} style={{ color, fontFamily: 'var(--font-display)' }}>
          {typeof value === 'number' ? Math.round(value * 10) / 10 : value}
        </div>
      )}
      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>{unit}</div>
    </div>
  );
}

/* ─── Re-exports ─────────────────────────────────────────── */
export { useToast, ToastProvider } from './ToastContext';
export { CalorieTrendChart, DayRingsChart, WeekBarChart, MonthLineChart } from './MiniChart';
export { PWAPrompt } from './PWAPrompt';
export { LogoMark } from './LogoMark';
export { AnimatedTypewriterPrompt, VEG_MEAL_PROMPTS } from './AnimatedTypewriterPrompt';
export { OnboardingTour } from './OnboardingTour';
export { BottomNav } from './BottomNav';
export { CalorieRing } from './CalorieRing';
