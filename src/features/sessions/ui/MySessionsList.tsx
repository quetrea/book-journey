"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Grid3X3,
  type LucideIcon,
  Rows3,
  Search,
  StretchHorizontal,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SessionListItem } from "../types";
import { api } from "../../../../convex/_generated/api";

type SessionsViewMode = "list" | "compact" | "grid";

function formatDateLabel(timestamp: number) {
  const now = new Date();
  const date = new Date(timestamp);
  const isToday = now.toDateString() === date.toDateString();

  if (isToday) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatElapsed(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatTimeLabel(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

type ViewToggleButtonProps = {
  mode: SessionsViewMode;
  activeMode: SessionsViewMode;
  onSelect: (mode: SessionsViewMode) => void;
  icon: LucideIcon;
  label: string;
};

function ViewToggleButton({
  mode,
  activeMode,
  onSelect,
  icon: Icon,
  label,
}: ViewToggleButtonProps) {
  const isActive = mode === activeMode;

  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? "secondary" : "ghost"}
      onClick={() => onSelect(mode)}
      className={cn(
        "h-8 gap-1.5 rounded-lg px-2.5 text-xs",
        isActive
          ? "bg-white/80 text-foreground hover:bg-white/90 dark:bg-white/15 dark:hover:bg-white/20"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </Button>
  );
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function StatusBadge({ status, endedAt }: { status: SessionListItem["status"]; endedAt?: number }) {
  if (status === "active") {
    return (
      <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
        Active
      </Badge>
    );
  }

  const daysLeft =
    endedAt !== undefined
      ? Math.max(0, Math.ceil((endedAt + SEVEN_DAYS_MS - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
        Ended
      </Badge>
      {daysLeft !== null ? (
        <span className="whitespace-nowrap text-[10px] text-muted-foreground/65">
          {daysLeft > 0 ? `Deletes in ${daysLeft}d` : "Deleting soon"}
        </span>
      ) : null}
    </div>
  );
}

function renderLoadingSkeleton(viewMode: SessionsViewMode) {
  const skeletonGridClass =
    viewMode === "grid" ? "grid gap-2.5 md:grid-cols-2" : "space-y-2.5";

  return (
    <div className={skeletonGridClass}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card
          key={`sessions-skeleton-${index}`}
          className={cn(
            "border-white/[0.34] bg-white/[0.58] px-4 py-4 backdrop-blur-md dark:border-white/[0.12] dark:bg-white/[0.07]",
            viewMode === "grid" ? "h-full" : "",
          )}
        >
          <CardContent className="space-y-3 p-0">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-18 rounded-full" />
              <Skeleton className="h-6 w-22 rounded-full" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MySessionsList() {
  const sessions = useQuery(api.sessions.listMySessionsServer);

  const [now, setNow] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<SessionsViewMode>("list");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const normalizedSessions = useMemo(() => sessions ?? [], [sessions]);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredSessions = useMemo(() => {
    if (!normalizedSearch) {
      return normalizedSessions;
    }

    return normalizedSessions.filter((session) => {
      const searchFields = [
        session.title,
        session.bookTitle,
        session.authorName,
        session.hostName,
        session._id,
      ];

      return searchFields.some(
        (value) => typeof value === "string" && value.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [normalizedSearch, normalizedSessions]);

  if (sessions === undefined) {
    return renderLoadingSkeleton(viewMode);
  }

  if (normalizedSessions.length === 0) {
    return (
      <Card className="border-white/[0.35] bg-white/[0.44] py-4 dark:border-white/[0.12] dark:bg-white/[0.04]">
        <CardContent className="px-4 text-sm text-muted-foreground">
          No sessions yet. Create one to start reading live.
        </CardContent>
      </Card>
    );
  }

  const sessionsWrapperClass =
    viewMode === "grid" ? "grid gap-2.5 md:grid-cols-2" : "space-y-2.5";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.38] bg-white/[0.5] p-2.5 backdrop-blur-md dark:border-white/[0.12] dark:bg-white/[0.06]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, book, author, host, or session ID..."
              className="h-9 border-white/45 bg-white/70 pl-9 text-sm dark:border-white/14 dark:bg-white/8"
            />
          </div>

          <div className="inline-flex items-center rounded-xl border border-white/50 bg-white/70 p-1 dark:border-white/14 dark:bg-white/10">
            <ViewToggleButton
              mode="list"
              activeMode={viewMode}
              onSelect={setViewMode}
              icon={Rows3}
              label="List"
            />
            <ViewToggleButton
              mode="compact"
              activeMode={viewMode}
              onSelect={setViewMode}
              icon={StretchHorizontal}
              label="Compact"
            />
            <ViewToggleButton
              mode="grid"
              activeMode={viewMode}
              onSelect={setViewMode}
              icon={Grid3X3}
              label="Grid"
            />
          </div>
        </div>

        <p className="px-1 text-xs text-muted-foreground">
          Showing {filteredSessions.length} of {normalizedSessions.length} sessions
        </p>
      </div>

      {filteredSessions.length === 0 ? (
        <Card className="border-white/[0.35] bg-white/[0.44] py-4 dark:border-white/[0.12] dark:bg-white/[0.04]">
          <CardContent className="px-4 text-sm text-muted-foreground">
            No sessions match <span className="font-medium text-foreground">&quot;{searchQuery}&quot;</span>.
          </CardContent>
        </Card>
      ) : null}

      <div className={sessionsWrapperClass}>
        {filteredSessions.map((session, index) => {
          const finishedAt =
            session.status === "ended" ? (session.endedAt ?? session.createdAt) : now;
          const elapsed = formatElapsed(finishedAt - session.createdAt);
          const isCompactView = viewMode === "compact";
          const isGridView = viewMode === "grid";

          return (
            <Link key={session._id} href={`/s/${session._id}`} className="block">
              <Card
                className={cn(
                  "relative gap-0 overflow-hidden border-white/[0.36] bg-white/[0.62] shadow-[0_10px_24px_-18px_rgba(79,70,229,0.6)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.72] hover:shadow-[0_14px_26px_-16px_rgba(79,70,229,0.7)] animate-in fade-in slide-in-from-bottom-1 dark:border-white/[0.12] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]",
                  isCompactView ? "px-3 py-3" : "px-4 py-4",
                  isGridView ? "h-full" : "",
                )}
                style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}
              >
                <span
                  className={`pointer-events-none absolute left-0 top-0 h-full w-[2px] ${
                    session.status === "active"
                      ? "bg-gradient-to-b from-emerald-400/95 via-emerald-300/80 to-transparent"
                      : "bg-gradient-to-b from-slate-300/80 to-transparent dark:from-slate-400/45"
                  }`}
                />

                <CardContent className="p-0">
                  <div className={cn("space-y-3.5", isCompactView ? "space-y-2.5" : "") }>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p
                          className={cn(
                            "line-clamp-1 font-semibold tracking-tight text-foreground",
                            isCompactView ? "text-[15px]" : "text-base md:text-[18px]",
                          )}
                        >
                          {session.title ?? session.bookTitle}
                        </p>
                        <p className={cn("line-clamp-1 text-muted-foreground/90", isCompactView ? "text-xs" : "text-sm") }>
                          {session.title ? `Book: ${session.bookTitle}` : session.bookTitle}
                        </p>
                        <p className={cn("line-clamp-1 text-muted-foreground/90", isCompactView ? "text-xs" : "text-sm") }>
                          {session.authorName ? `by ${session.authorName}` : "Author unknown"}
                        </p>
                      </div>

                      <StatusBadge status={session.status} endedAt={session.endedAt} />
                    </div>

                    {!isCompactView && session.synopsis ? (
                      <p className="line-clamp-3 rounded-xl border border-white/45 bg-white/55 px-3 py-2 text-sm leading-relaxed text-foreground/85 dark:border-white/10 dark:bg-white/[0.07] dark:text-foreground/80">
                        {session.synopsis}
                      </p>
                    ) : null}

                    <div className={cn("grid gap-2", isCompactView ? "grid-cols-1" : "sm:grid-cols-2") }>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-2.5 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                        <Clock3 className="size-3.5" />
                        Elapsed: {elapsed}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-2.5 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                        <CalendarDays className="size-3.5" />
                        {formatDateLabel(session.createdAt)} at {formatTimeLabel(session.createdAt)}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl border border-white/45 bg-white/58 dark:border-white/10 dark:bg-white/[0.07]",
                        isCompactView ? "px-2 py-1.5" : "px-2.5 py-2",
                      )}
                    >
                      <div className="inline-flex min-w-0 items-center gap-2">
                        <Avatar size="sm" className="ring-1 ring-white/70 dark:ring-white/20">
                          <AvatarImage
                            src={session.hostImage ?? undefined}
                            alt={session.hostName ?? "Host"}
                          />
                          <AvatarFallback>{getInitials(session.hostName ?? "H")}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-xs text-muted-foreground">
                          Hosted by <span className="font-medium text-foreground">{session.hostName ?? "Unknown"}</span>
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/85">
                        Open
                        <ChevronRight className="size-3.5" />
                      </span>
                    </div>

                    {!isCompactView ? (
                      <div className="border-t border-white/45 pt-2 text-[11px] text-muted-foreground/85 dark:border-white/10">
                        Session ID: {session._id}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
