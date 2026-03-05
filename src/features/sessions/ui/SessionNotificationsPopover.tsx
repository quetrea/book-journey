"use client";

import { useMutation, useQuery } from "convex/react";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getInitials } from "@/lib/formatters";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionNotificationsPopoverProps = {
  sessionId: Id<"sessions">;
  isHost: boolean;
  sessionAccessType: "public" | "passcode" | "private";
  isSessionEnded: boolean;
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

export function SessionNotificationsPopover({
  sessionId,
  isHost,
  sessionAccessType,
  isSessionEnded,
}: SessionNotificationsPopoverProps) {
  const respondToJoinRequest = useMutation(
    api.sessions.respondToSessionJoinRequestServer
  );
  const pendingJoinRequests = useQuery(
    api.sessions.listPendingSessionJoinRequestsServer,
    isHost && sessionAccessType === "private" && !isSessionEnded
      ? { sessionId }
      : "skip"
  );

  const [respondingJoinRequestUserId, setRespondingJoinRequestUserId] = useState<
    string | null
  >(null);
  const [accessNotifications, setAccessNotifications] = useState<
    AccessNotificationItem[]
  >([]);
  const seenPendingRequestKeysRef = useRef<Set<string>>(new Set());
  const isPendingSnapshotInitializedRef = useRef(false);

  const unreadNotificationCount = useMemo(
    () => accessNotifications.filter((item) => !item.isRead).length,
    [accessNotifications]
  );

  const badgeCount =
    unreadNotificationCount > 0
      ? unreadNotificationCount
      : pendingJoinRequests?.length ?? 0;

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

  if (!isHost || sessionAccessType !== "private" || isSessionEnded) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="relative shrink-0"
        >
          <Bell className="size-4" />
          <span className="hidden sm:inline">Notifications</span>
          {badgeCount > 0 ? (
            <Badge className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-indigo-500 p-0 text-[10px] text-white hover:bg-indigo-500">
              {badgeCount > 9 ? "9+" : badgeCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[22rem] space-y-3 border-white/30 bg-white/90 p-3 backdrop-blur-xl dark:border-white/12 dark:bg-[#0d1222]/90"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">Notification box</p>
          <div className="flex items-center gap-1">
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

        <div className="space-y-2 rounded-lg border border-white/30 bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/4">
          <p className="text-xs font-medium text-foreground">Access requests</p>
          {pendingJoinRequests === undefined ? (
            <p className="text-xs text-muted-foreground">Loading requests...</p>
          ) : pendingJoinRequests.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pending requests.</p>
          ) : (
            <div className="max-h-40 space-y-2 overflow-y-auto pr-0.5">
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
                      <p className="truncate text-xs font-medium text-foreground">
                        {request.requesterName}
                      </p>
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

        <div className="space-y-2 rounded-lg border border-white/30 bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/4">
          <p className="text-xs font-medium text-foreground">Activity</p>
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
      </PopoverContent>
    </Popover>
  );
}
