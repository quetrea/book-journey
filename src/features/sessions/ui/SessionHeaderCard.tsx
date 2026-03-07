"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  BookOpenText,
  Copy,
  Info,
  Pencil,
  Shuffle,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";
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
const SESSION_ACCESS_OPTIONS: Array<{
  value: SessionAccessType;
  label: string;
  description: string;
}> = [
  {
    value: "public",
    label: "Public",
    description: "Anyone with the invite link can join instantly.",
  },
  {
    value: "passcode",
    label: "Passcode",
    description: "Readers need the link and the session passcode.",
  },
  {
    value: "private",
    label: "Private",
    description: "Readers request access and wait for host approval.",
  },
];

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
  return "*".repeat(Math.max(length, 8));
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
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

function getAccessOption(accessType: SessionAccessType) {
  return (
    SESSION_ACCESS_OPTIONS.find((option) => option.value === accessType) ??
    SESSION_ACCESS_OPTIONS[0]
  );
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
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { cardShadow } = useThemeGlow();

  const canEdit = (isHost || isModerator) && !isSessionEnded && sessionId;
  const updateSession = useMutation(api.sessions.updateSessionServer);
  const currentAccessType = resolveSessionAccessType(session);

  const [editBookTitle, setEditBookTitle] = useState(session.bookTitle);
  const [editAuthorName, setEditAuthorName] = useState(
    session.authorName ?? "",
  );
  const [editTitle, setEditTitle] = useState(session.title ?? "");
  const [editSynopsis, setEditSynopsis] = useState(session.synopsis ?? "");
  const [editBookCoverUrl, setEditBookCoverUrl] = useState(
    session.bookCoverUrl ?? "",
  );
  const [editAccessType, setEditAccessType] =
    useState<SessionAccessType>(currentAccessType);
  const [editSessionPasscode, setEditSessionPasscode] = useState("");
  const [isGeneratingPasscode, setIsGeneratingPasscode] = useState(false);
  const [editPasscodeCopyState, setEditPasscodeCopyState] = useState<
    "idle" | "copied" | "error"
  >("idle");
  const passcodeAnimationTimerRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const normalizedEditBookTitle = editBookTitle.trim();
  const normalizedEditAuthorName = editAuthorName.trim();
  const normalizedEditTitle = editTitle.trim();
  const normalizedEditSynopsis = editSynopsis.trim();
  const normalizedEditBookCoverUrl = editBookCoverUrl.trim();
  const draftPasscode = editSessionPasscode.trim();
  const currentAccessOption = getAccessOption(currentAccessType);
  const nextAccessOption = getAccessOption(editAccessType);

  useEffect(() => {
    if (!isEditOpen) {
      return;
    }

    setEditBookTitle(session.bookTitle);
    setEditAuthorName(session.authorName ?? "");
    setEditTitle(session.title ?? "");
    setEditSynopsis(session.synopsis ?? "");
    setEditBookCoverUrl(session.bookCoverUrl ?? "");
    setEditAccessType(currentAccessType);
    setEditSessionPasscode("");
    setEditPasscodeCopyState("idle");
    setIsGeneratingPasscode(false);
  }, [currentAccessType, isEditOpen, session]);

  useEffect(() => {
    if (editAccessType !== "passcode") {
      setEditSessionPasscode("");
      setEditPasscodeCopyState("idle");
      return;
    }

    if (
      isEditOpen &&
      currentAccessType !== "passcode" &&
      !editSessionPasscode
    ) {
      setEditSessionPasscode(buildRandomPasscode());
    }
  }, [currentAccessType, editAccessType, editSessionPasscode, isEditOpen]);

  useEffect(() => {
    if (isEditOpen) {
      return;
    }

    if (passcodeAnimationTimerRef.current !== null) {
      window.clearInterval(passcodeAnimationTimerRef.current);
      passcodeAnimationTimerRef.current = null;
    }
    setIsGeneratingPasscode(false);
  }, [isEditOpen]);

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
    if (!normalizedEditBookTitle) return;

    const didAccessTypeChange = currentAccessType !== editAccessType;
    const nextPasscode = editAccessType === "passcode" ? draftPasscode : "";

    if (editAccessType === "passcode" && didAccessTypeChange && !nextPasscode) {
      toast.error("Passcode is required when switching to passcode mode.");
      return;
    }

    setIsSaving(true);
    try {
      await updateSession({
        sessionId,
        bookTitle: normalizedEditBookTitle,
        authorName: normalizedEditAuthorName || undefined,
        title: normalizedEditTitle || undefined,
        synopsis: normalizedEditSynopsis || undefined,
        bookCoverUrl: normalizedEditBookCoverUrl || undefined,
        accessType: didAccessTypeChange ? editAccessType : undefined,
        sessionPasscode: nextPasscode || undefined,
      });
      toast.success("Session updated");
      setIsEditOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update session",
      );
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
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [session.status]);

  const elapsedLabel = useMemo(() => {
    const endTimestamp =
      session.status === "ended" ? (session.endedAt ?? session.createdAt) : now;
    return formatElapsed(endTimestamp - session.createdAt);
  }, [now, session.createdAt, session.endedAt, session.status]);

  const hasEditChanges = useMemo(() => {
    if (normalizedEditBookTitle !== session.bookTitle.trim()) {
      return true;
    }
    if (normalizedEditAuthorName !== (session.authorName ?? "").trim()) {
      return true;
    }
    if (normalizedEditTitle !== (session.title ?? "").trim()) {
      return true;
    }
    if (normalizedEditSynopsis !== (session.synopsis ?? "").trim()) {
      return true;
    }
    if (normalizedEditBookCoverUrl !== (session.bookCoverUrl ?? "").trim()) {
      return true;
    }
    if (editAccessType !== currentAccessType) {
      return true;
    }

    return editAccessType === "passcode" && Boolean(draftPasscode);
  }, [
    currentAccessType,
    draftPasscode,
    editAccessType,
    normalizedEditAuthorName,
    normalizedEditBookCoverUrl,
    normalizedEditBookTitle,
    normalizedEditSynopsis,
    normalizedEditTitle,
    session.authorName,
    session.bookCoverUrl,
    session.bookTitle,
    session.synopsis,
    session.title,
  ]);

  async function handleCopyInviteLink() {
    const inviteLink = buildSessionInviteUrl(
      window.location.origin,
      session._id,
    );

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
    <Card
      className="relative overflow-hidden border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8"
      style={{ boxShadow: cardShadow }}
    >
      <CardHeader className="relative gap-2.5 pb-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-white/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md dark:border-white/12 dark:bg-white/8">
            <Sparkles className="size-3.5 text-indigo-500" />
            Session room
          </div>
          <div className="flex items-center gap-2">
            {session.status === "active" ? (
              <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
                Active
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 text-[11px]"
              >
                Ended
              </Badge>
            )}
            {canEdit && (
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground/50 hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-4xl gap-0 overflow-hidden border-white/35 bg-white/82 p-0 shadow-2xl backdrop-blur-2xl dark:border-white/12 dark:bg-[#0d1222]/88">
                  <DialogHeader className="border-b border-black/8 px-6 py-5 dark:border-white/10">
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <Pencil className="size-4 text-indigo-500" />
                      Edit session
                    </DialogTitle>
                    <DialogDescription>
                      Update the room identity, book metadata, and join rules
                      without leaving the session.
                    </DialogDescription>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/45 bg-white/70 px-3 py-2 text-left shadow-sm dark:border-white/12 dark:bg-white/8">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                          Current access
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {currentAccessOption.label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {currentAccessOption.description}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/45 bg-white/70 px-3 py-2 text-left shadow-sm dark:border-white/12 dark:bg-white/8">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                          Started
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatShortDate(session.createdAt)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Session has been running for {elapsedLabel}.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/45 bg-white/70 px-3 py-2 text-left shadow-sm dark:border-white/12 dark:bg-white/8">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                          Members
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {memberCount} active
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Invite code:{" "}
                          {buildSessionInviteCodeFromSessionId(session._id)}
                        </p>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="grid max-h-[calc(85vh-160px)] gap-6 overflow-y-auto px-6 py-5 pb-24 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-6">
                      <section className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Book details
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Keep the book metadata clean so the room card stays
                            readable everywhere.
                          </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                              Book title *
                            </label>
                            <Input
                              value={editBookTitle}
                              onChange={(event) =>
                                setEditBookTitle(event.target.value)
                              }
                              placeholder="Atomic Habits"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                              Author
                            </label>
                            <Input
                              value={editAuthorName}
                              onChange={(event) =>
                                setEditAuthorName(event.target.value)
                              }
                              placeholder="James Clear"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                              Cover URL
                            </label>
                            <Input
                              value={editBookCoverUrl}
                              onChange={(event) =>
                                setEditBookCoverUrl(event.target.value)
                              }
                              placeholder="https://example.com/cover.jpg"
                            />
                          </div>
                        </div>
                      </section>

                      <section className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Room copy
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Set a clearer headline and short synopsis for
                            readers.
                          </p>
                        </div>
                        <div className="grid gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                              Session title
                            </label>
                            <Input
                              value={editTitle}
                              onChange={(event) =>
                                setEditTitle(event.target.value)
                              }
                              placeholder="Sunday reading sprint"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                              <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                                Synopsis
                              </label>
                              <span className="text-[11px] text-muted-foreground">
                                {normalizedEditSynopsis.length}/280
                              </span>
                            </div>
                            <Textarea
                              value={editSynopsis}
                              onChange={(event) =>
                                setEditSynopsis(
                                  event.target.value.slice(0, 280),
                                )
                              }
                              placeholder="Share what this session is for and what readers should expect."
                              rows={5}
                              className="resize-none"
                            />
                          </div>
                        </div>
                      </section>

                      <section className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Access settings
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pick how people enter the room, then rotate the
                            passcode if needed.
                          </p>
                        </div>

                        <div className="grid gap-3">
                          {SESSION_ACCESS_OPTIONS.map((option) => {
                            const isSelected = editAccessType === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setEditAccessType(option.value)}
                                className={cn(
                                  "rounded-2xl border px-4 py-3 text-left transition-colors",
                                  isSelected
                                    ? "border-indigo-500/60 bg-indigo-500/[0.08] shadow-sm dark:border-indigo-400/45 dark:bg-indigo-400/[0.12]"
                                    : "border-white/45 bg-white/70 hover:border-white/70 hover:bg-white/90 dark:border-white/12 dark:bg-white/6 dark:hover:bg-white/10",
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {option.label}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {option.description}
                                    </p>
                                  </div>
                                  <div
                                    className={cn(
                                      "size-4 rounded-full border transition-colors",
                                      isSelected
                                        ? "border-indigo-500 bg-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                                        : "border-muted-foreground/30 bg-transparent",
                                    )}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {editAccessType === "passcode" ? (
                          <div className="space-y-3 rounded-2xl border border-white/45 bg-white/75 p-4 shadow-sm dark:border-white/12 dark:bg-white/8">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  Session passcode
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  The current passcode stays hidden until you
                                  save a new one.
                                </p>
                              </div>
                              <span className="rounded-full border border-white/45 bg-white/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground shadow-sm dark:border-white/12 dark:bg-white/10">
                                {draftPasscode ? "Draft ready" : "Hidden"}
                              </span>
                            </div>
                            <Input
                              value={getMaskedPasscode(
                                editSessionPasscode.length,
                              )}
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
                                  className={cn(
                                    "size-3.5",
                                    isGeneratingPasscode && "animate-spin",
                                  )}
                                />
                                {draftPasscode
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
                                disabled={!draftPasscode || isSaving}
                                className="gap-1.5"
                              >
                                <Copy className="size-3.5" />
                                Copy draft
                              </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {draftPasscode
                                ? "A new passcode draft is ready. Save changes to rotate it."
                                : "Generate a new passcode if you want to replace the current one."}
                              {editPasscodeCopyState === "copied"
                                ? " Copied."
                                : ""}
                              {editPasscodeCopyState === "error"
                                ? " Copy failed."
                                : ""}
                            </p>
                          </div>
                        ) : null}
                      </section>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-0">
                      <div className="rounded-[24px] border border-white/45 bg-white/78 p-4 shadow-sm dark:border-white/12 dark:bg-white/8">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                          Live preview
                        </p>
                        <div className="mt-4 space-y-4">
                          <div className="overflow-hidden rounded-[20px] border border-white/45 bg-gradient-to-br from-white to-white/55 dark:border-white/12 dark:from-white/10 dark:to-white/5">
                            {normalizedEditBookCoverUrl || bookCoverUrl ? (
                              <img
                                src={normalizedEditBookCoverUrl || bookCoverUrl}
                                alt={
                                  normalizedEditBookTitle || session.bookTitle
                                }
                                className="aspect-[4/5] w-full object-cover"
                              />
                            ) : (
                              <div className="flex aspect-[4/5] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_58%)]">
                                <BookOpenText className="size-10 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="line-clamp-2 text-lg font-semibold text-foreground">
                              {normalizedEditBookTitle || "Book title"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {normalizedEditAuthorName || "Author name"}
                            </p>
                            {normalizedEditTitle ? (
                              <p className="text-sm font-medium text-foreground/85">
                                {normalizedEditTitle}
                              </p>
                            ) : null}
                            <p className="text-sm leading-6 text-muted-foreground">
                              {normalizedEditSynopsis ||
                                "A short synopsis helps readers understand the purpose of the session before joining."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-white/45 bg-white/78 p-4 shadow-sm dark:border-white/12 dark:bg-white/8">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                          Join experience
                        </p>
                        <div className="mt-3 space-y-3 text-sm">
                          <div className="rounded-2xl border border-white/45 bg-white/80 px-3 py-2 dark:border-white/12 dark:bg-white/6">
                            <p className="font-semibold text-foreground">
                              {nextAccessOption.label}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {nextAccessOption.description}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/45 bg-white/80 px-3 py-2 dark:border-white/12 dark:bg-white/6">
                            <p className="font-semibold text-foreground">
                              Save impact
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Changes apply immediately for everyone using the
                              room link.
                            </p>
                          </div>
                          {editAccessType === "passcode" ? (
                            <div className="rounded-2xl border border-white/45 bg-white/80 px-3 py-2 dark:border-white/12 dark:bg-white/6">
                              <p className="font-semibold text-foreground">
                                Passcode rotation
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {draftPasscode
                                  ? "A new draft passcode will replace the current one after save."
                                  : "Current passcode remains unchanged until you generate and save a new draft."}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </aside>
                  </div>

                  <DialogFooter className="sticky bottom-0 z-10 border-t border-black/8 bg-white/92 px-6 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1222]/92">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditOpen(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleSaveEdit()}
                      disabled={
                        isSaving || !normalizedEditBookTitle || !hasEditChanges
                      }
                    >
                      {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground/50 hover:text-foreground"
                >
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
                  <div className="flex gap-4">
                    {bookCoverUrl ? (
                      <img
                        src={bookCoverUrl}
                        alt={session.bookTitle}
                        className="h-24 w-16 shrink-0 rounded-md object-cover shadow-md ring-1 ring-black/10 dark:ring-white/10"
                      />
                    ) : null}
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Book
                      </p>
                      <p className="font-semibold text-foreground">
                        {session.bookTitle}
                      </p>
                      {session.authorName ? (
                        <p className="text-muted-foreground">
                          by {session.authorName}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {session.title ? (
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Session title
                      </p>
                      <p className="text-foreground">{session.title}</p>
                    </div>
                  ) : null}

                  {session.synopsis ? (
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Synopsis
                      </p>
                      <div className="max-h-36 overflow-y-auto rounded-lg pr-1 text-sm leading-relaxed text-foreground/85">
                        {session.synopsis}
                      </div>
                    </div>
                  ) : null}

                  {hostName ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Host
                      </p>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/70 px-2.5 py-1.5 dark:border-white/15 dark:bg-white/10">
                        <Avatar className="size-5 ring-1 ring-white/70 dark:ring-white/20">
                          <AvatarImage
                            src={hostImage ?? undefined}
                            alt={hostName}
                          />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(hostName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">
                          {hostName}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        Started
                      </p>
                      <p className="text-xs text-foreground/80">
                        {formatFullDate(session.createdAt)}
                      </p>
                    </div>
                    {session.status === "ended" && session.endedAt ? (
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                          Ended
                        </p>
                        <p className="text-xs text-foreground/80">
                          {formatFullDate(session.endedAt)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                          Running for
                        </p>
                        <p className="text-xs text-foreground/80">
                          {elapsedLabel}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      Members
                    </p>
                    <p className="text-xs text-foreground/80">
                      {memberCount} participant{memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-black/8 pt-3 dark:border-white/10">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      Invite code
                    </p>
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
              {session.authorName
                ? `by ${session.authorName}`
                : "Author unknown"}
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

      <CardContent className="relative space-y-2.5 pt-0">
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
