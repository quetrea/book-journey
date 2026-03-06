"use client";

import { useMutation, useQuery } from "convex/react";
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
  Sparkles,
  StretchHorizontal,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { hexToRgba, useThemeGlow } from "@/hooks/useThemeGlow";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SessionListItem } from "../types";
import { CreateSessionModal } from "./CreateSessionModal";
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
  const { itemShadow } = useThemeGlow();
  const isActive = mode === activeMode;

  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? "secondary" : "ghost"}
      onClick={() => onSelect(mode)}
      className={cn(
        "h-8 flex-1 gap-1.5 rounded-lg px-2.5 text-xs sm:flex-none",
        isActive
          ? "border border-black/10 bg-white/48 text-foreground hover:bg-white/60 dark:border-white/12 dark:bg-white/10 dark:hover:bg-white/14"
          : "text-muted-foreground hover:text-foreground",
      )}
      style={isActive ? { boxShadow: itemShadow } : undefined}
    >
      <Icon className="size-3.5" />
      {label}
    </Button>
  );
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function StatusBadge({ status, endedAt, now }: { status: SessionListItem["status"]; endedAt?: number; now: number }) {
  const { orb } = useThemeGlow();

  if (status === "active") {
    return (
      <Badge className="rounded-full border border-black/10 bg-white/48 px-2.5 text-[11px] text-foreground hover:bg-white/48 dark:border-white/12 dark:bg-white/10 dark:text-white">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: hexToRgba(orb, 0.85) }}
        />
        Active
      </Badge>
    );
  }

  const daysLeft =
    endedAt !== undefined
      ? Math.max(0, Math.ceil((endedAt + SEVEN_DAYS_MS - now) / (1000 * 60 * 60 * 24)))
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
            "border-black/8 bg-white/18 px-4 py-4 backdrop-blur-xl dark:border-white/12 dark:bg-white/6",
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

type SessionCardProps = {
  session: SessionListItem;
  viewMode: SessionsViewMode;
  now: number;
  index: number;
};

