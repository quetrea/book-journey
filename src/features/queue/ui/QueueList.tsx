import { CircleCheckBig, CircleDot, Clock3, Radio, UserRoundCheck, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueueItem } from "@/features/queue/types";

type QueueListProps = {
  queue: QueueItem[];
  isLoading: boolean;
  errorMessage: string | null;
  isHost?: boolean;
  onRemove?: (userId: string) => void;
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function formatJoinedAgo(joinedAt: number) {
  const diffMs = Date.now() - joinedAt;
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (minutes < 1) {
    return "Queued just now";
  }

  if (minutes < 60) {
    return `Queued ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `Queued ${hours}h ago`;
}

function QueueStatusBadge({ status }: { status: QueueItem["status"] }) {
  if (status === "reading") {
    return (
      <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
        Reading
      </Badge>
    );
  }

  if (status === "waiting") {
    return (
      <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
        Waiting
      </Badge>
    );
  }

  return (
    <Badge className="rounded-full bg-slate-500/90 px-2.5 text-[11px] text-white hover:bg-slate-500/90">
      Done
    </Badge>
  );
}

export function QueueList({ queue, isLoading, errorMessage, isHost, onRemove }: QueueListProps) {
  if (isLoading) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Radio className="size-4 text-emerald-600" />
            Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Radio className="size-4 text-emerald-600" />
            Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (queue.length === 0) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Radio className="size-4 text-emerald-600" />
            Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No one in queue yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/[0.45] bg-white/[0.68] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
      <CardHeader className="pb-3">
        <CardTitle className="inline-flex items-center gap-2">
          <Radio className="size-4 text-emerald-600" />
          Queue
        </CardTitle>
        <p className="text-xs text-muted-foreground">Turn order and current reader status.</p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {queue.map((item) => (
          <div
            key={item.queueItemId}
            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 shadow-sm ${
              item.status === "reading"
                ? "border-emerald-300/60 bg-emerald-50/62 dark:border-emerald-400/35 dark:bg-emerald-500/12"
                : "border-white/[0.35] bg-white/[0.56] dark:border-white/[0.12] dark:bg-white/[0.06]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-white/65 bg-white/75 text-[11px] font-semibold text-muted-foreground dark:border-white/15 dark:bg-white/12">
                {item.position}
              </div>
              <Avatar className="ring-1 ring-white/70 dark:ring-white/20">
                <AvatarImage src={item.image ?? undefined} alt={item.name} />
                <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {item.status === "reading" ? (
                    <>
                      <UserRoundCheck className="size-3.5 text-emerald-600" />
                      Current reader
                    </>
                  ) : (
                    <>
                      <Clock3 className="size-3.5" />
                      {formatJoinedAgo(item.joinedAt)}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item.status === "reading" ? (
                <CircleDot className="size-4 text-emerald-600" />
              ) : null}
              {item.status === "done" ? (
                <CircleCheckBig className="size-4 text-slate-500" />
              ) : null}
              <QueueStatusBadge status={item.status} />
              {isHost && onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 rounded-full text-muted-foreground/50 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  onClick={() => onRemove(item.userId)}
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
