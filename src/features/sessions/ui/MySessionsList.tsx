"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronRight,
  Clock3,
  Globe2,
  Grid3X3,
  ListOrdered,
  LockKeyhole,
  Radio,
  Repeat2,
  type LucideIcon,
  Rows3,
  Search,
  ShieldCheck,
  Sparkles,
  StretchHorizontal,
  Trash2,
  Users,
  X,
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
import { buildSessionInviteCodeFromSessionId, buildSessionInvitePathFromSessionId } from "@/features/sessions/lib/inviteLinks";
import { hexToRgba, useThemeGlow } from "@/hooks/useThemeGlow";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SessionListItem } from "../types";
import { CreateSessionModal } from "./CreateSessionModal";
import { api } from "../../../../convex/_generated/api";

type SessionsViewMode = "list" | "compact" | "grid";
type SessionStatusFilter = "all" | "active" | "ended";
type SessionsSortMode = "recent" | "title" | "active-first";

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

function formatRelativeTimeLabel(timestamp: number, now: number) {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 5) {
    return `${weeks}w ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(days / 365)}y ago`;
}

function resolveAccessMeta(accessType: SessionListItem["accessType"]) {
  switch (accessType) {
    case "private":
      return { label: "Private", icon: ShieldCheck };
    case "passcode":
      return { label: "Passcode", icon: LockKeyhole };
    case "public":
    default:
      return { label: "Public", icon: Globe2 };
  }
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

type ControlButtonProps = {
  active: boolean;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
};

function ControlButton({ active, label, icon: Icon, onClick }: ControlButtonProps) {
  const { itemShadow } = useThemeGlow();

  return (
    <Button
      type="button"
      size="xs"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      className={cn(
        "h-7 gap-1.5 rounded-lg px-2.5 text-[11px]",
        active
          ? "border border-black/10 bg-white/52 text-foreground hover:bg-white/60 dark:border-white/12 dark:bg-white/12 dark:hover:bg-white/16"
          : "text-muted-foreground hover:text-foreground",
      )}
      style={active ? { boxShadow: itemShadow } : undefined}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
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

type SessionStatProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  compact?: boolean;
};

function SessionStat({
  icon: Icon,
  label,
  value,
  hint,
  compact = false,
}: SessionStatProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-black/8 bg-white/28 px-3 py-2.5 dark:border-white/10 dark:bg-white/8",
        compact ? "space-y-1.5" : "space-y-2",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/85">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p
        title={value}
        className={cn(
          "line-clamp-2 break-words font-semibold tracking-tight text-foreground",
          compact ? "text-sm" : "text-[15px]",
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground/75">{hint}</p>
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
  const accessMeta = resolveAccessMeta(session.accessType);
  const AccessIcon = accessMeta.icon;
  const participantCount = session.participantCount ?? 0;
  const activeQueueCount = session.activeQueueCount ?? 0;
  const liveReaderLabel =
    session.currentReaderName ??
    (session.status === "active" ? "Waiting to start" : "No active reader");
  const timelineLabel =
    session.status === "ended" && session.endedAt
      ? `Ended ${formatDateLabel(session.endedAt)} at ${formatTimeLabel(session.endedAt)}`
      : `Created ${formatDateLabel(session.createdAt)} at ${formatTimeLabel(session.createdAt)}`;

  return (
    <div className="group relative">
      <Link href={buildSessionInvitePathFromSessionId(session._id)} className="block">
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
                <div
                  aria-hidden="true"
                  className="aspect-[5/3] w-full rounded-xl border border-black/8 bg-white/18 bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:border-white/10 dark:bg-white/8"
                  style={{ backgroundImage: `url(${session.bookCoverUrl})` }}
                />
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div
                  className={cn(
                    "min-w-0",
                    hasCover && !isGridView ? "flex items-start gap-3" : "space-y-2",
                  )}
                >
                  {hasCover && !isGridView ? (
                    <div
                      aria-hidden="true"
                      className="h-[88px] w-[60px] shrink-0 rounded-lg border border-black/8 bg-white/18 bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/8"
                      style={{ backgroundImage: `url(${session.bookCoverUrl})` }}
                    />
                  ) : null}

                  <div className={cn("min-w-0 space-y-2", hasCover && !isGridView ? "flex-1" : "")}>
                    <div className="space-y-1">
                      <p
                        className={cn(
                          "line-clamp-2 font-semibold tracking-tight text-foreground",
                          isCompactView ? "text-[15px]" : "text-base md:text-[18px]",
                        )}
                      >
                        {session.title ?? session.bookTitle}
                      </p>
                      <div className="space-y-0.5">
                        <p className={cn("line-clamp-1 text-foreground/78", isCompactView ? "text-xs" : "text-sm")}>
                          {session.title ? `Book: ${session.bookTitle}` : session.bookTitle}
                        </p>
                        <p className={cn("line-clamp-1 text-muted-foreground/85", isCompactView ? "text-xs" : "text-sm")}>
                          {session.authorName ? `by ${session.authorName}` : "Author unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="rounded-full border border-black/8 bg-white/44 px-2.5 text-[11px] text-foreground dark:border-white/12 dark:bg-white/10"
                      >
                        <AccessIcon className="size-3.5" />
                        {accessMeta.label}
                      </Badge>

                      {session.isRepeatEnabled ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full border border-black/8 bg-white/38 px-2.5 text-[11px] text-foreground/85 dark:border-white/12 dark:bg-white/8"
                        >
                          <Repeat2 className="size-3.5" />
                          Repeat queue
                        </Badge>
                      ) : null}

                      {!isCompactView ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/30 px-2.5 py-1.5 text-[11px] text-muted-foreground dark:border-white/10 dark:bg-white/8">
                          <Clock3 className="size-3.5 shrink-0" />
                          Started {formatRelativeTimeLabel(session.createdAt, now)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-start gap-2 sm:flex-col sm:items-end">
                  <StatusBadge status={session.status} endedAt={session.endedAt} now={now} />
                </div>
              </div>

              {!isCompactView && session.synopsis ? (
                <div className="rounded-xl border border-black/8 bg-white/28 px-3 py-3 dark:border-white/10 dark:bg-white/8">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                    Session note
                  </p>
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground/88 dark:text-foreground/84">
                    {session.synopsis}
                  </p>
                </div>
              ) : null}

              <div className={cn("grid gap-2", isCompactView ? "grid-cols-2" : "sm:grid-cols-3")}>
                <SessionStat
                  icon={Users}
                  label="Readers"
                  value={String(participantCount)}
                  hint={session.status === "active" ? "currently in room" : "joined this session"}
                  compact={isCompactView}
                />
                <SessionStat
                  icon={ListOrdered}
                  label="Queue"
                  value={String(activeQueueCount)}
                  hint={session.status === "active" ? "still in rotation" : "queue entries kept"}
                  compact={isCompactView}
                />
                <SessionStat
                  icon={Radio}
                  label="Live reader"
                  value={liveReaderLabel}
                  hint={
                    session.status === "active"
                      ? "who is reading right now"
                      : "latest active reading state"
                  }
                  compact={isCompactView}
                />
              </div>

              <div className={cn("grid gap-2", isCompactView ? "grid-cols-1" : "sm:grid-cols-2")}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/30 px-2.5 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                  <Clock3 className="size-3.5 shrink-0" />
                  Elapsed: {elapsed}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/30 px-2.5 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {timelineLabel}
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
                  Invite code: {buildSessionInviteCodeFromSessionId(session._id)}
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
              className="size-7 rounded-lg text-muted-foreground/45 opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-red-950/50"
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
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>(() => {
    if (typeof window === "undefined") return "all";
    const stored = window.localStorage.getItem("sessions-status-filter");
    return stored === "all" || stored === "active" || stored === "ended" ? stored : "all";
  });
  const [sortMode, setSortMode] = useState<SessionsSortMode>(() => {
    if (typeof window === "undefined") return "recent";
    const stored = window.localStorage.getItem("sessions-sort-mode");
    return stored === "recent" || stored === "title" || stored === "active-first"
      ? stored
      : "recent";
  });

  function handleViewModeChange(mode: SessionsViewMode) {
    setViewMode(mode);
    window.localStorage.setItem("sessions-view-mode", mode);
  }

  function handleStatusFilterChange(mode: SessionStatusFilter) {
    setStatusFilter(mode);
    window.localStorage.setItem("sessions-status-filter", mode);
  }

  function handleSortModeChange(mode: SessionsSortMode) {
    setSortMode(mode);
    window.localStorage.setItem("sessions-sort-mode", mode);
  }

  function resetListingControls() {
    setSearchQuery("");
    handleStatusFilterChange("all");
    handleSortModeChange("recent");
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
  const sessionSummary = useMemo(() => {
    const active = normalizedSessions.filter((session) => session.status === "active").length;
    const ended = normalizedSessions.length - active;
    const participantTotal = normalizedSessions.reduce(
      (total, session) => total + (session.participantCount ?? 0),
      0,
    );
    const queueTotal = normalizedSessions.reduce(
      (total, session) => total + (session.activeQueueCount ?? 0),
      0,
    );

    return {
      total: normalizedSessions.length,
      active,
      ended,
      participantTotal,
      queueTotal,
    };
  }, [normalizedSessions]);
  const filteredSessions = useMemo(() => {
    const filtered = normalizedSessions.filter((session) => {
      const matchesStatus =
        statusFilter === "all" ? true : session.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchFields = [
        session.title,
        session.bookTitle,
        session.authorName,
        session.hostName,
        session._id,
        buildSessionInviteCodeFromSessionId(session._id),
        session.currentReaderName,
      ];

      return searchFields.some(
        (value) => typeof value === "string" && value.toLowerCase().includes(normalizedSearch),
      );
    });

    filtered.sort((left, right) => {
      switch (sortMode) {
        case "title":
          return (left.title ?? left.bookTitle).localeCompare(right.title ?? right.bookTitle);
        case "active-first":
          if (left.status !== right.status) {
            return left.status === "active" ? -1 : 1;
          }
          return right.createdAt - left.createdAt;
        case "recent":
        default:
          return right.createdAt - left.createdAt;
      }
    });

    return filtered;
  }, [normalizedSearch, normalizedSessions, sortMode, statusFilter]);
  const hasActiveControls =
    searchQuery.trim().length > 0 || statusFilter !== "all" || sortMode !== "recent";

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
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-black/8 bg-white/30 px-3 py-3 dark:border-white/10 dark:bg-white/8">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              Hosted
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {sessionSummary.total}
            </p>
            <p className="text-xs text-muted-foreground">Total rooms in your library</p>
          </div>
          <div className="rounded-xl border border-black/8 bg-white/30 px-3 py-3 dark:border-white/10 dark:bg-white/8">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              Active now
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {sessionSummary.active}
            </p>
            <p className="text-xs text-muted-foreground">
              {sessionSummary.ended} ended session{sessionSummary.ended === 1 ? "" : "s"} archived
            </p>
          </div>
          <div className="rounded-xl border border-black/8 bg-white/30 px-3 py-3 dark:border-white/10 dark:bg-white/8">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              Readers + queue
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {sessionSummary.participantTotal}
            </p>
            <p className="text-xs text-muted-foreground">
              {sessionSummary.queueTotal} queued across your sessions
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, book, author, host, or invite code..."
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

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              Filter
            </span>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/10 bg-white/42 p-1 dark:border-white/12 dark:bg-white/8">
              <ControlButton
                active={statusFilter === "all"}
                label={`All (${sessionSummary.total})`}
                onClick={() => handleStatusFilterChange("all")}
              />
              <ControlButton
                active={statusFilter === "active"}
                label={`Active (${sessionSummary.active})`}
                onClick={() => handleStatusFilterChange("active")}
              />
              <ControlButton
                active={statusFilter === "ended"}
                label={`Ended (${sessionSummary.ended})`}
                onClick={() => handleStatusFilterChange("ended")}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              Sort
            </span>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/10 bg-white/42 p-1 dark:border-white/12 dark:bg-white/8">
              <ControlButton
                active={sortMode === "recent"}
                label="Recent"
                icon={ArrowUpDown}
                onClick={() => handleSortModeChange("recent")}
              />
              <ControlButton
                active={sortMode === "active-first"}
                label="Active first"
                icon={Radio}
                onClick={() => handleSortModeChange("active-first")}
              />
              <ControlButton
                active={sortMode === "title"}
                label="A-Z"
                icon={Rows3}
                onClick={() => handleSortModeChange("title")}
              />
            </div>

            {hasActiveControls ? (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="h-7 rounded-lg px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={resetListingControls}
              >
                <X className="size-3.5" />
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        <p className="px-1 text-xs text-muted-foreground">
          Showing {filteredSessions.length} of {normalizedSessions.length} sessions
        </p>
      </div>

      {filteredSessions.length === 0 ? (
        <Card className="border-black/8 bg-white/18 py-4 backdrop-blur-xl dark:border-white/12 dark:bg-white/6">
          <CardContent className="px-4 text-sm text-muted-foreground">
            {searchQuery.trim().length > 0 ? (
              <>
                No sessions match <span className="font-medium text-foreground">&quot;{searchQuery}&quot;</span>.
              </>
            ) : (
              <>No sessions match the current filters.</>
            )}
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
