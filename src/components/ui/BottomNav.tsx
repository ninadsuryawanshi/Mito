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
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] pb-safe z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto px-4 py-2">
        {NAV.map(item => {
          const active = path === item.href;
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-1 -mt-5">
                <div className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)] transition-transform active:scale-95">
                  <span className="text-2xl text-[#0a0908] font-bold leading-none">{item.icon}</span>
                </div>
                <span className="text-[9px] font-mono text-[var(--muted)] uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 py-1 px-3 transition-all active:scale-95">
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
    </nav>
  );
}
