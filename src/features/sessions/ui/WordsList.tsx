"use client";

import { useMutation, useQuery } from "convex/react";
import { BookMarked, Trash2 } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useThemeGlow } from "@/hooks/useThemeGlow";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type WordsListProps = {
  sessionId: Id<"sessions">;
  isParticipant: boolean;
  isSessionEnded: boolean;
  viewerUserId?: string;
  isHost: boolean;
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function formatTimeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 60_000);

  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;

  return `${Math.floor(diff / 60)}h ago`;
}

export function WordsList({
  sessionId,
  isParticipant,
  isSessionEnded,
  viewerUserId,
  isHost,
}: WordsListProps) {
  const { cardShadow } = useThemeGlow();
  const words = useQuery(api.sessionWords.listWordsServer, { sessionId });
  const addWord = useMutation(api.sessionWords.addWordServer);
  const removeWord = useMutation(api.sessionWords.removeWordServer);

  const [wordInput, setWordInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showContextInput, setShowContextInput] = useState(false);

  const canAdd = isParticipant && !isSessionEnded;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = wordInput.trim();

    if (!trimmed) return;

    setIsAdding(true);

    try {
      await addWord({
        sessionId,
        word: trimmed,
        context: contextInput.trim() || undefined,
      });
      setWordInput("");
      setContextInput("");
      setShowContextInput(false);
    } finally {
      setIsAdding(false);
    }
  }

  const cardClass =
    "border-white/45 bg-white/68 backdrop-blur-md dark:border-white/15 dark:bg-white/8";

  if (words === undefined) {
    return (
      <Card className={cardClass} style={{ boxShadow: cardShadow }}>
        <CardHeader className="pb-3">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <BookMarked className="size-4 text-indigo-500" />
            Words
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClass} style={{ boxShadow: cardShadow }}>
      <CardHeader className="pb-3">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <BookMarked className="size-4 text-indigo-500" />
          Words
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Save words or phrases from the reading.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {words.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No words saved yet. Add the first one below.
          </p>
        ) : (
          <div className="space-y-2">
            {words.map((entry) => {
              const canDelete =
                isHost || entry.userId === viewerUserId;

              return (
                <div
                  key={entry._id}
                  className="flex items-start gap-2.5 rounded-xl border border-white/35 bg-white/55 px-3 py-2.5 dark:border-white/12 dark:bg-white/6"
                >
                  <Avatar size="sm" className="mt-0.5 shrink-0 ring-1 ring-white/60 dark:ring-white/15">
                    <AvatarImage src={entry.userImage ?? undefined} alt={entry.userName} />
                    <AvatarFallback>{getInitials(entry.userName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {entry.word}
                    </p>
                    {entry.context ? (
                      <p className="mt-0.5 line-clamp-2 text-xs italic text-muted-foreground/80">
                        &ldquo;{entry.context}&rdquo;
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                      {entry.userName} · {formatTimeAgo(entry.createdAt)}
                    </p>
                  </div>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => {
                        void removeWord({ wordId: entry._id });
                      }}
                      className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {canAdd ? (
          <form onSubmit={handleAdd} className="space-y-2 border-t border-black/8 pt-3 dark:border-white/10">
            <div className="flex gap-2">
              <Input
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder="Add a word or phrase..."
                className="h-9 text-sm"
                disabled={isAdding}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isAdding || !wordInput.trim()}
                className="shrink-0"
              >
                {isAdding ? "..." : "Add"}
              </Button>
            </div>
            {showContextInput ? (
              <Input
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                placeholder="Optional context (sentence where it appeared)"
                className="h-9 text-xs"
                disabled={isAdding}
              />
            ) : (
              <button
                type="button"
                className="text-xs text-muted-foreground/60 underline-offset-2 hover:text-muted-foreground hover:underline"
                onClick={() => setShowContextInput(true)}
              >
                + Add context
              </button>
            )}
          </form>
        ) : null}

        {!canAdd && !isSessionEnded ? (
          <p className="border-t border-black/8 pt-3 text-xs text-muted-foreground dark:border-white/10">
            Join the session to add words.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
