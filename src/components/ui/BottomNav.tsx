'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: '/log',
    label: 'Log',
    icon: (_active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    isCta: true,
  },
  {
    href: '/rules',
    label: 'Rules',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.2-2.9 8-7 9-4.1-1-7-4.8-7-9V6l7-3z"/>
        <path d="M9.5 12.5l1.8 1.8 3.5-3.5"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass-nav fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center px-3 py-2 gap-1"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        if (item.isCta) {
          return (
            <Link key={item.href} href={item.href} aria-label="Log a meal">
              <motion.div
                whileTap={{ scale: 0.90 }}
                whileHover={{ scale: 1.07 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="gold-btn mx-2 flex items-center justify-center text-[var(--text)]"
                style={{ width: 52, height: 52, borderRadius: '50%', padding: 0 }}
              >
                {item.icon(false)}
              </motion.div>
            </Link>
          );
        }

        return (
          <Link key={item.href} href={item.href} aria-label={item.label}>
            <motion.div
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-full"
              style={{
                color: isActive ? 'var(--gold-2)' : 'var(--muted)',
                minWidth: 56,
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active-bg"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--gold-tint)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{item.icon(isActive)}</span>
              <span
                className="relative z-10 text-[10px] font-semibold leading-none"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {item.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
