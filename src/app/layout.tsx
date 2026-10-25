import type { Metadata, Viewport } from 'next';
import { Syne, Manrope } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal'],
  variable: '--font-syne',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mito — Powerhouse of You',
  description: 'Your personal food mirror. Know what you eat, understand how it affects you.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Mito' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAFAF7',
};

import { ToastProvider } from '@/components/ui/ToastContext';
import { AuthRecoveryRedirect } from '@/components/auth/AuthRecoveryRedirect';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable}`}>
      <body>
        <AuthRecoveryRedirect />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
