"use client";

import { Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBackgroundTheme } from "./BackgroundProvider";

export function ThemePicker() {
  const { theme: active, setThemeId, themes } = useBackgroundTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Choose background theme"
          className="relative size-9 rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 dark:border-white/10 dark:bg-white/8"
        >
          <Palette className="size-4 text-foreground/80" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-64 border border-white/20 bg-black/70 p-3 backdrop-blur-2xl dark:border-white/10"
      >
        <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-white/50">
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
                  borderColor: active.id === t.id ? "white" : "transparent",
                  background: `conic-gradient(from 0deg, ${t.orb1} 0%, ${t.orb2} 50%, ${t.orb3} 100%)`,
                  boxShadow:
                    active.id === t.id
                      ? `0 0 12px 3px ${t.orb1}66`
                      : "none",
                }}
              >
                {active.id === t.id && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="size-2 rounded-full bg-white shadow-sm" />
                  </span>
                )}
              </span>
              {/* Name */}
              <span className="text-[9px] leading-tight text-white/50 transition-colors group-hover:text-white/80">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
