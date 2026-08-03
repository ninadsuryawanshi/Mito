'use client';
import { useState, useEffect } from 'react';

export const VEG_MEAL_PROMPTS = [
  "2 chapatis with bhindi bhaji and a bowl of dal",
  "1 plate poha with peanuts and hot chai",
  "2 masale dosa with coconut chutney",
  "paneer butter masala with 2 butter rotis",
  "1 bowl rajma chawal with cucumber salad",
  "2 moong dal chilla with pudina chutney",
  "1 cup filter coffee with 2 soft idlis",
  "1 bowl curd rice with pomegranate",
  "2 parathas with fresh curd and mango pickle",
  "1 plate pav bhaji with extra butter",
];

interface AnimatedTypewriterPromptProps {
  prefix?: string;
  className?: string;
  prompts?: string[];
}

export function AnimatedTypewriterPrompt({
  prefix = '',
  className = '',
  prompts = VEG_MEAL_PROMPTS,
}: AnimatedTypewriterPromptProps) {
  const [promptIdx, setPromptIdx] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const targetText = prompts[promptIdx];
    let timer: NodeJS.Timeout;

    if (!isDeleting && currentText.length < targetText.length) {
      // Typing next character
      timer = setTimeout(() => {
        setCurrentText(targetText.slice(0, currentText.length + 1));
      }, 35);
    } else if (!isDeleting && currentText.length === targetText.length) {
      // Pause at full sentence for reading
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 1800);
    } else if (isDeleting && currentText.length > 0) {
      // Fast backspace/delete
      timer = setTimeout(() => {
        setCurrentText(targetText.slice(0, currentText.length - 1));
      }, 15);
    } else if (isDeleting && currentText.length === 0) {
      // Switch to next sentence
      setIsDeleting(false);
      setPromptIdx((prev) => (prev + 1) % prompts.length);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, promptIdx, prompts]);

  return (
    <span className={`inline-flex items-center flex-wrap ${className}`}>
      {prefix && <span className="mr-1 opacity-90">{prefix}</span>}
      <span className="relative font-mono text-[var(--text2)] font-normal text-xs sm:text-sm">
        {currentText}
        <span className="inline-block w-[1.5px] h-[1em] bg-[var(--muted)] opacity-80 ml-0.5 translate-y-[1px] animate-pulse" />
      </span>
    </span>
  );
}
