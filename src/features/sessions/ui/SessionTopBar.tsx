"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Radio } from "lucide-react";

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
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionTopBarProps = {
  sessionId: Id<"sessions">;
  isHost: boolean;
  isParticipant: boolean;
  sessionAccessType: "public" | "passcode" | "private";
  isSessionEnded: boolean;
  createdAt: number;
  endedAt?: number;
  cardShadow: string;
};

function formatStartedAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function SessionTopBar({
  sessionId,
  isHost,
  isParticipant,
  sessionAccessType,
  isSessionEnded,
  createdAt,
  endedAt,
  cardShadow,
}: SessionTopBarProps) {
  const router = useRouter();
  const endSession = useMutation(api.sessions.endSessionServer);
  const leaveSession = useMutation(api.sessions.leaveSessionServer);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [endSessionErrorMessage, setEndSessionErrorMessage] = useState<string | null>(null);
  const [isLeavingSession, setIsLeavingSession] = useState(false);
  const [leaveSessionErrorMessage, setLeaveSessionErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isSessionEnded) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSessionEnded]);

  const elapsedLabel = useMemo(() => {
    const endTimestamp = isSessionEnded ? (endedAt ?? now) : now;
    return formatElapsed(endTimestamp - createdAt);
  }, [createdAt, endedAt, isSessionEnded, now]);

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

  async function handleLeaveSession() {
    setIsLeavingSession(true);
    setLeaveSessionErrorMessage(null);
    try {
      await leaveSession({ sessionId });
      router.replace("/dashboard");
    } catch (error) {
      setLeaveSessionErrorMessage(
        error instanceof Error ? error.message : "Failed to leave session.",
      );
    } finally {
      setIsLeavingSession(false);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-500">
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-[1.35rem] border border-white/45 bg-white/62 px-2 py-1.5 backdrop-blur-md dark:border-white/15 dark:bg-white/8"
        style={{ boxShadow: cardShadow }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => { router.push("/dashboard"); }}
            className="w-fit"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Dashboard
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/75 px-3 py-1 text-[11px] font-medium text-muted-foreground dark:border-white/12 dark:bg-white/10">
            <Clock3 className="size-3.5 text-indigo-500" />
            Started {formatStartedAt(createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/75 px-3 py-1 text-[11px] font-medium text-foreground dark:border-white/12 dark:bg-white/10">
            <Radio className={`size-3.5 ${isSessionEnded ? "text-slate-400" : "text-emerald-500"}`} />
            {isSessionEnded ? "Ended" : "Live"} {elapsedLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SessionNotificationsPopover
            sessionId={sessionId}
            isHost={isHost}
            isParticipant={isParticipant}
            sessionAccessType={sessionAccessType}
            isSessionEnded={isSessionEnded}
          />
          {!isHost && isParticipant && !isSessionEnded ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => { void handleLeaveSession(); }}
              disabled={isLeavingSession}
            >
              {isLeavingSession ? "Leaving..." : "Leave session"}
            </Button>
          ) : null}
          {isHost && !isSessionEnded ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isEndingSession}
                  className="shadow-sm"
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
      {endSessionErrorMessage || leaveSessionErrorMessage ? (
        <p className="mt-2 text-xs text-red-500">
          {endSessionErrorMessage ?? leaveSessionErrorMessage}
        </p>
      ) : null}
    </div>
  );
}
