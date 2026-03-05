"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SessionNotificationsPopover } from "./SessionNotificationsPopover";
import { WordsQuickPanel } from "./WordsQuickPanel";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionTopBarProps = {
  sessionId: Id<"sessions">;
  isHost: boolean;
  isParticipant: boolean;
  sessionAccessType: "public" | "passcode" | "private";
  isSessionEnded: boolean;
  cardShadow: string;
};

export function SessionTopBar({
  sessionId,
  isHost,
  isParticipant,
  sessionAccessType,
  isSessionEnded,
  cardShadow,
}: SessionTopBarProps) {
  const router = useRouter();
  const endSession = useMutation(api.sessions.endSessionServer);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [endSessionErrorMessage, setEndSessionErrorMessage] = useState<string | null>(null);

  async function handleEndSession() {
    setIsEndingSession(true);
    setEndSessionErrorMessage(null);
    try {
      await endSession({ sessionId });
      router.replace("/dashboard");
    } catch (error) {
      setEndSessionErrorMessage(
        error instanceof Error ? error.message : "Failed to end session.",
      );
    } finally {
      setIsEndingSession(false);
    }
  }

  return (
    <div className="mb-5 animate-in fade-in slide-in-from-top-1 duration-500">
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/45 bg-white/62 p-2 backdrop-blur-md dark:border-white/15 dark:bg-white/8"
        style={{ boxShadow: cardShadow }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => { router.push("/dashboard"); }}
            className="w-fit"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isParticipant && !isSessionEnded ? (
            <WordsQuickPanel
              sessionId={sessionId}
              isParticipant={isParticipant}
            />
          ) : null}
          <SessionNotificationsPopover
            sessionId={sessionId}
            isHost={isHost}
            sessionAccessType={sessionAccessType}
            isSessionEnded={isSessionEnded}
          />
          {isHost && !isSessionEnded ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isEndingSession}
                >
                  End session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End this session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the session as ended and block further
                    join/queue actions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isEndingSession}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isEndingSession}
                    onClick={() => { void handleEndSession(); }}
                  >
                    {isEndingSession ? "Ending..." : "End session"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>
      {endSessionErrorMessage ? (
        <p className="mt-2 text-xs text-red-500">
          {endSessionErrorMessage}
        </p>
      ) : null}
    </div>
  );
}
