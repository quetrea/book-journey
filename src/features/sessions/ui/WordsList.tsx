"use client";

import { useMutation, useQuery } from "convex/react";
import { BookMarked, ChevronDown, ChevronUp, Check, Copy, Download, Trash2 } from "lucide-react";
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
  bookTitle?: string;
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
  bookTitle,
}: WordsListProps) {
  const { cardShadow } = useThemeGlow();
  const words = useQuery(api.sessionWords.listWordsServer, { sessionId });
  const addWord = useMutation(api.sessionWords.addWordServer);
  const removeWord = useMutation(api.sessionWords.removeWordServer);

  const [wordInput, setWordInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showContextInput, setShowContextInput] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  const PAGE_SIZE = 3;

  function handleCopy(id: string, word: string, context?: string) {
    const text = context ? `${word}\n"${context}"` : word;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    });
  }

  function handleDownload() {
    if (!words || words.length === 0) return;

    const dateStr = new Intl.DateTimeFormat(undefined, {
      year: "numeric", month: "long", day: "numeric",
    }).format(new Date());

    const lines: string[] = [
      "BookJourney — Vocabulary List",
      bookTitle ? `Book: ${bookTitle}` : "",
      `Exported: ${dateStr}`,
      `Total: ${words.length} word${words.length !== 1 ? "s" : ""}`,
      "─".repeat(40),
      "",
    ].filter((l) => l !== "");

    words.forEach((entry, i) => {
      lines.push(`${i + 1}. ${entry.word}`);
      if (entry.context) {
        lines.push(`   "${entry.context}"`);
      }
      lines.push(`   — ${entry.userName} · ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(entry.createdAt))}`);
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (bookTitle ?? "session").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    a.href = url;
    a.download = `bookjourney-vocab-${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <BookMarked className="size-4 text-indigo-500" />
            Words
            {words.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({words.length})</span>
            )}
          </CardTitle>
          {words.length > 0 && (
            <button
              type="button"
              onClick={handleDownload}
              title="Download vocabulary list"
              className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            >
              <Download className="size-3.5" />
            </button>
          )}
        </div>
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
            {words.slice(0, visibleCount).map((entry) => {
              const canDelete = isHost || entry.userId === viewerUserId;

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
                  <button
                    type="button"
                    onClick={() => handleCopy(entry._id, entry.word, entry.context)}
                    className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground/40 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                  >
                    {copiedId === entry._id
                      ? <Check className="size-3.5 text-emerald-500" />
                      : <Copy className="size-3.5" />}
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => { void removeWord({ wordId: entry._id }); }}
                      className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground/40 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            })}

            {/* Show more / Show less */}
            {words.length > PAGE_SIZE && (
              <div className="flex items-center gap-2 pt-0.5">
                {visibleCount < words.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    <ChevronDown className="size-3.5" />
                    Show {Math.min(PAGE_SIZE, words.length - visibleCount)} more
                    <span className="text-muted-foreground/40">· {words.length - visibleCount} hidden</span>
                  </button>
                )}
                {visibleCount > PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(PAGE_SIZE)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    <ChevronUp className="size-3.5" />
                    Show less
                  </button>
                )}
              </div>
            )}
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
