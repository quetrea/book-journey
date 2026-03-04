"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { UsersRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginButton } from "@/features/auth/ui/LoginButton";
import { ParticlesBackground } from "@/features/dashboard/ui/ParticlesBackground";
import { ParticipantsList } from "@/features/participants/ui/ParticipantsList";
import { QueueList } from "@/features/queue/ui/QueueList";
import { QueueStatusBar } from "@/features/queue/ui/QueueStatusBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionToasts } from "@/hooks/useSessionToasts";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { SessionControlsCard } from "./SessionControlsCard";
import { SessionHeaderCard } from "./SessionHeaderCard";
import { SessionTopBar } from "./SessionTopBar";
import { WordsList } from "./WordsList";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const BG_GRADIENT =
  "fixed inset-0 -z-20 bg-[radial-gradient(70%_48%_at_50%_0%,rgba(88,101,242,0.34),transparent_72%),linear-gradient(145deg,rgba(165,180,252,0.24),rgba(147,197,253,0.16)_45%,rgba(244,114,182,0.12))] dark:bg-[radial-gradient(70%_50%_at_50%_0%,rgba(88,101,242,0.5),transparent_72%),linear-gradient(145deg,rgba(15,23,42,0.75),rgba(49,46,129,0.48)_45%,rgba(76,29,149,0.36))]";

type SessionRoomPageClientProps = {
  sessionId: string;
};

