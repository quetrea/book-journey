"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronRight,
  Globe2,
  Grid3X3,
  LockKeyhole,
  MoreVertical,
  Pencil,
  Radio,
  type LucideIcon,
  Rows3,
  Search,
  ShieldCheck,
  Sparkles,
  StretchHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { buildSessionInviteCodeFromSessionId, buildSessionInvitePathFromSessionId } from "@/features/sessions/lib/inviteLinks";
import { hexToRgba, useThemeGlow } from "@/hooks/useThemeGlow";
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

  if (now.toDateString() === date.toDateString()) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
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

function StatusBadge({
  status,
  endedAt,
  now,
}: {
  status: SessionListItem["status"];
  endedAt?: number;
  now: number;
}) {
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
function SessionCover({
  session,
  viewMode,
}: {
  session: SessionListItem;
  viewMode: SessionsViewMode;
}) {
  const title = session.title ?? session.bookTitle;
  const isCompact = viewMode === "compact";
  const isGrid = viewMode === "grid";
  const hasCover = Boolean(session.bookCoverUrl);

  if (isCompact) {
    return (
      <div className="flex gap-3">
        <div
          className={cn(
            "relative w-[96px] shrink-0 overflow-hidden rounded-2xl border border-black/8 bg-linear-to-br from-white/70 via-white/20 to-black/10 dark:border-white/10 dark:from-white/12 dark:via-white/6 dark:to-black/30",
            hasCover ? "bg-cover bg-center" : "",
          )}
          style={hasCover ? { backgroundImage: `url(${session.bookCoverUrl})` } : undefined}
        >
          <div className="aspect-[3/4]" />
          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
        </div>

        <div className="min-w-0 flex-1 self-end">
          <p className="line-clamp-2 text-base font-semibold tracking-tight text-foreground">
            {title}
          </p>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground/85">
            {session.authorName ? `by ${session.authorName}` : session.bookTitle}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/72">
            Tap cover to enter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-black/8 bg-linear-to-br from-white/75 via-white/20 to-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:border-white/10 dark:from-white/12 dark:via-white/6 dark:to-black/30",
        isGrid ? "aspect-[4/5] w-full" : "aspect-[8/4.6] w-full",
        hasCover ? "bg-cover bg-center" : "",
      )}
      style={hasCover ? { backgroundImage: `url(${session.bookCoverUrl})` } : undefined}
    >
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/24 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="line-clamp-2 text-lg font-semibold tracking-tight text-white">
          {title}
        </p>
        <p className="mt-1 line-clamp-1 text-sm text-white/80">
          {session.authorName ? `by ${session.authorName}` : session.bookTitle}
        </p>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white/62">
          Open to see details
        </p>
      </div>
    </div>
  );
}

type EditSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionListItem;
};

