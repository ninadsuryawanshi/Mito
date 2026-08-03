import { AIMealAnalysis, AIFoodItem, DashboardStats } from '@/types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: 'Nutrition analysis AI. Respond with valid JSON only. No markdown.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Groq error: ${await response.text()}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty Groq response');
  return text;
}

// ─── JSON extraction helper ───────────────────────────────────────────────────
// LLMs sometimes wrap JSON in markdown fences, add prose, or truncate.
// This function finds the FIRST balanced {...} block in the raw response,
// which is far more robust than a simple regex strip.
function extractJSON(raw: string): string {
  // Fast path: already valid JSON
  const trimmed = raw.trim();
  try { JSON.parse(trimmed); return trimmed; } catch {}

  // Strip common markdown fences (case-insensitive, with optional language tag)
  const stripped = trimmed.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/i, '').trim();
  try { JSON.parse(stripped); return stripped; } catch {}

  // Find the first '{' and walk to its matching '}'
  const start = stripped.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in AI response');

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return stripped.slice(start, i + 1);
    }
  }
  throw new Error('Unbalanced JSON braces in AI response');
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // 4096 tokens prevents mid-JSON truncation for complex multi-item meals
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096, responseMimeType: 'application/json' },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
      console.warn('Gemini failed, falling back to Groq...');
    } catch (e) {
      console.warn('Gemini error, trying Groq:', e);
    }
  }
  return callGroq(prompt);
}

// ─── Prompt optimization utilities ───────────────────────────────────────────

// Known foods we can pass as reference to improve accuracy
// In production this would query food_entities table for known Indian foods
function buildFoodContext(knownFoods?: Array<{ name: string; calories_per_unit: number; unit: string }>): string {
  if (!knownFoods || knownFoods.length === 0) return '';
  const refs = knownFoods.slice(0, 5).map(f => `${f.name}:${f.calories_per_unit}kcal/${f.unit}`).join(', ');
  return `\nReference (verified): ${refs}`;
}

// ─── Meal Analysis ────────────────────────────────────────────────────────────
// OPTIMIZED PROMPT: Short, structured, forces JSON
// Passes known food data as reference to reduce AI uncertainty

export async function analyzeMeal(
  description: string,
  knownFoods?: Array<{ name: string; calories_per_unit: number; unit: string }>
): Promise<AIMealAnalysis> {

  const foodContext = buildFoodContext(knownFoods);

  // Prompt is kept intentionally short — reduces tokens, faster response, lower cost
  // We use a schema comment instead of verbose instructions
  const prompt = `Analyze this Indian meal and return ONLY valid JSON.
Meal: "${description}"
Context: ${foodContext}

### JSON INTEGRITY RULES (STRICT):
1. NO conversational text, no markdown blocks (no  \`\`\` json), and no preamble.
2. ESCAPE all double quotes within strings using a backslash (\").
3. NO trailing commas after the last property or last array item.
4. VALIDATE that every opening '{' and '[' has a matching closing tag.
5. ENSURE all property names are enclosed in double quotes.

### MANDATORY CALCULATION PROTOCOL:
1. BRAND PRIORITY: If a brand is mentioned, use the FSSAI/Official nutritional table values for that specific SKU.
2. THE "DRY WEIGHT" RULE: For packaged noodles/mixes, assume the weight provided is DRY weight unless "cooked" is specified. 100g Dry Maggi ≠ 100g Cooked Maggi.
3. DENSITY ANCHORS:
   - 1 Katori/Bowl = 180ml (Standard Indian Serving)
   - 1 Roti/Phulka = 35g (approx. 85-100 kcal)
   - 1 Tablespoon Oil (hidden in restaurant food) = 13g fat / 120 kcal
4. RESTAURANT MULTIPLIER: For 'street' or 'restaurant' items, multiply the baseline FAT and SODIUM by 1.35x to account for commercial preparation.

### INTERNAL VERIFICATION STEP:
Before closing the JSON, sum the calories of all "items" and ensure "total_calories" matches the sum exactly. If they do not match, recalculate the items.

JSON schema:
{
  "items": [
    {
      "name": "string (canonical Indian food name)",
      "brand": "string|null",
      "quantity": number,
      "unit": "piece|bowl|glass|plate|cup|g|ml",
      "cuisine": "string",
      "region": "string|null",
      "typical_context": "restaurant|home|packaged|street",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number,
      "sugar_g": number,
      "sodium_mg": number
    }
  ],
  "total_calories": number,
  "total_protein_g": number,
  "total_carbs_g": number,
  "total_fat_g": number,
  "total_fiber_g": number,
  "total_sugar_g": number,
  "total_sodium_mg": number,
  "eating_context": "restaurant|home|ordered_in|street|packaged",

"ai_note": "1 sentence (max 20 words)",
"serving_assumption": "Short phrase if assumed, else null (max 10 words)"

}

Rules:
- Decompose into individual food items (max 1 level deep)
- Use realistic Indian portion sizes
- nutrition values must be numbers, not null
- eating_context inferred from meal description`;

  async function attemptParse(rawResponse: string): Promise<AIMealAnalysis> {
    const clean = extractJSON(rawResponse);
    const parsed = JSON.parse(clean) as AIMealAnalysis;
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Invalid AI response structure: missing items array');
    }
    // Always recompute totals from items — never trust AI math
    parsed.total_calories = parsed.items.reduce((s, i) => s + (i.calories || 0), 0);
    parsed.total_protein_g = parsed.items.reduce((s, i) => s + (i.protein_g || 0), 0);
    parsed.total_carbs_g = parsed.items.reduce((s, i) => s + (i.carbs_g || 0), 0);
    parsed.total_fat_g = parsed.items.reduce((s, i) => s + (i.fat_g || 0), 0);
    parsed.total_fiber_g = parsed.items.reduce((s, i) => s + (i.fiber_g || 0), 0);
    parsed.total_sugar_g = parsed.items.reduce((s, i) => s + (i.sugar_g || 0), 0);
    parsed.total_sodium_mg = parsed.items.reduce((s, i) => s + (i.sodium_mg || 0), 0);
    return parsed;
  }

  // First attempt
  const raw = await callGemini(prompt);
  try {
    return await attemptParse(raw);
  } catch (firstErr) {
    console.warn('First parse attempt failed, retrying once:', firstErr, '\nRaw:', raw);
  }

  // One automatic retry — a fresh call often returns valid JSON
  try {
    const retryRaw = await callGemini(prompt);
    return await attemptParse(retryRaw);
  } catch (e) {
    console.error('Both parse attempts failed. Last raw response:', raw);
    throw new Error(`Failed to parse meal analysis: ${e}.`);
  }
}

