"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";

import { BACKGROUND_THEMES, DEFAULT_THEME_ID, type BackgroundTheme } from "./themes";
import { ParticleCanvas } from "./ParticleCanvas";

type BackgroundContextValue = {
  theme: BackgroundTheme;
  setThemeId: (id: string) => void;
  themes: BackgroundTheme[];
};

type MoonVisual = {
  phaseName: "new" | "waxing-crescent" | "first-quarter" | "waxing-gibbous" | "full" | "waning-gibbous" | "last-quarter" | "waning-crescent";
  illumination: number;
  shadowOffsetPercent: number;
  shadowOpacity: number;
  isBloodMoon: boolean;
};

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

const STORAGE_KEY = "bj-bg-theme";
const MOON_MIN_X = 0.06;
const MOON_MAX_X = 0.94;
const MOON_MIN_Y = 0.08;
const MOON_MAX_Y = 0.84;
const MOON_MAGNET_ZONE = 0.16;
const MOON_SWITCH_ZONE = 0.08;
const MOON_SNAP_DELAY_MS = 190;
const SUN_ENTER_OFFSET_PX = 220;
const MOON_ENTER_OFFSET_PX = 220;
const CELESTIAL_ENTER_OFFSET_Y_PX = 250;
const MODE_MORPH_MS = 680;
const INITIAL_MOON_POSITION = { x: 0.84, y: 0.16 };
const INITIAL_SUN_POSITION = { x: 0.84, y: 0.16 };
const SYNODIC_MONTH_DAYS = 29.53058867;
const MOON_REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const BLOOD_MOON_UTC_DATES = new Set([
  "2025-03-14",
  "2025-09-07",
  "2026-03-03",
  "2026-08-28",
  "2027-02-20",
  "2027-08-17",
]);
const DEFAULT_MOON_VISUAL: MoonVisual = {
  phaseName: "waxing-gibbous",
  illumination: 0.74,
  shadowOffsetPercent: -148,
  shadowOpacity: 0.92,
  isBloodMoon: false,
};
const STAR_FIELD = [
  { left: "6%", top: "12%", size: 1.8, delay: 0.2, duration: 4.6 },
  { left: "12%", top: "28%", size: 1.4, delay: 1.3, duration: 5.2 },
  { left: "18%", top: "8%", size: 2.2, delay: 0.8, duration: 4.1 },
  { left: "23%", top: "19%", size: 1.6, delay: 2.2, duration: 5.8 },
  { left: "29%", top: "11%", size: 1.3, delay: 1.6, duration: 4.9 },
  { left: "34%", top: "26%", size: 2.1, delay: 0.9, duration: 6.1 },
  { left: "41%", top: "16%", size: 1.7, delay: 2.8, duration: 4.7 },
  { left: "46%", top: "7%", size: 1.2, delay: 1.1, duration: 5.7 },
  { left: "51%", top: "22%", size: 2.3, delay: 0.4, duration: 4.3 },
  { left: "57%", top: "13%", size: 1.5, delay: 2.4, duration: 6.3 },
  { left: "63%", top: "9%", size: 1.9, delay: 1.7, duration: 5.1 },
  { left: "69%", top: "24%", size: 1.4, delay: 0.5, duration: 4.8 },
  { left: "74%", top: "15%", size: 2.4, delay: 2.9, duration: 6.2 },
  { left: "79%", top: "6%", size: 1.2, delay: 1.5, duration: 4.2 },
  { left: "84%", top: "18%", size: 2.0, delay: 0.7, duration: 5.6 },
  { left: "89%", top: "11%", size: 1.5, delay: 2.6, duration: 6.4 },
  { left: "94%", top: "23%", size: 1.8, delay: 1.0, duration: 4.5 },
  { left: "8%", top: "38%", size: 1.3, delay: 2.1, duration: 5.5 },
  { left: "16%", top: "47%", size: 2.1, delay: 0.6, duration: 4.4 },
  { left: "27%", top: "41%", size: 1.6, delay: 1.4, duration: 5.9 },
  { left: "37%", top: "44%", size: 1.2, delay: 2.5, duration: 4.6 },
  { left: "44%", top: "53%", size: 1.9, delay: 0.3, duration: 6.2 },
  { left: "55%", top: "39%", size: 1.5, delay: 2.7, duration: 4.9 },
  { left: "66%", top: "48%", size: 2.2, delay: 0.9, duration: 5.3 },
  { left: "73%", top: "37%", size: 1.4, delay: 1.9, duration: 6.1 },
  { left: "82%", top: "45%", size: 1.7, delay: 2.3, duration: 4.7 },
  { left: "91%", top: "40%", size: 1.2, delay: 0.8, duration: 5.4 },
  { left: "11%", top: "61%", size: 1.8, delay: 2.0, duration: 4.3 },
  { left: "21%", top: "72%", size: 1.3, delay: 0.5, duration: 5.8 },
  { left: "32%", top: "66%", size: 2.0, delay: 1.2, duration: 4.8 },
  { left: "43%", top: "74%", size: 1.5, delay: 2.6, duration: 6.0 },
  { left: "53%", top: "63%", size: 2.2, delay: 0.7, duration: 4.1 },
  { left: "64%", top: "70%", size: 1.4, delay: 1.8, duration: 5.7 },
  { left: "75%", top: "62%", size: 1.9, delay: 2.9, duration: 4.6 },
  { left: "86%", top: "73%", size: 1.6, delay: 1.1, duration: 6.3 },
  { left: "95%", top: "68%", size: 1.2, delay: 2.4, duration: 4.4 },
] as const;

