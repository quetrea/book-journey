"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginButton } from "@/features/auth/ui/LoginButton";
import { ParticlesBackground } from "@/features/dashboard/ui/ParticlesBackground";
import { ParticipantsList } from "@/features/participants/ui/ParticipantsList";
import { buildPremidSessionState } from "@/features/presence/buildPremidSessionState";
import type { PremidSessionState } from "@/features/presence/types";
import { QueueList } from "@/features/queue/ui/QueueList";
import { QueueStatusBar } from "@/features/queue/ui/QueueStatusBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionToasts } from "@/hooks/useSessionToasts";
import { hexToRgba, useThemeGlow } from "@/hooks/useThemeGlow";
import { buildSessionPathFromSessionId } from "@/features/sessions/lib/inviteLinks";
import { SessionControlsCard } from "./SessionControlsCard";
import { SessionHeaderCard } from "./SessionHeaderCard";
import { SessionTopBar } from "./SessionTopBar";
import { WordsList } from "./WordsList";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionRoomPageClientProps = {
  sessionId: string;
};

type SessionPanel = "queue" | "words" | "people";

function PremidStateScript({ state }: { state: PremidSessionState }) {
  const serializedState = JSON.stringify(state).replace(/</g, "\\u003c");

  return (
    <script
      id="bookjourney-premid-state"
      type="application/json"
      dangerouslySetInnerHTML={{ __html: serializedState }}
    />
  );
}

