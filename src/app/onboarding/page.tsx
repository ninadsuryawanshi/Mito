'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { computeWHORecommendations } from '@/lib/ai/gemini';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Little or no exercise' },
  { value: 'light',     label: 'Light',     sub: '1–3 days/week' },
  { value: 'moderate',  label: 'Moderate',  sub: '3–5 days/week' },
  { value: 'active',    label: 'Active',    sub: '6–7 days/week' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('');
  const [activity, setActivity] = useState<string>('');
  const [recCal, setRecCal] = useState<number | null>(null);
  const [recProtein, setRecProtein] = useState<number | null>(null);

  function computeRecs() {
    if (!weight || !height || !age || !sex || !activity) return;
    const recs = computeWHORecommendations(
      parseFloat(weight), parseFloat(height), parseInt(age),
      sex as 'male' | 'female' | 'other',
      activity as 'sedentary' | 'light' | 'moderate' | 'active'
    );
    setRecCal(recs.recommended_calories);
    setRecProtein(recs.recommended_protein_g);
    setStep(3);
  }

  async function handleSubmit() {
    setLoading(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        weight_kg: parseFloat(weight) || undefined,
        height_cm: parseFloat(height) || undefined,
        age: parseInt(age) || undefined,
        sex: sex || undefined,
        activity_level: activity || undefined,
        recommended_calories: recCal,
        recommended_protein_g: recProtein,
      }),
    });
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-10 text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[#0a0908] font-bold text-xs" style={{ fontFamily: 'Syne, serif' }}>M</span>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: 'Syne, serif' }}>mito</span>
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Step indicators */}
        <div className="flex gap-2 mb-8 animate-fade-up">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
          ))}
        </div>

        {/* Step 1 — Name */}
        {step === 1 && (
          <div className="animate-fade-up bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>What should we call you?</h1>
            <p className="text-sm text-[var(--muted)] mb-8">Your mirror is personal.</p>
            <Input label="Your name" placeholder="Ninad" value={name} onChange={e => setName(e.target.value)} autoFocus />
            <Button size="lg" className="mt-6 font-mono" onClick={() => setStep(2)} disabled={!name.trim()}>
              Continue →
            </Button>
          </div>
        )}

        {/* Step 2 — Physical profile */}
        {step === 2 && (
          <div className="animate-fade-up bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Your body profile</h1>
            <p className="text-sm text-[var(--muted)] mb-8">Used to compute your recommended intake. All editable later.</p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Weight (kg)" type="number" placeholder="65" value={weight} onChange={e => setWeight(e.target.value)} />
                <Input label="Height (cm)" type="number" placeholder="170" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
              <Input label="Age" type="number" placeholder="22" value={age} onChange={e => setAge(e.target.value)} />

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">Sex</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['male','female','other'] as const).map(s => (
                    <button key={s} onClick={() => setSex(s)}
                      className={`py-2 rounded-xl text-sm border transition-all capitalize ${sex === s ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">Activity Level</p>
                <div className="flex flex-col gap-2">
                  {ACTIVITY_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setActivity(opt.value)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${activity === opt.value ? 'border-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)]'}`}>
                      <span className={`text-sm font-medium ${activity === opt.value ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>{opt.label}</span>
                      <span className="text-xs text-[var(--muted)]">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" size="md" onClick={() => router.push('/dashboard')} className="text-xs">
                Skip for now
              </Button>
              <Button size="lg" className="flex-1 font-mono" onClick={computeRecs}
                disabled={!weight || !height || !age || !sex || !activity}>
                Compute Goals →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Review WHO recommendations */}
        {step === 3 && (
          <div className="animate-fade-up bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'Syne, serif' }}>Your daily targets</h1>
            <p className="text-sm text-[var(--muted)] mb-6">Computed from WHO standards. Edit if your dietitian has different numbers.</p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1.5">Daily Calories (kcal)</p>
                <input type="number" value={recCal ?? ''} onChange={e => setRecCal(parseInt(e.target.value))}
                  className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-4 py-3 text-2xl font-bold text-[var(--accent)] outline-none focus:border-[var(--accent)]"
                  style={{ fontFamily: 'Syne, serif' }} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1.5">Daily Protein (g)</p>
                <input type="number" value={recProtein ?? ''} onChange={e => setRecProtein(parseInt(e.target.value))}
                  className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-4 py-3 text-2xl font-bold text-[var(--blue)] outline-none focus:border-[var(--accent)]"
                  style={{ fontFamily: 'Syne, serif' }} />
              </div>
            </div>

            <p className="text-xs text-[var(--muted)] mb-6 font-mono">These are shown as context on your dashboard — not as targets to hit. You can change them anytime in Settings.</p>

            <Button size="lg" className="font-mono" loading={loading} onClick={handleSubmit}>
              Enter Mito →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
