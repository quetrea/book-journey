"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type AdvanceQueueButtonProps = {
  isHost: boolean;
  onAdvance: () => Promise<void>;
};

export function AdvanceQueueButton({ isHost, onAdvance }: AdvanceQueueButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isHost) {
    return null;
  }

  async function handleAdvance() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onAdvance();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to advance queue.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={() => {
          void handleAdvance();
        }}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Advancing..." : "Advance queue"}
      </Button>
      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
    </div>
  );
}
