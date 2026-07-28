import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;
        
        if (!file) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
        }

        const whisperFormData = new FormData();
        whisperFormData.append('file', file, 'audio.webm');
        whisperFormData.append('model', 'whisper-large-v3-turbo');
        whisperFormData.append('response_format', 'json');

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
            },
            body: whisperFormData,
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error?.message || 'Transcription failed');
        }

        return NextResponse.json({ transcript: data.text });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
