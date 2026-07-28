import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/db/server';
import BottomNav from '@/components/ui/BottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  console.log('[layout] Path: /dashboard | User:', user?.id || 'null');
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
