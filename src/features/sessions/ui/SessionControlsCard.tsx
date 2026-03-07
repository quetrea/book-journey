"use client";

import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { BookOpenText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { JoinSessionButton } from "@/features/participants/ui/JoinSessionButton";
import { JoinQueueButton } from "@/features/queue/ui/JoinQueueButton";
import { SkipTurnButton } from "@/features/queue/ui/SkipTurnButton";
import type { ParticipantListItem } from "@/features/participants/types";
import type { QueueItem } from "@/features/queue/types";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionControlsCardProps = {
  sessionId: Id<"sessions">;
  isHost: boolean;
  isModerator: boolean;
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

export function SessionControlsCard({
  sessionId,
  isHost,
  isModerator,
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
  const joinSession = useMutation(api.sessions.joinSessionServer);
  const verifySessionPasscode = useMutation(
    api.sessions.verifySessionPasscodeServer
  );
  const joinQueue = useMutation(api.queue.joinQueueServer);
  const leaveQueue = useMutation(api.queue.leaveQueueServer);
  const skipMyTurn = useMutation(api.queue.skipMyTurnServer);
  const setMySkipTag = useMutation(api.queue.setMySkipTagServer);
  const toggleRepeatMode = useMutation(api.sessions.toggleRepeatModeServer);

  const [passcodeValue, setPasscodeValue] = useState("");
  const [passcodeErrorMessage, setPasscodeErrorMessage] = useState<
    string | null
  >(null);
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [skipReasonDraft, setSkipReasonDraft] = useState("");
  const [isSavingSkipTag, setIsSavingSkipTag] = useState(false);
  const [skipTagErrorMessage, setSkipTagErrorMessage] = useState<string | null>(
    null
  );

  const viewerQueueItem = viewerUserId
    ? safeQueue.find((item) => item.userId === viewerUserId)
    : undefined;

  const isViewerSkipTagged = Boolean(viewerQueueItem?.isSkipped);
  const viewerQueueItemId = viewerQueueItem?.queueItemId ?? null;
  const viewerSkipReason = viewerQueueItem?.skipReason ?? "";
  const viewerSkipState = Boolean(viewerQueueItem?.isSkipped);

  useEffect(() => {
    if (!viewerQueueItemId) {
      setSkipReasonDraft("");
      setSkipTagErrorMessage(null);
      return;
    }

    setSkipReasonDraft(viewerSkipReason);
    setSkipTagErrorMessage(null);
  }, [viewerQueueItemId, viewerSkipReason, viewerSkipState]);

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

  async function handleSkipTagToggle(nextIsSkipped: boolean) {
    if (!viewerQueueItem) {
      return;
    }

    setIsSavingSkipTag(true);
    setSkipTagErrorMessage(null);
    try {
      await setMySkipTag({
        sessionId,
        isSkipped: nextIsSkipped,
        reason: nextIsSkipped ? skipReasonDraft.trim() || undefined : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update skip tag.";
      setSkipTagErrorMessage(message);
    } finally {
      setIsSavingSkipTag(false);
    }
  }

  async function handleSaveSkipReason() {
    if (!viewerQueueItem || !isViewerSkipTagged) {
      return;
    }

    setIsSavingSkipTag(true);
    setSkipTagErrorMessage(null);
    try {
      await setMySkipTag({
        sessionId,
        isSkipped: true,
        reason: skipReasonDraft.trim() || undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save skip reason.";
      setSkipTagErrorMessage(message);
    } finally {
      setIsSavingSkipTag(false);
    }
  }

  return (
    <Card
      className="border-white/45 bg-white/68 backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-500 dark:border-white/15 dark:bg-white/8"
      style={{ boxShadow: cardShadow }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <BookOpenText className="size-4 text-indigo-500" />
          Your actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <JoinSessionButton
          isParticipant={safeIsCurrentUserParticipant}
          isSessionEnded={isSessionEnded}
          onJoin={handleJoin}
        />

        {showPasscodePrompt ? (
          <div className="space-y-2.5 rounded-xl border border-white/40 bg-white/60 p-3 dark:border-white/[0.14] dark:bg-white/6">
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

        {canUseQueueControls ? (
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              Queue tools
            </p>
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
          </div>
        ) : null}

        {canUseQueueControls &&
        safeIsCurrentUserParticipant &&
        viewerQueueItem ? (
          <div className="space-y-2.5 rounded-xl border border-white/40 bg-white/60 p-3 dark:border-white/[0.14] dark:bg-white/6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-foreground">Skip tag</p>
                <p className="text-[11px] text-muted-foreground">
                  Mark yourself as temporarily skipped in the queue.
                </p>
              </div>
              <Switch
                size="default"
                checked={isViewerSkipTagged}
                disabled={isSavingSkipTag}
                onCheckedChange={(checked) => {
                  void handleSkipTagToggle(checked);
                }}
              />
            </div>
            {isViewerSkipTagged ? (
              <div className="space-y-2">
                <Input
                  value={skipReasonDraft}
                  onChange={(event) => setSkipReasonDraft(event.target.value)}
                  placeholder="Reason (optional)"
                  maxLength={240}
                  disabled={isSavingSkipTag}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleSaveSkipReason();
                  }}
                  disabled={isSavingSkipTag}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-500/10"
                >
                  {isSavingSkipTag ? "Saving..." : "Save reason"}
                </Button>
              </div>
            ) : null}
            {skipTagErrorMessage ? (
              <p className="text-xs text-red-500">{skipTagErrorMessage}</p>
            ) : null}
          </div>
        ) : null}

        {(isHost || isModerator) && canUseQueueControls ? (
          <details className="group open:space-y-2.5 xl:[open]" open>
            <summary className="cursor-pointer list-none text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 transition-colors hover:text-foreground xl:hidden [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1">
                Host tools
                <span className="text-[10px] transition-transform group-open:rotate-180">
                  &#9660;
                </span>
              </span>
            </summary>
            <div className="mt-2 space-y-2.5 xl:mt-0">
              <p className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 xl:block">
                Host tools
              </p>
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

            </div>
          </details>
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
