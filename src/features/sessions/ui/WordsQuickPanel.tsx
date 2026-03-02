"use client";

import { useQuery } from "convex/react";
import { BookOpen, Check, Copy } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type WordsQuickPanelProps = {
  sessionId: Id<"sessions">;
  isParticipant: boolean;
};

export function WordsQuickPanel({
  sessionId,
  isParticipant,
}: WordsQuickPanelProps) {
  const words = useQuery(
    api.sessionWords.listWordsServer,
    isParticipant ? { sessionId } : "skip",
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isParticipant || !words || words.length === 0) {
    return null;
  }

  const recentWords = words.slice(0, 5);

  function handleCopy(wordId: string, word: string) {
    void navigator.clipboard.writeText(word).then(() => {
      setCopiedId(wordId);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="relative shrink-0"
        >
          <BookOpen className="size-4" />
          <span className="hidden sm:inline">Words</span>
          <Badge className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-indigo-500 p-0 text-[10px] text-white hover:bg-indigo-500">
            {words.length > 9 ? "9+" : words.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 border-white/30 bg-white/90 p-0 backdrop-blur-xl dark:border-white/12 dark:bg-[#0d1222]/90"
      >
        <div className="border-b border-black/8 px-3 py-2.5 dark:border-white/8">
          <p className="text-xs font-semibold text-foreground">Session Words</p>
          <p className="text-[11px] text-muted-foreground">
            {words.length} word{words.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <div className="divide-y divide-black/6 dark:divide-white/6">
          {recentWords.map((w) => (
            <div
              key={w._id}
              className="flex items-center gap-2 px-3 py-2"
            >
              <span className="flex-1 text-sm font-medium text-foreground">
                {w.word}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(w._id, w.word)}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-black/8 hover:text-foreground dark:hover:bg-white/10"
                aria-label={`Copy ${w.word}`}
              >
                {copiedId === w._id ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
        {words.length > 5 && (
          <div className="border-t border-black/8 px-3 py-2 dark:border-white/8">
            <p className="text-[11px] text-muted-foreground">
              +{words.length - 5} more in the Words tab
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