function SessionCard({ session, viewMode, now, index }: SessionCardProps) {
  const deleteSession = useMutation(api.sessions.deleteSessionServer);
  const { itemShadow, orb, isDark } = useThemeGlow();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await deleteSession({ sessionId: session._id as any });
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  const finishedAt = session.status === "ended" ? (session.endedAt ?? session.createdAt) : now;
  const elapsed = formatElapsed(finishedAt - session.createdAt);
  const isCompactView = viewMode === "compact";
  const isGridView = viewMode === "grid";
  const hasCover = Boolean(session.bookCoverUrl) && !isCompactView;

  return (
    <div className="group relative">
      <Link href={`/s/${session._id}`} className="block">
        <Card
          className={cn(
            "relative isolate gap-0 overflow-hidden backdrop-blur-md transition-all duration-250 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-1",
            session.status === "active"
              ? "border-black/10 bg-white/26 hover:bg-white/34 dark:border-white/12 dark:bg-white/8 dark:hover:bg-white/12"
              : "border-black/8 bg-white/18 hover:bg-white/26 dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10",
            isCompactView ? "px-3 py-3" : "px-4 py-4",
            isGridView ? "h-full" : "",
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
          } as React.CSSProperties}
        >
          {/* Status accent bar */}
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

          <CardContent className="relative z-10 p-0">
            <div className={cn("space-y-3.5", isCompactView ? "space-y-2.5" : "")}>
              {hasCover && isGridView ? (
                <div className="space-y-3">
                    <div
                      aria-hidden="true"
                      className="aspect-[5/3] w-full rounded-xl border border-black/8 bg-white/18 bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/10 dark:bg-white/8"
                      style={{ backgroundImage: `url(${session.bookCoverUrl})` }}
                    />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1 pr-4 sm:pr-6">
                      <p
                        className={cn(
                          "line-clamp-1 font-semibold tracking-tight text-foreground",
                          isCompactView ? "text-[15px]" : "text-base md:text-[18px]",
                        )}
                      >
                        {session.title ?? session.bookTitle}
                      </p>
                      <p className={cn("line-clamp-1 text-muted-foreground/90", isCompactView ? "text-xs" : "text-sm")}>
                        {session.title ? `Book: ${session.bookTitle}` : session.bookTitle}
                      </p>
                      <p className={cn("line-clamp-1 text-muted-foreground/90", isCompactView ? "text-xs" : "text-sm")}>
                        {session.authorName ? `by ${session.authorName}` : "Author unknown"}
                      </p>
                    </div>

                    <StatusBadge status={session.status} endedAt={session.endedAt} now={now} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div
                    className={cn(
                      "min-w-0 pr-4 sm:pr-6",
                      hasCover ? "flex flex-1 items-start gap-3" : "space-y-1",
                    )}
                  >
                    {hasCover ? (
                      <div
                        aria-hidden="true"
                        className="h-20 w-14 shrink-0 rounded-md border border-black/8 bg-white/18 bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/8"
                        style={{ backgroundImage: `url(${session.bookCoverUrl})` }}
                      />
                    ) : null}
                    <div className={cn("min-w-0 space-y-1", hasCover ? "flex-1" : "")}>
                      <p
                        className={cn(
                          "line-clamp-1 font-semibold tracking-tight text-foreground",
                          isCompactView ? "text-[15px]" : "text-base md:text-[18px]",
                        )}
                      >
                        {session.title ?? session.bookTitle}
                      </p>
                      <p className={cn("line-clamp-1 text-muted-foreground/90", isCompactView ? "text-xs" : "text-sm")}>
                        {session.title ? `Book: ${session.bookTitle}` : session.bookTitle}
                      </p>
                      <p className={cn("line-clamp-1 text-muted-foreground/90", isCompactView ? "text-xs" : "text-sm")}>
                        {session.authorName ? `by ${session.authorName}` : "Author unknown"}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={session.status} endedAt={session.endedAt} now={now} />
                </div>
              )}

              {!isCompactView && session.synopsis ? (
                <p className="line-clamp-3 rounded-xl border border-black/8 bg-white/26 px-3 py-2 text-sm leading-relaxed text-foreground/85 dark:border-white/10 dark:bg-white/8 dark:text-foreground/80">
                  {session.synopsis}
                </p>
              ) : null}

              <div className={cn("grid gap-2", isCompactView ? "grid-cols-1" : "sm:grid-cols-2")}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/30 px-2.5 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                  <Clock3 className="size-3.5 shrink-0" />
                  Elapsed: {elapsed}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/30 px-2.5 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {formatDateLabel(session.createdAt)} at {formatTimeLabel(session.createdAt)}
                </span>
              </div>

              <div
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border border-black/8 bg-white/26 dark:border-white/10 dark:bg-white/8",
                  isCompactView ? "px-2 py-1.5" : "px-2.5 py-2",
                )}
              >
                <div className="inline-flex min-w-0 items-center gap-2">
                  <Avatar size="sm" className="ring-1 ring-black/10 dark:ring-white/20">
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
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 transition-colors group-hover:text-muted-foreground">
                  Open
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>

              {!isCompactView ? (
                <div className="border-t border-black/8 pt-2 text-[11px] text-muted-foreground/70 dark:border-white/10">
                  Session ID: {session._id}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Delete button — outside Link to avoid navigation */}
      <div className="absolute right-2.5 top-2.5 z-10">
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground/40 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/50"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this session?</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{session.title ?? session.bookTitle}&quot; and all its data (queue, words, participants) will be permanently deleted. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={() => { void handleDelete(); }}
              >
                {isDeleting ? "Deleting..." : "Delete session"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function MySessionsList() {
  const sessions = useQuery(api.sessions.listMySessionsServer);

  const [now, setNow] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<SessionsViewMode>(() => {
    if (typeof window === "undefined") return "list";
    const stored = window.localStorage.getItem("sessions-view-mode");
    return stored === "list" || stored === "compact" || stored === "grid" ? stored : "list";
  });

  function handleViewModeChange(mode: SessionsViewMode) {
    setViewMode(mode);
    window.localStorage.setItem("sessions-view-mode", mode);
  }

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
      <Card className="border-black/8 bg-white/18 py-8 backdrop-blur-[24px] dark:border-white/12 dark:bg-black/18">
        <CardContent className="relative flex min-h-44 flex-col items-center justify-center gap-2.5 px-4 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-white/46 text-foreground dark:border-white/12 dark:bg-white/10 dark:text-white">
            <Sparkles className="size-5" />
          </span>
          <p className="text-base font-semibold text-foreground">No sessions yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first session and start reading live with your group.
          </p>
          <div className="pt-1">
            <CreateSessionModal />
          </div>
        </CardContent>
      </Card>
    );
  }

  const sessionsWrapperClass =
    viewMode === "grid" ? "grid gap-2.5 md:grid-cols-2" : "space-y-2.5";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-black/8 bg-white/18 p-2.5 backdrop-blur-xl dark:border-white/12 dark:bg-white/6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, book, author, host, or session ID..."
              className="h-9 border-black/10 bg-white/42 pl-9 text-sm dark:border-white/12 dark:bg-white/8"
            />
          </div>

          <div className="grid w-full grid-cols-3 items-center rounded-xl border border-black/10 bg-white/42 p-1 dark:border-white/12 dark:bg-white/8 sm:inline-flex sm:w-auto">
            <ViewToggleButton
              mode="list"
              activeMode={viewMode}
              onSelect={handleViewModeChange}
              icon={Rows3}
              label="List"
            />
            <ViewToggleButton
              mode="compact"
              activeMode={viewMode}
              onSelect={handleViewModeChange}
              icon={StretchHorizontal}
              label="Compact"
            />
            <ViewToggleButton
              mode="grid"
              activeMode={viewMode}
              onSelect={handleViewModeChange}
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
        <Card className="border-black/8 bg-white/18 py-4 backdrop-blur-xl dark:border-white/12 dark:bg-white/6">
          <CardContent className="px-4 text-sm text-muted-foreground">
            No sessions match <span className="font-medium text-foreground">&quot;{searchQuery}&quot;</span>.
          </CardContent>
        </Card>
      ) : null}

      <div className={sessionsWrapperClass}>
        {filteredSessions.map((session, index) => (
          <SessionCard
            key={session._id}
            session={session}
            viewMode={viewMode}
            now={now}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