function EditSessionDialog({ open, onOpenChange, session }: EditSessionDialogProps) {
  const updateSession = useMutation(api.sessions.updateSessionServer);
  const [bookTitle, setBookTitle] = useState(session.bookTitle);
  const [authorName, setAuthorName] = useState(session.authorName ?? "");
  const [title, setTitle] = useState(session.title ?? "");
  const [bookCoverUrl, setBookCoverUrl] = useState(session.bookCoverUrl ?? "");
  const [synopsis, setSynopsis] = useState(session.synopsis ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setBookTitle(session.bookTitle);
    setAuthorName(session.authorName ?? "");
    setTitle(session.title ?? "");
    setBookCoverUrl(session.bookCoverUrl ?? "");
    setSynopsis(session.synopsis ?? "");
  }, [open, session]);

  const normalizedBookTitle = bookTitle.trim();
  const normalizedAuthorName = authorName.trim();
  const normalizedTitle = title.trim();
  const normalizedBookCoverUrl = bookCoverUrl.trim();
  const normalizedSynopsis = synopsis.trim();

  const hasChanges =
    normalizedBookTitle !== session.bookTitle.trim() ||
    normalizedAuthorName !== (session.authorName ?? "").trim() ||
    normalizedTitle !== (session.title ?? "").trim() ||
    normalizedBookCoverUrl !== (session.bookCoverUrl ?? "").trim() ||
    normalizedSynopsis !== (session.synopsis ?? "").trim();

  async function handleSave() {
    if (!normalizedBookTitle) {
      toast.error("Book title cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      await updateSession({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessionId: session._id as any,
        bookTitle: normalizedBookTitle,
        authorName: normalizedAuthorName || undefined,
        title: normalizedTitle || undefined,
        bookCoverUrl: normalizedBookCoverUrl || undefined,
        synopsis: normalizedSynopsis || undefined,
      });
      toast.success("Session updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update session.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit session</DialogTitle>
          <DialogDescription>
            Update the card-facing book identity. Room details still live inside the session.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">Book title</label>
            <Input value={bookTitle} onChange={(event) => setBookTitle(event.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Session title</label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional display title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Author</label>
            <Input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">Book cover URL</label>
            <Input
              value={bookCoverUrl}
              onChange={(event) => setBookCoverUrl(event.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">Synopsis</label>
            <Textarea
              value={synopsis}
              onChange={(event) => setSynopsis(event.target.value)}
              placeholder="Optional session note"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => { void handleSave(); }} disabled={isSaving || !hasChanges}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
            </div>
            <Skeleton className="h-52 w-full rounded-[24px]" />
            <Skeleton className="h-12 w-full rounded-xl" />
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await deleteSession({ sessionId: session._id as any });
      setIsDeleteOpen(false);
      toast.success("Session deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete session.");
    } finally {
      setIsDeleting(false);
    }
  }

  const isCompactView = viewMode === "compact";
  const isGridView = viewMode === "grid";
  const accessMeta = resolveAccessMeta(session.accessType);
  const AccessIcon = accessMeta.icon;
  const participantCount = session.participantCount ?? 0;

  return (
    <div className="group relative">
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

        <CardContent className="relative z-10 p-0">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={session.status} endedAt={session.endedAt} now={now} />
                <Badge
                  variant="secondary"
                  className="rounded-full border border-black/8 bg-white/40 px-2.5 text-[11px] text-foreground dark:border-white/12 dark:bg-white/10"
                >
                  <AccessIcon className="size-3.5" />
                  {accessMeta.label}
                </Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-full text-muted-foreground/55 hover:text-foreground"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {session.status === "active" ? (
                    <>
                      <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
                        <Pencil className="size-4" />
                        Edit details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setIsDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Delete session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link href={buildSessionInvitePathFromSessionId(session._id)} className="block">
              <SessionCover session={session} viewMode={viewMode} />
            </Link>

            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white/24 dark:border-white/10 dark:bg-white/8",
                isCompactView ? "px-3 py-2.5" : "px-3.5 py-3",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {participantCount} reader{participantCount === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Started {formatRelativeTimeLabel(session.createdAt, now)}
                  {session.status === "ended" ? ` • ${formatDateLabel(session.endedAt ?? session.createdAt)} archive` : ""}
                </p>
              </div>

              <Link
                href={buildSessionInvitePathFromSessionId(session._id)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground/72 transition-colors hover:text-foreground"
              >
                Open
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditSessionDialog open={isEditOpen} onOpenChange={setIsEditOpen} session={session} />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
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
        session._id,
        buildSessionInviteCodeFromSessionId(session._id),
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
              placeholder="Search by title, book, author, or invite code..."
              className="h-9 border-black/10 bg-white/42 pl-9 text-sm dark:border-white/12 dark:bg-white/8"
            />
          </div>

          <div className="grid w-full grid-cols-3 items-center rounded-xl border border-black/10 bg-white/42 p-1 dark:border-white/12 dark:bg-white/8 sm:inline-flex sm:w-auto">
            <ViewToggleButton mode="list" activeMode={viewMode} onSelect={handleViewModeChange} icon={Rows3} label="List" />
            <ViewToggleButton mode="compact" activeMode={viewMode} onSelect={handleViewModeChange} icon={StretchHorizontal} label="Compact" />
            <ViewToggleButton mode="grid" activeMode={viewMode} onSelect={handleViewModeChange} icon={Grid3X3} label="Grid" />
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              Filter
            </span>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/10 bg-white/42 p-1 dark:border-white/12 dark:bg-white/8">
              <ControlButton active={statusFilter === "all"} label={`All (${sessionSummary.total})`} onClick={() => handleStatusFilterChange("all")} />
              <ControlButton active={statusFilter === "active"} label={`Active (${sessionSummary.active})`} onClick={() => handleStatusFilterChange("active")} />
              <ControlButton active={statusFilter === "ended"} label={`Ended (${sessionSummary.ended})`} onClick={() => handleStatusFilterChange("ended")} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              Sort
            </span>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/10 bg-white/42 p-1 dark:border-white/12 dark:bg-white/8">
              <ControlButton active={sortMode === "recent"} label="Recent" icon={ArrowUpDown} onClick={() => handleSortModeChange("recent")} />
              <ControlButton active={sortMode === "active-first"} label="Active first" icon={Radio} onClick={() => handleSortModeChange("active-first")} />
              <ControlButton active={sortMode === "title"} label="A-Z" icon={Rows3} onClick={() => handleSortModeChange("title")} />
            </div>

            {hasActiveControls ? (
              <Button type="button" size="xs" variant="ghost" className="h-7 rounded-lg px-2.5 text-[11px] text-muted-foreground hover:text-foreground" onClick={resetListingControls}>
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
          <SessionCard key={session._id} session={session} viewMode={viewMode} now={now} index={index} />
        ))}
      </div>
    </div>
  );
}

