'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AIMealAnalysis } from '@/types';
import { Button, Textarea, NutrientBox, MonoLabel, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';

type Step = 'input' | 'analyzing' | 'review' | 'saving' | 'done';
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

// Quick time presets — most common log times
const TIME_PRESETS = [
  { label: 'Now', getValue: () => format(new Date(), 'HH:mm') },
  { label: '7:00 AM', getValue: () => '07:00' },
  { label: '9:00 AM', getValue: () => '09:00' },
  { label: '1:00 PM', getValue: () => '13:00' },
  { label: '4:00 PM', getValue: () => '16:00' },
  { label: '8:00 PM', getValue: () => '20:00' },
];

// Quick date presets
function makeDatePresets() {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return {
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : format(d, 'EEE d MMM'),
      value: format(d, 'yyyy-MM-dd'),
    };
  });
}

export default function LogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('input');
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('');
  const [price, setPrice] = useState('');
  const [analysis, setAnalysis] = useState<AIMealAnalysis | null>(null);
  const [userEdited, setUserEdited] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState('image/jpeg');

  // Date + Time — default to today/now
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logTime, setLogTime] = useState(format(new Date(), 'HH:mm'));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeEdited, setTimeEdited] = useState(false);
  const [dateEdited, setDateEdited] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const originalDataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Compress: max 800px on longest side, JPEG quality 0.8
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round((height / width) * MAX); width = MAX; }
          else { width = Math.round((width / height) * MAX); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoPreview(compressed);
        setPhotoBase64(compressed.split(',')[1]);
        setPhotoMime('image/jpeg');
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  }


  // Build the full logged_at datetime from chosen date + chosen time
  function buildLoggedAt(): string {
    return new Date(`${logDate}T${logTime}:00`).toISOString();
  }

  async function handleAnalyze() {
    if (!description.trim() && !photoBase64) {
      setError('Please describe what you ate or upload a photo.');
      return;
    }
    setError('');
    setStep('analyzing');
    try {
      const res = await fetch('/api/meals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim() || undefined,
          photo_base64: photoBase64 || undefined,
          photo_mime_type: photoMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Try again.');
      setStep('input');
    }
  }

  async function handleSave() {
    if (!analysis) return;
    setStep('saving');
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          description: description.trim() || undefined,
          input_method: photoBase64 ? 'photo' : 'text',
          meal_type: mealType || undefined,
          price: price ? parseFloat(price) : undefined,
          currency: '₹',
          user_edited: userEdited,
          logged_at: buildLoggedAt(),  // pass custom time
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast('Meal logged ✓', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setStep('review');
    }
  }

  function updateNutrient(field: keyof AIMealAnalysis, value: number) {
    if (!analysis) return;
    setUserEdited(true);
    setAnalysis({ ...analysis, [field]: value });
  }

  function removeItem(index: number) {
    if (!analysis) return;
    const item = analysis.items[index];
    setUserEdited(true);
    setAnalysis({
      ...analysis,
      items: analysis.items.filter((_, i) => i !== index),
      total_calories:   Math.max(0, analysis.total_calories   - item.calories),
      total_protein_g:  Math.max(0, analysis.total_protein_g  - item.protein_g),
      total_carbs_g:    Math.max(0, analysis.total_carbs_g    - item.carbs_g),
      total_fat_g:      Math.max(0, analysis.total_fat_g      - item.fat_g),
      total_fiber_g:    Math.max(0, analysis.total_fiber_g    - item.fiber_g),
      total_sugar_g:    Math.max(0, analysis.total_sugar_g    - item.sugar_g),
      total_sodium_mg:  Math.max(0, analysis.total_sodium_mg  - item.sodium_mg),
    });
  }



  if (step === 'saving') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="font-mono text-[var(--muted)] text-xs uppercase tracking-widest">Saving...</p>
    </div>
  );

  if (step === 'analyzing') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <Spinner size="lg" />
      <p className="font-mono text-[var(--muted)] text-xs uppercase tracking-widest">Analyzing nutrition...</p>
  {description && <p className="text-sm text-[var(--text2)] text-center max-w-xs italic">&quot;{description}&quot;</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <button onClick={() => step === 'review' ? setStep('input') : router.back()}
          className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors">
          ←
        </button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, serif' }}>
          {step === 'review' ? 'Review & Edit' : 'Log a Meal'}
        </h1>
      </div>

      {/* ── INPUT ── */}
      {step === 'input' && (
        <div className="flex flex-col gap-5 animate-fade-up">

          {/* Photo */}
          <div>
            <MonoLabel className="mb-2 block">Photo (optional)</MonoLabel>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhoto} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-28 border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[var(--accent)] transition-colors group overflow-hidden relative">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="meal" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-2xl text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">📷</span>
                  <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-widest">Tap to photograph meal</span>
                </>
              )}
            </button>
            {photoPreview && (
              <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); }}
                className="text-xs font-mono text-[var(--red)] mt-2">Remove photo</button>
            )}
          </div>

          {/* Description */}
          <Textarea
            label="What did you eat? (More detail = Better Result)"
            placeholder="Casually, What? How Much? Where?...Thats It!"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />

          {/* Meal type */}
          <div>
            <MonoLabel className="mb-2 block">Meal Type</MonoLabel>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setMealType(mealType === t ? '' : t)}
                  className={`py-2 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all
                    ${mealType === t ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Date & Time picker ── */}
          <div className="flex flex-col gap-3">
            <MonoLabel>When did you eat?</MonoLabel>

            {/* Date row */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Date</span>
                <button onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all
                    ${dateEdited ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}>
                  {dateEdited ? `✓ ${format(new Date(logDate + 'T00:00:00'), 'd MMM yyyy')}` : `Today · ${format(new Date(), 'd MMM')} ↓`}
                </button>
              </div>
              {showDatePicker && (
                <div className="bg-[var(--surface)] border border-[var(--accent)] rounded-xl p-4 animate-scale-in">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {makeDatePresets().map(preset => (
                      <button key={preset.value}
                        onClick={() => {
                          setLogDate(preset.value);
                          setDateEdited(preset.value !== format(new Date(), 'yyyy-MM-dd'));
                          setShowDatePicker(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all
                          ${logDate === preset.value ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]'}`}>
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <MonoLabel>Custom:</MonoLabel>
                    <input
                      type="date"
                      value={logDate}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      onChange={e => {
                        setLogDate(e.target.value);
                        setDateEdited(e.target.value !== format(new Date(), 'yyyy-MM-dd'));
                      }}
                      className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] font-mono"
                    />
                    <button onClick={() => setShowDatePicker(false)}
                      className="text-xs font-mono text-[var(--accent)] border border-[var(--accent)] px-3 py-2 rounded-lg hover:bg-[var(--accent-glow)]">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Time row */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Time</span>
                <button onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }}
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all
                    ${timeEdited ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}>
                  {timeEdited ? `✓ ${format(new Date(`2000-01-01T${logTime}`), 'h:mm a')}` : `Now · ${format(new Date(), 'h:mm a')} ↓`}
                </button>
              </div>
              {showTimePicker && (
                <div className="bg-[var(--surface)] border border-[var(--accent)] rounded-xl p-4 animate-scale-in">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {TIME_PRESETS.map(preset => {
                      const val = preset.getValue();
                      const isNow = preset.label === 'Now';
                      return (
                        <button key={preset.label}
                          onClick={() => {
                            setLogTime(val);
                            setTimeEdited(!isNow);
                            setShowTimePicker(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all
                            ${logTime === val ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]'}`}>
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <MonoLabel>Custom:</MonoLabel>
                    <input
                      type="time"
                      value={logTime}
                      onChange={e => { setLogTime(e.target.value); setTimeEdited(true); }}
                      className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] font-mono"
                    />
                    <button onClick={() => setShowTimePicker(false)}
                      className="text-xs font-mono text-[var(--accent)] border border-[var(--accent)] px-3 py-2 rounded-lg hover:bg-[var(--accent-glow)]">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-[var(--red)] text-xs bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.2)] rounded-xl px-4 py-3 font-mono">
              {error}
            </div>
          )}

          <Button size="lg" onClick={handleAnalyze} className="font-mono tracking-wide"
            disabled={!description.trim() && !photoBase64}>
            ✦ Analyze Nutrition
          </Button>
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === 'review' && analysis && (
        <div className="flex flex-col gap-5 animate-fade-up">

          {analysis.ai_note && (
            <div className="bg-[rgba(91,184,212,0.08)] border border-[rgba(91,184,212,0.2)] rounded-xl px-4 py-3">
              <p className="text-xs text-[var(--blue)] italic">{analysis.ai_note}</p>
            </div>
          )}

          {analysis.serving_assumption && (
            <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-4 py-3">
              <MonoLabel className="block mb-1">Assumed serving</MonoLabel>
              <p className="text-xs text-[var(--text2)]">{analysis.serving_assumption}</p>
            </div>
          )}

          {/* Detected items */}
          <div>
            <MonoLabel className="mb-2 block">Detected Items</MonoLabel>
            {analysis.items.length === 0 ? (
              <div className="bg-[var(--surface2)] border border-dashed border-[var(--border)] rounded-xl px-4 py-6 text-center">
                <p className="text-xs font-mono text-[var(--muted)]">All items removed. Edit the nutrition values manually below.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {analysis.items.map((item, i) => (
                  <div key={i} className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: 'Syne, serif' }}>{item.name}</p>
                      <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">{item.quantity} {item.unit} · {Math.round(item.calories)} kcal</p>
                    </div>
                    <button
                      onClick={() => removeItem(i)}
                      title="Remove this item"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted2)] hover:text-[var(--red)] hover:bg-[rgba(224,92,92,0.08)] transition-all text-base font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nutrition — all editable */}
          <div>
            <MonoLabel className="mb-2 block">Nutrition (tap to edit)</MonoLabel>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <NutrientBox label="Calories" value={analysis.total_calories} unit="kcal"
                  color="var(--accent)" large editable onChange={v => updateNutrient('total_calories', v)} />
              </div>
              <NutrientBox label="Protein" value={analysis.total_protein_g} unit="g"
                color="var(--blue)" editable onChange={v => updateNutrient('total_protein_g', v)} />
              <NutrientBox label="Carbs" value={analysis.total_carbs_g} unit="g"
                color="var(--accent)" editable onChange={v => updateNutrient('total_carbs_g', v)} />
              <NutrientBox label="Fat" value={analysis.total_fat_g} unit="g"
                color="#e8885a" editable onChange={v => updateNutrient('total_fat_g', v)} />
              <NutrientBox label="Fiber" value={analysis.total_fiber_g} unit="g"
                color="var(--green)" editable onChange={v => updateNutrient('total_fiber_g', v)} />
              <NutrientBox label="Sugar" value={analysis.total_sugar_g} unit="g"
                color="var(--red)" editable onChange={v => updateNutrient('total_sugar_g', v)} />
              <NutrientBox label="Sodium" value={analysis.total_sodium_mg} unit="mg"
                color="var(--muted)" editable onChange={v => updateNutrient('total_sodium_mg', v)} />
            </div>
          </div>

          {/* Macro bar */}
          {(() => {
            const total = analysis.total_protein_g * 4 + analysis.total_carbs_g * 4 + analysis.total_fat_g * 9;
            if (total === 0) return null;
            return (
              <div>
                <div className="macro-bar mb-2">
                  <div className="macro-bar-protein" style={{ flex: analysis.total_protein_g * 4 / total }} />
                  <div className="macro-bar-carbs" style={{ flex: analysis.total_carbs_g * 4 / total }} />
                  <div className="macro-bar-fat" style={{ flex: analysis.total_fat_g * 9 / total }} />
                </div>
                <div className="flex gap-4 text-[10px] font-mono">
                  <span className="text-[var(--blue)]">■ Protein</span>
                  <span className="text-[var(--accent)]">■ Carbs</span>
                  <span style={{ color: '#e8885a' }}>■ Fat</span>
                </div>
              </div>
            );
          })()}

          {/* Date + Time summary on review */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center justify-between">
            <MonoLabel>Logged at</MonoLabel>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-[var(--text)]">
                {format(new Date(`${logDate}T${logTime}:00`), 'd MMM yyyy · h:mm a')}
              </span>
              <button onClick={() => setStep('input')}
                className="text-[10px] font-mono text-[var(--accent)] hover:underline">edit</button>
            </div>
          </div>

          {/* Price */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
            <MonoLabel className="mb-2 block">Price Paid (optional)</MonoLabel>
            <div className="flex items-center gap-2">
              <span className="text-[var(--accent)] font-mono text-lg">₹</span>
              <input type="number" placeholder="0" value={price}
                onChange={e => setPrice(e.target.value)}
                className="flex-1 bg-transparent outline-none text-2xl font-bold text-[var(--accent)] placeholder:text-[var(--muted2)]"
                style={{ fontFamily: 'Syne, serif' }} min="0" step="1" />
            </div>
          </div>

          {error && (
            <div className="text-[var(--red)] text-xs bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.2)] rounded-xl px-4 py-3 font-mono">
              {error}
            </div>
          )}

          <Button size="lg" onClick={handleSave} className="font-mono tracking-wide">
            ✓ Add to Log
          </Button>
          <Button variant="ghost" size="md" onClick={() => setStep('input')} className="text-xs font-mono">
            ← Edit description
          </Button>
        </div>
      )}
    </div>
  );
}