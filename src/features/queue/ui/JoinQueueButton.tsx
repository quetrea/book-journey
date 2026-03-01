"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type JoinQueueButtonProps = {
  isParticipant: boolean;
  isInQueue: boolean;
  isSessionEnded: boolean;
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
};

export function JoinQueueButton({
  isParticipant,
  isInQueue,
  isSessionEnded,
  onJoin,
  onLeave,
}: JoinQueueButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function callQueueMutation(path: "join" | "leave") {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (path === "join") {
        await onJoin();
      } else {
        await onLeave();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Queue action failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isParticipant) {
    return (
      <p className="text-xs text-muted-foreground">
        Join the session first to join the reading queue.
      </p>
    );
  }

  if (isSessionEnded) {
    return <p className="text-xs text-muted-foreground">Queue is closed for ended sessions.</p>;
  }

  return (
    <div className="space-y-2">
      {isInQueue ? (
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => {
            void callQueueMutation("leave");
          }}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Leaving..." : "Leave queue"}
        </Button>
      ) : (
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            void callQueueMutation("join");
          }}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Joining..." : "Join queue"}
        </Button>
      )}

      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
    </div>
  );
}
