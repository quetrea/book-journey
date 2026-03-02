"use client";

import { Lock, Mic2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { QueueItem } from "@/features/queue/types";
import { useThemeGlow } from "@/hooks/useThemeGlow";

type QueueStatusBarProps = {
  queue: QueueItem[];
  viewerUserId?: string;
  isPasscodeProtected: boolean;
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function QueueStatusBar({
  queue,
  viewerUserId,
  isPasscodeProtected,
}: QueueStatusBarProps) {
  const { cardShadow, orb } = useThemeGlow();
  const currentReader = queue.find((item) => item.status === "reading");
  const nextReader = queue.find((item) => item.status === "waiting");
  const viewerQueueItem = viewerUserId
    ? queue.find((item) => item.userId === viewerUserId)
    : undefined;
  const totalInQueue = queue.filter((item) => item.status !== "done").length;
  const isViewerReading = viewerQueueItem?.status === "reading";

  if (!currentReader) {
    return (
      <Card
        className="border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7"
        style={{ boxShadow: cardShadow }}
      >
        <CardContent className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground">
          <span>No active reader</span>
          <div className="flex items-center gap-3">
            <span>{totalInQueue} in queue</span>
            {isPasscodeProtected && (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3.5" />
                Protected
              </span>
            )}
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
      {/* Ambient glow behind reader */}
      <div
        className="pointer-events-none absolute -top-8 left-1/2 size-40 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: orb }}
      />

      <CardContent className="relative px-4 py-4">
        {/* Header row */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:border-white/15 dark:bg-white/10">
            <Mic2 className="size-3 text-indigo-500" />
            Now reading
            {isViewerReading && (
              <span className="ml-1 font-semibold text-indigo-500">· You</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
            <span>{totalInQueue} in queue</span>
            {isPasscodeProtected && <Lock className="size-3" />}
          </div>
        </div>

        {/* Reader spotlight */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              className="size-11 ring-2"
              style={{ "--tw-ring-color": `${orb}55` } as React.CSSProperties}
            >
              <AvatarImage src={currentReader.image ?? undefined} alt={currentReader.name} />
              <AvatarFallback className="text-base font-semibold">
                {getInitials(currentReader.name)}
              </AvatarFallback>
            </Avatar>
            {/* Live pulse dot */}
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
                It&apos;s your turn to read!
              </p>
            ) : viewerQueueItem && viewerQueueItem.status !== "done" ? (
              <p className="text-xs text-muted-foreground">
                Your position: <span className="font-medium text-foreground">#{viewerQueueItem.position}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Not in queue</p>
            )}
          </div>
        </div>

        {/* Next up */}
        {nextReader && (
          <div className="mt-3 flex items-center gap-2 border-t border-black/6 pt-2.5 dark:border-white/8">
            <span className="text-[11px] text-muted-foreground/55">Next</span>
            <Avatar size="sm" className="ring-1 ring-black/10 dark:ring-white/15">
              <AvatarImage src={nextReader.image ?? undefined} alt={nextReader.name} />
              <AvatarFallback className="text-[10px]">{getInitials(nextReader.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium text-foreground/80">{nextReader.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
