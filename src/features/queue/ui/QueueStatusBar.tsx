"use client";

import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { QueueItem } from "@/features/queue/types";
import { useThemeGlow } from "@/hooks/useThemeGlow";

type QueueStatusBarProps = {
  queue: QueueItem[];
  viewerUserId?: string;
  isPasscodeProtected: boolean;
};

export function QueueStatusBar({
  queue,
  viewerUserId,
  isPasscodeProtected,
}: QueueStatusBarProps) {
  const { cardShadow } = useThemeGlow();
  const currentReader = queue.find((item) => item.status === "reading");
  const viewerQueueItem = viewerUserId
    ? queue.find((item) => item.userId === viewerUserId)
    : undefined;
  const totalInQueue = queue.filter((item) => item.status !== "done").length;

  return (
    <Card className="border-white/45 bg-white/66 backdrop-blur-md dark:border-white/15 dark:bg-white/7" style={{ boxShadow: cardShadow }}>
      <CardContent className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-foreground">
          Current Reader:
          {" "}
          <span className="font-semibold">
            {currentReader?.name ?? "No active reader"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span>
            Total:
            {" "}
            {totalInQueue}
          </span>
          <span>
            You:
            {" "}
            {viewerQueueItem
              ? viewerQueueItem.status === "done"
                ? "Done"
                : `#${viewerQueueItem.position}`
              : "Not in queue"}
          </span>
          {isPasscodeProtected ? (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3.5" />
              Protected
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