export function SessionRoomPageClient({
  sessionId,
}: SessionRoomPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();

  const joinSession = useMutation(api.sessions.joinSessionServer);
  const verifySessionPasscode = useMutation(
    api.sessions.verifySessionPasscodeServer,
  );
  const requestPrivateJoin = useMutation(
    api.sessions.requestPrivateSessionJoinServer,
  );
  const advanceQueue = useMutation(api.queue.advanceQueueServer);
  const addUserToQueue = useMutation(api.queue.addUserToQueueServer);
  const removeFromQueue = useMutation(api.queue.removeFromQueueServer);
  const reorderQueue = useMutation(api.queue.reorderQueueServer);
  const setParticipantRole = useMutation(api.sessions.setParticipantRoleServer);
  const kickParticipant = useMutation(api.sessions.kickParticipantServer);

  const sessionIdAsConvex = sessionId as Id<"sessions">;

  const queryArgs = isAuthenticated ? { sessionId: sessionIdAsConvex } : "skip";

  const sessionDetails = useQuery(api.sessions.getSessionByIdServer, queryArgs);
  const participants = useQuery(api.sessions.listParticipantsServer, queryArgs);
  const isCurrentUserParticipant = useQuery(
    api.sessions.isParticipantServer,
    queryArgs,
  );
  const queue = useQuery(api.queue.getQueueServer, queryArgs);

  useSessionToasts(participants, queue, sessionDetails?.viewerUserId);

  // Detect if viewer was kicked (was participant, now isn't)
  const wasParticipant = useRef(false);
  const previousJoinRequestStatus = useRef<
    "pending" | "approved" | "rejected" | null
  >(null);
  useEffect(() => {
    if (isCurrentUserParticipant === undefined) return;
    if (wasParticipant.current && !isCurrentUserParticipant) {
      toast.error("You have been removed from this session");
      router.replace("/dashboard");
    }
    wasParticipant.current = isCurrentUserParticipant;
  }, [isCurrentUserParticipant, router]);

  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const [previewUnlocked, setPreviewUnlocked] = useState(false);
  const [entryPasscode, setEntryPasscode] = useState("");
  const [entryErrorMessage, setEntryErrorMessage] = useState<string | null>(
    null,
  );
  const [isEntrySubmitting, setIsEntrySubmitting] = useState(false);
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(true);
  const [activePanel, setActivePanel] = useState<SessionPanel>("queue");

  const [isJoiningAsGuest, setIsJoiningAsGuest] = useState(false);
  const [guestJoinError, setGuestJoinError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { cardShadow, sectionShadow, orb, isDark } = useThemeGlow();
  const shellStyle = {
    boxShadow: sectionShadow,
    backgroundColor: isDark ? hexToRgba(orb, 0.16) : "rgba(255,255,255,0.24)",
  };
  const shellBackdropStyle = {
    background: isDark
      ? `radial-gradient(70% 56% at 50% 0%, ${hexToRgba(orb, 0.34)}, transparent 72%), linear-gradient(145deg, rgba(15,23,42,0.78), ${hexToRgba(orb, 0.18)} 45%, rgba(15,23,42,0.22))`
      : `radial-gradient(70% 52% at 50% 0%, ${hexToRgba(orb, 0.22)}, transparent 72%), linear-gradient(145deg, rgba(255,255,255,0.8), ${hexToRgba(orb, 0.08)} 45%, rgba(255,255,255,0.42))`,
  };

  useEffect(() => {
    setIsPasscodeVerified(false);
    setPreviewUnlocked(false);
    setEntryPasscode("");
    setEntryErrorMessage(null);
    setActivePanel("queue");
    previousJoinRequestStatus.current = null;
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

  useEffect(() => {
    if (!sessionDetails) {
      return;
    }

    if (sessionDetails.accessType !== "private") {
      previousJoinRequestStatus.current =
        sessionDetails.viewerJoinRequestStatus;
      return;
    }

    const previousStatus = previousJoinRequestStatus.current;
    const currentStatus = sessionDetails.viewerJoinRequestStatus;

    if (previousStatus === "pending" && currentStatus === "approved") {
      toast.success("Host approved your request. You can join now.");
    }

    if (previousStatus === "pending" && currentStatus === "rejected") {
      toast.error("Host rejected your request.");
    }

    previousJoinRequestStatus.current = currentStatus;
  }, [sessionDetails]);

  const isDataLoading =
    isAuthenticated &&
    (sessionDetails === undefined ||
      participants === undefined ||
      isCurrentUserParticipant === undefined ||
      queue === undefined);

  const safeParticipants = useMemo(() => participants ?? [], [participants]);
  const safeQueue = useMemo(() => queue ?? [], [queue]);
  const addableParticipants = useMemo(
    () =>
      safeParticipants.filter(
        (participant) =>
          !safeQueue.some(
            (queueItem) => queueItem.userId === participant.userId,
          ),
      ),
    [safeParticipants, safeQueue],
  );
  const safeIsCurrentUserParticipant = Boolean(isCurrentUserParticipant);
  const premidState = useMemo(
    () =>
      buildPremidSessionState({
        routePath: pathname || buildSessionPathFromSessionId(sessionId),
        sessionId,
        isAuthLoading,
        isAuthenticated,
        isDataLoading,
        sessionDetails,
        queue,
        participantsCount: safeParticipants.length,
        isCurrentUserParticipant: safeIsCurrentUserParticipant,
      }),
    [
      isAuthLoading,
      isAuthenticated,
      isDataLoading,
      pathname,
      queue,
      safeIsCurrentUserParticipant,
      safeParticipants.length,
      sessionDetails,
      sessionId,
    ],
  );

  function renderWithPremid(content: ReactNode) {
    return (
      <>
        <PremidStateScript state={premidState} />
        {content}
      </>
    );
  }

  if (isAuthLoading || isDataLoading) {
    return renderWithPremid(
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={shellBackdropStyle}
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <section
            className="rounded-[2rem] border border-black/8 bg-white/18 p-4 backdrop-blur-[28px] dark:border-white/12 dark:bg-black/18 sm:p-5"
            style={shellStyle}
          >
            <Card
              className="border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8"
              style={{ boxShadow: cardShadow }}
            >
              <CardHeader className="pb-2">
                <CardTitle>Loading session room...</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-44 rounded-2xl" />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>,
    );
  }

  if (!isAuthenticated) {
    return renderWithPremid(
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={shellBackdropStyle}
        />
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <section
            className="rounded-[2rem] border border-black/8 bg-white/18 p-4 backdrop-blur-[28px] dark:border-white/12 dark:bg-black/18 sm:p-5"
            style={shellStyle}
          >
            <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-5">
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Enter session
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
                  Sign in or continue as guest to open the room.
                </p>
              </div>

              <div className="w-full rounded-2xl border border-black/8 bg-white/62 p-6 text-center backdrop-blur-xl dark:border-white/12 dark:bg-white/8">
                <p className="mb-1 text-sm font-medium text-foreground">
                  Sign in with Discord
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Use a persistent Discord profile and identity.
                </p>
                <LoginButton />
              </div>

              <div className="flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-black/8 dark:bg-white/12" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-black/8 dark:bg-white/12" />
              </div>

              <div className="w-full rounded-2xl border border-black/8 bg-white/62 p-6 backdrop-blur-xl dark:border-white/12 dark:bg-white/8">
                <p className="mb-1 text-sm font-medium text-foreground">
                  Join as Guest
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  A temporary name and avatar will be created for this session.
                </p>
                <div className="space-y-3">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => void handleGuestJoin()}
                    disabled={isJoiningAsGuest}
                  >
                    {isJoiningAsGuest ? "Generating guest..." : "Continue"}
                  </Button>
                  {guestJoinError ? (
                    <p className="text-xs text-red-500">{guestJoinError}</p>
                  ) : null}
                </div>
              </div>

              <Button
                asChild
                variant="ghost"
                className="w-fit px-0 text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
              >
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>,
    );
  }

  if (sessionDetails === null) {
    return renderWithPremid(
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={shellBackdropStyle}
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <section
            className="rounded-[2rem] border border-black/8 bg-white/18 p-4 backdrop-blur-[28px] dark:border-white/12 dark:bg-black/18 sm:p-5"
            style={shellStyle}
          >
            <Card
              className="border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8"
              style={{ boxShadow: cardShadow }}
            >
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
          </section>
        </div>
      </main>,
    );
  }

  if (!sessionDetails) {
    return renderWithPremid(null);
  }

  // Guests have no reason to view ended sessions
  if (
    sessionDetails.viewerIsGuest &&
    sessionDetails.session.status === "ended"
  ) {
    return renderWithPremid(
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={shellBackdropStyle}
        />
        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <section
            className="rounded-[2rem] border border-black/8 bg-white/18 p-4 backdrop-blur-[28px] dark:border-white/12 dark:bg-black/18 sm:p-5"
            style={shellStyle}
          >
            <div className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                This session has ended.
              </p>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>,
    );
  }

  const details = sessionDetails;

  async function handleGuestJoin() {
    setIsJoiningAsGuest(true);
    setGuestJoinError(null);
    try {
      await signIn("anonymous");
    } catch (error) {
      setGuestJoinError(
        error instanceof Error ? error.message : "Failed to sign in as guest.",
      );
    } finally {
      setIsJoiningAsGuest(false);
    }
  }

  async function handleAdvanceQueue() {
    await advanceQueue({ sessionId: sessionIdAsConvex });
  }

  async function handleJoinFromEntryLayer() {
    setIsEntrySubmitting(true);
    setEntryErrorMessage(null);
    try {
      await joinSession({ sessionId: sessionIdAsConvex });
    } catch (error) {
      setEntryErrorMessage(
        error instanceof Error ? error.message : "Failed to join session.",
      );
    } finally {
      setIsEntrySubmitting(false);
    }
  }

  async function handleJoinWithPasscodeFromEntryLayer() {
    const passcode = entryPasscode.trim();
    if (!passcode) {
      setEntryErrorMessage("Passcode is required.");
      return;
    }

    setIsEntrySubmitting(true);
    setEntryErrorMessage(null);
    try {
      const result = await verifySessionPasscode({
        sessionId: sessionIdAsConvex,
        passcode,
      });
      if (!result.verified) {
        setEntryErrorMessage("Invalid passcode.");
        return;
      }
      await joinSession({ sessionId: sessionIdAsConvex });
    } catch (error) {
      setEntryErrorMessage(
        error instanceof Error ? error.message : "Failed to verify passcode.",
      );
    } finally {
      setIsEntrySubmitting(false);
    }
  }

  async function handleRequestPrivateAccessFromEntryLayer() {
    setIsEntrySubmitting(true);
    setEntryErrorMessage(null);
    try {
      await requestPrivateJoin({ sessionId: sessionIdAsConvex });
      toast.success("Access request sent to host.");
    } catch (error) {
      setEntryErrorMessage(
        error instanceof Error ? error.message : "Failed to send join request.",
      );
    } finally {
      setIsEntrySubmitting(false);
    }
  }

  const isSessionEnded = details.session.status === "ended";
  const currentReader = safeQueue.find((item) => item.status === "reading");
  const isHostOrMod = details.isHost || details.isModerator;
  const isPublicSession = details.accessType === "public";
  const isPasscodeSession = details.accessType === "passcode";
  const isPrivateSession = details.accessType === "private";
  const shouldShowEntryLayer =
    !isSessionEnded && !safeIsCurrentUserParticipant && !previewUnlocked;
  const showPasscodePrompt = Boolean(
    !isSessionEnded &&
      details.isPasscodeProtected &&
      !isHostOrMod &&
      !isPasscodeVerified,
  );
  const canUseQueueControls = Boolean(
    !isSessionEnded &&
      (!details.isPasscodeProtected || isHostOrMod || isPasscodeVerified),
  );
  const accessLabel = isPublicSession
    ? "Public"
    : isPasscodeSession
      ? "Passcode"
      : "Private";
  const sessionTitle = details.session.title ?? details.session.bookTitle;
  const hostLabel = details.hostName ?? "Unknown host";
  const activeQueueCount = safeQueue.filter(
    (item) => item.status !== "done",
  ).length;
  const baseTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.56, ease: [0.22, 1, 0.36, 1] as const };
  const containerVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 1 },
        show: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 18 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            ...baseTransition,
            staggerChildren: 0.08,
            delayChildren: 0.04,
          },
        },
      };
  const itemVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 1 },
        show: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 16, scale: 0.985 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: baseTransition,
        },
      };
  const panelVariants = prefersReducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        initial: { opacity: 0, y: 18, filter: "blur(10px)" },
        animate: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { ...baseTransition, duration: 0.42 },
        },
        exit: {
          opacity: 0,
          y: -12,
          filter: "blur(8px)",
          transition: { duration: 0.22, ease: "easeOut" as const },
        },
      };
  const glowVariants = prefersReducedMotion
    ? {
        initial: { opacity: 0.18, scale: 1 },
        animate: { opacity: 0.18, scale: 1 },
      }
    : {
        initial: { opacity: 0.12, scale: 0.96 },
        animate: {
          opacity: [0.14, 0.24, 0.16],
          scale: [0.98, 1.04, 1],
          transition: {
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut" as const,
          },
        },
      };

  if (shouldShowEntryLayer) {
    return renderWithPremid(
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={shellBackdropStyle}
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <section
            className="rounded-[2rem] border border-black/8 bg-white/18 p-4 backdrop-blur-[28px] dark:border-white/12 dark:bg-black/18 sm:p-5"
            style={shellStyle}
          >
            <motion.div
              className="mx-auto grid min-h-[70vh] items-center gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div className="space-y-4" variants={itemVariants}>
                <motion.div
                  className="flex flex-wrap items-center gap-2"
                  variants={itemVariants}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/62 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground dark:border-white/12 dark:bg-white/8">
                    <ShieldCheck className="size-3.5 text-indigo-500" />
                    {accessLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/62 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground dark:border-white/12 dark:bg-white/8">
                    <UsersRound className="size-3.5 text-indigo-500" />
                    {safeParticipants.length} member
                    {safeParticipants.length === 1 ? "" : "s"}
                  </span>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    {sessionTitle}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-white/50">
                    {isPublicSession
                      ? "Public session: you can preview or join immediately."
                      : isPasscodeSession
                        ? "This room uses a passcode before entry."
                        : "Private session: join requests wait for host approval."}
                  </p>
                </motion.div>

                <motion.div
                  className="grid gap-3 sm:grid-cols-3"
                  variants={itemVariants}
                >
                  <motion.div
                    className="rounded-2xl border border-black/8 bg-white/62 px-4 py-3 dark:border-white/12 dark:bg-white/8"
                    variants={itemVariants}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                      Host
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {hostLabel}
                    </p>
                  </motion.div>
                  <motion.div
                    className="rounded-2xl border border-black/8 bg-white/62 px-4 py-3 dark:border-white/12 dark:bg-white/8"
                    variants={itemVariants}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                      Queue
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {activeQueueCount} active
                    </p>
                  </motion.div>
                  <motion.div
                    className="rounded-2xl border border-black/8 bg-white/62 px-4 py-3 dark:border-white/12 dark:bg-white/8"
                    variants={itemVariants}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                      Status
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {currentReader
                        ? `${currentReader.name} reading`
                        : "Ready to start"}
                    </p>
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div className="relative" variants={itemVariants}>
                <motion.div
                  className="pointer-events-none absolute inset-x-[10%] top-6 -z-10 h-40 rounded-full blur-3xl"
                  style={{
                    background: `radial-gradient(circle, ${hexToRgba(orb, isDark ? 0.22 : 0.18)} 0%, transparent 72%)`,
                  }}
                  variants={glowVariants}
                  initial="initial"
                  animate="animate"
                />
                <Card
                  className="w-full border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8"
                  style={{ boxShadow: cardShadow }}
                >
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">Enter room</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {isPublicSession
                        ? "Choose whether to join now or preview first."
                        : isPasscodeSession
                          ? "Verify the session passcode to continue."
                          : "Request access or enter once the host approves you."}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isPublicSession ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          onClick={() => {
                            void handleJoinFromEntryLayer();
                          }}
                          disabled={isEntrySubmitting}
                          className="w-full sm:w-auto"
                        >
                          {isEntrySubmitting ? "Joining..." : "Join session"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setPreviewUnlocked(true);
                          }}
                          disabled={isEntrySubmitting}
                          className="w-full sm:w-auto"
                        >
                          Preview session
                        </Button>
                      </div>
                    ) : null}

                    {isPasscodeSession ? (
                      <div className="space-y-3">
                        <Input
                          value={entryPasscode}
                          onChange={(event) =>
                            setEntryPasscode(event.target.value)
                          }
                          placeholder="Enter session passcode"
                          type="password"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              void handleJoinWithPasscodeFromEntryLayer();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            void handleJoinWithPasscodeFromEntryLayer();
                          }}
                          disabled={isEntrySubmitting}
                          className="w-full sm:w-auto"
                        >
                          {isEntrySubmitting
                            ? "Checking..."
                            : "Verify and join"}
                        </Button>
                      </div>
                    ) : null}

                    {isPrivateSession ? (
                      <div className="space-y-3">
                        {details.viewerJoinRequestStatus === "approved" ? (
                          <Button
                            type="button"
                            onClick={() => {
                              void handleJoinFromEntryLayer();
                            }}
                            disabled={isEntrySubmitting}
                            className="w-full sm:w-auto"
                          >
                            {isEntrySubmitting ? "Joining..." : "Join session"}
                          </Button>
                        ) : details.viewerJoinRequestStatus === "pending" ? (
                          <p className="text-sm text-muted-foreground">
                            Your request is pending host approval.
                          </p>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => {
                              void handleRequestPrivateAccessFromEntryLayer();
                            }}
                            disabled={isEntrySubmitting}
                            className="w-full sm:w-auto"
                          >
                            {isEntrySubmitting
                              ? "Sending..."
                              : "Request access"}
                          </Button>
                        )}
                      </div>
                    ) : null}

                    {entryErrorMessage ? (
                      <p className="text-xs text-red-500">
                        {entryErrorMessage}
                      </p>
                    ) : null}
                    {isPrivateSession &&
                    details.viewerJoinRequestStatus === "rejected" ? (
                      <p className="text-xs text-muted-foreground">
                        Host rejected your previous request. You can send a new
                        one.
                      </p>
                    ) : null}
                    <Button asChild variant="ghost">
                      <Link href="/dashboard">Back to dashboard</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </section>
        </div>
      </main>,
    );
  }

  return renderWithPremid(
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div
        className="pointer-events-none absolute inset-0 -z-20"
        style={shellBackdropStyle}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72"
        style={{
          background: `radial-gradient(circle at top, ${hexToRgba(orb, isDark ? 0.24 : 0.16)} 0%, transparent 68%)`,
        }}
        variants={glowVariants}
        initial="initial"
        animate="animate"
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <section
          className="rounded-[2rem] border border-black/8 bg-white/18 p-3 backdrop-blur-[28px] dark:border-white/12 dark:bg-black/18 sm:p-4"
          style={shellStyle}
        >
          <motion.div
            className="space-y-2.5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <SessionTopBar
                sessionId={sessionIdAsConvex}
                isHost={details.isHost}
                isParticipant={safeIsCurrentUserParticipant}
                sessionAccessType={details.accessType}
                isSessionEnded={isSessionEnded}
                createdAt={details.session.createdAt}
                endedAt={details.session.endedAt}
                cardShadow={cardShadow}
              />
            </motion.div>

            <div className="grid gap-3 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] xl:items-start">
              <motion.div
                className="order-2 space-y-3 xl:order-1"
                variants={itemVariants}
              >
                <motion.div
                  variants={itemVariants}
                  initial={
                    prefersReducedMotion
                      ? false
                      : { opacity: 0, scale: 0.98, y: 20 }
                  }
                  animate={
                    prefersReducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }
                  }
                  transition={baseTransition}
                >
                  <SessionHeaderCard
                    session={details.session}
                    hostName={details.hostName}
                    hostImage={details.hostImage}
                    memberCount={safeParticipants.length}
                    bookCoverUrl={details.session.bookCoverUrl}
                    isHost={details.isHost}
                    isModerator={details.isModerator}
                    sessionId={sessionIdAsConvex}
                    isSessionEnded={isSessionEnded}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <SessionControlsCard
                    sessionId={sessionIdAsConvex}
                    isHost={details.isHost}
                    isModerator={details.isModerator}
                    isRepeatEnabled={Boolean(details.session.isRepeatEnabled)}
                    viewerUserId={details.viewerUserId}
                    safeIsCurrentUserParticipant={safeIsCurrentUserParticipant}
                    safeQueue={safeQueue}
                    safeParticipants={safeParticipants}
                    canUseQueueControls={canUseQueueControls}
                    isSessionEnded={isSessionEnded}
                    showPasscodePrompt={showPasscodePrompt}
                    onPasscodeVerified={() => setIsPasscodeVerified(true)}
                    cardShadow={cardShadow}
                  />
                </motion.div>
              </motion.div>

              <motion.div
                className="order-1 space-y-3 xl:order-2 xl:sticky xl:top-4"
                variants={itemVariants}
              >
                <div className="rounded-[1.35rem] border border-black/8 bg-white/34 p-2 backdrop-blur-xl dark:border-white/12 dark:bg-white/6">
                  <Tabs
                    value={activePanel}
                    onValueChange={(value) =>
                      setActivePanel(value as SessionPanel)
                    }
                  >
                    <TabsList className="mb-2.5 w-full rounded-xl border border-black/8 bg-white/52 p-1 dark:border-white/12 dark:bg-white/10">
                      <TabsTrigger value="queue" className="flex-1">
                        Queue
                      </TabsTrigger>
                      <TabsTrigger value="words" className="flex-1">
                        Words
                      </TabsTrigger>
                      <TabsTrigger value="people" className="flex-1">
                        People
                      </TabsTrigger>
                    </TabsList>
                    <AnimatePresence mode="wait" initial={false}>
                      {activePanel === "queue" ? (
                        <TabsContent forceMount asChild value="queue">
                          <motion.div
                            key="queue-panel"
                            className="mt-0 space-y-3"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <QueueStatusBar
                              queue={safeQueue}
                              viewerUserId={details.viewerUserId}
                              isPasscodeProtected={details.isPasscodeProtected}
                              canManageQueue={
                                isHostOrMod && canUseQueueControls
                              }
                              onAdvance={handleAdvanceQueue}
                            />
                            <QueueList
                              queue={safeQueue}
                              isLoading={false}
                              errorMessage={null}
                              hideCompleted
                              canManageQueue={isHostOrMod}
                              canReorder={isHostOrMod && !isSessionEnded}
                              addableParticipants={addableParticipants}
                              onRemove={(userId) => {
                                void removeFromQueue({
                                  sessionId: sessionIdAsConvex,
                                  targetUserId: userId as Id<"profiles">,
                                });
                              }}
                              onReorder={(orderedUserIds) => {
                                void reorderQueue({
                                  sessionId: sessionIdAsConvex,
                                  orderedUserIds: orderedUserIds.map(
                                    (id) => id as Id<"profiles">,
                                  ),
                                });
                              }}
                              onAddParticipant={async (userId) => {
                                await addUserToQueue({
                                  sessionId: sessionIdAsConvex,
                                  targetUserId: userId as Id<"profiles">,
                                });
                              }}
                            />
                          </motion.div>
                        </TabsContent>
                      ) : null}
                      {activePanel === "words" ? (
                        <TabsContent forceMount asChild value="words">
                          <motion.div
                            key="words-panel"
                            className="mt-0"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <WordsList
                              sessionId={sessionIdAsConvex}
                              isParticipant={safeIsCurrentUserParticipant}
                              isSessionEnded={isSessionEnded}
                              viewerUserId={details.viewerUserId}
                              isHost={details.isHost}
                              bookTitle={details.session.bookTitle}
                            />
                          </motion.div>
                        </TabsContent>
                      ) : null}
                      {activePanel === "people" ? (
                        <TabsContent forceMount asChild value="people">
                          <motion.div
                            key="people-panel"
                            className="mt-0"
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <ParticipantsList
                              participants={safeParticipants}
                              isLoading={false}
                              errorMessage={null}
                              isExpanded={isParticipantsExpanded}
                              onExpandedChange={setIsParticipantsExpanded}
                              isHost={details.isHost}
                              isModerator={details.isModerator}
                              viewerUserId={details.viewerUserId}
                              isSessionEnded={isSessionEnded}
                              onSetRole={(targetUserId, newRole) => {
                                void setParticipantRole({
                                  sessionId: sessionIdAsConvex,
                                  targetUserId: targetUserId as Id<"profiles">,
                                  newRole,
                                });
                              }}
                              onKick={(targetUserId) => {
                                void kickParticipant({
                                  sessionId: sessionIdAsConvex,
                                  targetUserId: targetUserId as Id<"profiles">,
                                });
                              }}
                            />
                          </motion.div>
                        </TabsContent>
                      ) : null}
                    </AnimatePresence>
                  </Tabs>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>,
  );
}
