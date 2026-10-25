import { BottomNav } from '@/components/ui';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen pb-24 md:pb-8 md:pl-24">{children}<BottomNav /></div>;
}
