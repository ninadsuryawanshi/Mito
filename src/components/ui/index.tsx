'use client';
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[var(--accent)] text-[#0a0908] hover:bg-[var(--accent2)] active:scale-[0.98]',
    secondary: 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.98]',
    ghost: 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] active:scale-[0.98]',
    danger: 'bg-[var(--red)] text-white hover:opacity-90 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base w-full',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
          {label}
        </label>
      )}
      <input
        className={`
          w-full bg-[var(--surface2)] border rounded-xl px-4 py-3 text-sm text-[var(--text)]
          placeholder:text-[var(--muted)] outline-none transition-all duration-200
          ${error ? 'border-[var(--red)]' : 'border-[var(--border)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-[11px] text-[var(--red)]">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}
// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full bg-[var(--surface2)] border rounded-xl px-4 py-3 text-sm text-[var(--text)]
            placeholder:text-[var(--muted)] outline-none transition-all duration-200 resize-none
            ${error ? 'border-[var(--red)]' : 'border-[var(--border)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-[11px] text-[var(--red)]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`
      bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5
      ${glow ? 'shadow-[0_0_30px_var(--accent-glow)]' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

// ─── Label (mono) ─────────────────────────────────────────────────────────────
// export function MonoLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
//   return (
//     <span className={`text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] ${className}`}>
//       {children}
//     </span>
//   );
// }
type MonoLabelProps = React.HTMLAttributes<HTMLSpanElement>;

export function MonoLabel({ children, className, ...props }: MonoLabelProps) {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}
// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin`} />
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-[var(--border)] my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[11px] text-[var(--muted)] font-mono">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = 'accent' | 'green' | 'red' | 'blue' | 'muted';
export function Badge({ children, color = 'muted' }: { children: ReactNode; color?: BadgeColor }) {
  const colors: Record<BadgeColor, string> = {
    accent: 'bg-[rgba(244,162,77,0.12)] text-[var(--accent)] border-[rgba(244,162,77,0.25)]',
    green: 'bg-[rgba(92,184,138,0.12)] text-[var(--green)] border-[rgba(92,184,138,0.25)]',
    red: 'bg-[rgba(224,92,92,0.12)] text-[var(--red)] border-[rgba(224,92,92,0.25)]',
    blue: 'bg-[rgba(91,184,212,0.12)] text-[var(--blue)] border-[rgba(91,184,212,0.25)]',
    muted: 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--border)]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${colors[color]}`}>
      {children}
    </span>
  );
}

// ─── Nutrient Box ─────────────────────────────────────────────────────────────
export function NutrientBox({
  label, value, unit, color = 'var(--text)', large = false, editable = false, onChange,
}: {
  label: string; value: number; unit: string; color?: string;
  large?: boolean; editable?: boolean; onChange?: (v: number) => void;
}) {
  return (
    <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-1">
      <MonoLabel>{label}</MonoLabel>
      {editable ? (
        <input
          type="number"
          value={value}
          onChange={e => onChange?.(parseFloat(e.target.value) || 0)}
          className={`bg-transparent outline-none border-b border-[var(--accent)] w-full font-['Syne',serif] font-bold ${large ? 'text-4xl' : 'text-xl'}`}
          style={{ color }}
          step="0.1"
        />
      ) : (
        <div className={`font-['Syne',serif] font-bold ${large ? 'text-4xl' : 'text-xl'}`} style={{ color }}>
          {typeof value === 'number' ? Math.round(value * 10) / 10 : value}
        </div>
      )}
      <div className="text-[10px] font-mono text-[var(--muted)]">{unit}</div>
    </div>
  );
}

export { useToast, ToastProvider } from './ToastContext';
export { CalorieTrendChart } from './MiniChart';
export { PWAPrompt } from './PWAPrompt';
export { LogoMark } from './LogoMark';



