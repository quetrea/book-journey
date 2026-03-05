"use client";

import { useMutation } from "convex/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BookOpenText, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { JoinSessionButton } from "@/features/participants/ui/JoinSessionButton";
import { JoinQueueButton } from "@/features/queue/ui/JoinQueueButton";
import { SkipTurnButton } from "@/features/queue/ui/SkipTurnButton";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getInitials } from "@/lib/formatters";
import type { ParticipantListItem } from "@/features/participants/types";
import type { QueueItem } from "@/features/queue/types";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionControlsCardProps = {
  sessionId: Id<"sessions">;
  isHost: boolean;
  isModerator: boolean;
  sessionAccessType: "public" | "passcode" | "private";
  isRepeatEnabled: boolean;
  viewerUserId: string | null | undefined;
  safeIsCurrentUserParticipant: boolean;
  safeQueue: QueueItem[];
  safeParticipants: ParticipantListItem[];
  canUseQueueControls: boolean;
  isSessionEnded: boolean;
  showPasscodePrompt: boolean;
  onPasscodeVerified: () => void;
  cardShadow: string;
};

type AccessNotificationItem = {
  id: string;
  kind: "request" | "decision";
  requesterUserId?: string;
  title: string;
  description: string;
  createdAt: number;
  isRead: boolean;
};

function formatNotificationTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function SessionControlsCard({
  sessionId,
  isHost,
  isModerator,
  sessionAccessType,
  isRepeatEnabled,
  viewerUserId,
  safeIsCurrentUserParticipant,
  safeQueue,
  safeParticipants,
  canUseQueueControls,
  isSessionEnded,
  showPasscodePrompt,
  onPasscodeVerified,
  cardShadow,
}: SessionControlsCardProps) {
  const router = useRouter();

  const joinSession = useMutation(api.sessions.joinSessionServer);
  const leaveSession = useMutation(api.sessions.leaveSessionServer);
  const verifySessionPasscode = useMutation(
    api.sessions.verifySessionPasscodeServer
  );
  const joinQueue = useMutation(api.queue.joinQueueServer);
  const leaveQueue = useMutation(api.queue.leaveQueueServer);
  const skipMyTurn = useMutation(api.queue.skipMyTurnServer);
  const addUserToQueue = useMutation(api.queue.addUserToQueueServer);
  const toggleRepeatMode = useMutation(api.sessions.toggleRepeatModeServer);
  const respondToJoinRequest = useMutation(
    api.sessions.respondToSessionJoinRequestServer
  );
  const pendingJoinRequests = useQuery(
    api.sessions.listPendingSessionJoinRequestsServer,
    isHost && sessionAccessType === "private" && !isSessionEnded
      ? { sessionId }
      : "skip"
  );

  const [passcodeValue, setPasscodeValue] = useState("");
  const [passcodeErrorMessage, setPasscodeErrorMessage] = useState<
    string | null
  >(null);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
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
  const [respondingJoinRequestUserId, setRespondingJoinRequestUserId] = useState<
    string | null
  >(null);
  const [accessNotifications, setAccessNotifications] = useState<
    AccessNotificationItem[]
  >([]);
  const seenPendingRequestKeysRef = useRef<Set<string>>(new Set());
  const isPendingSnapshotInitializedRef = useRef(false);

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = usePushNotifications();

  const viewerQueueItem = viewerUserId
    ? safeQueue.find((item) => item.userId === viewerUserId)
    : undefined;

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
  const unreadNotificationCount = useMemo(
    () => accessNotifications.filter((item) => !item.isRead).length,
    [accessNotifications]
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

  useEffect(() => {
    if (!isHost || sessionAccessType !== "private" || isSessionEnded) {
      seenPendingRequestKeysRef.current = new Set();
      isPendingSnapshotInitializedRef.current = false;
      return;
    }

    if (pendingJoinRequests === undefined) {
      return;
    }

    const pendingKeys = new Set(
      pendingJoinRequests.map(
        (request) => `${request.requesterUserId}:${request.requestedAt}`
      )
    );

    if (!isPendingSnapshotInitializedRef.current) {
      seenPendingRequestKeysRef.current = pendingKeys;
      isPendingSnapshotInitializedRef.current = true;
      return;
    }

    for (const request of pendingJoinRequests) {
      const key = `${request.requesterUserId}:${request.requestedAt}`;
      if (seenPendingRequestKeysRef.current.has(key)) {
        continue;
      }

      toast("New access request", {
        description: `${request.requesterName} wants to join this private session.`,
      });

      setAccessNotifications((prev) => [
        {
          id: key,
          kind: "request",
          requesterUserId: request.requesterUserId,
          title: "New access request",
          description: `${request.requesterName} requested to join.`,
          createdAt: Date.now(),
          isRead: false,
        },
        ...prev,
      ]);
    }

    seenPendingRequestKeysRef.current = pendingKeys;
  }, [
    isHost,
    isSessionEnded,
    pendingJoinRequests,
    sessionAccessType,
  ]);

  async function handleJoin() {
    await joinSession({ sessionId });
  }

  async function handleJoinQueue() {
    await joinQueue({ sessionId });
  }

  async function handleLeaveQueue() {
    await leaveQueue({ sessionId });
  }

  async function handleSkipTurn() {
    await skipMyTurn({ sessionId });
  }

  async function handleLeaveSession() {
    setIsLeavingSession(true);
    setLeaveSessionErrorMessage(null);

    try {
      await leaveSession({ sessionId });
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
        sessionId,
        passcode: passcodeValue,
      });

      if (!result.verified) {
        setPasscodeErrorMessage("Invalid passcode.");
        return;
      }

      onPasscodeVerified();
      setPasscodeValue("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to verify passcode.";
      setPasscodeErrorMessage(message);
    } finally {
      setIsVerifyingPasscode(false);
    }
  }

  async function handleAddParticipantToQueue() {
    if (!selectedParticipantUserId) {
      setAddParticipantToQueueError("Select a participant first.");
      return;
    }

    setIsAddingParticipantToQueue(true);
    setAddParticipantToQueueError(null);

    try {
      await addUserToQueue({
        sessionId,
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

  async function handleRespondToJoinRequest(
    requesterUserId: string,
    decision: "approved" | "rejected"
  ) {
    const requesterName =
      pendingJoinRequests?.find(
        (request) => request.requesterUserId === requesterUserId
      )?.requesterName ?? "User";

    setRespondingJoinRequestUserId(requesterUserId);
    try {
      await respondToJoinRequest({
        sessionId,
        requesterUserId: requesterUserId as Id<"profiles">,
        decision,
      });

      setAccessNotifications((prev) => [
        {
          id: `decision:${requesterUserId}:${Date.now()}`,
          kind: "decision",
          requesterUserId,
          title:
            decision === "approved"
              ? "Access request approved"
              : "Access request rejected",
          description: `${requesterName} was ${
            decision === "approved" ? "approved" : "rejected"
          }.`,
          createdAt: Date.now(),
          isRead: false,
        },
        ...prev.map((item) =>
          item.requesterUserId === requesterUserId && item.kind === "request"
            ? { ...item, isRead: true }
            : item
        ),
      ]);

      toast.success(
        decision === "approved"
          ? `${requesterName} approved.`
          : `${requesterName} rejected.`
      );
    } finally {
      setRespondingJoinRequestUserId(null);
    }
  }

  return (
    <Card
      className="border-white/45 bg-white/68 backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-500 dark:border-white/15 dark:bg-white/8"
      style={{ boxShadow: cardShadow }}
    >
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

        {isHost && sessionAccessType === "private" && !isSessionEnded ? (
          <div className="space-y-3 rounded-xl border border-white/40 bg-white/60 p-3 dark:border-white/[0.14] dark:bg-white/6">
            <div className="space-y-2 rounded-lg border border-white/30 bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/4">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Bell className="size-3.5 text-indigo-500" />
                  Notification box
                </p>
                <div className="flex items-center gap-1.5">
                  {unreadNotificationCount > 0 ? (
                    <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {unreadNotificationCount}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAccessNotifications((prev) =>
                        prev.map((item) => ({ ...item, isRead: true }))
                      );
                    }}
                    disabled={accessNotifications.length === 0}
                    className="h-6 px-2 text-[11px]"
                  >
                    <CheckCheck className="mr-1 size-3" />
                    Read all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAccessNotifications([]);
                    }}
                    disabled={accessNotifications.length === 0}
                    className="h-6 px-2 text-[11px]"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              {accessNotifications.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  New access request toasts will appear here.
                </p>
              ) : (
                <div className="max-h-32 space-y-1.5 overflow-y-auto pr-0.5">
                  {accessNotifications.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border border-white/25 bg-white/60 px-2 py-1.5 dark:border-white/10 dark:bg-white/[0.05]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-medium text-foreground">
                          {item.title}
                        </p>
                        {!item.isRead ? (
                          <span className="size-1.5 shrink-0 rounded-full bg-indigo-500" />
                        ) : null}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {formatNotificationTime(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs font-medium text-foreground">Access requests</p>
            {pendingJoinRequests === undefined ? (
              <p className="text-xs text-muted-foreground">Loading requests...</p>
            ) : pendingJoinRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No pending requests.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingJoinRequests.map((request) => {
                  const isResponding =
                    respondingJoinRequestUserId === request.requesterUserId;
                  return (
                    <div
                      key={request.requesterUserId}
                      className="flex flex-col gap-2 rounded-lg border border-white/30 bg-white/55 p-2 dark:border-white/10 dark:bg-white/4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="inline-flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={request.requesterImage ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(request.requesterName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">
                            {request.requesterName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            void handleRespondToJoinRequest(
                              request.requesterUserId,
                              "approved"
                            );
                          }}
                          disabled={isResponding}
                          className="h-7 px-2.5 text-[11px]"
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            void handleRespondToJoinRequest(
                              request.requesterUserId,
                              "rejected"
                            );
                          }}
                          disabled={isResponding}
                          className="h-7 px-2.5 text-[11px]"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {canUseQueueControls ? (
          <div className="flex flex-wrap items-center gap-2">
            <JoinQueueButton
              isParticipant={safeIsCurrentUserParticipant}
              isInQueue={Boolean(viewerQueueItem)}
              isSessionEnded={isSessionEnded}
              onJoin={handleJoinQueue}
              onLeave={handleLeaveQueue}
            />
            <SkipTurnButton
              canSkip={viewerQueueItem?.status === "reading"}
              onSkip={handleSkipTurn}
            />
          </div>
        ) : null}

        {(isHost || isModerator) && canUseQueueControls ? (
          <details className="group open:space-y-3 xl:[open]" open>
            <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground transition-colors hover:text-foreground xl:hidden [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1">
                Queue management
                <span className="text-[10px] transition-transform group-open:rotate-180">&#9660;</span>
              </span>
            </summary>
            <div className="mt-2 space-y-3 xl:mt-0">
              {isHost && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/60 px-3 py-2.5 dark:border-white/[0.14] dark:bg-white/6">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Repeat queue
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Automatically restart when everyone is done
                    </p>
                  </div>
                  <Switch
                    size="default"
                    checked={Boolean(isRepeatEnabled)}
                    onCheckedChange={() => {
                      void toggleRepeatMode({ sessionId });
                    }}
                  />
                </div>
              )}

              <div className="space-y-2 rounded-xl border border-white/40 bg-white/60 p-3 dark:border-white/[0.14] dark:bg-white/6">
                <p className="text-xs font-medium text-foreground">
                  Add participant to queue
                </p>
                {addableParticipants.length > 0 ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={selectedParticipantUserId}
                      onValueChange={setSelectedParticipantUserId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select participant" />
                      </SelectTrigger>
                      <SelectContent>
                        {addableParticipants.map((participant) => (
                          <SelectItem
                            key={participant.userId}
                            value={participant.userId}
                          >
                            {participant.name}
                            {participant.role === "host" ? " (Host)" : participant.role === "moderator" ? " (Mod)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            </div>
          </details>
        ) : null}

        {isPushSupported &&
        safeIsCurrentUserParticipant &&
        !isSessionEnded ? (
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
                  void (isPushSubscribed
                    ? unsubscribeFromPush()
                    : subscribeToPush());
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

        {!isHost && safeIsCurrentUserParticipant ? (
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
  );
}
