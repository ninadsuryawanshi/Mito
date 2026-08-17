'use client';

import { useState, useEffect } from 'react';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  badge?: string;
  position?: 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'quick-log-prompt',
    title: 'Fast & Natural Logging',
    description: 'Tap here to type, speak, or take a photo of your meal. Done in under 30 seconds with zero menu searching.',
    badge: 'Step 1 of 6',
    position: 'bottom',
  },
  {
    targetId: 'header-streaks',
    title: 'Track Your Streaks',
    description: 'Keep your Log Streak going by logging daily, and your Clean Streak alive by avoiding personal rule breaks.',
    badge: 'Step 2 of 6',
    position: 'bottom',
  },
  {
    targetId: 'macro-stats',
    title: 'The Full Nutrition Picture',
    description: 'Instantly view your calories, protein, fiber, sugar, and sodium totals for the day, week, or month.',
    badge: 'Step 3 of 6',
    position: 'top',
  },
  {
    targetId: 'nav-rules',
    title: 'Your Rules. Your Call.',
    description: 'Define personal rules (e.g. "no late night sugar"). Mito quietly monitors your logs without judgment or scolding.',
    badge: 'Step 4 of 6',
    position: 'top',
  },
  {
    targetId: 'nav-settings-mobile',
    title: 'Share & Export Logs',
    description: 'Download your food logs as CSV or HTML/PDF documents, print them, share links with dietitians, or feed them to LLMs!',
    badge: 'Step 5 of 6',
    position: 'top',
  },
  {
    targetId: 'quick-log-prompt',
    title: 'Ready to Start?',
    description: 'Go ahead, log your last meal right now! Don\'t forget to enable push notifications so staying consistent becomes effortless.',
    badge: 'Step 6 of 6',
    position: 'bottom',
  },
];

const CARD_HEIGHT = 220;
const CARD_WIDTH = 384;
const CARD_OFFSET = 20;

export function OnboardingTour({ onComplete }: { onComplete?: () => void }) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem('mito_tour_completed');
    if (!completed) {
      const timer = setTimeout(() => setActiveStep(0), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (activeStep === null) return;
    const step = TOUR_STEPS[activeStep];

    const measure = () => {
      const el = document.getElementById(step.targetId);
      if (el) setTargetRect(el.getBoundingClientRect());
      else setTargetRect(null);
    };

    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(measure, 450);
    } else {
      setTargetRect(null);
    }

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [activeStep]);

  function finishTour() {
    localStorage.setItem('mito_tour_completed', 'true');
    setActiveStep(null);
    if (onComplete) onComplete();
  }

  function handleNext() {
    if (activeStep === null) return;
    if (activeStep < TOUR_STEPS.length - 1) setActiveStep(activeStep + 1);
    else finishTour();
  }

  function handleBack() {
    if (activeStep !== null && activeStep > 0) setActiveStep(activeStep - 1);
  }

  if (activeStep === null) return null;

  const currentStep = TOUR_STEPS[activeStep];
  const padding = 8;
  const rx = 14;

  const computeCardStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rawLeft = vw / 2 - CARD_WIDTH / 2;
    const clampedLeft = Math.max(8, Math.min(rawLeft, vw - CARD_WIDTH - 8));

    let top: number;

    if (currentStep.position === 'top') {
      top = targetRect.top - padding - CARD_OFFSET - CARD_HEIGHT;
      if (top < 8) top = targetRect.bottom + padding + CARD_OFFSET;
    } else {
      top = targetRect.bottom + padding + CARD_OFFSET;
      if (top + CARD_HEIGHT > vh - 8) top = targetRect.top - padding - CARD_OFFSET - CARD_HEIGHT;
    }

    top = Math.max(8, Math.min(top, vh - CARD_HEIGHT - 8));

    return { top, left: clampedLeft };
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[101]">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx={rx}
                ry={rx}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(8, 7, 6, 0.88)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {targetRect && (
        <div
          className="fixed pointer-events-none z-[102] transition-all duration-300"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            borderRadius: `${rx}px`,
            border: '2px solid var(--accent)',
            boxShadow: '0 0 30px var(--accent-glow), inset 0 0 15px rgba(244,162,77,0.2)',
          }}
        />
      )}

      <div
        className="fixed z-[103] w-full max-w-sm px-4 pointer-events-auto transition-all duration-300"
        style={computeCardStyle()}
      >
        <div className="bg-[#12100e] border border-[rgba(244,162,77,0.4)] rounded-2xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.98),0_0_30px_rgba(244,162,77,0.25)] flex flex-col gap-3 animate-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[rgba(244,162,77,0.12)] text-[var(--accent)] border border-[rgba(244,162,77,0.3)]">
              {currentStep.badge}
            </span>
            <button
              onClick={finishTour}
              className="text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors p-1"
            >
              Skip tour ✕
            </button>
          </div>

          <div>
            <h3 className="text-base font-bold text-[var(--text)] mb-1" style={{ fontFamily: 'Syne, serif' }}>
              {currentStep.title}
            </h3>
            <p className="text-xs font-mono text-[var(--muted)] leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1f1b16] mt-1">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeStep ? 'bg-[var(--accent)] w-5' : 'bg-[var(--border)]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-[#0a0908] font-mono text-xs font-bold hover:bg-[var(--accent2)] transition-all shadow-[0_0_15px_var(--accent-glow)] cursor-pointer"
              >
                {activeStep === TOUR_STEPS.length - 1 ? 'Log First Meal! ➔' : 'Next ➔'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
