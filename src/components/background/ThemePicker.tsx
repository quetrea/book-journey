"use client";

import { Palette } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBackgroundTheme } from "./BackgroundProvider";

export function ThemePicker() {
  const { theme: active, setThemeId, themes } = useBackgroundTheme();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Choose background theme"
          className="relative size-9 rounded-full border border-black/12 bg-black/6 backdrop-blur-md transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/8 dark:hover:bg-white/20"
        >
          <Palette className="size-4 text-foreground/80" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-64 border border-black/12 bg-white/92 p-3 backdrop-blur-2xl dark:border-white/10 dark:bg-black/70"
      >
        <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-white/50">
          Background Theme
        </p>

        <div className="grid grid-cols-5 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.name}
              onClick={() => setThemeId(t.id)}
              className="group relative flex flex-col items-center gap-1.5"
            >
              {/* Color swatch */}
              <span
                className="relative size-9 overflow-hidden rounded-full border-2 transition-all duration-200"
                style={{
                  borderColor: active.id === t.id ? (isDark ? "white" : "#1e293b") : "transparent",
                  background: `conic-gradient(from 0deg, ${t.orb1} 0%, ${t.orb2} 50%, ${t.orb3} 100%)`,
                  boxShadow:
                    active.id === t.id
                      ? `0 0 12px 3px ${t.orb1}66`
                      : "none",
                }}
              >
                {active.id === t.id && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className={`size-2 rounded-full shadow-sm ${isDark ? "bg-white" : "bg-slate-900"}`} />
                  </span>
                )}
              </span>
              {/* Name */}
              <span className="text-[9px] leading-tight text-slate-500 transition-colors group-hover:text-slate-800 dark:text-white/50 dark:group-hover:text-white/80">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
