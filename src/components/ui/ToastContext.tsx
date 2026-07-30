'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Icon per type ────────────────────────────────────────────────────────────
const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: '◎',
};

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'rgba(92,184,138,0.3)', icon: 'var(--green)', bg: 'rgba(92,184,138,0.06)' },
  error:   { border: 'rgba(224,92,92,0.3)',  icon: 'var(--red)',   bg: 'rgba(224,92,92,0.06)'  },
  info:    { border: 'rgba(244,162,77,0.3)', icon: 'var(--accent)',bg: 'rgba(244,162,77,0.06)' },
};

// ─── Single Toast Item ────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const c = COLORS[toast.type];
  return (
    <div
      onClick={() => onDismiss(toast.id)}
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer animate-fade-up"
      style={{
        background: `var(--surface)`,
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 0 0 1px ${c.bg}`,
        minWidth: '240px',
        maxWidth: '360px',
      }}
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: c.bg, color: c.icon, border: `1px solid ${c.border}` }}
      >
        {ICONS[toast.type]}
      </span>
      <p className="text-sm text-[var(--text)] font-mono flex-1">{toast.message}</p>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]); // max 3
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div
          className="fixed z-[9999] flex flex-col gap-2 pointer-events-none"
          style={{
            bottom: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <style>{`
            @media (min-width: 768px) {
              .toast-container {
                left: auto !important;
                right: 1.5rem !important;
                bottom: 1.5rem !important;
                transform: none !important;
              }
            }
          `}</style>
          <div className="toast-container flex flex-col gap-2 pointer-events-auto">
            {toasts.map(t => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
