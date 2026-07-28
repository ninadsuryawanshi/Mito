import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/server';
import { analyzeMeal, analyzeMealFromPhoto } from '@/lib/ai/gemini';

// Raise body size limit — base64-encoded food photos can exceed the 4.5 MB default
export const maxDuration = 60; // seconds (Vercel hobby allows up to 60s)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { description, photo_base64, photo_mime_type, additional_context } = body;

    if (!description && !photo_base64) {
      return NextResponse.json({ error: 'description or photo required' }, { status: 400 });
    }

    let analysis;
    if (photo_base64) {
      // Photo input — use Gemini Vision
      analysis = await analyzeMealFromPhoto(photo_base64, photo_mime_type || 'image/jpeg', additional_context);
    } else {
      // Text input — use text analysis
      analysis = await analyzeMeal(description);
    }

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
