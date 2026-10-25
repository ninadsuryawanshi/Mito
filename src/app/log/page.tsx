'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Camera, Check, Mic, Sparkles, Zap } from 'lucide-react';
import { AIMealAnalysis } from '@/types';
import { Button, Textarea, NutrientBox, MonoLabel, Spinner, AnimatedTypewriterPrompt } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';

type Step = 'input' | 'analyzing' | 'review' | 'saving' | 'done';
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const ANALYZE_STAGES_TEXT = [
  'Decomposing meal items and portions',
  'Calculating calories, protein and macros',
  'Checking against your food rules',
  'Finalizing nutritional breakdown',
];

const ANALYZE_STAGES_PHOTO = [
  'Capturing your food & scanning visual details...',
  'Running a vibe check on your plate...',
  'Decomposing meal items and portion sizes',
  'Calculating calories, protein and macros',
  'Checking against your food rules',
  'Finalizing nutritional breakdown',
];

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

function LogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Quick re-log state
  const [recentMeals, setRecentMeals] = useState<any[]>([]);
  const [reusedFromLogId, setReusedFromLogId] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'photo' | 'quick_reuse'>('text');
  const [showAllRecent, setShowAllRecent] = useState(false);

  // Date + Time — default to today/now
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logTime, setLogTime] = useState(format(new Date(), 'HH:mm'));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeEdited, setTimeEdited] = useState(false);
  const [dateEdited, setDateEdited] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [analyzingStage, setAnalyzingStage] = useState(0);

  const currentStages = photoBase64 ? ANALYZE_STAGES_PHOTO : ANALYZE_STAGES_TEXT;

  useEffect(() => {
    if (step !== 'analyzing') {
      setAnalyzingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setAnalyzingStage(prev => (prev < currentStages.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [step, currentStages.length]);

  useEffect(() => {
    fetch('/api/meals?recent=true')
      .then(res => res.json())
      .then(data => { if (data.meals) setRecentMeals(data.meals); })
      .catch(console.error);
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 500) {
          setIsListening(false);
          return;
        }

        setIsTranscribing(true);
        toast('Transcribing audio with AI Whisper...', 'info');

        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.transcript) {
            setDescription((prev) => (prev ? `${prev.trim()} ${data.transcript.trim()}` : data.transcript.trim()));
            toast('Voice transcribed.', 'success');
          } else {
            toast(data.error || 'Transcription failed', 'error');
          }
        } catch (err: any) {
          console.error('Transcription error:', err);
          toast('Failed to transcribe voice note', 'error');
        } finally {
          setIsTranscribing(false);
          setIsListening(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      toast('Recording started. Tap button when finished speaking.', 'info');
    } catch (e: any) {
      console.error('Microphone access error:', e);
      toast('Microphone access denied or unavailable.', 'error');
      setIsListening(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  const toggleListening = useCallback(() => {
    if (isTranscribing) return;
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isTranscribing, isListening]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const autoFocus = searchParams.get('autoFocus');

    if (mode === 'photo') {
      setTimeout(() => fileRef.current?.click(), 300);
    } else if (mode === 'voice') {
      setTimeout(() => {
        textareaRef.current?.focus();
        toggleListening();
      }, 300);
    } else {
      // Focus immediately + delayed to catch mobile DOM focus transition
      textareaRef.current?.focus();
      const t1 = setTimeout(() => textareaRef.current?.focus(), 100);
      const t2 = setTimeout(() => textareaRef.current?.focus(), 300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [searchParams, toggleListening]);

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

  const selectedDateLabel = dateEdited
    ? format(new Date(logDate + 'T00:00:00'), 'EEE, d MMM')
    : 'Today';
  const selectedTimeLabel = format(new Date(`2000-01-01T${logTime}`), 'h:mm a');

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
          // If a photo is present, send description as additional_context so the
          // vision model receives the user's text hint (e.g. "ragi dosa") alongside
          // the image rather than ignoring it.
          description: !photoBase64 ? (description.trim() || undefined) : undefined,
          photo_base64: photoBase64 || undefined,
          photo_mime_type: photoMime,
          additional_context: photoBase64 ? (description.trim() || undefined) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
      setInputMethod(photoBase64 ? 'photo' : 'text');
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
          input_method: inputMethod,
          reused_from_log_id: reusedFromLogId || undefined,
          meal_type: mealType || undefined,
          price: price ? parseFloat(price) : undefined,
          currency: '₹',
          user_edited: userEdited,
          logged_at: buildLoggedAt(),  // pass custom time
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast('Meal logged.', 'success');
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
      total_calories: Math.max(0, analysis.total_calories - item.calories),
      total_protein_g: Math.max(0, analysis.total_protein_g - item.protein_g),
      total_carbs_g: Math.max(0, analysis.total_carbs_g - item.carbs_g),
      total_fat_g: Math.max(0, analysis.total_fat_g - item.fat_g),
      total_fiber_g: Math.max(0, analysis.total_fiber_g - item.fiber_g),
      total_sugar_g: Math.max(0, analysis.total_sugar_g - item.sugar_g),
      total_sodium_mg: Math.max(0, analysis.total_sodium_mg - item.sodium_mg),
    });
  }

  function handleQuickRelog(meal: any) {
    const items = meal.items?.map((i: any) => ({
      name: i.food_entity?.name || 'Food item',
      quantity: i.quantity || 1,
      unit: i.unit || 'serving',
      calories: i.calories || 0,
      protein_g: i.protein_g || 0,
      carbs_g: i.carbs_g || 0,
      fat_g: i.fat_g || 0,
      fiber_g: i.fiber_g || 0,
      sugar_g: i.sugar_g || 0,
      sodium_mg: i.sodium_mg || 0,
    })) || [];

    const relogAnalysis: AIMealAnalysis = {
      items,
      eating_context: (meal.eating_context as any) || 'home',
      total_calories: meal.total_calories || 0,
      total_protein_g: meal.total_protein_g || 0,
      total_carbs_g: meal.total_carbs_g || 0,
      total_fat_g: meal.total_fat_g || 0,
      total_fiber_g: meal.total_fiber_g || 0,
      total_sugar_g: meal.total_sugar_g || 0,
      total_sodium_mg: meal.total_sodium_mg || 0,
      ai_note: meal.ai_note || 'Re-logged meal',
    };

    setAnalysis(relogAnalysis);
    if (meal.meal_type) setMealType(meal.meal_type);
    setReusedFromLogId(meal.log_id);
    setInputMethod('quick_reuse');
    setStep('review');
    toast('Meal copied — review & save', 'info');
  }



  if (step === 'saving') return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
      <Spinner size="lg" />
      <p className="text-[13px] uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Saving...</p>
    </div>
  );

  if (step === 'analyzing') return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 max-w-md mx-auto" style={{ background: 'var(--bg)' }}>
      {photoPreview ? (
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--gold-shadow)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoPreview} alt="analyzing photo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-center pb-2"
            style={{ background: 'linear-gradient(to top, rgba(28,26,20,0.6), transparent)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1" style={{ color: 'var(--gold-3)' }}><Camera className="w-3 h-3" />Scanning</span>
          </div>
        </div>
      ) : (
        <div className="relative flex items-center justify-center w-24 h-24">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--gold-glow)' }} />
          <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'var(--gold-tint)' }} />
          <div className="relative w-12 h-12 rounded-full flex items-center justify-center gold-btn" style={{ borderRadius: '50%', padding: 0 }}>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      )}
      <div className="text-center flex flex-col items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--gold-2)', fontFamily: 'var(--font-body)' }}>
          Step {analyzingStage + 1} of {currentStages.length}
        </p>
        <p key={analyzingStage} className="text-[16px] font-bold anim-fade-up" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          {currentStages[analyzingStage]}
        </p>
      </div>
      <div className="w-full max-w-xs flex gap-1.5">
        {currentStages.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-500"
            style={{ background: i <= analyzingStage ? 'var(--gold-gradient)' : 'var(--surface3)' }} />
        ))}
      </div>
      {description && (
        <p className="text-[13px] italic text-center max-w-xs line-clamp-2" style={{ color: 'var(--muted)' }}>
          &ldquo;{description}&rdquo;
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 min-h-dvh pb-28" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-7 anim-fade-up">
        <button onClick={() => step === 'review' ? setStep('input') : router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-[22px] font-extrabold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          {step === 'review' ? 'Review & Edit' : 'Log a Meal'}
        </h1>
      </div>

      {/* ── INPUT ── */}
      {step === 'input' && (
        <div className="flex flex-col gap-5 anim-fade-up min-h-[calc(100dvh-132px)]">

          {/* ── Big Text Input (hero) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <MonoLabel>What did you eat?</MonoLabel>
              {!description && (
                <div className="hidden sm:block">
                  <AnimatedTypewriterPrompt prefix="Try:" />
                </div>
              )}
            </div>
            <div className="mito-card p-4 relative" style={{
              ...(isListening ? { border: '2px solid var(--red)', boxShadow: '0 0 0 4px rgba(224,92,92,0.12)' } : {}),
            }}>
              <textarea
                ref={textareaRef}
                autoFocus
                placeholder={
                  isTranscribing ? 'Transcribing voice with AI Whisper...'
                  : isListening ? 'Recording... tap button when done...'
                  : 'What did you eat?'
                }
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                className="w-full bg-transparent outline-none resize-none text-[15px] pb-10 border-0"
                style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}
              />
              {/* Action icons inside textarea */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" capture="environment"
                  onChange={handlePhoto} className="hidden" />
                {photoPreview && (
                  <div className="relative w-8 h-8 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                    <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); }}
                      className="absolute inset-0 flex items-center justify-center text-white text-xs border-none bg-black/40 cursor-pointer">×</button>
                  </div>
                )}
                <button onClick={() => fileRef.current?.click()} title="Add photo"
                  className="w-8 h-8 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all"
                  style={{ background: 'var(--surface2)', color: 'var(--muted)' }}><Camera className="w-4 h-4" /></button>
                <button type="button" onClick={toggleListening} disabled={isTranscribing}
                  title={isListening ? 'Stop recording' : 'Voice log'}
                  className="w-8 h-8 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all"
                  style={{
                    background: isListening ? 'var(--red-tint)' : isTranscribing ? 'var(--gold-tint)' : 'var(--surface2)',
                    color: isListening ? 'var(--red)' : isTranscribing ? 'var(--gold-2)' : 'var(--muted)',
                  }}>
                  {isListening ? (
                    <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: 'var(--red)' }} />
                  ) : isTranscribing ? (
                    <Zap className="w-4 h-4 anim-spin" />
                  ) : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick re-log recent meals */}
          {recentMeals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <MonoLabel className="block">Re-log Recent Meal</MonoLabel>
                <button
                  onClick={() => setShowAllRecent(prev => !prev)}
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--gold-1)', fontFamily: 'var(--font-body)' }}
                >
                  {showAllRecent ? 'Show less' : 'See all'}
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {recentMeals.slice(0, showAllRecent ? 8 : 3).map((meal: any) => {
                  const names = meal.items?.map((i: any) => i.food_entity?.name).filter(Boolean).join(', ') || 'Meal';
                  return (
                    <button
                      key={meal.log_id}
                      onClick={() => handleQuickRelog(meal)}
                      className="shrink-0 bg-[var(--surface2)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl px-3.5 py-2 text-left transition-all group"
                    >
                      <p className="text-xs font-medium text-[var(--text)] group-hover:text-[var(--accent)] max-w-[160px] truncate" style={{ fontFamily: 'Syne, serif' }}>
                        {names}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">
                        {Math.round(meal.total_calories || 0)} kcal
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meal metadata summary + quick edit */}
          <div className="mito-card p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <MonoLabel>Meal details</MonoLabel>
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>Tap to edit</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setMealType(mealType === t ? '' : t)}
                  className="py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all"
                  style={mealType === t
                    ? { borderColor: 'rgba(232,160,48,0.5)', color: 'var(--gold-1)', background: 'var(--gold-tint)' }
                    : { borderColor: 'var(--border)', color: 'var(--muted)' }}>
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
                className="text-left rounded-xl border px-3 py-2.5 transition-all"
                style={dateEdited
                  ? { borderColor: 'rgba(232,160,48,0.5)', background: 'var(--gold-tint)' }
                  : { borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Date</p>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{selectedDateLabel}</p>
              </button>

              <button
                onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }}
                className="text-left rounded-xl border px-3 py-2.5 transition-all"
                style={timeEdited
                  ? { borderColor: 'rgba(232,160,48,0.5)', background: 'var(--gold-tint)' }
                  : { borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Time</p>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{selectedTimeLabel}</p>
              </button>
            </div>

            {showDatePicker && (
              <div className="bg-[var(--surface)] border rounded-xl p-4 mt-3 animate-scale-in" style={{ borderColor: 'rgba(232,160,48,0.35)' }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  {makeDatePresets().map(preset => (
                    <button key={preset.value}
                      onClick={() => {
                        setLogDate(preset.value);
                        setDateEdited(preset.value !== format(new Date(), 'yyyy-MM-dd'));
                        setShowDatePicker(false);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs border transition-all"
                      style={logDate === preset.value
                        ? { borderColor: 'rgba(232,160,48,0.55)', color: 'var(--gold-1)', background: 'var(--gold-tint)' }
                        : { borderColor: 'var(--border)', color: 'var(--muted)' }}>
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
                    className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none"
                  />
                  <button onClick={() => setShowDatePicker(false)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ color: 'var(--gold-1)', border: '1px solid rgba(232,160,48,0.45)' }}>
                    Done
                  </button>
                </div>
              </div>
            )}

            {showTimePicker && (
              <div className="bg-[var(--surface)] border rounded-xl p-4 mt-3 animate-scale-in" style={{ borderColor: 'rgba(232,160,48,0.35)' }}>
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
                        className="px-3 py-1.5 rounded-lg text-xs border transition-all"
                        style={logTime === val
                          ? { borderColor: 'rgba(232,160,48,0.55)', color: 'var(--gold-1)', background: 'var(--gold-tint)' }
                          : { borderColor: 'var(--border)', color: 'var(--muted)' }}>
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
                    className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none"
                  />
                  <button onClick={() => setShowTimePicker(false)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ color: 'var(--gold-1)', border: '1px solid rgba(232,160,48,0.45)' }}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-[var(--red)] text-xs bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.2)] rounded-xl px-4 py-3 font-mono">
              {error}
            </div>
          )}

          <div className="mt-auto pt-2" />
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === 'review' && analysis && (
        <div className="flex flex-col gap-5 anim-fade-up">

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

          <Button variant="gold" size="lg" onClick={handleSave}>
            <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" />Add to Log</span>
          </Button>
          <Button variant="ghost" size="md" onClick={() => setStep('input')}>
            <span className="inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" />Edit description</span>
          </Button>
        </div>
      )}

      {step === 'input' && (
        <div className="fixed left-0 right-0 bottom-0 z-20 px-4 pb-4 pt-3"
          style={{
            background: 'linear-gradient(180deg, rgba(250,250,247,0) 0%, rgba(250,250,247,0.94) 36%, rgba(250,250,247,0.98) 100%)',
            backdropFilter: 'blur(6px)',
          }}>
          <div className="max-w-2xl mx-auto">
            <Button variant="gold" size="lg" onClick={handleAnalyze}
              disabled={!description.trim() && !photoBase64}>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" />Analyze Nutrition</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <LogContent />
    </Suspense>
  );
}