export function SessionRoomPageClient({
  sessionId,
}: SessionRoomPageClientProps) {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();

  const joinSession = useMutation(api.sessions.joinSessionServer);
  const advanceQueue = useMutation(api.queue.advanceQueueServer);
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
    queryArgs
  );
  const queue = useQuery(api.queue.getQueueServer, queryArgs);

  useSessionToasts(participants, queue, sessionDetails?.viewerUserId);

  // Detect if viewer was kicked (was participant, now isn't)
  const wasParticipant = useRef(false);
  useEffect(() => {
    if (isCurrentUserParticipant === undefined) return;
    if (wasParticipant.current && !isCurrentUserParticipant) {
      toast.error("You have been removed from this session");
      router.replace("/dashboard");
    }
    wasParticipant.current = isCurrentUserParticipant;
  }, [isCurrentUserParticipant, router]);

  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [isJoiningAsGuest, setIsJoiningAsGuest] = useState(false);
  const [guestJoinError, setGuestJoinError] = useState<string | null>(null);

  const { cardShadow } = useThemeGlow();

  useEffect(() => {
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

  if (isAuthLoading || isDataLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div className={BG_GRADIENT} />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <Card className="border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8" style={{ boxShadow: cardShadow }}>
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
        <div className="mx-auto flex min-h-[80vh] w-full max-w-sm flex-col items-center justify-center gap-6">
          {/* Discord sign-in */}
          <div className="w-full rounded-2xl border border-white/15 bg-[#0d1222]/70 p-6 text-center backdrop-blur-xl">
            <p className="mb-1 text-sm font-medium text-white/80">Sign in with Discord</p>
            <p className="mb-4 text-xs text-white/40">Full access — create and host sessions</p>
            <LoginButton />
          </div>

          {/* Divider */}
          <div className="flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-white/12" />
            <span className="text-xs text-white/30">or</span>
            <div className="h-px flex-1 bg-white/12" />
          </div>

          {/* Guest join */}
          <div className="w-full rounded-2xl border border-white/15 bg-[#0d1222]/70 p-6 backdrop-blur-xl">
            <p className="mb-1 text-sm font-medium text-white/80">Join as Guest</p>
            <p className="mb-4 text-xs text-white/40">Enter just your name — no account needed</p>
            <div className="space-y-3">
              <Input
                placeholder="Your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleGuestJoin();
                }}
                maxLength={32}
                className="border-white/15 bg-white/8 text-white placeholder:text-white/30"
              />
              <Button
                type="button"
                className="w-full"
                onClick={() => void handleGuestJoin()}
                disabled={isJoiningAsGuest || guestName.trim().length < 2}
              >
                {isJoiningAsGuest ? "Joining..." : "Join session"}
              </Button>
              {guestJoinError && (
                <p className="text-xs text-red-400">{guestJoinError}</p>
              )}
            </div>
          </div>

          <Button asChild variant="ghost" className="text-white/40 hover:text-white/60">
            <Link href="/">← Back to home</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (sessionDetails === null) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div className={BG_GRADIENT} />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <Card className="border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8" style={{ boxShadow: cardShadow }}>
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

  // Guests have no reason to view ended sessions
  if (sessionDetails.viewerIsGuest && sessionDetails.session.status === "ended") {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <ParticlesBackground />
        <div className={BG_GRADIENT} />
        <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-4 px-4">
          <p className="text-sm text-muted-foreground">This session has ended.</p>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </main>
    );
  }

  const details = sessionDetails;

  async function handleGuestJoin() {
    const name = guestName.trim();
    if (name.length < 2) {
      setGuestJoinError("Name must be at least 2 characters.");
      return;
    }
    setIsJoiningAsGuest(true);
    setGuestJoinError(null);
    try {
      await signIn("anonymous", { name });
      await joinSession({ sessionId: sessionIdAsConvex });
    } catch (error) {
      setGuestJoinError(
        error instanceof Error ? error.message : "Failed to join as guest."
      );
    } finally {
      setIsJoiningAsGuest(false);
    }
  }

  async function handleAdvanceQueue() {
    await advanceQueue({ sessionId: sessionIdAsConvex });
  }

  const isSessionEnded = details.session.status === "ended";
  const currentReader = safeQueue.find((item) => item.status === "reading");
  const isHostOrMod = details.isHost || details.isModerator;
  const showPasscodePrompt = Boolean(
    !isSessionEnded &&
    details.isPasscodeProtected &&
    !isHostOrMod &&
    !isPasscodeVerified
  );
  const canUseQueueControls = Boolean(
    !isSessionEnded &&
    (!details.isPasscodeProtected || isHostOrMod || isPasscodeVerified)
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground />
      <div className={BG_GRADIENT} />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <SessionTopBar
          sessionId={sessionIdAsConvex}
          isHost={details.isHost}
          isParticipant={safeIsCurrentUserParticipant}
          isSessionEnded={isSessionEnded}
          cardShadow={cardShadow}
        />

        {currentReader && !isSessionEnded ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 xl:hidden">
            <span className="size-2 animate-ping rounded-full bg-emerald-500" />
            <Avatar className="size-5">
              <AvatarImage src={currentReader.image} />
              <AvatarFallback className="text-[9px]">{currentReader.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{currentReader.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">reading now</span>
          </div>
        ) : null}

        <section className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.92fr)] xl:items-start">

            {/* Mobile: 1st (top). Desktop: left col, bottom row */}
            <div className="space-y-4 xl:col-start-1 xl:row-start-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/72 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10">
                <UsersRound className="size-3.5 text-indigo-500" />
                Members panel
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <ParticipantsList
                  participants={safeParticipants}
                  isLoading={false}
                  errorMessage={null}
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
              </div>
            </div>

            {/* Mobile: 2nd. Desktop: right col, spans 2 rows, sticky */}
            <div className="xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:sticky xl:top-4">
              <Tabs defaultValue="queue">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="queue" className="flex-1">Queue</TabsTrigger>
                  <TabsTrigger value="words" className="flex-1">Words</TabsTrigger>
                </TabsList>
                <TabsContent value="queue" className="space-y-4">
                  <QueueStatusBar
                    queue={safeQueue}
                    viewerUserId={details.viewerUserId}
                    isPasscodeProtected={details.isPasscodeProtected}
                    canManageQueue={isHostOrMod && canUseQueueControls}
                    onAdvance={handleAdvanceQueue}
                  />
                  <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                    <QueueList
                      queue={safeQueue}
                      isLoading={false}
                      errorMessage={null}
                      canManageQueue={isHostOrMod}
                      canReorder={isHostOrMod && !isSessionEnded}
                      onRemove={(userId) => {
                        void removeFromQueue({
                          sessionId: sessionIdAsConvex,
                          targetUserId: userId as Id<"profiles">,
                        });
                      }}
                      onReorder={(orderedUserIds) => {
                        void reorderQueue({
                          sessionId: sessionIdAsConvex,
                          orderedUserIds: orderedUserIds.map((id) => id as Id<"profiles">),
                        });
                      }}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="words">
                  <WordsList
                    sessionId={sessionIdAsConvex}
                    isParticipant={safeIsCurrentUserParticipant}
                    isSessionEnded={isSessionEnded}
                    viewerUserId={details.viewerUserId}
                    isHost={details.isHost}
                    bookTitle={details.session.bookTitle}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Mobile: 3rd. Desktop: left col, top row */}
            <div className="space-y-4 xl:col-start-1 xl:row-start-1">
              <div className="animate-in fade-in zoom-in-95 duration-500">
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
              </div>

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

            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
