"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  username?: string | null;
  id?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  showRing?: boolean;
  ringClassName?: string;
  alt?: string;
  priority?: boolean;
}

const GRADIENT_PALETTES = [
  {
    bg: "bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700",
    text: "text-white",
    ring: "ring-emerald-400/30",
    shadow: "shadow-emerald-500/25",
  },
  {
    bg: "bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700",
    text: "text-white",
    ring: "ring-indigo-400/30",
    shadow: "shadow-indigo-500/25",
  },
  {
    bg: "bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700",
    text: "text-white",
    ring: "ring-purple-400/30",
    shadow: "shadow-purple-500/25",
  },
  {
    bg: "bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700",
    text: "text-white",
    ring: "ring-rose-400/30",
    shadow: "shadow-rose-500/25",
  },
  {
    bg: "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700",
    text: "text-white",
    ring: "ring-amber-400/30",
    shadow: "shadow-amber-500/25",
  },
  {
    bg: "bg-gradient-to-br from-cyan-500 via-teal-600 to-blue-700",
    text: "text-white",
    ring: "ring-cyan-400/30",
    shadow: "shadow-cyan-500/25",
  },
  {
    bg: "bg-gradient-to-br from-blue-500 via-sky-600 to-indigo-700",
    text: "text-white",
    ring: "ring-blue-400/30",
    shadow: "shadow-blue-500/25",
  },
  {
    bg: "bg-gradient-to-br from-fuchsia-500 via-pink-600 to-purple-700",
    text: "text-white",
    ring: "ring-fuchsia-400/30",
    shadow: "shadow-fuchsia-500/25",
  },
  {
    bg: "bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-800",
    text: "text-white",
    ring: "ring-teal-400/30",
    shadow: "shadow-teal-500/25",
  },
  {
    bg: "bg-gradient-to-br from-orange-400 via-rose-500 to-indigo-600",
    text: "text-white",
    ring: "ring-orange-400/30",
    shadow: "shadow-orange-500/25",
  },
  {
    bg: "bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-600",
    text: "text-white",
    ring: "ring-teal-400/30",
    shadow: "shadow-teal-500/25",
  },
  {
    bg: "bg-gradient-to-br from-blue-500 via-indigo-500 to-fuchsia-600",
    text: "text-white",
    ring: "ring-indigo-400/30",
    shadow: "shadow-indigo-500/25",
  },
  {
    bg: "bg-gradient-to-br from-red-500 via-rose-600 to-amber-600",
    text: "text-white",
    ring: "ring-red-400/30",
    shadow: "shadow-red-500/25",
  },
  {
    bg: "bg-gradient-to-br from-slate-700 via-indigo-800 to-slate-900",
    text: "text-indigo-100",
    ring: "ring-indigo-400/30",
    shadow: "shadow-slate-900/30",
  },
];

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getInitials(name?: string | null, username?: string | null): string {
  const cleanName = (name || "").trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const firstLetter = parts[0].replace(/[^a-zA-Z0-9]/g, "")[0] || parts[0][0];
      const secondPart = parts[1];
      const secondLetter = secondPart.replace(/[^a-zA-Z0-9]/g, "")[0] || secondPart[0];
      return (firstLetter + secondLetter).toUpperCase();
    }
    const cleanLetters = cleanName.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanLetters.length >= 2) {
      return cleanLetters.slice(0, 2).toUpperCase();
    }
    return (cleanLetters[0] || cleanName[0] || "U").toUpperCase();
  }

  const cleanUser = (username || "").replace(/^@/, "").trim();
  if (cleanUser) {
    const parts = cleanUser.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    const cleanLetters = cleanUser.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanLetters.length >= 2) {
      return cleanLetters.slice(0, 2).toUpperCase();
    }
    return (cleanLetters[0] || cleanUser[0] || "U").toUpperCase();
  }

  return "U";
}

const SIZE_MAP: Record<string, { sizeClass: string; textClass: string; px: number }> = {
  xs: { sizeClass: "size-6", textClass: "text-[10px]", px: 24 },
  sm: { sizeClass: "size-8", textClass: "text-xs", px: 32 },
  md: { sizeClass: "size-10", textClass: "text-sm", px: 40 },
  lg: { sizeClass: "size-12 sm:size-14", textClass: "text-base sm:text-lg", px: 56 },
  xl: { sizeClass: "size-16 sm:size-20", textClass: "text-xl sm:text-2xl", px: 80 },
  "2xl": { sizeClass: "size-20 sm:size-28", textClass: "text-2xl sm:text-4xl", px: 112 },
};

export default function UserAvatar({
  src,
  name,
  username,
  id,
  size = "md",
  className,
  imageClassName,
  fallbackClassName,
  showRing = false,
  ringClassName,
  alt,
  priority = false,
}: UserAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);

  // Compute initials and deterministic palette
  const seedString = id || name || username || "User";
  const palette = useMemo(() => {
    const hash = stringToHash(seedString);
    return GRADIENT_PALETTES[hash % GRADIENT_PALETTES.length];
  }, [seedString]);

  const initials = useMemo(() => getInitials(name, username), [name, username]);

  const sizeConfig = typeof size === "string" ? SIZE_MAP[size] || SIZE_MAP.md : null;
  const customPx = typeof size === "number" ? size : (sizeConfig?.px || 40);

  const displayImage = src && !hasImageError;

  return (
    <div
      className={cn(
        "relative shrink-0 select-none overflow-hidden rounded-full font-bold transition-transform",
        sizeConfig ? sizeConfig.sizeClass : "",
        showRing && (ringClassName || "ring-2 ring-background shadow-xs"),
        className,
      )}
      style={typeof size === "number" ? { width: size, height: size } : undefined}
    >
      {displayImage ? (
        <Image
          src={src}
          alt={alt || name || "User avatar"}
          width={customPx}
          height={customPx}
          priority={priority}
          unoptimized
          onError={() => setHasImageError(true)}
          className={cn("size-full object-cover rounded-full", imageClassName)}
        />
      ) : (
        <div
          className={cn(
            "relative flex size-full items-center justify-center rounded-full font-black tracking-wide",
            palette.bg,
            palette.text,
            sizeConfig?.textClass,
            fallbackClassName,
          )}
          style={typeof size === "number" ? { fontSize: `${Math.round(size * 0.42)}px` } : undefined}
        >
          {/* Subtle Ambient Specular Highlight */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/5 to-transparent" />
          
          {/* Ultra-Fine Inner Border Ring */}
          <div className="pointer-events-none absolute inset-px rounded-full border border-white/20" />
          
          {/* Subtle Isometric Geometric Watermark */}
          <svg
            className="pointer-events-none absolute inset-0 size-full opacity-15"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="0.75" />
          </svg>

          {/* User Initials with crisp drop shadow */}
          <span className="relative z-10 leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}
