'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '@/components/ui';
import { computeWHORecommendations } from '@/lib/ai/gemini';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary',  sub: 'Desk job, little movement',  emoji: '🪑' },
  { value: 'light',     label: 'Light',      sub: 'Walking, 1–3 days exercise',  emoji: '🚶' },
  { value: 'moderate',  label: 'Moderate',   sub: 'Gym 3–5 days a week',         emoji: '🏃' },
  { value: 'active',    label: 'Active',     sub: 'Daily training or hard job',  emoji: '⚡' },
] as const;

const STEPS = ['brand', 'name', 'body', 'goals'];

const slideVariants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
  exit: { x: -40, opacity: 0, transition: { duration: 0.18 } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('');
  const [activity, setActivity] = useState('');
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
        name, weight_kg: parseFloat(weight) || undefined,
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
    <div className="min-h-dvh flex flex-col px-6 py-10 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,199,79,0.14) 0%, transparent 65%)', filter: 'blur(50px)' }} />

      {/* Step progress bar */}
      {step > 0 && (
        <div className="flex gap-1.5 mb-8 relative z-10">
          {[0,1,2,3].map(s => (
            <motion.div
              key={s}
              className="flex-1 h-1 rounded-full"
              animate={{ background: s < step ? 'var(--gold-gradient)' : s === step ? 'var(--gold-2)' : 'var(--surface3)' }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      )}

      {/* Steps */}
      <div className="flex-1 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">

          {/* Step 0 — Brand Splash */}
          {step === 0 && (
            <motion.div key="brand" variants={slideVariants} initial="enter" animate="center" exit="exit"
              className="flex flex-col items-center text-center gap-6">

              {/* Food bowl hero image */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}
                className="w-52 h-52 rounded-full overflow-hidden"
                style={{ boxShadow: '0 12px 48px rgba(200,130,10,0.22), 0 4px 16px rgba(28,26,20,0.10)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/food-hero-bowl.png" alt="Healthy meal bowl" className="w-full h-full object-cover" />
              </motion.div>

              {/* Logo mark */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[9px] flex items-center justify-center font-extrabold text-sm"
                  style={{ background: 'var(--gold-gradient)', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>M</div>
                <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>mito</span>
              </div>

              <div>
                <h1 className="text-[32px] font-extrabold leading-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  Your food,{' '}
                  <em className="not-italic" style={{ background: 'var(--gold-gradient-text)', backgroundSize: '200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    reflected.
                  </em>
                </h1>
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text2)', fontFamily: 'var(--font-body)' }}>
                  Not a coach. Not a diet plan.{'\n'}A clear mirror for what powers you.
                </p>
              </div>

              <Button variant="dark" size="lg" onClick={() => setStep(1)} className="w-full">
                Set up my mirror →
              </Button>
            </motion.div>
          )}

          {/* Step 1 — Name */}
          {step === 1 && (
            <motion.div key="name" variants={slideVariants} initial="enter" animate="center" exit="exit"
              className="flex flex-col gap-6">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-2)' }}>Step 1 of 3</p>
                <h1 className="text-[28px] font-extrabold leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  What should we call you?
                </h1>
                <p className="text-[15px] mt-1" style={{ color: 'var(--text2)' }}>Your mirror is personal.</p>
              </div>
              <Input label="Your name" id="onboard-name" placeholder="Alex" value={name} onChange={e => setName(e.target.value)} autoFocus />
              <Button variant="gold" size="lg" onClick={() => setStep(2)} disabled={!name.trim()}>Continue →</Button>
            </motion.div>
          )}

          {/* Step 2 — Body profile */}
          {step === 2 && (
            <motion.div key="body" variants={slideVariants} initial="enter" animate="center" exit="exit"
              className="flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 140px)', paddingRight: '2px' }}>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-2)' }}>Step 2 of 3</p>
                <h1 className="text-[28px] font-extrabold leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  Your body profile
                </h1>
                <p className="text-[15px] mt-1" style={{ color: 'var(--text2)' }}>
                  Used to compute your targets. Editable anytime.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Weight (kg)" id="onboard-weight" type="number" placeholder="65" value={weight} onChange={e => setWeight(e.target.value)} />
                <Input label="Height (cm)" id="onboard-height" type="number" placeholder="170" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
              <Input label="Age" id="onboard-age" type="number" placeholder="24" value={age} onChange={e => setAge(e.target.value)} />

              {/* Sex chips */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Sex</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['male','female','other'] as const).map(s => (
                    <motion.button key={s} whileTap={{ scale: 0.94 }} onClick={() => setSex(s)}
                      className="py-3 rounded-2xl text-[13px] font-semibold capitalize transition-all border"
                      style={{
                        background: sex === s ? 'var(--gold-tint)' : 'var(--surface)',
                        borderColor: sex === s ? 'var(--gold-2)' : 'var(--border)',
                        color: sex === s ? 'var(--gold-1)' : 'var(--text2)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >{s}</motion.button>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>Activity Level</p>
                <div className="flex flex-col gap-2">
                  {ACTIVITY_OPTIONS.map(opt => (
                    <motion.button key={opt.value} whileTap={{ scale: 0.97 }} onClick={() => setActivity(opt.value)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all relative overflow-hidden"
                      style={{
                        background: activity === opt.value ? 'var(--gold-tint)' : 'var(--surface)',
                        borderColor: activity === opt.value ? 'var(--gold-2)' : 'var(--border)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {/* Left accent bar on active */}
                      {activity === opt.value && (
                        <motion.div layoutId="activity-bar" className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{ background: 'var(--gold-gradient)' }} />
                      )}
                      <span className="text-xl">{opt.emoji}</span>
                      <div>
                        <p className="text-[14px] font-semibold" style={{ color: activity === opt.value ? 'var(--gold-1)' : 'var(--text)' }}>
                          {opt.label}
                        </p>
                        <p className="text-[12px]" style={{ color: 'var(--muted)' }}>{opt.sub}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <Button variant="ghost" size="md" onClick={() => router.push('/dashboard')}>Skip</Button>
                <Button variant="gold" size="lg" onClick={computeRecs}
                  disabled={!weight || !height || !age || !sex || !activity}
                  className="flex-1">
                  Compute Goals →
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Review targets */}
          {step === 3 && (
            <motion.div key="goals" variants={slideVariants} initial="enter" animate="center" exit="exit"
              className="flex flex-col gap-5">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-2)' }}>Step 3 of 3</p>
                <h1 className="text-[28px] font-extrabold leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  Your daily targets
                </h1>
                <p className="text-[15px] mt-1" style={{ color: 'var(--text2)' }}>
                  Computed from WHO standards. Edit if needed.
                </p>
              </div>

              {/* Calorie input card */}
              <div className="mito-card p-5 flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Daily Calories</p>
                <div className="flex items-baseline gap-2">
                  <input type="number" value={recCal ?? ''} onChange={e => setRecCal(parseInt(e.target.value))}
                    className="text-[48px] font-extrabold leading-none bg-transparent outline-none border-b-2 border-[var(--gold-2)] w-full"
                    style={{ color: 'var(--gold-2)', fontFamily: 'var(--font-display)' }} />
                  <span className="text-[16px]" style={{ color: 'var(--muted)' }}>kcal</span>
                </div>
              </div>

              {/* Protein input card */}
              <div className="mito-card p-5 flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Daily Protein</p>
                <div className="flex items-baseline gap-2">
                  <input type="number" value={recProtein ?? ''} onChange={e => setRecProtein(parseInt(e.target.value))}
                    className="text-[48px] font-extrabold leading-none bg-transparent outline-none border-b-2 border-[var(--blue)] w-full"
                    style={{ color: 'var(--blue)', fontFamily: 'var(--font-display)' }} />
                  <span className="text-[16px]" style={{ color: 'var(--muted)' }}>g</span>
                </div>
              </div>

              <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
                These show as context, not targets to hit. Change anytime in Settings.
              </p>

              <Button variant="gold" size="lg" loading={loading} onClick={handleSubmit}>
                Enter Mito →
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
