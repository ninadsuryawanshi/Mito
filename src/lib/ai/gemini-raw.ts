// Exported raw Gemini/Groq caller for use outside the main AI service
// Needed by weekly digest to call AI without circular imports

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function callGeminiRaw(prompt: string): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
        try {
            const res = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 512, responseMimeType: 'application/json' },
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return text;
            }
        } catch { }
    }

    // Groq fallback
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error('No AI keys configured');

    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
            model: 'llama3-70b-8192',
            temperature: 0.3,
            max_tokens: 512,
            messages: [
                { role: 'system', content: 'Return valid JSON only. No markdown.' },
                { role: 'user', content: prompt },
            ],
        }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}