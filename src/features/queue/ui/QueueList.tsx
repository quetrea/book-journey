import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QueueItem } from "@/features/queue/types";

type QueueListProps = {
  queue: QueueItem[];
  isLoading: boolean;
  errorMessage: string | null;
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
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

export function QueueList({ queue, isLoading, errorMessage }: QueueListProps) {
  if (isLoading) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading queue...</p>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (queue.length === 0) {
    return (
      <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No readers in queue yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/[0.45] bg-white/[0.66] shadow-[0_18px_50px_-28px_rgba(67,56,202,0.7)] backdrop-blur-md dark:border-white/[0.15] dark:bg-white/[0.07] dark:shadow-[0_18px_50px_-28px_rgba(79,70,229,0.7)]">
      <CardHeader>
        <CardTitle>Queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {queue.map((item) => (
          <div
            key={item.queueItemId}
            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
              item.status === "reading"
                ? "border-emerald-300/60 bg-emerald-50/55 dark:border-emerald-400/35 dark:bg-emerald-500/10"
                : "border-white/[0.35] bg-white/[0.52] dark:border-white/[0.12] dark:bg-white/[0.05]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar size="sm" className="ring-1 ring-white/70 dark:ring-white/20">
                <AvatarImage src={item.image ?? undefined} alt={item.name} />
                <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">#{item.position}</p>
              </div>
            </div>

            <QueueStatusBadge status={item.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
