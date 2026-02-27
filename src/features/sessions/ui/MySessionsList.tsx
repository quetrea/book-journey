"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SessionListItem } from "../types";

type MySessionsListProps = {
  isReady: boolean;
  refreshKey: number;
};

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

function StatusBadge({ status }: { status: SessionListItem["status"] }) {
  if (status === "active") {
    return (
      <Badge className="rounded-full bg-emerald-600/90 px-2.5 text-[11px] text-white hover:bg-emerald-600/90">
        Active
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="rounded-full px-2.5 text-[11px]">
      Ended
    </Badge>
  );
}

export function MySessionsList({ isReady, refreshKey }: MySessionsListProps) {
  const [now, setNow] = useState(() => Date.now());
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      setSessions([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSessions() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch("/api/sessions/list", {
          cache: "no-store",
        });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            typeof body?.error === "string" ? body.error : "Failed to load sessions.";
          throw new Error(message);
        }

        const loadedSessions = Array.isArray(body?.sessions) ? body.sessions : [];

        if (!cancelled) {
          setSessions(loadedSessions as SessionListItem[]);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Failed to load sessions.";
        setErrorMessage(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSessions();

    const intervalId = window.setInterval(() => {
      void loadSessions();
    }, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isReady, refreshKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const normalizedSessions = useMemo(() => sessions ?? [], [sessions]);

  if (!isReady) {
    return <p className="text-sm text-muted-foreground">Preparing account...</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading sessions...</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-red-500">{errorMessage}</p>;
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

  return (
    <div className="space-y-2.5">
      {normalizedSessions.map((session) => {
        const finishedAt = session.status === "ended" ? (session.endedAt ?? session.createdAt) : now;
        const elapsed = formatElapsed(finishedAt - session.createdAt);

        return (
          <Card
            key={session._id}
            className="relative gap-0 overflow-hidden border-white/[0.34] bg-white/[0.53] px-3.5 py-3 shadow-[0_10px_24px_-18px_rgba(79,70,229,0.6)] backdrop-blur-md dark:border-white/[0.12] dark:bg-white/[0.06]"
          >
            <span
              className={`pointer-events-none absolute left-0 top-0 h-full w-[2px] ${
                session.status === "active"
                  ? "bg-gradient-to-b from-emerald-400/95 via-emerald-300/80 to-transparent"
                  : "bg-gradient-to-b from-slate-300/80 to-transparent dark:from-slate-400/45"
              }`}
            />

            <CardContent className="p-0">
              <div className="grid gap-2.5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground md:text-[15px]">
                    {session.bookTitle}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground/95">
                    {session.authorName ? `by ${session.authorName}` : "Author unknown"}
                  </p>
                  {session.synopsis ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground/85">
                      {session.synopsis}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={session.status} />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-2 py-1 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/8">
                    <Clock3 className="size-3.5" />
                    {elapsed}
                  </span>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <p>{formatDateLabel(session.createdAt)}</p>
                  {session.synopsis ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="mt-1 hidden text-[11px] underline underline-offset-2 hover:text-foreground md:inline-block"
                        >
                          View
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" sideOffset={8} className="max-w-xs">
                        {session.synopsis}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