// ─── Rule Keyword Expansion ───────────────────────────────────────────────────
// When user creates a rule like "no chocolate", we expand to all related keywords
// This runs ONCE at rule creation — not at every meal log

export async function expandRuleKeywords(ruleDescription: string): Promise<string[]> {
  const prompt = `User food rule: "${ruleDescription}"
Return JSON array of 8-12 keywords/food names related to this rule.
Include common Indian variants, brand names, ingredients.
Example for "no chocolate": ["chocolate","cocoa","nutella","dairy milk","kit kat","dark chocolate","chocolate cake","hot chocolate","choco","milo"]
Return ONLY the JSON array, nothing else.`;

  const raw = await callGemini(prompt);
  try {
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    const keywords = JSON.parse(clean);
    if (!Array.isArray(keywords)) throw new Error('Not an array');
    return keywords.map((k: string) => k.toLowerCase().trim());
  } catch {
    // Fallback: just use the rule description as a keyword
    return [ruleDescription.toLowerCase().trim()];
  }
}

// ─── Daily Insight Generation ─────────────────────────────────────────────────
// Generates ONE observational sentence about the day's eating
// Purely observational — no coaching, no suggestions

export async function generateDailyInsight(meals: Array<{
  meal_type?: string;
  eating_context?: string;
  total_calories?: number;
  total_protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  total_sugar_g?: number;
  total_sodium_mg?: number;
  logged_at: string;
  items?: Array<{ food_entity?: { name: string } }>;
}>): Promise<string> {

  if (meals.length === 0) return '';

  // Build a compact summary to minimize tokens sent to AI
  const mealSummary = meals.map(m => {
    const foods = m.items?.map(i => i.food_entity?.name).filter(Boolean).join(', ') || 'unknown foods';
    const hour = new Date(m.logged_at).getHours();
    return `${m.meal_type || 'meal'} at ${hour}h: ${foods} (${Math.round(m.total_calories || 0)}kcal)`;
  }).join(' | ');

  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + (m.total_calories || 0),
    protein: acc.protein + (m.total_protein_g || 0),
    carbs: acc.carbs + (m.total_carbs_g || 0),
    fat: acc.fat + (m.total_fat_g || 0),
    sugar: acc.sugar + (m.total_sugar_g || 0),
    sodium: acc.sodium + (m.total_sodium_mg || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0 });

  const prompt = `Today's meals: ${mealSummary}
Totals: ${Math.round(totals.cal)}kcal, protein ${Math.round(totals.protein)}g, carbs ${Math.round(totals.carbs)}g, fat ${Math.round(totals.fat)}g, sugar ${Math.round(totals.sugar)}g, sodium ${Math.round(totals.sodium)}mg

Write ONE short observational sentence (max 12 words) about today's eating pattern.
Rules: purely observational, no advice, no judgment, no exclamation marks.
Examples: "Mostly carbs today, light on protein" / "High sodium since the restaurant lunch" / "Well balanced day across all meals"
Return ONLY the sentence as a plain string in JSON: {"insight": "your sentence here"}`;

  const raw = await callGemini(prompt);
  try {
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(clean);
    return parsed.insight || 'Meals logged today.';
  } catch {
    return 'Meals logged today.';
  }
}

// ─── WHO Calorie & Protein Recommendations ────────────────────────────────────
// Computes TDEE using Mifflin-St Jeor equation + activity multiplier
// No AI call needed — pure math. Fast, free, accurate.

