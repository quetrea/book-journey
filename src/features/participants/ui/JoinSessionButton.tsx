"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type JoinSessionButtonProps = {
  isParticipant: boolean;
  isSessionEnded: boolean;
  onJoin: () => Promise<void>;
};

export function JoinSessionButton({
  isParticipant,
  isSessionEnded,
  onJoin,
}: JoinSessionButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isParticipant) {
    return null;
  }

  async function handleJoin() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onJoin();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join session.";
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
          void handleJoin();
        }}
        disabled={isSubmitting || isSessionEnded}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Joining..." : "Join session"}
      </Button>

      {isSessionEnded ? (
        <p className="text-xs text-muted-foreground">This session has ended.</p>
      ) : null}
      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
    </div>
  );
}
