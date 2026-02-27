"use client";

import {
  BookOpenText,
  Clock3,
  ListOrdered,
  MessageCircleHeart,
  ScrollText,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BOOK_TITLE = "Atomic Habits";

const SYNOPSIS =
  "Atomic Habits explains how tiny, repeatable improvements can compound into major long-term results. James Clear argues that behavior change is easier when you focus on systems and identity instead of motivation alone. The book breaks habits into four stages (cue, craving, response, reward) and offers practical rules to build good routines and reduce bad ones by changing your environment, lowering friction, and tracking consistency over time.";

const queue = [
  { handle: "@sola", isYou: false },
  { handle: "@inkbyte", isYou: false },
  { handle: "@novapage", isYou: false },
  { handle: "@quietmint", isYou: false },
  { handle: "@lyrareads", isYou: true },
  { handle: "@midnighthall", isYou: false },
  { handle: "@acornnote", isYou: false },
];

export function LandingDemoCard() {
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const isLongSynopsis = SYNOPSIS.length > 300;

  return (
    <Card className="group relative mt-8 overflow-hidden border border-black/10 bg-slate-100/65 shadow-[0_14px_36px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_20px_42px_-22px_rgba(88,101,242,0.36)] motion-reduce:transform-none dark:border-white/10 dark:bg-white/5 dark:ring-white/10 dark:shadow-[0_14px_36px_-22px_rgba(2,6,23,0.65)] dark:hover:shadow-[0_22px_42px_-22px_rgba(88,101,242,0.42)]">
      <div className="pointer-events-none absolute inset-px rounded-[calc(var(--radius)-1px)] border border-white/35 dark:border-white/6" />
      <div className="pointer-events-none absolute top-0 left-0 h-full w-[3px] bg-[#5865F2]/22 dark:bg-[#8ea1ff]/34" />

      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="border-white/20 bg-white/30 text-[10px] tracking-wide uppercase dark:border-white/10 dark:bg-white/10"
            >
              App
            </Badge>
            <CardTitle className="max-w-[15.5rem] truncate text-base tracking-tight sm:max-w-none sm:text-lg">
              Book Club Session
            </CardTitle>
          </div>
          <p className="shrink-0 text-[11px] text-muted-foreground">
            Today at 6:28 PM
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Currently reading
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="mt-1 text-base font-semibold text-foreground sm:text-lg [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                {BOOK_TITLE}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top">{BOOK_TITLE}</TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-2 rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <UserRound className="size-3.5" />
            <span className="uppercase tracking-wide">Author</span>
          </div>
          <p className="pl-5 text-sm text-foreground">James Clear</p>

          <div className="pt-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <ScrollText className="size-3.5" />
              <span className="uppercase tracking-wide">Synopsis</span>
            </div>
            <p
              className={`pl-5 text-sm text-foreground/90 ${
                isSynopsisExpanded || !isLongSynopsis
                  ? "overflow-visible"
                  : "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden"
              }`}
            >
              {SYNOPSIS}
            </p>
            {isLongSynopsis ? (
              <button
                type="button"
                onClick={() => setIsSynopsisExpanded((prev) => !prev)}
                className="mt-1 ml-5 text-xs text-muted-foreground transition-colors hover:text-[#5865F2] dark:hover:text-[#8ea1ff]"
              >
                {isSynopsisExpanded ? "View less" : "View more"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <BookOpenText className="size-3.5" />
              <span>Hosted by</span>
            </div>
            <p className="mt-1 font-semibold text-[#5865F2] transition-all hover:underline hover:decoration-[#5865F2]/70 hover:[text-shadow:0_0_8px_rgba(88,101,242,0.28)] dark:text-[#8ea1ff] dark:hover:decoration-[#8ea1ff]/70 dark:hover:[text-shadow:0_0_10px_rgba(142,161,255,0.35)]">
              @lunarhost
            </p>
          </div>
          <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Clock3 className="size-3.5" />
              <span>Status</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="relative inline-flex size-2">
                <span className="absolute inline-flex size-2 animate-pulse rounded-full bg-emerald-500/65 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                Active
              </Badge>
            </div>
          </div>
          <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <UserRound className="size-3.5" />
              <span>Current Reader</span>
            </div>
            <p className="mt-1 font-semibold text-[#5865F2] transition-all hover:underline hover:decoration-[#5865F2]/70 hover:[text-shadow:0_0_8px_rgba(88,101,242,0.28)] dark:text-[#8ea1ff] dark:hover:decoration-[#8ea1ff]/70 dark:hover:[text-shadow:0_0_10px_rgba(142,161,255,0.35)]">
              @echopage
            </p>
          </div>
          <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Users className="size-3.5" />
              <span>Readers</span>
            </div>
            <p className="mt-1 text-lg font-semibold">7</p>
          </div>
        </div>

        <Separator className="bg-white/30 dark:bg-white/10" />

        <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            <ListOrdered className="size-3.5" />
            <span>Next in Line</span>
          </div>
          <ol className="grid grid-cols-1 gap-1 text-sm leading-6 sm:grid-cols-2">
            {queue.map((item, index) => (
              <li
                key={item.handle}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-white/35 dark:hover:bg-white/10"
              >
                <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/35 bg-white/35 font-mono text-[11px] tabular-nums text-muted-foreground dark:border-white/10 dark:bg-white/5">
                  {index + 1}
                </span>
                <span className="font-semibold tracking-tight text-[#5865F2] transition-all hover:underline hover:decoration-[#5865F2]/70 hover:[text-shadow:0_0_8px_rgba(88,101,242,0.28)] dark:text-[#8ea1ff] dark:hover:decoration-[#8ea1ff]/70 dark:hover:[text-shadow:0_0_10px_rgba(142,161,255,0.35)]">
                  {item.handle}
                </span>
                {item.isYou ? (
                  <span className="text-[11px] text-muted-foreground">(you)</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageCircleHeart className="size-3.5" />
          <span>Happy reading!</span>
        </div>
      </CardContent>
    </Card>
  );
}
