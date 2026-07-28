import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const supabase = createServiceClient();

        const { data: access, error } = await supabase
            .from('viewer_access')
            .select('viewer_email')
            .eq('access_token', token)
            .eq('active', true)
            .single();

        if (error || !access) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (access.viewer_email && access.viewer_email.toLowerCase() !== email.toLowerCase()) {
            return NextResponse.json({ error: 'Email does not match.' }, { status: 403 });
        }

        // Set HttpOnly cookie
        const cookieStore = await cookies();
        cookieStore.set(`viewer_${token}`, access.viewer_email || email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
