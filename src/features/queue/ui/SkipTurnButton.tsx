"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type SkipTurnButtonProps = {
  canSkip: boolean;
  onSkip: () => Promise<void>;
};

export function SkipTurnButton({ canSkip, onSkip }: SkipTurnButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!canSkip) {
    return null;
  }

  async function handleSkip() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSkip();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to skip turn.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void handleSkip();
        }}
        disabled={isSubmitting}
        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
      >
        {isSubmitting ? "Skipping..." : "Skip my turn"}
      </Button>
      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
    </div>
  );
}
