"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type WritingTickerProps = {
  phrases: string[];
  className?: string;
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function WritingTicker({
  phrases,
  className,
  typingSpeedMs = 46,
  deletingSpeedMs = 28,
  pauseMs = 1200,
}: WritingTickerProps) {
  const safePhrases = useMemo(
    () => phrases.filter((phrase) => phrase.trim().length > 0),
    [phrases]
  );
  const reducedMotion = useReducedMotion();

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const phrase = safePhrases[phraseIndex] ?? "";
  const text = reducedMotion
    ? safePhrases[0] ?? ""
    : phrase.slice(0, Math.max(0, charCount));

  useEffect(() => {
    if (reducedMotion || safePhrases.length <= 1) {
      return;
    }

    const hasTypedFullPhrase = charCount === phrase.length;
    const hasDeletedPhrase = charCount === 0;

    const timeout = window.setTimeout(
      () => {
        if (!isDeleting && !hasTypedFullPhrase) {
          setCharCount((current) => current + 1);
          return;
        }

        if (!isDeleting && hasTypedFullPhrase) {
          setIsDeleting(true);
          return;
        }

        if (isDeleting && !hasDeletedPhrase) {
          setCharCount((current) => current - 1);
          return;
        }

        setIsDeleting(false);
        setPhraseIndex((current) => (current + 1) % safePhrases.length);
      },
      !isDeleting && hasTypedFullPhrase
        ? pauseMs
        : isDeleting
          ? deletingSpeedMs
          : typingSpeedMs
    );

    return () => window.clearTimeout(timeout);
  }, [
    charCount,
    deletingSpeedMs,
    isDeleting,
    pauseMs,
    phrase.length,
    reducedMotion,
    safePhrases.length,
    typingSpeedMs,
  ]);

  return (
    <p className={cn("font-mono text-sm leading-6", className)}>
      {text}
      {!reducedMotion ? <span className="writing-caret" aria-hidden="true" /> : null}
    </p>
  );
}

type OnboardingWritingSequenceProps = {
  lines: string[];
  className?: string;
  typingSpeedMs?: number;
  linePauseMs?: number;
};

export function OnboardingWritingSequence({
  lines,
  className,
  typingSpeedMs = 30,
  linePauseMs = 420,
}: OnboardingWritingSequenceProps) {
  const safeLines = useMemo(
    () => lines.filter((line) => line.trim().length > 0),
    [lines]
  );
  const reducedMotion = useReducedMotion();

  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const isDone = lineIndex >= safeLines.length;
  const currentLine = safeLines[lineIndex] ?? "";

  useEffect(() => {
    if (reducedMotion || isDone || safeLines.length === 0) {
      return;
    }

    const lineComplete = charCount >= currentLine.length;
    const timeout = window.setTimeout(
      () => {
        if (!lineComplete) {
          setCharCount((current) => current + 1);
          return;
        }

        setLineIndex((current) => current + 1);
        setCharCount(0);
      },
      lineComplete ? linePauseMs : typingSpeedMs
    );

    return () => window.clearTimeout(timeout);
  }, [
    charCount,
    currentLine.length,
    isDone,
    linePauseMs,
    reducedMotion,
    safeLines.length,
    typingSpeedMs,
  ]);

  if (safeLines.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {safeLines.map((line, index) => {
        const isComplete = reducedMotion || index < lineIndex;
        const isCurrent = !reducedMotion && index === lineIndex && !isDone;
        const content = isComplete
          ? line
          : isCurrent
            ? line.slice(0, charCount)
            : "";

        return (
          <div
            key={`${line}-${index}`}
            className={cn(
              "flex min-h-6 items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
              isComplete
                ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "text-slate-500 dark:text-white/45"
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="size-3.5 shrink-0" />
            ) : (
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-slate-400/80 dark:bg-white/50" />
            )}
            <span className="font-mono">
              {content}
              {isCurrent ? <span className="writing-caret" aria-hidden="true" /> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
