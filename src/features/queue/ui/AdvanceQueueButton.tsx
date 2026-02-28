"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type AdvanceQueueButtonProps = {
  sessionId: string;
  isHost: boolean;
  onChanged: () => Promise<void> | void;
};

export function AdvanceQueueButton({
  sessionId,
  isHost,
  onChanged,
}: AdvanceQueueButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isHost) {
    return null;
  }

  async function handleAdvance() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/queue/advance`, {
        method: "POST",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const message = typeof body?.error === "string" ? body.error : "Failed to advance queue.";
        throw new Error(message);
      }

      await onChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to advance queue.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleAdvance} disabled={isSubmitting}>
        {isSubmitting ? "Advancing..." : "Advance queue"}
      </Button>
      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
    </div>
  );
}
