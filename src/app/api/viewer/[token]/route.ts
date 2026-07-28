import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/server';
import { getMealsForTimeline, computeStats } from '@/lib/services/mealService';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const view = (req.nextUrl.searchParams.get('view') || 'day') as 'day' | 'week' | 'month';

        // Service client — bypasses RLS to validate token
        const supabase = createServiceClient();

        // Validate token
        const { data: access, error } = await supabase
            .from('viewer_access')
            .select('*, owner:profiles(name)')
            .eq('access_token', token)
            .eq('active', true)
            .single();

        if (error || !access) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Email gate check
        if (access.viewer_email) {
            const cookieStore = await cookies();
            const verifiedEmail = cookieStore.get(`viewer_${token}`)?.value;
            if (!verifiedEmail || verifiedEmail.toLowerCase() !== access.viewer_email.toLowerCase()) {
                return NextResponse.json({ error: 'Email verification required', needsAuth: true }, { status: 401 });
            }
        }

        // Check expiry
        if (access.expires_at && new Date(access.expires_at) < new Date()) {
            return NextResponse.json({ error: 'This link has expired.' }, { status: 401 });
        }

        // Update last_accessed_at
        await supabase
            .from('viewer_access')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('access_id', access.access_id);

        // Fetch meals for owner
        const meals = await getMealsForTimeline(supabase, access.owner_user_id, view);
        const stats = computeStats(meals);

        // Fetch today's insight
        const today = new Date().toISOString().split('T')[0];
        const { data: insightRow } = await supabase
            .from('daily_insights')
            .select('insight_text')
            .eq('user_id', access.owner_user_id)
            .eq('insight_date', today)
            .single();

        return NextResponse.json({
            owner_name: access.owner?.name || 'User',
            permission_level: access.permission_level,
            can_see_price: access.can_see_price,
            meals,
            stats,
            insight: insightRow?.insight_text || '',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}