"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  Clock3,
  Copy,
  Sparkles,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionListItem } from "@/features/sessions/types";

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

export function SessionHeaderCard({
  session,
  hostName,
  hostImage,
  memberCount,
}: SessionHeaderCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );

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
    <Card className="relative overflow-hidden border-white/45 bg-white/68 shadow-[0_22px_54px_-30px_rgba(67,56,202,0.78)] backdrop-blur-md dark:border-white/15 dark:bg-white/8 dark:shadow-[0_24px_54px_-30px_rgba(79,70,229,0.78)]">
      <CardHeader className="relative gap-4 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10">
            <Sparkles className="size-3.5 text-indigo-500" />
            Session room
          </div>
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
