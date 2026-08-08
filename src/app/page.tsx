import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/db/server';
import { LandingPage } from '@/components/LandingPage';

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
