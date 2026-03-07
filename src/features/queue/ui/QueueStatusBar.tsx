"use client";

import { Lock, Mic2 } from "lucide-react";
import { memo, useMemo, useState, type CSSProperties } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/formatters";
import type { QueueItem } from "@/features/queue/types";
import { useThemeGlow } from "@/hooks/useThemeGlow";

type QueueStatusBarProps = {
  queue: QueueItem[];
  viewerUserId?: string;
  isPasscodeProtected: boolean;
  canManageQueue?: boolean;
  onAdvance?: () => Promise<void>;
};

export const QueueStatusBar = memo(function QueueStatusBar({
  queue,
  viewerUserId,
  isPasscodeProtected,
  canManageQueue,
  onAdvance,
}: QueueStatusBarProps) {
  const { cardShadow, orb } = useThemeGlow();
  const [isAdvancing, setIsAdvancing] = useState(false);

  async function handleAdvance() {
    if (!onAdvance) return;
    setIsAdvancing(true);
    try {
      await onAdvance();
    } finally {
      setIsAdvancing(false);
    }
  }

  const { currentReader, nextReader, viewerQueueItem, totalInQueue, isViewerReading } =
    useMemo(() => {
      const cr = queue.find((item) => item.status === "reading");
      const nr = queue.find((item) => item.status === "waiting" && !item.isSkipped);
      const vqi = viewerUserId
        ? queue.find((item) => item.userId === viewerUserId)
        : undefined;
      const total = queue.filter((item) => item.status !== "done").length;
      return {
        currentReader: cr,
        nextReader: nr,
        viewerQueueItem: vqi,
        totalInQueue: total,
        isViewerReading: vqi?.status === "reading",
      };
    }, [queue, viewerUserId]);

  if (!currentReader) {
    return (
      <Card
        className="border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7"
        style={{ boxShadow: cardShadow }}
      >
        <CardContent className="space-y-3 px-4 py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:border-white/15 dark:bg-white/10">
                <Mic2 className="size-3 text-indigo-500" />
                Queue ready
              </div>
              <p className="text-base font-semibold text-foreground">No active reader</p>
              <p className="text-sm text-muted-foreground">
                {totalInQueue > 0
                  ? `${totalInQueue} reader${totalInQueue === 1 ? "" : "s"} waiting for the next turn.`
                  : "No one is waiting yet. Join the queue to start the room flow."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full border border-black/8 bg-white/75 px-2.5 py-1 dark:border-white/12 dark:bg-white/10">
                {totalInQueue} active
              </span>
              {isPasscodeProtected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-black/8 bg-white/75 px-2.5 py-1 dark:border-white/12 dark:bg-white/10">
                  <Lock className="size-3.5" />
                  Protected
                </span>
              ) : null}
            </div>
          </div>

          {!isViewerReading && viewerQueueItem?.isSkipped ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              <span className="font-semibold">Your queue status:</span>{" "}
              Skip tag active
              {viewerQueueItem.skipReason ? `: ${viewerQueueItem.skipReason}` : ""}
            </div>
          ) : !isViewerReading && viewerQueueItem?.status === "waiting" ? (
            <div className="rounded-xl border border-black/8 bg-black/3 px-3 py-2 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5">
              Your position:{" "}
              <span className="font-semibold text-foreground">
                #{viewerQueueItem.position}
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManageQueue && totalInQueue > 0 && onAdvance ? (
              <Button
                type="button"
                size="sm"
                onClick={() => void handleAdvance()}
                disabled={isAdvancing}
                className="h-8 text-xs"
              >
                {isAdvancing ? "Starting..." : "Start queue"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="relative overflow-hidden border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7"
      style={{ boxShadow: cardShadow }}
    >
      <div
        className="pointer-events-none absolute -top-8 left-1/2 size-40 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: orb }}
      />

      <CardContent className="relative px-4 py-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:border-white/15 dark:bg-white/10">
            <Mic2 className="size-3 text-indigo-500" />
            Now reading
            {isViewerReading ? (
              <span className="ml-1 font-semibold text-indigo-500">. You</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
            <span>{totalInQueue} in queue</span>
            {isPasscodeProtected ? <Lock className="size-3" /> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              className="size-11 ring-2"
              style={{ "--tw-ring-color": `${orb}55` } as CSSProperties}
            >
              <AvatarImage src={currentReader.image ?? undefined} alt={currentReader.name} />
              <AvatarFallback className="text-base font-semibold">
                {getInitials(currentReader.name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 flex size-3">
              <span className="absolute inline-flex size-3 animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-black/40" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">
              {currentReader.name}
            </p>
            {isViewerReading ? (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                It&apos;s your turn to read.
              </p>
            ) : null}
          </div>
        </div>

        {!isViewerReading && viewerQueueItem?.isSkipped ? (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            <span className="font-semibold">Your queue status:</span>{" "}
            Skip tag active
            {viewerQueueItem.skipReason ? `: ${viewerQueueItem.skipReason}` : ""}
          </div>
        ) : !isViewerReading && viewerQueueItem?.status === "waiting" ? (
          <div className="mt-3 rounded-xl border border-black/8 bg-black/3 px-3 py-2 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5">
            Your position:{" "}
            <span className="font-semibold text-foreground">
              #{viewerQueueItem.position}
            </span>
          </div>
        ) : null}

        {nextReader ? (
          <div className="mt-3 flex items-center gap-2 border-t border-black/6 pt-2.5 dark:border-white/8">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
              Next up
            </span>
            <Avatar size="sm" className="ring-1 ring-black/10 dark:ring-white/15">
              <AvatarImage src={nextReader.image ?? undefined} alt={nextReader.name} />
              <AvatarFallback className="text-[10px]">
                {getInitials(nextReader.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium text-foreground/80">
              {nextReader.name}
            </span>
          </div>
        ) : null}

        {canManageQueue && onAdvance ? (
          <div
            className={`flex justify-end ${
              nextReader ? "mt-2.5" : "mt-3 border-t border-black/6 pt-2.5 dark:border-white/8"
            }`}
          >
            <Button
              type="button"
              size="sm"
              onClick={() => void handleAdvance()}
              disabled={isAdvancing}
              className="h-8 text-xs"
            >
              {isAdvancing ? "Advancing..." : "Advance queue"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
});