export function computeWHORecommendations(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: 'male' | 'female' | 'other',
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active'
): { recommended_calories: number; recommended_protein_g: number } {

  // Mifflin-St Jeor BMR
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // Activity multipliers (WHO standard)
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  const tdee = Math.round(bmr * multipliers[activity_level]);

  // Protein: WHO recommends 0.8g/kg, fitness standard is 1.6g/kg
  // We use 1.2g/kg as a sensible middle ground
  const protein = Math.round(weight_kg * 1.2);

  return {
    recommended_calories: tdee,
    recommended_protein_g: protein,
  };
}

// ─── Photo Meal Analysis ──────────────────────────────────────────────────────
// Sends image + optional context to Gemini Vision with Groq Vision fallback

async function analyzeMealFromPhotoGroq(
  base64Image: string,
  mimeType: string,
  additionalContext?: string
): Promise<AIMealAnalysis> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const prompt = `Analyze this food photo. ${additionalContext ? `Context: ${additionalContext}` : ''}
Return ONLY valid JSON matching this schema:
{
  "items": [{"name":"string","brand":null,"quantity":number,"unit":"piece|bowl|glass|plate|g|ml","cuisine":"string","region":null,"typical_context":"restaurant|home|packaged|street","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"sugar_g":number,"sodium_mg":number}],
  "total_calories":number,"total_protein_g":number,"total_carbs_g":number,"total_fat_g":number,"total_fiber_g":number,"total_sugar_g":number,"total_sodium_mg":number,
  "eating_context":"restaurant|home|ordered_in|street|packaged",
  "ai_note":"1 sentence about this meal",
  "serving_assumption":"string if assumed else null"
}`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.2-11b-vision-preview',
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`Groq Vision error: ${await response.text()}`);
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Groq Vision');

  const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(clean) as AIMealAnalysis;

  parsed.total_calories = parsed.items.reduce((s, i) => s + (i.calories || 0), 0);
  parsed.total_protein_g = parsed.items.reduce((s, i) => s + (i.protein_g || 0), 0);
  parsed.total_carbs_g = parsed.items.reduce((s, i) => s + (i.carbs_g || 0), 0);
  parsed.total_fat_g = parsed.items.reduce((s, i) => s + (i.fat_g || 0), 0);
  parsed.total_fiber_g = parsed.items.reduce((s, i) => s + (i.fiber_g || 0), 0);
  parsed.total_sugar_g = parsed.items.reduce((s, i) => s + (i.sugar_g || 0), 0);
  parsed.total_sodium_mg = parsed.items.reduce((s, i) => s + (i.sodium_mg || 0), 0);

  return parsed;
}

export async function analyzeMealFromPhoto(
  base64Image: string,
  mimeType: string,
  additionalContext?: string
): Promise<AIMealAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey) {
    try {
      const prompt = `Analyze this food photo. ${additionalContext ? `Context: ${additionalContext}` : ''}
Return ONLY valid JSON matching this schema:
{
  "items": [{"name":"string","brand":null,"quantity":number,"unit":"piece|bowl|glass|plate|g|ml","cuisine":"string","region":null,"typical_context":"restaurant|home|packaged|street","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"sugar_g":number,"sodium_mg":number}],
  "total_calories":number,"total_protein_g":number,"total_carbs_g":number,"total_fat_g":number,"total_fiber_g":number,"total_sugar_g":number,"total_sodium_mg":number,
  "eating_context":"restaurant|home|ordered_in|street|packaged",
  "ai_note":"1 sentence about this meal",
  "serving_assumption":"string if assumed else null"
}`;

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(clean) as AIMealAnalysis;

          parsed.total_calories = parsed.items.reduce((s, i) => s + (i.calories || 0), 0);
          parsed.total_protein_g = parsed.items.reduce((s, i) => s + (i.protein_g || 0), 0);
          parsed.total_carbs_g = parsed.items.reduce((s, i) => s + (i.carbs_g || 0), 0);
          parsed.total_fat_g = parsed.items.reduce((s, i) => s + (i.fat_g || 0), 0);
          parsed.total_fiber_g = parsed.items.reduce((s, i) => s + (i.fiber_g || 0), 0);
          parsed.total_sugar_g = parsed.items.reduce((s, i) => s + (i.sugar_g || 0), 0);
          parsed.total_sodium_mg = parsed.items.reduce((s, i) => s + (i.sodium_mg || 0), 0);

          return parsed;
        }
      } else {
        const errText = await response.text();
        console.warn('Gemini Vision failed/rate limited, trying Groq fallback:', errText);
      }
    } catch (e: any) {
      console.warn('Gemini Vision error, trying Groq fallback:', e);
    }
  }

  // Fallback to Groq Vision
  if (process.env.GROQ_API_KEY) {
    try {
      return await analyzeMealFromPhotoGroq(base64Image, mimeType, additionalContext);
    } catch (groqErr) {
      console.warn('Groq Vision fallback error:', groqErr);
    }
  }

  throw new Error('AI Vision rate limit temporarily reached. Please wait a few seconds and try again, or type a text description of your meal.');
}
