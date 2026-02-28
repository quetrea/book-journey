import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { QueueItem } from "@/features/queue/types";

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
  const currentReader = queue.find((item) => item.status === "reading");
  const viewerQueueItem = viewerUserId
    ? queue.find((item) => item.userId === viewerUserId)
    : undefined;

  return (
    <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
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
