"use client";

import { useBackgroundTheme } from "@/components/background/BackgroundProvider";
import { useTheme } from "next-themes";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useThemeGlow() {
  const { theme } = useBackgroundTheme();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const orb = theme.orb1;

  return {
    /** Large ambient shadow for outer section wrappers */
    sectionShadow: isDark
      ? `0 30px 90px -35px ${hexToRgba(orb, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.05)`
      : `0 30px 90px -35px ${hexToRgba(orb, 0.12)}, inset 0 1px 0 rgba(255,255,255,0.88)`,

    /** Soft ambient shadow for card containers */
    cardShadow: isDark
      ? `0 18px 50px -28px ${hexToRgba(orb, 0.65)}, inset 0 1px 0 rgba(255,255,255,0.06)`
      : `0 18px 50px -28px ${hexToRgba(orb, 0.28)}, inset 0 1px 0 rgba(255,255,255,0.92)`,

    /** Hover shadow for interactive cards */
    cardHoverShadow: isDark
      ? `0 16px 40px -8px ${hexToRgba(orb, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.10)`
      : `0 16px 40px -8px ${hexToRgba(orb, 0.30)}, inset 0 1px 0 rgba(255,255,255,0.96)`,

    /** Resting shadow for list item cards */
    itemShadow: isDark
      ? `0 8px 28px -10px ${hexToRgba(orb, 0.28)}, inset 0 1px 0 rgba(255,255,255,0.06)`
      : `0 8px 28px -10px ${hexToRgba(orb, 0.12)}, inset 0 1px 0 rgba(255,255,255,0.90)`,

    /** Hover shadow for list item cards */
    itemHoverShadow: isDark
      ? `0 16px 40px -8px ${hexToRgba(orb, 0.45)}, inset 0 1px 0 rgba(255,255,255,0.09)`
      : `0 16px 40px -8px ${hexToRgba(orb, 0.22)}, inset 0 1px 0 rgba(255,255,255,0.96)`,

    orb,
    isDark,
  };
}
