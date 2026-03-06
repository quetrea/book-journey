"use client";

import { Coffee, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { ThemePicker } from "@/components/background/ThemePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function LandingTopBar() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme ? resolvedTheme === "dark" : true;

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex flex-col items-start gap-1">
        <p className="font-display text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-white">
          bookjourney
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="border-black/12 bg-black/8 text-[10px] text-slate-500 sm:text-[11px] dark:border-white/15 dark:bg-white/10 dark:text-white/60"
          >
            Realtime reading sessions
          </Badge>
          <a
            href="https://buymeacoffee.com/codewithilb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#ffdd95]/60 bg-[#fff1cc]/80 px-3 py-1 text-[10px] font-medium text-[#6b4d00] backdrop-blur-md transition-all hover:bg-[#ffe6a8] sm:text-[11px] dark:border-[#f6c55c]/25 dark:bg-[#f6c55c]/14 dark:text-[#ffe2a1] dark:hover:bg-[#f6c55c]/20"
          >
            <Coffee className="size-3" />
            Buy me a coffee
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemePicker />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="relative size-9 rounded-full border border-black/12 bg-black/6 backdrop-blur-md transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/8 dark:hover:bg-white/20"
        >
          <Sun className="absolute size-4 rotate-0 scale-100 text-slate-600 transition-all duration-200 dark:-rotate-90 dark:scale-0 dark:text-white/80" />
          <Moon className="absolute size-4 rotate-90 scale-0 text-slate-600 transition-all duration-200 dark:rotate-0 dark:scale-100 dark:text-white/80" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
