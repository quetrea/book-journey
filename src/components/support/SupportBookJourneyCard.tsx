"use client";

import { HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hexToRgba, useThemeGlow } from "@/hooks/useThemeGlow";

type SupportBookJourneyCardProps = {
  compact?: boolean;
};

const SUPPORT_URL = "https://buymeacoffee.com/codewithilb";

export function SupportBookJourneyCard({
  compact = false,
}: SupportBookJourneyCardProps) {
  const { cardShadow, orb, isDark } = useThemeGlow();

  return (
    <Card
      className="overflow-hidden border border-black/8 bg-white/18 backdrop-blur-[24px] dark:border-white/12 dark:bg-black/18"
      style={{
        boxShadow: cardShadow,
        backgroundColor: isDark ? hexToRgba(orb, 0.12) : "rgba(255,255,255,0.22)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-20 rounded-full blur-3xl"
        style={{
          background: `linear-gradient(90deg, ${hexToRgba(orb, isDark ? 0.18 : 0.1)}, rgba(255,255,255,0))`,
        }}
      />
      <CardHeader className={compact ? "space-y-2" : "space-y-3"}>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/45 bg-white/60 backdrop-blur-md dark:border-white/12 dark:bg-white/10">
            <HeartHandshake className="size-4 text-rose-500 dark:text-rose-300" />
          </span>
          Support BookJourney
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-white/70">
          {compact
            ? "If BookJourney feels meaningful to you, you can help keep this reading space warm, calm, and sustainable with a small donation."
            : "If BookJourney feels meaningful to you, you can help it stay warm, calm, and sustainable with a small donation. It helps cover hosting, development, and the care it takes to keep a gentle community reading space running."}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-white/45">
            Completely optional. The core reading experience stays free.
          </p>

          <Button
            asChild
            className="w-full rounded-full border border-white/50 bg-white/70 text-slate-900 shadow-sm backdrop-blur-md hover:bg-white/85 sm:w-auto dark:border-white/14 dark:bg-white/12 dark:text-white dark:hover:bg-white/16"
          >
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
              Support on Buy Me a Coffee
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
