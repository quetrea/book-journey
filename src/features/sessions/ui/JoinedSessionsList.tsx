"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { ChevronRight, DoorOpen } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
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

export function JoinedSessionsList() {
  const sessions = useQuery(api.sessions.listJoinedSessionsServer);

  if (sessions === undefined) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card
            key={`joined-skeleton-${i}`}
            className="border-cyan-200/35 bg-[rgba(239,255,253,0.40)] px-4 py-4 shadow-[0_12px_30px_rgba(14,165,233,0.06),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl dark:border-cyan-300/12 dark:bg-[rgba(255,255,255,0.05)] dark:shadow-[0_14px_34px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]"
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
      <Card className="border-emerald-200/40 bg-[rgba(235,255,249,0.42)] py-8 shadow-[0_18px_40px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl dark:border-emerald-300/14 dark:bg-[rgba(255,255,255,0.05)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <CardContent className="relative flex min-h-44 flex-col items-center justify-center gap-2.5 px-4 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-full border border-emerald-200/55 bg-[rgba(255,255,255,0.58)] text-emerald-700 dark:border-emerald-300/22 dark:bg-[rgba(255,255,255,0.08)] dark:text-emerald-200">
            <DoorOpen className="size-5" />
          </span>
          <p className="text-base font-semibold text-foreground">No joined sessions yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Open a live session from the home page or ask someone to share a session link.
          </p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/">Join session</Link>
          </Button>
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
              "group relative isolate gap-0 overflow-hidden px-4 py-4 backdrop-blur-md transition-all duration-250 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-1",
              session.status === "active"
                ? "border-emerald-200/45 bg-[rgba(234,255,248,0.42)] hover:bg-[rgba(241,255,251,0.54)] dark:border-emerald-300/16 dark:bg-[rgba(255,255,255,0.06)] dark:hover:bg-[rgba(255,255,255,0.10)]"
              : "border-cyan-200/35 bg-[rgba(238,255,252,0.36)] hover:bg-[rgba(245,255,254,0.48)] dark:border-cyan-300/12 dark:bg-[rgba(255,255,255,0.05)] dark:hover:bg-[rgba(255,255,255,0.09)]",
              "shadow-[0_14px_34px_rgba(8,145,178,0.06),inset_0_1px_0_rgba(255,255,255,0.68)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]",
            )}
            style={{
              animationDelay: `${Math.min(index * 45, 180)}ms`,
            }}
          >
            <span
              className={`pointer-events-none absolute left-0 top-0 h-full w-[2.5px] transition-opacity duration-300 ${
                session.status === "active"
                  ? "bg-emerald-300/70 opacity-90 group-hover:opacity-100 dark:bg-emerald-300/40"
                : "bg-cyan-200/70 opacity-70 group-hover:opacity-90 dark:bg-cyan-300/22"
              }`}
            />
            <CardContent className="relative z-10 space-y-3 p-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div
                  className={cn(
                    "min-w-0",
                    session.bookCoverUrl ? "flex flex-1 items-start gap-3" : "space-y-0.5",
                  )}
                >
                  {session.bookCoverUrl ? (
                    <div
                      aria-hidden="true"
                      className="h-20 w-14 shrink-0 rounded-md border border-cyan-200/35 bg-white/20 bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-cyan-300/10 dark:bg-white/8"
                      style={{ backgroundImage: `url(${session.bookCoverUrl})` }}
                    />
                  ) : null}
                  <div className={cn("min-w-0 space-y-0.5", session.bookCoverUrl ? "flex-1" : "")}>
                    <p className="line-clamp-1 text-base font-semibold tracking-tight text-foreground">
                      {session.title ?? session.bookTitle}
                    </p>
                    {session.title ? (
                      <p className="line-clamp-1 text-sm text-muted-foreground/90">
                        Book: {session.bookTitle}
                      </p>
                    ) : null}
                    {session.authorName ? (
                      <p className="line-clamp-1 text-sm text-muted-foreground/80">
                        by {session.authorName}
                      </p>
                    ) : null}
                  </div>
                </div>
                {session.status === "active" ? (
                  <Badge className="rounded-full border border-emerald-300/45 bg-emerald-400/15 px-2.5 text-[11px] text-emerald-800 hover:bg-emerald-400/15 dark:border-emerald-300/20 dark:bg-emerald-400/12 dark:text-emerald-200">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
                    Ended
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-200/34 bg-[rgba(248,255,254,0.44)] px-2.5 py-2 dark:border-cyan-300/10 dark:bg-[rgba(255,255,255,0.05)]">
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
