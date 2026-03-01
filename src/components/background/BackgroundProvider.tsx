"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";

import { BACKGROUND_THEMES, DEFAULT_THEME_ID, type BackgroundTheme } from "./themes";
import { ParticleCanvas } from "./ParticleCanvas";

type BackgroundContextValue = {
  theme: BackgroundTheme;
  setThemeId: (id: string) => void;
  themes: BackgroundTheme[];
};

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

const STORAGE_KEY = "bj-bg-theme";

export function useBackgroundTheme() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) throw new Error("useBackgroundTheme must be used within BackgroundProvider");
  return ctx;
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && BACKGROUND_THEMES.find((t) => t.id === stored)) {
      setThemeIdState(stored);
    }
  }, []);

  useEffect(() => {
    const el = spotlightRef.current;
    if (!el) return;

    let raf: number;
    const onMove = ({ clientX: x, clientY: y }: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x - 400}px, ${y - 400}px)`;
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const theme = BACKGROUND_THEMES.find((t) => t.id === themeId) ?? BACKGROUND_THEMES[0]!;

  function setThemeId(id: string) {
    setThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  // Dark mode: vivid orbs on dark base; Light mode: tinted orbs on near-white base
  const base = isDark ? theme.base : "#eef0f8";
  const orb1Opacity = isDark ? 0.70 : 0.38;
  const orb2Opacity = isDark ? 0.60 : 0.30;
  const orb3Opacity = isDark ? 0.55 : 0.26;
  const orb4Opacity = isDark ? 0.40 : 0.18;
  const vignette = isDark
    ? "radial-gradient(ellipse 80% 60% at 50% 0%,transparent 40%,rgba(0,0,0,0.55) 100%)"
    : "radial-gradient(ellipse 80% 60% at 50% 0%,transparent 40%,rgba(180,190,215,0.25) 100%)";

  return (
    <BackgroundContext.Provider value={{ theme, setThemeId, themes: BACKGROUND_THEMES }}>
      {/* Fixed animated background — behind all content */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 overflow-hidden transition-[background] duration-700"
        style={{ background: base }}
      >
        {/* Particle canvas — dancing nodes */}
        <ParticleCanvas color={theme.orb1} isDark={isDark} />

        {/* Orb 1 — top-left anchor, breathe-1 */}
        <div
          className="absolute -left-48 -top-48 size-[750px] transition-opacity duration-700"
          style={{
            opacity: orb1Opacity,
            animation: "orb-breathe-1 7s ease-in-out infinite",
          }}
        >
          <div
            className="size-full rounded-full blur-[130px]"
            style={{
              background: `radial-gradient(circle, ${theme.orb1}cc 0%, ${theme.orb1}44 55%, transparent 80%)`,
              animation: "orb-drift-1 24s ease-in-out infinite",
            }}
          />
        </div>

        {/* Orb 2 — top-right anchor, breathe-2 */}
        <div
          className="absolute -right-48 top-8 size-[650px] transition-opacity duration-700"
          style={{
            opacity: orb2Opacity,
            animation: "orb-breathe-2 9s ease-in-out infinite",
          }}
        >
          <div
            className="size-full rounded-full blur-[150px]"
            style={{
              background: `radial-gradient(circle, ${theme.orb2}cc 0%, ${theme.orb2}44 55%, transparent 80%)`,
              animation: "orb-drift-2 30s ease-in-out infinite",
            }}
          />
        </div>

        {/* Orb 3 — bottom-center anchor, breathe-3 */}
        <div
          className="absolute bottom-0 left-1/2 size-[700px] -translate-x-1/2 transition-opacity duration-700"
          style={{
            opacity: orb3Opacity,
            animation: "orb-breathe-3 11s ease-in-out infinite",
          }}
        >
          <div
            className="size-full rounded-full blur-[160px]"
            style={{
              background: `radial-gradient(circle, ${theme.orb3}cc 0%, ${theme.orb3}44 55%, transparent 80%)`,
              animation: "orb-drift-3 38s ease-in-out infinite",
            }}
          />
        </div>

        {/* Orb 4 — center depth, breathe-4 */}
        <div
          className="absolute left-1/4 top-1/3 size-[450px] transition-opacity duration-700"
          style={{
            opacity: orb4Opacity,
            animation: "orb-breathe-4 13s ease-in-out infinite",
          }}
        >
          <div
            className="size-full rounded-full blur-[170px]"
            style={{
              background: `radial-gradient(circle, ${theme.orb1}66 0%, ${theme.orb2}33 60%, transparent 80%)`,
              animation: "orb-drift-4 42s ease-in-out infinite",
            }}
          />
        </div>

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ background: vignette }}
        />

        {/* Mouse spotlight */}
        <div
          ref={spotlightRef}
          className="pointer-events-none absolute top-0 left-0 size-[800px] rounded-full will-change-transform"
          style={{
            background: `radial-gradient(circle, ${theme.orb1}${isDark ? "1c" : "14"} 0%, ${theme.orb1}08 50%, transparent 70%)`,
          }}
        />
      </div>

      {children}
    </BackgroundContext.Provider>
  );
}