function seededUnit(index: number, salt: number) {
  let value = Math.imul(index + 1, 374761393) + Math.imul(salt + 1, 668265263);
  value = (value ^ (value >>> 13)) >>> 0;
  value = Math.imul(value, 1274126177) >>> 0;
  return value / 4294967295;
}

const EXTRA_STAR_FIELD = Array.from({ length: 92 }, (_, index) => {
  const left = seededUnit(index, 1) * 100;
  const top = seededUnit(index, 2) * 86 + 4;
  const size = Number((0.8 + seededUnit(index, 3) * 2.4).toFixed(5));
  const delay = Number((seededUnit(index, 4) * 4.2).toFixed(5));
  const duration = Number((3.4 + seededUnit(index, 5) * 4.8).toFixed(5));
  const glow = Number((0.38 + seededUnit(index, 6) * 0.46).toFixed(5));
  return {
    left: `${left.toFixed(2)}%`,
    top: `${top.toFixed(2)}%`,
    size,
    delay,
    duration,
    glow,
  };
});

const ALL_STARS = [
  ...STAR_FIELD.map((star) => ({ ...star, glow: 0.46 })),
  ...EXTRA_STAR_FIELD,
] as const;

function getMoonPhaseName(phaseFraction: number): MoonVisual["phaseName"] {
  if (phaseFraction < 0.0625 || phaseFraction >= 0.9375) return "new";
  if (phaseFraction < 0.1875) return "waxing-crescent";
  if (phaseFraction < 0.3125) return "first-quarter";
  if (phaseFraction < 0.4375) return "waxing-gibbous";
  if (phaseFraction < 0.5625) return "full";
  if (phaseFraction < 0.6875) return "waning-gibbous";
  if (phaseFraction < 0.8125) return "last-quarter";
  return "waning-crescent";
}

function getMoonVisual(date: Date): MoonVisual {
  const daysSinceReference = (date.getTime() - MOON_REFERENCE_NEW_MOON_MS) / 86400000;
  const phaseFraction = ((daysSinceReference / SYNODIC_MONTH_DAYS) % 1 + 1) % 1;
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phaseFraction));
  const isWaxing = phaseFraction < 0.5;
  const phaseName = getMoonPhaseName(phaseFraction);
  const shadowOffsetPercent = (isWaxing ? -1 : 1) * Math.min(210, illumination * 210);
  const isoDate = date.toISOString().slice(0, 10);
  const isBloodMoon = phaseName === "full" && BLOOD_MOON_UTC_DATES.has(isoDate);
  return {
    phaseName,
    illumination,
    shadowOffsetPercent,
    shadowOpacity: isBloodMoon ? 0.58 : 0.92,
    isBloodMoon,
  };
}

