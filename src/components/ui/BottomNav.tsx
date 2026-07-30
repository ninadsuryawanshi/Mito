'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', icon: '◎', label: 'Mirror' },
  { href: '/log',       icon: '+', label: 'Log',    primary: true },
  { href: '/rules',     icon: '⊘', label: 'Rules' },
  { href: '/settings',  icon: '◈', label: 'You' },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] pb-safe z-50 md:top-0 md:bottom-0 md:right-auto md:w-24 md:border-t-0 md:border-r md:flex md:flex-col">

      {/* Desktop logo at top */}
      <div className="hidden md:flex flex-col items-center pt-6 pb-4 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-[0_0_16px_var(--accent-glow)]">
          <span className="text-[#0a0908] font-bold text-base" style={{ fontFamily: 'Syne, serif' }}>M</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex items-center justify-around max-w-lg mx-auto px-4 py-2 md:flex-col md:flex-1 md:justify-center md:gap-6 md:px-0 md:py-0">
        {NAV.map(item => {
          const active = path === item.href;
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-1 -mt-5 md:mt-0">
                <div className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)] transition-transform active:scale-95 md:w-12 md:h-12">
                  <span className="text-2xl text-[#0a0908] font-bold leading-none md:text-xl">{item.icon}</span>
                </div>
                <span className="text-[9px] font-mono text-[var(--muted)] uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 py-1 px-3 transition-all active:scale-95 md:px-0 md:w-full md:py-2 md:hover:bg-[var(--surface2)] md:rounded-lg">
              <span className={`text-xl transition-all ${active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-mono uppercase tracking-widest ${active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Desktop footer brand mark */}
      <div className="hidden md:flex flex-col items-center pb-6 pt-4 border-t border-[var(--border)]">
        <span className="text-[8px] font-mono text-[var(--muted2)] uppercase tracking-widest leading-loose">mito</span>
        <span className="text-[7px] font-mono text-[var(--muted2)] opacity-50">v1.0</span>
      </div>
    </nav>
  );
}
