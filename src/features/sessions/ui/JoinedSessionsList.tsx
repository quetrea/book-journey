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
            className="border-black/8 bg-white/65 px-4 py-4 shadow-sm backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/12 dark:bg-white/7 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
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
      <Card className="relative overflow-hidden border-white/45 bg-linear-to-br from-white/82 via-white/62 to-emerald-100/36 py-8 shadow-[0_20px_60px_rgba(16,185,129,0.13),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl dark:border-white/15 dark:from-white/12 dark:via-white/7 dark:to-emerald-500/16 dark:shadow-[0_20px_60px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <CardContent className="relative flex min-h-44 flex-col items-center justify-center gap-2.5 px-4 text-center">
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-20%,rgba(16,185,129,0.18),transparent_60%)]" />
          <span className="pointer-events-none absolute -top-20 left-1/2 size-56 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-400/20" />
          <span className="inline-flex size-10 items-center justify-center rounded-full border border-emerald-200/70 bg-white/80 text-emerald-600 dark:border-emerald-300/25 dark:bg-white/10 dark:text-emerald-300">
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
                ? "border-emerald-200/60 bg-white/70 hover:bg-white/80 dark:border-emerald-400/20 dark:bg-white/9 dark:hover:bg-white/13"
              : "border-black/8 bg-white/65 hover:bg-white/78 dark:border-white/12 dark:bg-white/8 dark:hover:bg-white/12",
              "shadow-sm",
            )}
            style={{
              animationDelay: `${Math.min(index * 45, 180)}ms`,
            }}
          >
            <span
              className={`pointer-events-none absolute left-0 top-0 h-full w-[2.5px] transition-opacity duration-300 ${
                session.status === "active"
                  ? "bg-linear-to-b from-emerald-400 via-emerald-300/70 to-transparent opacity-90 group-hover:opacity-100"
                  : "bg-linear-to-b from-slate-300/70 to-transparent opacity-60 group-hover:opacity-80 dark:from-slate-400/40"
              }`}
            />
            <span
              className={cn(
                "pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                session.status === "active"
                  ? "bg-[radial-gradient(130%_80%_at_50%_0%,rgba(16,185,129,0.22),rgba(255,255,255,0.02)_60%)] dark:bg-[radial-gradient(130%_80%_at_50%_0%,rgba(16,185,129,0.2),rgba(255,255,255,0.02)_60%)]"
                  : "bg-[radial-gradient(120%_75%_at_50%_0%,rgba(148,163,184,0.18),rgba(255,255,255,0.01)_62%)] dark:bg-[radial-gradient(120%_75%_at_50%_0%,rgba(148,163,184,0.15),rgba(255,255,255,0.01)_62%)]",
              )}
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
                      className="h-20 w-14 shrink-0 rounded-md border border-black/10 bg-black/5 bg-cover bg-center shadow-sm dark:border-white/12 dark:bg-white/10"
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
                  <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
                    Ended
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl border border-black/8 bg-white/55 px-2.5 py-2 dark:border-white/10 dark:bg-white/7">
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
