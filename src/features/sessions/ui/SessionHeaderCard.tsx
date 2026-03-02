"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  Clock3,
  Copy,
  Info,
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
import type { SessionListItem } from "@/features/sessions/types";
import { useThemeGlow } from "@/hooks/useThemeGlow";

type SessionHeaderCardProps = {
  session: SessionListItem;
  hostName?: string;
  hostImage?: string;
  memberCount: number;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
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

export function SessionHeaderCard({
  session,
  hostName,
  hostImage,
  memberCount,
}: SessionHeaderCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { cardShadow } = useThemeGlow();

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
    const inviteLink = `${window.location.origin}/s/${session._id}`;

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
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Book</p>
                    <p className="font-semibold text-foreground">{session.bookTitle}</p>
                    {session.authorName ? (
                      <p className="text-muted-foreground">by {session.authorName}</p>
                    ) : null}
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
                      <p className="leading-relaxed text-foreground/85">{session.synopsis}</p>
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

                  {/* Session ID + copy link */}
                  <div className="space-y-2 border-t border-black/8 pt-3 dark:border-white/10">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">Session ID</p>
                    <p className="break-all font-mono text-[11px] text-muted-foreground">{session._id}</p>
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
}
