"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function LandingTopBar() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme ? resolvedTheme === "dark" : true;

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex flex-col items-start gap-1">
        <p className="text-base font-semibold tracking-tight sm:text-lg">
          bookjourney
        </p>
        <Badge
          variant="secondary"
          className="border-white/20 bg-white/20 text-[10px] dark:border-white/10 dark:bg-white/10 sm:text-[11px]"
        >
          Realtime reading sessions
        </Badge>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="relative rounded-full border border-white/20 bg-white/15 backdrop-blur-md transition-all hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20"
      >
        <Sun className="absolute size-4 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </header>
  );
}
