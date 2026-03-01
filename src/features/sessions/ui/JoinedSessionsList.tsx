"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { api } from "../../../../convex/_generated/api";

function formatDateLabel(timestamp: number) {
  const now = new Date();
  const date = new Date(timestamp);

  if (now.toDateString() === date.toDateString()) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function JoinedSessionsList() {
  const sessions = useQuery(api.sessions.listJoinedSessionsServer);
  const { itemShadow, itemHoverShadow } = useThemeGlow();

  if (sessions === undefined) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card
            key={`joined-skeleton-${i}`}
            className="border-black/8 bg-white/65 px-4 py-4 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/12 dark:bg-white/[0.07] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <CardContent className="space-y-2 p-0">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-black/8 bg-white/60 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/12 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <CardContent className="px-4 text-sm text-muted-foreground">
          No joined sessions yet. Ask someone to share a session link.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {sessions.map((session, index) => (
        <Link key={session._id} href={`/s/${session._id}`} className="block">
          <Card
            className={cn(
              "group relative gap-0 overflow-hidden px-4 py-4 backdrop-blur-md transition-all duration-250 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-1",
              session.status === "active"
                ? "border-emerald-200/60 bg-white/70 hover:bg-white/80 dark:border-emerald-400/20 dark:bg-white/9 dark:hover:bg-white/13"
                : "border-black/8 bg-white/65 hover:bg-white/78 dark:border-white/12 dark:bg-white/8 dark:hover:bg-white/12",
            )}
            style={{
              animationDelay: `${Math.min(index * 45, 180)}ms`,
              boxShadow: itemShadow,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = itemHoverShadow;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = itemShadow;
            }}
          >
            <span
              className={`pointer-events-none absolute left-0 top-0 h-full w-[2.5px] transition-opacity duration-300 ${
                session.status === "active"
                  ? "bg-linear-to-b from-emerald-400 via-emerald-300/70 to-transparent opacity-90 group-hover:opacity-100"
                  : "bg-linear-to-b from-slate-300/70 to-transparent opacity-60 group-hover:opacity-80 dark:from-slate-400/40"
              }`}
            />
            <CardContent className="space-y-3 p-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="line-clamp-1 text-base font-semibold tracking-tight text-foreground">
                    {session.title ?? session.bookTitle}
                  </p>
                  {session.title ? (
                    <p className="line-clamp-1 text-sm text-muted-foreground/90">
                      Book: {session.bookTitle}
                    </p>
                  ) : null}
                </div>
                {session.status === "active" ? (
                  <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
                    Ended
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl border border-black/8 bg-white/55 px-2.5 py-2 dark:border-white/10 dark:bg-white/[0.07]">
                <div className="inline-flex min-w-0 items-center gap-2">
                  <Avatar size="sm" className="ring-1 ring-black/10 dark:ring-white/20">
                    <AvatarImage src={session.hostImage ?? undefined} alt={session.hostName ?? "Host"} />
                    <AvatarFallback>{getInitials(session.hostName ?? "H")}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs text-muted-foreground">
                    Hosted by{" "}
                    <span className="font-medium text-foreground">
                      {session.hostName ?? "Unknown"}
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">
                    · {formatDateLabel(session.joinedAt)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 transition-colors group-hover:text-muted-foreground">
                  Open
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
