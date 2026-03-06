"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  BookOpenText,
  Clock3,
  Copy,
  Info,
  Pencil,
  Shuffle,
  Sparkles,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/formatters";
import type { SessionListItem } from "@/features/sessions/types";
import {
  buildSessionInviteCodeFromSessionId,
  buildSessionInviteUrl,
} from "@/features/sessions/lib/inviteLinks";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type SessionHeaderCardProps = {
  session: SessionListItem;
  hostName?: string;
  hostImage?: string;
  memberCount: number;
  bookCoverUrl?: string;
  isHost?: boolean;
  isModerator?: boolean;
  sessionId?: Id<"sessions">;
  isSessionEnded?: boolean;
};

type SessionAccessType = "public" | "passcode" | "private";
const PASSCODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function resolveSessionAccessType(session: SessionListItem): SessionAccessType {
  if (session.accessType) {
    return session.accessType;
  }
  if (session.isPrivate) {
    return "private";
  }
  return "public";
}

function buildRandomPasscode(length = 6) {
  let result = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * PASSCODE_CHARS.length);
    result += PASSCODE_CHARS[randomIndex];
  }
  return result;
}

function getMaskedPasscode(length: number) {
  return "•".repeat(Math.max(length, 8));
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatShortDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatFullDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export const SessionHeaderCard = memo(function SessionHeaderCard({
  session,
  hostName,
  hostImage,
  memberCount,
  bookCoverUrl,
  isHost,
  isModerator,
  sessionId,
  isSessionEnded,
}: SessionHeaderCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { cardShadow } = useThemeGlow();

  const canEdit = (isHost || isModerator) && !isSessionEnded && sessionId;
  const updateSession = useMutation(api.sessions.updateSessionServer);

  const [editBookTitle, setEditBookTitle] = useState(session.bookTitle);
  const [editAuthorName, setEditAuthorName] = useState(session.authorName ?? "");
  const [editTitle, setEditTitle] = useState(session.title ?? "");
  const [editSynopsis, setEditSynopsis] = useState(session.synopsis ?? "");
  const [editBookCoverUrl, setEditBookCoverUrl] = useState(session.bookCoverUrl ?? "");
  const [editAccessType, setEditAccessType] = useState<SessionAccessType>(
    resolveSessionAccessType(session),
  );
  const [editSessionPasscode, setEditSessionPasscode] = useState("");
  const [isGeneratingPasscode, setIsGeneratingPasscode] = useState(false);
  const [editPasscodeCopyState, setEditPasscodeCopyState] = useState<
    "idle" | "copied" | "error"
  >("idle");
  const passcodeAnimationTimerRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditOpen) {
      setEditBookTitle(session.bookTitle);
      setEditAuthorName(session.authorName ?? "");
      setEditTitle(session.title ?? "");
      setEditSynopsis(session.synopsis ?? "");
      setEditBookCoverUrl(session.bookCoverUrl ?? "");
      setEditAccessType(resolveSessionAccessType(session));
      setEditSessionPasscode("");
    }
  }, [isEditOpen, session]);

  useEffect(() => {
    if (editAccessType !== "passcode") {
      setEditSessionPasscode("");
      setEditPasscodeCopyState("idle");
      return;
    }

    if (
      isEditOpen &&
      resolveSessionAccessType(session) !== "passcode" &&
      !editSessionPasscode
    ) {
      setEditSessionPasscode(buildRandomPasscode());
    }
  }, [editAccessType, editSessionPasscode, isEditOpen, session]);

  useEffect(() => {
    return () => {
      if (passcodeAnimationTimerRef.current !== null) {
        window.clearInterval(passcodeAnimationTimerRef.current);
      }
    };
  }, []);

  function handleGeneratePasscode() {
    if (isGeneratingPasscode) {
      return;
    }

    setIsGeneratingPasscode(true);
    let ticks = 0;

    if (passcodeAnimationTimerRef.current !== null) {
      window.clearInterval(passcodeAnimationTimerRef.current);
    }

    passcodeAnimationTimerRef.current = window.setInterval(() => {
      ticks += 1;
      setEditSessionPasscode(buildRandomPasscode());

      if (ticks >= 12) {
        if (passcodeAnimationTimerRef.current !== null) {
          window.clearInterval(passcodeAnimationTimerRef.current);
          passcodeAnimationTimerRef.current = null;
        }
        setEditSessionPasscode(buildRandomPasscode());
        setIsGeneratingPasscode(false);
      }
    }, 45);
  }

  async function handleCopyDraftPasscode() {
    if (!editSessionPasscode) {
      setEditPasscodeCopyState("error");
      window.setTimeout(() => setEditPasscodeCopyState("idle"), 2_000);
      toast.error("Generate a new passcode first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(editSessionPasscode);
      setEditPasscodeCopyState("copied");
      toast.success("Passcode copied");
    } catch {
      setEditPasscodeCopyState("error");
      toast.error("Failed to copy passcode");
    } finally {
      window.setTimeout(() => setEditPasscodeCopyState("idle"), 2_000);
    }
  }

  async function handleSaveEdit() {
    if (!sessionId) return;
    if (!editBookTitle.trim()) return;

    const currentAccessType = resolveSessionAccessType(session);
    const didAccessTypeChange = currentAccessType !== editAccessType;
    const nextPasscode =
      editAccessType === "passcode" ? editSessionPasscode.trim() : "";

    if (editAccessType === "passcode" && didAccessTypeChange && !nextPasscode) {
      toast.error("Passcode is required when switching to passcode mode.");
      return;
    }

    setIsSaving(true);
    try {
      await updateSession({
        sessionId,
        bookTitle: editBookTitle,
        authorName: editAuthorName || undefined,
        title: editTitle || undefined,
        synopsis: editSynopsis || undefined,
        bookCoverUrl: editBookCoverUrl || undefined,
        accessType: didAccessTypeChange ? editAccessType : undefined,
        sessionPasscode: nextPasscode || undefined,
      });
      toast.success("Session updated");
      setIsEditOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update session");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (session.status !== "active") {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [session.status]);

  const elapsedLabel = useMemo(() => {
    const endTimestamp =
      session.status === "ended" ? (session.endedAt ?? session.createdAt) : now;
    return formatElapsed(endTimestamp - session.createdAt);
  }, [now, session.createdAt, session.endedAt, session.status]);

  async function handleCopyInviteLink() {
    const inviteLink = buildSessionInviteUrl(window.location.origin, session._id);

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2_000);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2_000);
    }
  }

  return (
    <Card className="relative overflow-hidden border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8" style={{ boxShadow: cardShadow }}>
      <CardHeader className="relative gap-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10">
            <Sparkles className="size-3.5 text-indigo-500" />
            Session room
          </div>
          <div className="flex items-center gap-2">
            {session.status === "active" ? (
              <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
                Ended
              </Badge>
            )}
            {canEdit && (
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground/50 hover:text-foreground">
                    <Pencil className="size-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <Pencil className="size-4 text-indigo-500" />
                      Edit session
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Book title *
                      </label>
                      <Input
                        value={editBookTitle}
                        onChange={(e) => setEditBookTitle(e.target.value)}
                        placeholder="Book title"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Author
                      </label>
                      <Input
                        value={editAuthorName}
                        onChange={(e) => setEditAuthorName(e.target.value)}
                        placeholder="Author name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Session title
                      </label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Session title"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Synopsis
                      </label>
                      <Textarea
                        value={editSynopsis}
                        onChange={(e) => setEditSynopsis(e.target.value)}
                        placeholder="Synopsis"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Book cover URL
                      </label>
                      <Input
                        value={editBookCoverUrl}
                        onChange={(e) => setEditBookCoverUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Session access
                      </label>
                      <Select
                        value={editAccessType}
                        onValueChange={(value) =>
                          setEditAccessType(value as SessionAccessType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="passcode">Passcode</SelectItem>
                          <SelectItem value="private">
                            Private (host approval)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editAccessType === "passcode" ? (
                      <div className="space-y-2 rounded-xl border border-white/40 bg-white/60 p-3 dark:border-white/[0.14] dark:bg-white/6">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-foreground">
                            Session passcode
                          </p>
                        </div>
                        <Input
                          value={getMaskedPasscode(editSessionPasscode.length)}
                          readOnly
                          className="font-mono tracking-[0.28em]"
                        />
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGeneratePasscode}
                            disabled={isGeneratingPasscode || isSaving}
                            className="gap-1.5"
                          >
                            <Shuffle
                              className={`size-3.5 ${isGeneratingPasscode ? "animate-spin" : ""}`}
                            />
                            {editSessionPasscode
                              ? isGeneratingPasscode
                                ? "Generating..."
                                : "Regenerate"
                              : isGeneratingPasscode
                                ? "Generating..."
                                : "Generate new"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              void handleCopyDraftPasscode();
                            }}
                            disabled={!editSessionPasscode || isSaving}
                            className="gap-1.5"
                          >
                            <Copy className="size-3.5" />
                            Copy new code
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {editSessionPasscode
                            ? "A new passcode draft is ready. Save changes to rotate it."
                            : "Current passcode stays hidden. Generate a new one if you want to rotate or copy it."}
                          {editPasscodeCopyState === "copied" ? " Copied." : ""}
                          {editPasscodeCopyState === "error" ? " Copy failed." : ""}
                        </p>
                      </div>
                    ) : null}
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => void handleSaveEdit()}
                      disabled={isSaving || !editBookTitle.trim()}
                    >
                      {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground/50 hover:text-foreground">
                  <Info className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <BookOpenText className="size-4 text-indigo-500" />
                    Session details
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 text-sm">
                  {/* Book info */}
                  <div className="flex gap-4">
                    {bookCoverUrl ? (
                      <img
                        src={bookCoverUrl}
                        alt={session.bookTitle}
                        className="h-24 w-16 shrink-0 rounded-md object-cover shadow-md ring-1 ring-black/10 dark:ring-white/10"
                      />
                    ) : null}
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Book</p>
                      <p className="font-semibold text-foreground">{session.bookTitle}</p>
                      {session.authorName ? (
                        <p className="text-muted-foreground">by {session.authorName}</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Session title */}
                  {session.title ? (
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Session title</p>
                      <p className="text-foreground">{session.title}</p>
                    </div>
                  ) : null}

                  {/* Synopsis */}
                  {session.synopsis ? (
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Synopsis</p>
                      <div className="max-h-36 overflow-y-auto rounded-lg pr-1 text-sm leading-relaxed text-foreground/85">
                        {session.synopsis}
                      </div>
                    </div>
                  ) : null}

                  {/* Host */}
                  {hostName ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Host</p>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/70 px-2.5 py-1.5 dark:border-white/15 dark:bg-white/10">
                        <Avatar className="size-5 ring-1 ring-white/70 dark:ring-white/20">
                          <AvatarImage src={hostImage ?? undefined} alt={hostName} />
                          <AvatarFallback className="text-[10px]">{getInitials(hostName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">{hostName}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Started</p>
                      <p className="text-xs text-foreground/80">{formatFullDate(session.createdAt)}</p>
                    </div>
                    {session.status === "ended" && session.endedAt ? (
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Ended</p>
                        <p className="text-xs text-foreground/80">{formatFullDate(session.endedAt)}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Running for</p>
                        <p className="text-xs text-foreground/80">{elapsedLabel}</p>
                      </div>
                    )}
                  </div>

                  {/* Members */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Members</p>
                    <p className="text-xs text-foreground/80">{memberCount} participant{memberCount !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Invite details */}
                  <div className="space-y-2 border-t border-black/8 pt-3 dark:border-white/10">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Invite code</p>
                    <p className="break-all font-mono text-[11px] text-muted-foreground">
                      {buildSessionInviteCodeFromSessionId(session._id)}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        void handleCopyInviteLink();
                        setIsInfoOpen(false);
                      }}
                    >
                      <Copy className="mr-1.5 size-3.5" />
                      Copy invite link
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex min-w-0 gap-4">
          {bookCoverUrl ? (
            <img
              src={bookCoverUrl}
              alt={session.bookTitle}
              className="h-16 w-11 shrink-0 rounded-md object-cover shadow-md ring-1 ring-black/10 sm:h-20 sm:w-14 dark:ring-white/10"
            />
          ) : null}
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpenText className="size-3.5" />
              Shared book
            </div>

            <CardTitle className="line-clamp-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {session.bookTitle}
            </CardTitle>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {session.authorName ? `by ${session.authorName}` : "Author unknown"}
            </p>
            {session.title ? (
              <p className="mt-2 line-clamp-1 text-sm font-medium text-foreground/90">
                {session.title}
              </p>
            ) : null}
            {session.synopsis ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {session.synopsis}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-3 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
            <Clock3 className="size-3.5" />
            Elapsed: {elapsedLabel}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-3 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
            <Users className="size-3.5" />
            Members: {memberCount}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-3 py-1.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
            <Clock3 className="size-3.5" />
            Started: {formatShortDate(session.createdAt)}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {hostName ? (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/55 bg-white/70 px-2.5 py-1.5 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10">
              <Avatar className="ring-1 ring-white/70 dark:ring-white/20">
                <AvatarImage src={hostImage ?? undefined} alt={hostName} />
                <AvatarFallback>{getInitials(hostName)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Host:{" "}
                <span className="font-medium text-foreground">{hostName}</span>
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyInviteLink}
              className="w-full sm:w-auto"
            >
              <Copy className="mr-1.5 size-4" />
              Copy invite link
            </Button>
            {copyState === "copied" ? (
              <p className="text-xs text-emerald-600">Copied</p>
            ) : null}
            {copyState === "error" ? (
              <p className="text-xs text-red-500">Failed to copy</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
