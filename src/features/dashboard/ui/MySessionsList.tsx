import { ChevronRight, Clock3, Crown, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type SessionListItem = {
  id: string;
  bookTitle: string;
  authorName?: string;
  status: "active" | "ended";
  elapsed: string;
  readersCount: number;
  createdAtLabel: string;
  hostedBy: string;
};

type MySessionsListProps = {
  sessions: SessionListItem[];
};

function StatusBadge({ status }: { status: SessionListItem["status"] }) {
  if (status === "active") {
    return (
      <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
        Active
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
      Ended
    </Badge>
  );
}

export function MySessionsList({ sessions }: MySessionsListProps) {
  if (sessions.length === 0) {
    return (
      <Card className="border-white/[0.35] bg-white/[0.44] py-4 dark:border-white/[0.12] dark:bg-white/[0.04]">
        <CardContent className="px-4 text-sm text-muted-foreground">
          You have no sessions yet. Create your first room to start reading live.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {sessions.map((session) => (
        <Card
          key={session.id}
          className="group relative gap-0 overflow-hidden border-white/[0.34] bg-white/[0.53] px-3.5 py-3 shadow-[0_10px_24px_-18px_rgba(79,70,229,0.6)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.5] hover:shadow-[0_20px_44px_-20px_rgba(79,70,229,0.76)] dark:border-white/[0.12] dark:bg-white/[0.06] dark:hover:border-white/[0.2] dark:hover:shadow-[0_22px_48px_-20px_rgba(37,99,235,0.7)]"
        >
          <span
            className={`pointer-events-none absolute left-0 top-0 h-full w-[2px] ${
              session.status === "active"
                ? "bg-gradient-to-b from-emerald-400/95 via-emerald-300/80 to-transparent"
                : "bg-gradient-to-b from-slate-300/80 to-transparent dark:from-slate-400/45"
            }`}
          />
          <span className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.78)_0.6px,transparent_0.6px)] [background-size:3px_3px] dark:opacity-[0.06]" />
          <span className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/25 to-transparent dark:from-white/8" />

          <CardContent className="relative z-10 p-0">
            <div className="grid gap-2.5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.95fr)_minmax(0,1.1fr)] md:items-center">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold text-foreground md:text-[15px]">
                  {session.bookTitle}
                </p>
                <p className="line-clamp-1 text-xs text-muted-foreground/95">
                  {session.authorName ? `by ${session.authorName}` : "Author unknown"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {session.createdAtLabel}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={session.status} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-2 py-1 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                  <Clock3 className="size-3.5" />
                  {session.elapsed}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
                <p className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-2 py-1 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                  <Users className="size-3.5" />
                  {session.readersCount} readers
                </p>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-2 py-1 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                  <Crown className="size-3.5" />
                  {session.hostedBy}
                </p>
                <ChevronRight className="hidden size-4 text-muted-foreground/55 transition-transform duration-200 group-hover:translate-x-0.5 md:block" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