export function useBackgroundTheme() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) throw new Error("useBackgroundTheme must be used within BackgroundProvider");
  return ctx;
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);
  const [isMounted, setIsMounted] = useState(false);
  const backgroundRootRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const moonPointerOriginRef = useRef(INITIAL_MOON_POSITION);
  const moonPositionOriginRef = useRef(INITIAL_MOON_POSITION);
  const sunPointerOriginRef = useRef(INITIAL_SUN_POSITION);
  const sunPositionOriginRef = useRef(INITIAL_SUN_POSITION);
  const modeSwitchTimerRef = useRef<number | null>(null);
  const modeMorphTimerRef = useRef<number | null>(null);
  const sunEnterRafRef = useRef<number | null>(null);
  const moonEnterRafRef = useRef<number | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = isMounted ? resolvedTheme !== "light" : true;
  const [moonPosition, setMoonPosition] = useState(INITIAL_MOON_POSITION);
  const [sunPosition, setSunPosition] = useState(INITIAL_SUN_POSITION);
  const [isMoonDragging, setIsMoonDragging] = useState(false);
  const [isSunDragging, setIsSunDragging] = useState(false);
  const [isSunEnteringFromRight, setIsSunEnteringFromRight] = useState(false);
  const [isMoonEnteringFromLeft, setIsMoonEnteringFromLeft] = useState(false);
  const [isModeMorphing, setIsModeMorphing] = useState(false);
  const [moonVisual, setMoonVisual] = useState<MoonVisual>(DEFAULT_MOON_VISUAL);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setIsMounted(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && BACKGROUND_THEMES.find((t) => t.id === stored)) {
        setThemeIdState(stored);
      }
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const updateMoonVisual = () => {
      setMoonVisual(getMoonVisual(new Date()));
    };
    updateMoonVisual();
    const intervalId = window.setInterval(updateMoonVisual, 30 * 60 * 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const el = spotlightRef.current;
    const bg = backgroundRootRef.current;
    if (!el || !bg) return;

    document.documentElement.style.setProperty("--bj-parallax-x", "0px");
    document.documentElement.style.setProperty("--bj-parallax-y", "0px");

    let raf: number;
    const onMove = ({ clientX: x, clientY: y }: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x - 400}px, ${y - 400}px)`;
        const nx = (x / window.innerWidth - 0.5) * 2;
        const ny = (y / window.innerHeight - 0.5) * 2;
        bg.style.setProperty("--bj-parallax-x", `${(nx * 22).toFixed(2)}px`);
        bg.style.setProperty("--bj-parallax-y", `${(ny * 22).toFixed(2)}px`);
        bg.style.setProperty("--bj-mouse-x", `${((x / window.innerWidth) * 100).toFixed(2)}%`);
        bg.style.setProperty("--bj-mouse-y", `${((y / window.innerHeight) * 100).toFixed(2)}%`);
        document.documentElement.style.setProperty("--bj-parallax-x", `${(nx * 22).toFixed(2)}px`);
        document.documentElement.style.setProperty("--bj-parallax-y", `${(ny * 22).toFixed(2)}px`);
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.documentElement.style.setProperty("--bj-parallax-x", "0px");
      document.documentElement.style.setProperty("--bj-parallax-y", "0px");
      bg.style.setProperty("--bj-mouse-x", "50%");
      bg.style.setProperty("--bj-mouse-y", "50%");
    };
  }, []);

  useEffect(() => {
    return () => {
      if (modeSwitchTimerRef.current !== null) {
        window.clearTimeout(modeSwitchTimerRef.current);
      }
      if (modeMorphTimerRef.current !== null) {
        window.clearTimeout(modeMorphTimerRef.current);
      }
      if (sunEnterRafRef.current !== null) {
        window.cancelAnimationFrame(sunEnterRafRef.current);
      }
      if (moonEnterRafRef.current !== null) {
        window.cancelAnimationFrame(moonEnterRafRef.current);
      }
    };
  }, []);

  function startModeMorph() {
    setIsModeMorphing(true);
    if (modeMorphTimerRef.current !== null) {
      window.clearTimeout(modeMorphTimerRef.current);
    }
    modeMorphTimerRef.current = window.setTimeout(() => {
      setIsModeMorphing(false);
    }, MODE_MORPH_MS);
  }

  function handleMoonPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!isDark) {
      return;
    }

    if (modeSwitchTimerRef.current !== null) {
      window.clearTimeout(modeSwitchTimerRef.current);
      modeSwitchTimerRef.current = null;
    }
    moonPointerOriginRef.current = { x: event.clientX, y: event.clientY };
    moonPositionOriginRef.current = moonPosition;
    setIsMoonDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleMoonPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isMoonDragging) {
      return;
    }

    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const deltaX = event.clientX - moonPointerOriginRef.current.x;
    const deltaY = event.clientY - moonPointerOriginRef.current.y;
    const nextX = Math.max(
      MOON_MIN_X,
      Math.min(MOON_MAX_X, moonPositionOriginRef.current.x + deltaX / viewportWidth),
    );
    const nextY = Math.max(
      MOON_MIN_Y,
      Math.min(MOON_MAX_Y, moonPositionOriginRef.current.y + deltaY / viewportHeight),
    );

    let magnetX = nextX;
    if (nextX <= MOON_MIN_X + MOON_MAGNET_ZONE) {
      const influence = 1 - (nextX - MOON_MIN_X) / MOON_MAGNET_ZONE;
      magnetX = nextX + (MOON_MIN_X - nextX) * influence * 0.62;
    } else if (nextX >= MOON_MAX_X - MOON_MAGNET_ZONE) {
      const influence = 1 - (MOON_MAX_X - nextX) / MOON_MAGNET_ZONE;
      magnetX = nextX + (MOON_MAX_X - nextX) * influence * 0.62;
    }

    setMoonPosition({
      x: Math.max(MOON_MIN_X, Math.min(MOON_MAX_X, magnetX)),
      y: nextY,
    });
  }

  function handleMoonPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!isMoonDragging) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsMoonDragging(false);

    const nearLeftZone = moonPosition.x <= MOON_MIN_X + MOON_SWITCH_ZONE;
    const nearRightZone = moonPosition.x >= MOON_MAX_X - MOON_SWITCH_ZONE;
    if (!nearLeftZone && !nearRightZone) {
      return;
    }

    const snappedX = nearLeftZone ? MOON_MIN_X : MOON_MAX_X;
    setMoonPosition((prev) => ({ ...prev, x: snappedX }));

    if (modeSwitchTimerRef.current !== null) {
      window.clearTimeout(modeSwitchTimerRef.current);
    }
    modeSwitchTimerRef.current = window.setTimeout(() => {
      setSunPosition(INITIAL_SUN_POSITION);
      setIsSunEnteringFromRight(true);
      startModeMorph();
      setTheme("light");
      sunEnterRafRef.current = window.requestAnimationFrame(() => {
        sunEnterRafRef.current = window.requestAnimationFrame(() => {
          setIsSunEnteringFromRight(false);
        });
      });
    }, MOON_SNAP_DELAY_MS);
  }

  function handleSunPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isDark) {
      return;
    }

    if (modeSwitchTimerRef.current !== null) {
      window.clearTimeout(modeSwitchTimerRef.current);
      modeSwitchTimerRef.current = null;
    }
    sunPointerOriginRef.current = { x: event.clientX, y: event.clientY };
    sunPositionOriginRef.current = sunPosition;
    setIsSunDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSunPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isSunDragging) {
      return;
    }

    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const deltaX = event.clientX - sunPointerOriginRef.current.x;
    const deltaY = event.clientY - sunPointerOriginRef.current.y;
    const nextX = Math.max(
      MOON_MIN_X,
      Math.min(MOON_MAX_X, sunPositionOriginRef.current.x + deltaX / viewportWidth),
    );
    const nextY = Math.max(
      MOON_MIN_Y,
      Math.min(MOON_MAX_Y, sunPositionOriginRef.current.y + deltaY / viewportHeight),
    );

    let magnetX = nextX;
    if (nextX <= MOON_MIN_X + MOON_MAGNET_ZONE) {
      const influence = 1 - (nextX - MOON_MIN_X) / MOON_MAGNET_ZONE;
      magnetX = nextX + (MOON_MIN_X - nextX) * influence * 0.62;
    } else if (nextX >= MOON_MAX_X - MOON_MAGNET_ZONE) {
      const influence = 1 - (MOON_MAX_X - nextX) / MOON_MAGNET_ZONE;
      magnetX = nextX + (MOON_MAX_X - nextX) * influence * 0.62;
    }

    setSunPosition({
      x: Math.max(MOON_MIN_X, Math.min(MOON_MAX_X, magnetX)),
      y: nextY,
    });
  }

  function handleSunPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!isSunDragging) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsSunDragging(false);

    const nearLeftZone = sunPosition.x <= MOON_MIN_X + MOON_SWITCH_ZONE;
    const nearRightZone = sunPosition.x >= MOON_MAX_X - MOON_SWITCH_ZONE;
    if (!nearLeftZone && !nearRightZone) {
      return;
    }

    const snappedX = nearLeftZone ? MOON_MIN_X : MOON_MAX_X;
    setSunPosition((prev) => ({ ...prev, x: snappedX }));

    if (modeSwitchTimerRef.current !== null) {
      window.clearTimeout(modeSwitchTimerRef.current);
    }
    modeSwitchTimerRef.current = window.setTimeout(() => {
      setMoonPosition(INITIAL_MOON_POSITION);
      setIsMoonEnteringFromLeft(true);
      startModeMorph();
      setTheme("dark");
      moonEnterRafRef.current = window.requestAnimationFrame(() => {
        moonEnterRafRef.current = window.requestAnimationFrame(() => {
          setIsMoonEnteringFromLeft(false);
        });
      });
    }, MOON_SNAP_DELAY_MS);
  }

  const theme = BACKGROUND_THEMES.find((t) => t.id === themeId) ?? BACKGROUND_THEMES[0]!;

  function setThemeId(id: string) {
    setThemeIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }

  // Dark mode: vivid orbs on dark base; Light mode: tinted orbs on near-white base
  const dawnStrength = isDark
    ? Math.min(1, Math.max(0, (moonPosition.x - 0.54) / 0.4) * (0.55 + moonPosition.y * 0.45))
    : 0;
  const moonlightStrength = isDark
    ? Math.min(1, (1 - dawnStrength) * (0.6 + (1 - moonPosition.y) * 0.4))
    : 0;
  const sunDawnStrength = !isDark
    ? Math.min(
        1,
        Math.max(0, (sunPosition.x - MOON_MIN_X) / (MOON_MAX_X - MOON_MIN_X)) *
          (0.58 + (1 - sunPosition.y) * 0.42),
      )
    : 0;
  const moonGlowX = `${(moonPosition.x * 100).toFixed(1)}%`;
  const moonGlowY = `${(moonPosition.y * 100).toFixed(1)}%`;
  const sunGlowX = `${(sunPosition.x * 100).toFixed(1)}%`;
  const sunGlowY = `${(sunPosition.y * 100).toFixed(1)}%`;
  const base = isDark
    ? `radial-gradient(circle at ${moonGlowX} ${moonGlowY}, rgba(159,184,255,${(0.12 + moonlightStrength * 0.25).toFixed(3)}), rgba(22,28,58,0.86) 34%, rgba(8,12,30,1) 74%),
       radial-gradient(ellipse at 86% 100%, rgba(255,166,104,${(0.06 + dawnStrength * 0.5).toFixed(3)}), transparent 66%),
       linear-gradient(145deg, #030814 0%, #0a1230 44%, #2d2334 100%)`
    : `radial-gradient(circle at ${sunGlowX} ${sunGlowY}, rgba(255,248,215,0.98), rgba(255,235,175,0.82) 24%, rgba(186,224,255,0.46) 56%, rgba(219,236,255,0.18) 74%, rgba(238,240,248,1) 100%),
       radial-gradient(ellipse at 12% 100%, rgba(255,172,118,${(0.1 + sunDawnStrength * 0.34).toFixed(3)}), transparent 66%),
       linear-gradient(165deg, #f8ead1 0%, #d8ecff 44%, #edf3ff 100%)`;
  const orb1Opacity = isDark ? 0.7 - dawnStrength * 0.2 : 0.55;
  const orb2Opacity = isDark ? 0.6 - dawnStrength * 0.14 : 0.45;
  const orb3Opacity = isDark ? 0.55 + dawnStrength * 0.08 : 0.4;
  const orb4Opacity = isDark ? 0.4 + dawnStrength * 0.12 : 0.28;
  const vignette = isDark
    ? `radial-gradient(ellipse 80% 60% at 50% 0%,transparent 40%,rgba(0,0,0,${(0.58 - dawnStrength * 0.22).toFixed(3)}) 100%)`
    : `radial-gradient(ellipse 80% 60% at 50% 0%,transparent 40%,rgba(180,190,215,${(0.23 + sunDawnStrength * 0.14).toFixed(3)}) 100%)`;
  const isActiveDragging = isDark ? isMoonDragging : isSunDragging;
  const activeDragX = isDark ? moonPosition.x : sunPosition.x;
  const activeDragY = isDark ? moonPosition.y : sunPosition.y;
  const leftMagnetStrength =
    isActiveDragging && activeDragX <= MOON_MIN_X + MOON_MAGNET_ZONE
      ? Math.min(1, Math.max(0, 1 - (activeDragX - MOON_MIN_X) / MOON_MAGNET_ZONE))
      : 0;
  const rightMagnetStrength =
    isActiveDragging && activeDragX >= MOON_MAX_X - MOON_MAGNET_ZONE
      ? Math.min(1, Math.max(0, 1 - (MOON_MAX_X - activeDragX) / MOON_MAGNET_ZONE))
      : 0;
  const rightVisualStrength = Math.min(1, rightMagnetStrength * 1.2);
  const magnetCenterY = `${(activeDragY * 100).toFixed(1)}%`;
  const backgroundStyle: CSSProperties & Record<string, string> = {
    background: base,
    "--bj-parallax-x": "0px",
    "--bj-parallax-y": "0px",
    "--bj-mouse-x": "50%",
    "--bj-mouse-y": "50%",
  };

  return (
    <BackgroundContext.Provider value={{ theme, setThemeId, themes: BACKGROUND_THEMES }}>
      {/* Fixed animated background — behind all content */}
      <div
        ref={backgroundRootRef}
        aria-hidden="true"
        className="fixed inset-0 -z-10 overflow-hidden transition-[background,filter] duration-900 ease-out"
        style={backgroundStyle}
      >
        {/* Particle canvas — dancing nodes */}
        <ParticleCanvas color={theme.orb1} isDark={isDark} />

        <div
          className="pointer-events-none absolute inset-0 z-25 transition-opacity duration-500"
          style={{
            opacity: isModeMorphing ? 0.55 : 0,
            background: isDark
              ? "radial-gradient(circle at 74% 24%, rgba(255,208,142,0.28), rgba(16,22,48,0.2) 44%, rgba(3,8,18,0.52) 100%)"
              : "radial-gradient(circle at 24% 24%, rgba(120,156,255,0.3), rgba(44,52,92,0.18) 46%, rgba(247,237,217,0.42) 100%)",
            filter: "blur(0.5px)",
          }}
        />

        {/* Edge magnet feedback (black-hole style) */}
        <div
          className="pointer-events-none absolute left-0 top-0 z-8 h-full w-[28vw]"
          style={{
            opacity: leftMagnetStrength * 0.78,
            transition: "opacity 90ms linear",
            background: isDark
              ? "linear-gradient(90deg, rgba(2,6,18,0.85), rgba(2,6,18,0.58) 24%, rgba(2,6,18,0.16) 60%, transparent 100%)"
              : "linear-gradient(90deg, rgba(26,34,62,0.65), rgba(26,34,62,0.4) 24%, rgba(26,34,62,0.12) 60%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -left-16 top-0 z-9 h-full w-56"
          style={{
            opacity: leftMagnetStrength * 0.98,
            transition: "opacity 90ms linear",
          }}
        >
          <span
            className="absolute left-1/2 size-56 -translate-x-1/2 rounded-full"
            style={{
              top: magnetCenterY,
              transform: `translate(-50%, -50%) scale(${0.84 + leftMagnetStrength * 0.58})`,
              background: isDark
                ? "radial-gradient(circle at 62% 50%, rgba(0,0,0,0.96) 0%, rgba(5,10,26,0.95) 26%, rgba(78,120,238,0.45) 52%, rgba(144,188,255,0.2) 68%, transparent 82%)"
                : "radial-gradient(circle at 62% 50%, rgba(20,30,56,0.9) 0%, rgba(34,51,94,0.84) 24%, rgba(255,176,118,0.44) 52%, rgba(255,205,142,0.24) 68%, transparent 82%)",
              boxShadow: isDark
                ? "0 0 42px rgba(76,118,230,0.52), inset 0 0 28px rgba(0,0,0,0.88)"
                : "0 0 40px rgba(255,166,106,0.46), inset 0 0 24px rgba(18,28,54,0.74)",
              animation: "gravity-pulse 1.2s ease-in-out infinite",
            }}
          >
            <span
              className="absolute inset-[18%] rounded-full"
              style={{
                border: `1px solid ${
                  isDark
                    ? `rgba(150,190,255,${(0.16 + leftMagnetStrength * 0.54).toFixed(3)})`
                    : `rgba(255,198,136,${(0.14 + leftMagnetStrength * 0.5).toFixed(3)})`
                }`,
                animation: "gravity-spin 2.2s linear infinite",
              }}
            />
          </span>
        </div>
        <div
          className="pointer-events-none absolute -right-[4vw] top-0 z-8 h-full w-[34vw]"
          style={{
            opacity: rightVisualStrength * 0.86,
            transition: "opacity 90ms linear",
            background: isDark
              ? "linear-gradient(270deg, rgba(2,6,18,0.92), rgba(2,6,18,0.62) 26%, rgba(2,6,18,0.18) 60%, transparent 100%)"
              : "linear-gradient(270deg, rgba(26,34,62,0.72), rgba(26,34,62,0.46) 26%, rgba(26,34,62,0.14) 60%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 top-0 z-9 h-full w-56"
          style={{
            opacity: rightVisualStrength,
            transition: "opacity 90ms linear",
          }}
        >
          <span
            className="absolute left-1/2 size-56 -translate-x-1/2 rounded-full"
            style={{
              top: magnetCenterY,
              transform: `translate(-50%, -50%) scale(${0.84 + rightVisualStrength * 0.64})`,
              background: isDark
                ? "radial-gradient(circle at 38% 50%, rgba(0,0,0,0.96) 0%, rgba(5,10,26,0.95) 26%, rgba(78,120,238,0.45) 52%, rgba(144,188,255,0.2) 68%, transparent 82%)"
                : "radial-gradient(circle at 38% 50%, rgba(20,30,56,0.9) 0%, rgba(34,51,94,0.84) 24%, rgba(255,176,118,0.44) 52%, rgba(255,205,142,0.24) 68%, transparent 82%)",
              boxShadow: isDark
                ? "0 0 42px rgba(76,118,230,0.52), inset 0 0 28px rgba(0,0,0,0.88)"
                : "0 0 40px rgba(255,166,106,0.46), inset 0 0 24px rgba(18,28,54,0.74)",
              animation: "gravity-pulse 1.2s ease-in-out infinite",
            }}
          >
            <span
              className="absolute inset-[18%] rounded-full"
              style={{
                border: `1px solid ${
                  isDark
                    ? `rgba(150,190,255,${(0.16 + rightVisualStrength * 0.54).toFixed(3)})`
                    : `rgba(255,198,136,${(0.14 + rightVisualStrength * 0.5).toFixed(3)})`
                }`,
                animation: "gravity-spin 2.2s linear infinite reverse",
              }}
            />
          </span>
        </div>

        {isDark ? (
          <>
            {/* Night sky stars */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                transform:
                  "translate3d(calc(var(--bj-parallax-x, 0px) * 0.24), calc(var(--bj-parallax-y, 0px) * 0.24), 0)",
              }}
            >
              {ALL_STARS.map((star, index) => {
                const starSize = star.size.toFixed(5);
                const glowPrimary = Math.max(9, star.size * 6).toFixed(5);
                const glowSecondary = Math.max(16, star.size * 10).toFixed(5);
                const starGlow = star.glow.toFixed(3);
                const animationDuration = `${star.duration.toFixed(5)}s`;
                const animationDelay = `${star.delay.toFixed(5)}s`;
                return (
                <span
                  key={`star-${index}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    left: star.left,
                    top: star.top,
                    width: `${starSize}px`,
                    height: `${starSize}px`,
                    opacity: "0.86",
                    boxShadow: `0 0 ${glowPrimary}px rgba(255,255,255,${starGlow}), 0 0 ${glowSecondary}px rgba(190,220,255,0.32)`,
                    animationName: "star-twinkle",
                    animationDuration,
                    animationTimingFunction: "ease-in-out",
                    animationDelay,
                    animationIterationCount: "infinite",
                  }}
                />
                );
              })}
            </div>

            {/* Dawn haze reacts to moon position */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: 0.25 + dawnStrength * 0.75,
                background: `radial-gradient(ellipse 68% 42% at 82% 100%, rgba(255,160,100,${(0.08 + dawnStrength * 0.46).toFixed(3)}), transparent 72%)`,
                transform:
                  "translate3d(calc(var(--bj-parallax-x, 0px) * 0.16), calc(var(--bj-parallax-y, 0px) * 0.12), 0)",
              }}
            />

            {/* Shooting stars */}
            <span
              className="pointer-events-none absolute left-[18%] top-[19%] h-px w-28 rotate-22"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0))",
                filter: "drop-shadow(0 0 8px rgba(199,214,255,0.75))",
                animation: "shooting-star 9s linear 1.2s infinite",
                transform:
                  "translate3d(calc(var(--bj-parallax-x, 0px) * 0.2), calc(var(--bj-parallax-y, 0px) * 0.14), 0)",
              }}
            />
            <span
              className="pointer-events-none absolute left-[58%] top-[31%] h-px w-24 rotate-16"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.86), rgba(255,255,255,0))",
                filter: "drop-shadow(0 0 7px rgba(178,206,255,0.7))",
                animation: "shooting-star 11s linear 3.4s infinite",
                transform:
                  "translate3d(calc(var(--bj-parallax-x, 0px) * 0.16), calc(var(--bj-parallax-y, 0px) * 0.12), 0)",
              }}
            />
          </>
        ) : (
          <>
            {/* Dawn veil reacts to sun position */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: 0.24 + sunDawnStrength * 0.68,
                background: `radial-gradient(ellipse 66% 44% at 12% 100%, rgba(255,166,108,${(0.1 + sunDawnStrength * 0.38).toFixed(3)}), transparent 72%)`,
                transform:
                  "translate3d(calc(var(--bj-parallax-x, 0px) * 0.12), calc(var(--bj-parallax-y, 0px) * 0.08), 0)",
              }}
            />

            {/* Light clouds */}
            <span
              className="pointer-events-none absolute left-[10%] top-[12%] h-12 w-40 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 35%, rgba(255,255,255,0.78), rgba(255,255,255,0.34) 70%, rgba(255,255,255,0) 100%)",
                filter: "blur(1px)",
                animation: "cloud-drift 22s ease-in-out infinite",
                transform:
                  "translate3d(calc(var(--bj-parallax-x, 0px) * 0.2), calc(var(--bj-parallax-y, 0px) * 0.1), 0)",
              }}
            />
            <span
              className="pointer-events-none absolute left-[55%] top-[22%] h-10 w-32 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 38% 36%, rgba(255,255,255,0.72), rgba(255,255,255,0.3) 72%, rgba(255,255,255,0) 100%)",
                filter: "blur(1px)",
                animation: "cloud-drift 28s ease-in-out 1.4s infinite",
                transform:
                  "translate3d(calc(var(--bj-parallax-x, 0px) * 0.18), calc(var(--bj-parallax-y, 0px) * 0.08), 0)",
              }}
            />
          </>
        )}

        {/* Orb 1 — top-left anchor, breathe-1 */}
        <div
          className="absolute -left-48 -top-48 size-[750px] transition-opacity duration-700"
          style={{
            opacity: orb1Opacity,
            animation: "orb-breathe-1 7s ease-in-out infinite",
            transform:
              "translate3d(calc(var(--bj-parallax-x, 0px) * -0.18), calc(var(--bj-parallax-y, 0px) * -0.14), 0)",
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
            transform:
              "translate3d(calc(var(--bj-parallax-x, 0px) * 0.2), calc(var(--bj-parallax-y, 0px) * -0.12), 0)",
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
            transform:
              "translate3d(calc(var(--bj-parallax-x, 0px) * -0.08), calc(var(--bj-parallax-y, 0px) * 0.18), 0)",
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
            transform:
              "translate3d(calc(var(--bj-parallax-x, 0px) * 0.14), calc(var(--bj-parallax-y, 0px) * 0.14), 0)",
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

        {/* Dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.022)"} 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            opacity: isDark ? 0.55 : 0.5,
            WebkitMaskImage:
              "radial-gradient(340px circle at var(--bj-mouse-x, 50%) var(--bj-mouse-y, 50%), rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.86) 22%, rgba(0,0,0,0.14) 58%, transparent 78%)",
            maskImage:
              "radial-gradient(340px circle at var(--bj-mouse-x, 50%) var(--bj-mouse-y, 50%), rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.86) 22%, rgba(0,0,0,0.14) 58%, transparent 78%)",
          }}
        />

        {/* Animated grain texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute will-change-transform"
          style={{
            inset: "-150%",
            width: "400%",
            height: "400%",
            opacity: isDark ? 0.018 : 0.012,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            animation: "grain 8s steps(10) infinite",
            WebkitMaskImage:
              "radial-gradient(380px circle at var(--bj-mouse-x, 50%) var(--bj-mouse-y, 50%), rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 24%, rgba(0,0,0,0.1) 60%, transparent 82%)",
            maskImage:
              "radial-gradient(380px circle at var(--bj-mouse-x, 50%) var(--bj-mouse-y, 50%), rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 24%, rgba(0,0,0,0.1) 60%, transparent 82%)",
          }}
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

      {isDark ? (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20">
          <div
            className="pointer-events-auto absolute select-none"
            style={{
              left: `${(moonPosition.x * 100).toFixed(2)}%`,
              top: `${(moonPosition.y * 100).toFixed(2)}%`,
              transform: `translate(calc(-50% + ${isMoonEnteringFromLeft ? MOON_ENTER_OFFSET_PX : 0}px), calc(-50% + ${
                isMoonEnteringFromLeft ? CELESTIAL_ENTER_OFFSET_Y_PX : 0
              }px)) translate3d(calc(var(--bj-parallax-x, 0px) * 0.28), calc(var(--bj-parallax-y, 0px) * 0.28), 0)`,
              transition: isMoonDragging
                ? "none"
                : "left 180ms ease-out, top 180ms ease-out, transform 700ms ease-out",
              cursor: isMoonDragging ? "grabbing" : "grab",
              touchAction: "none",
            }}
            onPointerDown={handleMoonPointerDown}
            onPointerMove={handleMoonPointerMove}
            onPointerUp={handleMoonPointerUp}
            onPointerCancel={handleMoonPointerUp}
          >
            <div
              className="relative size-28 overflow-hidden rounded-full md:size-36"
              style={{
                background: moonVisual.isBloodMoon
                  ? "radial-gradient(circle at 34% 30%, rgba(255,168,148,0.98), rgba(225,86,76,0.92) 48%, rgba(145,28,34,0.9) 76%, rgba(78,8,16,0.82) 100%)"
                  : "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.98), rgba(240,244,255,0.92) 48%, rgba(196,206,235,0.9) 76%, rgba(144,158,201,0.72) 100%)",
                boxShadow:
                  moonVisual.isBloodMoon
                    ? "0 0 42px rgba(255,98,82,0.55), 0 0 110px rgba(166,20,30,0.38)"
                    : "0 0 42px rgba(210,222,255,0.55), 0 0 110px rgba(136,161,232,0.28)",
                animation: isMoonDragging ? "none" : "moon-float 14s ease-in-out infinite",
              }}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: moonVisual.isBloodMoon
                    ? "radial-gradient(circle, rgba(22,0,0,0.95) 0%, rgba(16,0,0,0.88) 68%, rgba(0,0,0,0.82) 100%)"
                    : "radial-gradient(circle, rgba(4,8,18,0.96) 0%, rgba(5,9,22,0.9) 72%, rgba(0,0,0,0.86) 100%)",
                  opacity: moonVisual.shadowOpacity,
                  transform: `translateX(${moonVisual.shadowOffsetPercent.toFixed(2)}%)`,
                  transition: "transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 600ms ease",
                }}
              />
              <span
                className="absolute left-[26%] top-[28%] size-3.5 rounded-full"
                style={{ background: moonVisual.isBloodMoon ? "rgba(255,182,170,0.24)" : "rgba(180,190,220,0.32)" }}
              />
              <span
                className="absolute left-[54%] top-[42%] size-5 rounded-full"
                style={{ background: moonVisual.isBloodMoon ? "rgba(255,164,150,0.2)" : "rgba(176,188,220,0.28)" }}
              />
              <span
                className="absolute left-[38%] top-[58%] size-2.5 rounded-full"
                style={{ background: moonVisual.isBloodMoon ? "rgba(255,144,128,0.22)" : "rgba(165,178,214,0.26)" }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20">
          <div
            className="pointer-events-auto absolute select-none"
            style={{
              left: `${(sunPosition.x * 100).toFixed(2)}%`,
              top: `${(sunPosition.y * 100).toFixed(2)}%`,
              transform: `translate(calc(-50% + ${isSunEnteringFromRight ? SUN_ENTER_OFFSET_PX : 0}px), calc(-50% + ${
                isSunEnteringFromRight ? CELESTIAL_ENTER_OFFSET_Y_PX : 0
              }px)) translate3d(calc(var(--bj-parallax-x, 0px) * 0.24), calc(var(--bj-parallax-y, 0px) * 0.24), 0)`,
              transition: isSunDragging
                ? "none"
                : "left 180ms ease-out, top 180ms ease-out, transform 700ms ease-out",
              cursor: isSunDragging ? "grabbing" : "grab",
              touchAction: "none",
            }}
            onPointerDown={handleSunPointerDown}
            onPointerMove={handleSunPointerMove}
            onPointerUp={handleSunPointerUp}
            onPointerCancel={handleSunPointerUp}
          >
            <div
              className="relative size-28 rounded-full md:size-36"
              style={{
                background:
                  "radial-gradient(circle at 34% 32%, rgba(255,255,245,0.98), rgba(255,235,170,0.95) 46%, rgba(255,202,104,0.92) 72%, rgba(255,164,80,0.9) 100%)",
                boxShadow:
                  "0 0 48px rgba(255,196,110,0.55), 0 0 120px rgba(255,162,87,0.32)",
                animation: isSunDragging ? "none" : "sun-float 10s ease-in-out infinite, sun-glow 6s ease-in-out infinite",
              }}
            >
              <span
                className="absolute inset-[-32%] rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(255,214,126,0.05), rgba(255,214,126,0.35), rgba(255,214,126,0.05))",
                  animation: "sun-spin 18s linear infinite",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {children}
    </BackgroundContext.Provider>
  );
}
