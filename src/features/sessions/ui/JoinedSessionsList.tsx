"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { ChevronRight, DoorOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { hexToRgba, useThemeGlow } from "@/hooks/useThemeGlow";
import { cn } from "@/lib/utils";
import { buildSessionInvitePathFromSessionId } from "@/features/sessions/lib/inviteLinks";
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

function CoverPreview({
  title,
  authorName,
  coverUrl,
}: {
  title: string;
  authorName?: string;
  coverUrl?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[8/4.7] overflow-hidden rounded-[24px] border border-black/8 bg-linear-to-br from-white/75 via-white/20 to-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:border-white/10 dark:from-white/12 dark:via-white/6 dark:to-black/30",
        coverUrl ? "bg-cover bg-center" : "",
      )}
      style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
    >
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/24 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="line-clamp-2 text-lg font-semibold tracking-tight text-white">
          {title}
        </p>
        <p className="mt-1 line-clamp-1 text-sm text-white/80">
          {authorName ? `by ${authorName}` : "Open to see room details"}
        </p>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white/62">
          Enter from cover
        </p>
      </div>
    </div>
  );
}

export function JoinedSessionsList() {
  const { cardShadow, itemShadow, orb, isDark } = useThemeGlow();
  const sessions = useQuery(api.sessions.listJoinedSessionsServer);

  if (sessions === undefined) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card
            key={`joined-skeleton-${i}`}
            className="border-black/8 bg-white/18 px-4 py-4 backdrop-blur-xl dark:border-white/12 dark:bg-white/6"
            style={{ boxShadow: itemShadow }}
          >
            <CardContent className="space-y-3 p-0">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-52 w-full rounded-[24px]" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-black/8 bg-white/18 py-8 backdrop-blur-[24px] dark:border-white/12 dark:bg-black/18" style={{ boxShadow: cardShadow }}>
        <CardContent className="relative flex min-h-44 flex-col items-center justify-center gap-2.5 px-4 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-white/46 text-foreground dark:border-white/12 dark:bg-white/10 dark:text-white">
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
        <Card
          key={session._id}
          className={cn(
            "group relative isolate gap-0 overflow-hidden px-4 py-4 backdrop-blur-md transition-all duration-250 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-1",
            session.status === "active"
              ? "border-black/10 bg-white/26 hover:bg-white/34 dark:border-white/12 dark:bg-white/8 dark:hover:bg-white/12"
              : "border-black/8 bg-white/18 hover:bg-white/26 dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10",
          )}
          style={{
            animationDelay: `${Math.min(index * 45, 180)}ms`,
            boxShadow: itemShadow,
            backgroundColor:
              session.status === "active"
                ? isDark
                  ? hexToRgba(orb, 0.14)
                  : hexToRgba(orb, 0.08)
                : undefined,
          }}
        >
          <span
            className={`pointer-events-none absolute left-0 top-0 h-full w-[2.5px] transition-opacity duration-300 ${
              session.status === "active"
                ? "opacity-90 group-hover:opacity-100"
                : "opacity-70 group-hover:opacity-90"
            }`}
            style={{
              backgroundColor: hexToRgba(
                orb,
                session.status === "active" ? 0.58 : 0.36,
              ),
            }}
          />

          <CardContent className="relative z-10 space-y-3 p-0">
            <div className="flex items-start justify-between gap-2">
              {session.status === "active" ? (
                <Badge className="rounded-full border border-black/10 bg-white/48 px-2.5 text-[11px] text-foreground hover:bg-white/48 dark:border-white/12 dark:bg-white/10 dark:text-white">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
                  Ended
                </Badge>
              )}
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/72">
                Joined {formatDateLabel(session.joinedAt)}
              </span>
            </div>

            <Link href={buildSessionInvitePathFromSessionId(session._id)} className="block">
              <CoverPreview
                title={session.title ?? session.bookTitle}
                authorName={session.authorName}
                coverUrl={session.bookCoverUrl}
              />
            </Link>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white/24 px-3.5 py-3 dark:border-white/10 dark:bg-white/8">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-medium text-foreground">
                  {session.hostName ?? "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">Host and room details are inside</p>
              </div>
              <Link
                href={buildSessionInvitePathFromSessionId(session._id)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground/72 transition-colors hover:text-foreground"
              >
                Open
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
