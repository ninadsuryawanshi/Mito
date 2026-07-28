import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';

// GET — fetch owner's viewers
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: viewers } = await supabase
            .from('viewer_access')
            .select('*')
            .eq('owner_user_id', user.id)
            .eq('active', true)
            .order('created_at', { ascending: false });

        return NextResponse.json({ viewers: viewers || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — create new viewer access
export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name, email, permission_level, can_see_price } = await req.json();
        if (!name || !email) return NextResponse.json({ error: 'name and email required' }, { status: 400 });

        const { data: viewer, error } = await supabase
            .from('viewer_access')
            .insert({
                owner_user_id: user.id,
                viewer_name: name,
                viewer_email: email,
                permission_level: permission_level || 'summary',
                can_see_price: can_see_price || false,
                active: true,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ viewer });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH — revoke viewer access
export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { access_id, active } = await req.json();

        const { error } = await supabase
            .from('viewer_access')
            .update({ active })
            .eq('access_id', access_id)
            .eq('owner_user_id', user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}