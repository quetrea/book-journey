"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { ThemePicker } from "@/components/background/ThemePicker";
import { ProfileModal } from "@/components/profile/ProfileModal";
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
        <Badge
          variant="secondary"
          className="border-black/12 bg-black/8 text-[10px] text-slate-500 sm:text-[11px] dark:border-white/15 dark:bg-white/10 dark:text-white/60"
        >
          Realtime reading sessions
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <ThemePicker />
        <ProfileModal />

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
