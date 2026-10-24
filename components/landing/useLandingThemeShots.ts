"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const LANDING_SHOTS = [
  "dashboard",
  "past-papers",
  "leaderboard",
  "nova",
  "generate",
  "history",
] as const;

export type LandingShotName = (typeof LANDING_SHOTS)[number];

export function getLandingShotSrc(name: LandingShotName, isDark: boolean): string {
  return isDark ? `/landing/${name}-dark-v2.webp` : `/landing/${name}.webp`;
}

export function getLandingMobileShotSrc(name: LandingShotName, isDark: boolean): string {
  return isDark ? `/landing/mobile-${name}-dark.webp` : `/landing/mobile-${name}.webp`;
}

export function useLandingThemeShots() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return {
    mounted,
    isDark,
    shot: (name: LandingShotName) => getLandingShotSrc(name, isDark),
    mobileShot: (name: LandingShotName) => getLandingMobileShotSrc(name, isDark),
    shotPair: (name: LandingShotName) => ({
      light: getLandingShotSrc(name, false),
      dark: getLandingShotSrc(name, true),
    }),
    mobileShotPair: (name: LandingShotName) => ({
      light: getLandingMobileShotSrc(name, false),
      dark: getLandingMobileShotSrc(name, true),
    }),
  };
}
