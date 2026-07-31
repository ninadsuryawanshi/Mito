'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from '@/components/ui';

const NAV = [
  { href: '/dashboard', icon: '◎', label: 'Mirror' },
  { href: '/log',       icon: '+', label: 'Log',    primary: true },
  { href: '/rules',     icon: '⊘', label: 'Rules' },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] pb-safe z-50 md:top-0 md:bottom-0 md:right-auto md:w-24 md:border-t-0 md:border-r md:flex md:flex-col">

      {/* Desktop logo at top */}
      <div className="hidden md:flex flex-col items-center pt-6 pb-4 border-b border-[var(--border)]">
        <LogoMark size={36} />
      </div>

      {/* Nav items */}
      <div className="flex items-center justify-around max-w-lg mx-auto w-full px-4 py-2 md:flex-col md:flex-1 md:justify-center md:gap-6 md:px-0 md:py-0">
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

      {/* Desktop settings link at bottom */}
      <div className="hidden md:flex flex-col items-center pb-6 pt-4 border-t border-[var(--border)] gap-3">
        <Link href="/settings"
          className="flex flex-col items-center gap-1 text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span className="text-[8px] font-mono uppercase tracking-widest">You</span>
        </Link>
      </div>
    </nav>
  );
}
