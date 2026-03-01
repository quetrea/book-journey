"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { LoginButton } from "@/features/auth/ui/LoginButton";
import { ParticlesBackground } from "@/features/dashboard/ui/ParticlesBackground";
import { JoinSessionButton } from "@/features/participants/ui/JoinSessionButton";
import { ParticipantsList } from "@/features/participants/ui/ParticipantsList";
import { AdvanceQueueButton } from "@/features/queue/ui/AdvanceQueueButton";
import { JoinQueueButton } from "@/features/queue/ui/JoinQueueButton";
import { QueueList } from "@/features/queue/ui/QueueList";
import { QueueStatusBar } from "@/features/queue/ui/QueueStatusBar";
import { SkipTurnButton } from "@/features/queue/ui/SkipTurnButton";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { SessionHeaderCard } from "./SessionHeaderCard";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionRoomPageClientProps = {
  sessionId: string;
};

export function SessionRoomPageClient({
  sessionId,
}: SessionRoomPageClientProps) {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  const joinSession = useMutation(api.sessions.joinSessionServer);
  const endSession = useMutation(api.sessions.endSessionServer);
  const leaveSession = useMutation(api.sessions.leaveSessionServer);
  const verifySessionPasscode = useMutation(
    api.sessions.verifySessionPasscodeServer
  );
  const joinQueue = useMutation(api.queue.joinQueueServer);
  const leaveQueue = useMutation(api.queue.leaveQueueServer);
  const skipMyTurn = useMutation(api.queue.skipMyTurnServer);
  const advanceQueue = useMutation(api.queue.advanceQueueServer);
  const addUserToQueue = useMutation(api.queue.addUserToQueueServer);

  const sessionIdAsConvex = sessionId as Id<"sessions">;

  const queryArgs = isAuthenticated ? { sessionId: sessionIdAsConvex } : "skip";

  const sessionDetails = useQuery(api.sessions.getSessionByIdServer, queryArgs);
  const participants = useQuery(api.sessions.listParticipantsServer, queryArgs);
  const isCurrentUserParticipant = useQuery(
    api.sessions.isParticipantServer,
    queryArgs
  );
  const queue = useQuery(api.queue.getQueueServer, queryArgs);

  const [passcodeValue, setPasscodeValue] = useState("");
  const [passcodeErrorMessage, setPasscodeErrorMessage] = useState<
    string | null
  >(null);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [endSessionErrorMessage, setEndSessionErrorMessage] = useState<
    string | null
  >(null);
  const [selectedParticipantUserId, setSelectedParticipantUserId] =
    useState("");
  const [isAddingParticipantToQueue, setIsAddingParticipantToQueue] =
    useState(false);
  const [addParticipantToQueueError, setAddParticipantToQueueError] = useState<
    string | null
  >(null);
  const [isLeavingSession, setIsLeavingSession] = useState(false);
  const [leaveSessionErrorMessage, setLeaveSessionErrorMessage] = useState<
    string | null
  >(null);

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications();

  useEffect(() => {
    setPasscodeValue("");
    setPasscodeErrorMessage(null);
    setIsPasscodeVerified(false);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionDetails) {
      return;
    }

    if (
      sessionDetails.isHost ||
      !sessionDetails.isPasscodeProtected ||
      sessionDetails.hasPasscodeAccess
    ) {
      setIsPasscodeVerified(true);
      return;
    }

    setIsPasscodeVerified(false);
  }, [sessionDetails]);

  const isDataLoading =
    isAuthenticated &&
    (sessionDetails === undefined ||
      participants === undefined ||
      isCurrentUserParticipant === undefined ||
      queue === undefined);

  const safeParticipants = useMemo(() => participants ?? [], [participants]);
  const safeQueue = useMemo(() => queue ?? [], [queue]);
  const safeIsCurrentUserParticipant = Boolean(isCurrentUserParticipant);
  const addableParticipants = useMemo(
    () =>
      safeParticipants.filter(
        (participant) =>
          !safeQueue.some(
            (queueItem) => queueItem.userId === participant.userId
          )
      ),
    [safeParticipants, safeQueue]
  );

  useEffect(() => {
    if (
      selectedParticipantUserId &&
      addableParticipants.some(
        (participant) => participant.userId === selectedParticipantUserId
      )
    ) {
      return;
    }

    setSelectedParticipantUserId(addableParticipants[0]?.userId ?? "");
  }, [addableParticipants, selectedParticipantUserId]);

  if (isAuthLoading || isDataLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]" />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <Card className="border-white/45 bg-white/68 shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/15 dark:bg-white/8 dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
            <CardHeader className="pb-2">
              <CardTitle>Loading session room...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-10">
        <ParticlesBackground />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.45),transparent_70%),linear-gradient(145deg,rgba(30,41,59,0.65),rgba(56,72,148,0.42)_45%,rgba(111,76,155,0.3))]" />
        <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-center justify-center gap-3 rounded-3xl border border-white/[0.15] bg-[#0d1222]/[0.58] p-6 text-center shadow-[0_35px_110px_-35px_rgba(37,99,235,0.45)] backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">
            You are not signed in.
          </p>
          <LoginButton />
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (sessionDetails === null) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]" />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <Card className="border-white/45 bg-white/68 shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/15 dark:bg-white/8 dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
            <CardHeader>
              <CardTitle>Session not found</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  router.push("/dashboard");
                }}
              >
                Back to dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!sessionDetails) {
    return null;
  }

  const details = sessionDetails;

  async function handleJoin() {
    await joinSession({ sessionId: sessionIdAsConvex });
  }

  async function handleJoinQueue() {
    await joinQueue({ sessionId: sessionIdAsConvex });
  }

  async function handleLeaveQueue() {
    await leaveQueue({ sessionId: sessionIdAsConvex });
  }

  async function handleSkipTurn() {
    await skipMyTurn({ sessionId: sessionIdAsConvex });
  }

  async function handleAdvanceQueue() {
    await advanceQueue({ sessionId: sessionIdAsConvex });
  }

  async function handleEndSession() {
    setIsEndingSession(true);
    setEndSessionErrorMessage(null);

    try {
      await endSession({ sessionId: sessionIdAsConvex });
      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to end session.";
      setEndSessionErrorMessage(message);
    } finally {
      setIsEndingSession(false);
    }
  }

  async function handleLeaveSession() {
    setIsLeavingSession(true);
    setLeaveSessionErrorMessage(null);

    try {
      await leaveSession({ sessionId: sessionIdAsConvex });
      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to leave session.";
      setLeaveSessionErrorMessage(message);
    } finally {
      setIsLeavingSession(false);
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
      const result = await verifySessionPasscode({
        sessionId: sessionIdAsConvex,
        passcode: passcodeValue,
      });

      if (!result.verified) {
        setPasscodeErrorMessage("Invalid passcode.");
        return;
      }

      setIsPasscodeVerified(true);
      setPasscodeValue("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to verify passcode.";
      setPasscodeErrorMessage(message);
    } finally {
      setIsVerifyingPasscode(false);
    }
  }

  const viewerUserId = details.viewerUserId;
  const viewerQueueItem = viewerUserId
    ? safeQueue.find((item) => item.userId === viewerUserId)
    : undefined;
  const canSkipTurn = viewerQueueItem?.status === "reading";
  const isSessionEnded = details.session.status === "ended";
  const showPasscodePrompt = Boolean(
    !isSessionEnded &&
    details.isPasscodeProtected &&
    !details.isHost &&
    !isPasscodeVerified
  );
  const canUseQueueControls = Boolean(
    !isSessionEnded &&
    (!details.isPasscodeProtected || details.isHost || isPasscodeVerified)
  );

  async function handleAddParticipantToQueue() {
    if (!selectedParticipantUserId) {
      setAddParticipantToQueueError("Select a participant first.");
      return;
    }

    setIsAddingParticipantToQueue(true);
    setAddParticipantToQueueError(null);

    try {
      await addUserToQueue({
        sessionId: sessionIdAsConvex,
        targetUserId: selectedParticipantUserId as Id<"profiles">,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add participant to queue.";
      setAddParticipantToQueueError(message);
    } finally {
      setIsAddingParticipantToQueue(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-5 animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/45 bg-white/62 p-2 shadow-[0_18px_48px_-30px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/15 dark:bg-white/8 dark:shadow-[0_18px_48px_-30px_rgba(79,70,229,0.75)]">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  router.push("/dashboard");
                }}
                className="w-fit"
              >
                <ArrowLeft className="mr-1.5 size-4" />
                Back to Dashboard
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {details.isHost && !isSessionEnded ? (
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
            <p className="mt-2 text-xs text-red-500">
              {endSessionErrorMessage}
            </p>
          ) : null}
        </div>

        <section className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.92fr)] xl:items-start">
            <div className="space-y-4">
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <SessionHeaderCard
                  session={details.session}
                  hostName={details.hostName}
                  hostImage={details.hostImage}
                  memberCount={safeParticipants.length}
                />
              </div>

              <Card className="border-white/45 bg-white/68 shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-500 dark:border-white/15 dark:bg-white/8 dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
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
                    isParticipant={safeIsCurrentUserParticipant}
                    isSessionEnded={isSessionEnded}
                    onJoin={handleJoin}
                  />

                  {showPasscodePrompt ? (
                    <div className="space-y-3 rounded-xl border border-white/40 bg-white/60 p-3 dark:border-white/[0.14] dark:bg-white/6">
                      <p className="text-sm font-medium text-foreground">
                        Session Passcode
                      </p>
                      <Input
                        type="password"
                        value={passcodeValue}
                        onChange={(event) =>
                          setPasscodeValue(event.target.value)
                        }
                        placeholder="Enter host passcode"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          void handlePasscodeVerify();
                        }}
                        disabled={isVerifyingPasscode}
                      >
                        {isVerifyingPasscode
                          ? "Verifying..."
                          : "Unlock queue controls"}
                      </Button>
                      {passcodeErrorMessage ? (
                        <p className="text-xs text-red-500">
                          {passcodeErrorMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {canUseQueueControls ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <JoinQueueButton
                        isParticipant={safeIsCurrentUserParticipant}
                        isInQueue={Boolean(viewerQueueItem)}
                        isSessionEnded={details.session.status === "ended"}
                        onJoin={handleJoinQueue}
                        onLeave={handleLeaveQueue}
                      />
                      <SkipTurnButton
                        canSkip={Boolean(canSkipTurn)}
                        onSkip={handleSkipTurn}
                      />
                      <AdvanceQueueButton
                        isHost={details.isHost}
                        onAdvance={handleAdvanceQueue}
                      />
                    </div>
                  ) : null}

                  {details.isHost && canUseQueueControls ? (
                    <div className="space-y-2 rounded-xl border border-white/40 bg-white/60 p-3 dark:border-white/[0.14] dark:bg-white/6">
                      <p className="text-xs font-medium text-foreground">
                        Host: add participant to queue
                      </p>
                      {addableParticipants.length > 0 ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={selectedParticipantUserId}
                            onChange={(event) =>
                              setSelectedParticipantUserId(event.target.value)
                            }
                            className="h-9 flex-1 rounded-md border border-white/45 bg-white/75 px-2 text-sm dark:border-white/14 dark:bg-white/10"
                          >
                            {addableParticipants.map((participant) => (
                              <option
                                key={participant.userId}
                                value={participant.userId}
                              >
                                {participant.name}
                                {participant.role === "host" ? " (Host)" : ""}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            onClick={() => {
                              void handleAddParticipantToQueue();
                            }}
                            disabled={isAddingParticipantToQueue}
                            className="w-full sm:w-auto"
                          >
                            {isAddingParticipantToQueue
                              ? "Adding..."
                              : "Add to queue"}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Every participant is already in queue.
                        </p>
                      )}
                      {addParticipantToQueueError ? (
                        <p className="text-xs text-red-500">
                          {addParticipantToQueueError}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {isPushSupported && safeIsCurrentUserParticipant && !isSessionEnded ? (
                    <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 px-3 py-2 dark:border-white/[0.14] dark:bg-white/6">
                      <span className="flex-1 text-xs text-muted-foreground">
                        {pushPermission === "denied"
                          ? "Notifications blocked in browser settings"
                          : isPushSubscribed
                            ? "Turn notifications are on"
                            : "Get notified when it's your turn"}
                      </span>
                      {pushPermission !== "denied" && (
                        <Button
                          type="button"
                          variant={isPushSubscribed ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            void (isPushSubscribed ? unsubscribeFromPush() : subscribeToPush());
                          }}
                          disabled={isPushLoading}
                          className="shrink-0 text-xs"
                        >
                          {isPushLoading
                            ? "..."
                            : isPushSubscribed
                              ? "Disable"
                              : "Enable notifications"}
                        </Button>
                      )}
                    </div>
                  ) : null}

                  {!details.isHost && safeIsCurrentUserParticipant ? (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          void handleLeaveSession();
                        }}
                        disabled={isLeavingSession}
                        className="w-full sm:w-auto"
                      >
                        {isLeavingSession ? "Leaving..." : "Leave session"}
                      </Button>
                      {leaveSessionErrorMessage ? (
                        <p className="text-xs text-red-500">
                          {leaveSessionErrorMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {isSessionEnded ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Queue controls are disabled for ended sessions.
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Auto-deletes in 7 days.
                      </p>
                    </div>
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
                    participants={safeParticipants}
                    isLoading={false}
                    errorMessage={null}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 xl:sticky xl:top-4">
              <QueueStatusBar
                queue={safeQueue}
                viewerUserId={details.viewerUserId}
                isPasscodeProtected={details.isPasscodeProtected}
              />
              <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                <QueueList
                  queue={safeQueue}
                  isLoading={false}
                  errorMessage={null}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
