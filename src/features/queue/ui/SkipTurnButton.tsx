"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type SkipTurnButtonProps = {
  sessionId: string;
  canSkip: boolean;
  onChanged: () => Promise<void> | void;
};

export function SkipTurnButton({ sessionId, canSkip, onChanged }: SkipTurnButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!canSkip) {
    return null;
  }

  async function handleSkip() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/queue/skip`, {
        method: "POST",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const message = typeof body?.error === "string" ? body.error : "Failed to skip turn.";
        throw new Error(message);
      }

      await onChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to skip turn.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={handleSkip} disabled={isSubmitting}>
        {isSubmitting ? "Skipping..." : "Skip my turn"}
      </Button>
      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
    </div>
  );
}
