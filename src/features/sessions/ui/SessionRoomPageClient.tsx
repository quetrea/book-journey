"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BookOpenText, UsersRound } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { JoinSessionButton } from "@/features/participants/ui/JoinSessionButton";
import { ParticipantsList } from "@/features/participants/ui/ParticipantsList";
import type { ParticipantListItem } from "@/features/participants/types";
import { ParticlesBackground } from "@/features/dashboard/ui/ParticlesBackground";
import type { QueueItem } from "@/features/queue/types";
import { AdvanceQueueButton } from "@/features/queue/ui/AdvanceQueueButton";
import { JoinQueueButton } from "@/features/queue/ui/JoinQueueButton";
import { QueueList } from "@/features/queue/ui/QueueList";
import { QueueStatusBar } from "@/features/queue/ui/QueueStatusBar";
import { SkipTurnButton } from "@/features/queue/ui/SkipTurnButton";
import type { SessionDetailsPayload } from "@/features/sessions/types";
import { SessionHeaderCard } from "./SessionHeaderCard";

type SessionRoomPageClientProps = {
  sessionId: string;
};

function normalizeApiError(message: unknown) {
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return "Request failed.";
}

export function SessionRoomPageClient({ sessionId }: SessionRoomPageClientProps) {
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<SessionDetailsPayload | null>(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(true);
  const [participantsErrorMessage, setParticipantsErrorMessage] = useState<string | null>(null);
  const [isCurrentUserParticipant, setIsCurrentUserParticipant] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [queueErrorMessage, setQueueErrorMessage] = useState<string | null>(null);
  const [passcodeValue, setPasscodeValue] = useState("");
  const [passcodeErrorMessage, setPasscodeErrorMessage] = useState<string | null>(null);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [endSessionErrorMessage, setEndSessionErrorMessage] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);

    if (response.status === 404) {
      setNotFound(true);
      setSessionDetails(null);
      return null;
    }

    if (!response.ok) {
      const message =
        response.status === 401
          ? "Please sign in again."
          : normalizeApiError(body?.error ?? "Failed to load session.");
      throw new Error(message);
    }

    setNotFound(false);
    const details = body as SessionDetailsPayload;
    setSessionDetails(details);
    return details;
  }, [sessionId]);

  const refreshParticipants = useCallback(
    async (showLoadingState: boolean) => {
      if (showLoadingState) {
        setIsParticipantsLoading(true);
      }

      try {
        const response = await fetch(`/api/sessions/${sessionId}/participants`, {
          cache: "no-store",
        });
        const body = await response.json().catch(() => null);

        if (response.status === 404) {
          setNotFound(true);
          setParticipants([]);
          setIsCurrentUserParticipant(false);
          return;
        }

        if (!response.ok) {
          const message =
            response.status === 401
              ? "Please sign in again."
              : normalizeApiError(body?.error ?? "Failed to load participants.");
          throw new Error(message);
        }

        const loadedParticipants = Array.isArray(body?.participants)
          ? (body.participants as ParticipantListItem[])
          : [];

        setParticipants(loadedParticipants);
        setIsCurrentUserParticipant(Boolean(body?.isCurrentUserParticipant));
        setParticipantsErrorMessage(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load participants.";
        setParticipantsErrorMessage(message);
      } finally {
        if (showLoadingState) {
          setIsParticipantsLoading(false);
        }
      }
    },
    [sessionId],
  );

  const refreshQueue = useCallback(
    async (showLoadingState: boolean) => {
      if (showLoadingState) {
        setIsQueueLoading(true);
      }

      try {
        const response = await fetch(`/api/sessions/${sessionId}/queue`, {
          cache: "no-store",
        });
        const body = await response.json().catch(() => null);

        if (response.status === 404) {
          setNotFound(true);
          setQueue([]);
          return;
        }

        if (!response.ok) {
          const message =
            response.status === 401
              ? "Please sign in again."
              : normalizeApiError(body?.error ?? "Failed to load queue.");
          throw new Error(message);
        }

        setQueue(Array.isArray(body?.queue) ? (body.queue as QueueItem[]) : []);
        setQueueErrorMessage(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load queue.";
        setQueueErrorMessage(message);
      } finally {
        if (showLoadingState) {
          setIsQueueLoading(false);
        }
      }
    },
    [sessionId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setIsInitialLoading(true);
      setSessionErrorMessage(null);
      setParticipantsErrorMessage(null);

      try {
        const details = await refreshSession();

        if (!details || cancelled) {
          return;
        }

        await Promise.all([refreshParticipants(true), refreshQueue(true)]);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load session.";
        setSessionErrorMessage(message);
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [refreshParticipants, refreshQueue, refreshSession]);

  const sessionStatus = sessionDetails?.session.status;

  useEffect(() => {
    if (sessionStatus !== "active") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intervalMs = reducedMotion ? 10_000 : 7_000;

    const intervalId = window.setInterval(() => {
      void refreshSession();
      void refreshParticipants(false);
      void refreshQueue(false);
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshParticipants, refreshQueue, refreshSession, sessionStatus]);

  useEffect(() => {
    setPasscodeValue("");
    setPasscodeErrorMessage(null);
    setIsPasscodeVerified(false);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionDetails) {
      return;
    }

    if (sessionDetails.isHost || !sessionDetails.isPasscodeProtected) {
      setIsPasscodeVerified(true);
    }
  }, [sessionDetails]);

  async function handleJoined() {
    setIsCurrentUserParticipant(true);
    await Promise.all([refreshParticipants(true), refreshSession(), refreshQueue(true)]);
  }

  async function handleQueueChanged() {
    await Promise.all([refreshQueue(true), refreshSession()]);
  }

  async function handleEndSession() {
    setIsEndingSession(true);
    setEndSessionErrorMessage(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const message = typeof body?.error === "string" ? body.error : "Failed to end session.";
        throw new Error(message);
      }

      router.replace("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to end session.";
      setEndSessionErrorMessage(message);
    } finally {
      setIsEndingSession(false);
    }
  }

  async function handlePasscodeVerify() {
    if (!passcodeValue.trim()) {
      setPasscodeErrorMessage("Passcode is required.");
      return;
    }

    setIsVerifyingPasscode(true);
    setPasscodeErrorMessage(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/passcode/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passcode: passcodeValue,
        }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const message = typeof body?.error === "string" ? body.error : "Failed to verify passcode.";
        throw new Error(message);
      }

      if (!body?.verified) {
        setPasscodeErrorMessage("Invalid passcode.");
        return;
      }

      setIsPasscodeVerified(true);
      setPasscodeValue("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to verify passcode.";
      setPasscodeErrorMessage(message);
    } finally {
      setIsVerifyingPasscode(false);
    }
  }

  const viewerUserId = sessionDetails?.viewerUserId;
  const viewerQueueItem = viewerUserId ? queue.find((item) => item.userId === viewerUserId) : undefined;
  const canSkipTurn = viewerQueueItem?.status === "reading";
  const isSessionEnded = sessionDetails?.session.status === "ended";
  const showPasscodePrompt = Boolean(
    !isSessionEnded
      && sessionDetails?.isPasscodeProtected
      && !sessionDetails?.isHost
      && !isPasscodeVerified,
  );
  const canUseQueueControls = Boolean(
    sessionDetails
      && !isSessionEnded
      && (!sessionDetails.isPasscodeProtected || sessionDetails.isHost || isPasscodeVerified),
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-5 animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.45] bg-white/[0.62] p-2 shadow-[0_18px_48px_-30px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_48px_-30px_rgba(79,70,229,0.75)]">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/dashboard")}
                className="w-fit"
              >
                <ArrowLeft className="mr-1.5 size-4" />
                Back to Dashboard
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {sessionDetails?.isHost && !isSessionEnded ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isEndingSession}>
                      End session
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>End this session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the session as ended and block further join/queue actions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isEndingSession}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={isEndingSession}
                        onClick={() => {
                          void handleEndSession();
                        }}
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
            <p className="mt-2 text-xs text-red-500">{endSessionErrorMessage}</p>
          ) : null}
        </div>

        {isInitialLoading ? (
          <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
            <CardHeader className="pb-2">
              <CardTitle>Loading session room...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </CardContent>
          </Card>
        ) : null}

        {!isInitialLoading && notFound ? (
          <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
            <CardHeader>
              <CardTitle>Session not found</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard" className="text-sm font-medium underline">
                Back to dashboard
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {!isInitialLoading && !notFound && sessionErrorMessage ? (
          <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
            <CardHeader>
              <CardTitle>Could not load session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-red-500">{sessionErrorMessage}</p>
              <Link href="/dashboard" className="text-sm font-medium underline">
                Back to dashboard
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {!isInitialLoading && !notFound && !sessionErrorMessage && sessionDetails ? (
          <section className="space-y-4 sm:space-y-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.92fr)] xl:items-start">
              <div className="space-y-4">
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <SessionHeaderCard
                    session={sessionDetails.session}
                    hostName={sessionDetails.hostName}
                    hostImage={sessionDetails.hostImage}
                    memberCount={participants.length}
                  />
                </div>

                <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-500 dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="inline-flex items-center gap-2 text-base">
                      <BookOpenText className="size-4 text-indigo-500" />
                      Session Controls
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Join the room and manage your place in the reading queue.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <JoinSessionButton
                      sessionId={sessionId}
                      isParticipant={isCurrentUserParticipant}
                      isSessionEnded={isSessionEnded}
                      onJoined={handleJoined}
                    />

                    {showPasscodePrompt ? (
                      <div className="space-y-3 rounded-xl border border-white/[0.4] bg-white/[0.6] p-3 dark:border-white/[0.14] dark:bg-white/[0.06]">
                        <p className="text-sm font-medium text-foreground">Session Passcode</p>
                        <Input
                          type="password"
                          value={passcodeValue}
                          onChange={(event) => setPasscodeValue(event.target.value)}
                          placeholder="Enter host passcode"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            void handlePasscodeVerify();
                          }}
                          disabled={isVerifyingPasscode}
                        >
                          {isVerifyingPasscode ? "Verifying..." : "Unlock queue controls"}
                        </Button>
                        {passcodeErrorMessage ? (
                          <p className="text-xs text-red-500">{passcodeErrorMessage}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {canUseQueueControls ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <JoinQueueButton
                          sessionId={sessionId}
                          isParticipant={isCurrentUserParticipant}
                          isInQueue={Boolean(viewerQueueItem)}
                          isSessionEnded={sessionDetails.session.status === "ended"}
                          onChanged={handleQueueChanged}
                        />
                        <SkipTurnButton
                          sessionId={sessionId}
                          canSkip={Boolean(canSkipTurn)}
                          onChanged={handleQueueChanged}
                        />
                        <AdvanceQueueButton
                          sessionId={sessionId}
                          isHost={sessionDetails.isHost}
                          onChanged={handleQueueChanged}
                        />
                      </div>
                    ) : null}

                    {isSessionEnded ? (
                      <p className="text-xs text-muted-foreground">
                        Queue controls are disabled for ended sessions.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/72 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10">
                    <UsersRound className="size-3.5 text-indigo-500" />
                    Members panel
                  </div>
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ParticipantsList
                      participants={participants}
                      isLoading={isParticipantsLoading}
                      errorMessage={participantsErrorMessage}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 xl:sticky xl:top-4">
                <QueueStatusBar
                  queue={queue}
                  viewerUserId={sessionDetails.viewerUserId}
                  isPasscodeProtected={sessionDetails.isPasscodeProtected}
                />
                <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                  <QueueList
                    queue={queue}
                    isLoading={isQueueLoading}
                    errorMessage={queueErrorMessage}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
