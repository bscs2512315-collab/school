"use client";

import React, { useState } from "react";
import Image from "next/image";
import TrophySVG from "@/public/svgs/TrophySVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import LockSVG from "@/public/svgs/LockSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import PeriodicHonorModal from "./PeriodicHonorModal";
import type { PeriodicHonorBadge, ActivePeriodRace } from "@/lib/gamification/badges";
import { CARD_PATTERNS, BADGE_PATTERN_MAP } from "@/lib/gamification/badgePatterns";
import { cn } from "@/lib/utils";

interface PeriodicHonorsSectionProps {
  honors: PeriodicHonorBadge[];
  activeRaces?: ActivePeriodRace[];
  isLoading?: boolean;
}

export default function PeriodicHonorsSection({
  honors,
  activeRaces = [],
  isLoading = false,
}: PeriodicHonorsSectionProps) {
  const [selectedHonor, setSelectedHonor] = useState<PeriodicHonorBadge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const unlockedCount = honors.filter((h) => h.unlocked).length;

  const handleHonorClick = (honor: PeriodicHonorBadge) => {
    setSelectedHonor(honor);
    setIsModalOpen(true);
  };

  const findRace = (periodType: "week" | "month" | "year") => {
    return activeRaces.find((r) => r.periodType === periodType) || null;
  };

  if (isLoading && honors.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 w-full rounded-3xl bg-muted/40 border border-border/50" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-3xl bg-muted/30 border border-border/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-linear-to-r from-amber-500/10 via-orange-500/5 to-card p-5 sm:p-6 shadow-sm">
        {/* Glow orb */}
        <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-amber-500/15 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-xs">
                <TrophySVG className="size-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                Hall of Fame & Periodic Honors
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pl-9">
              Flagship prestigious titles awarded to the premier students of the active Year, Month, and Week.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-9 sm:pl-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/30 px-3.5 py-1 text-xs font-black text-amber-600 dark:text-amber-300 shadow-2xs">
              <SparklesSVG className="size-3 text-amber-500" />
              <span>
                {unlockedCount} Crown{unlockedCount === 1 ? "" : "s"} Held
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Flagship Periodic Honors Grid (3 Primary Cards: Year, Month, Week) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {honors.map((honor, idx) => {
          const isUnlocked = honor.unlocked;
          const matchingRace = findRace(honor.periodType);
          const patternKey = BADGE_PATTERN_MAP[honor.badgeKey] || (honor.periodType === "year" ? "hexLattice" : honor.periodType === "month" ? "sacredPoly" : "celestialOrbits");
          const patternUrl = CARD_PATTERNS[patternKey];
          const displayTitle = isUnlocked
            ? honor.title
            : honor.title.toLowerCase().startsWith("who will be")
              ? honor.title
              : `Who Will Be ${honor.title}?`;

          return (
            <div
              key={honor.badgeKey || idx}
              onClick={() => handleHonorClick(honor)}
              className={cn(
                "group relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer overflow-hidden border min-h-[330px]",
                "border-white/25 text-white shadow-xl hover:-translate-y-1.5 hover:shadow-2xl hover:border-white/45",
                `bg-gradient-to-br ${honor.gradient}`,
                honor.borderGlow || "shadow-lg",
              )}
            >
              {/* Top ambient lighting */}
              <div className="pointer-events-none absolute -top-[25%] -right-[20%] size-[80%] rounded-full bg-white/20 blur-[40px]" />
              <div className="pointer-events-none absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/40 blur-[40px]" />

              {/* Top Performer Watermark Icons */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <TrophySVG className="absolute -bottom-3 -right-2 size-24 text-white/10 -rotate-12 select-none" />
                <CrownSVG className="absolute -top-3 right-8 size-14 text-white/10 rotate-12 select-none" />
                <MedalSVG className="absolute bottom-2 left-6 size-12 text-white/[0.08] -rotate-6 select-none" />
              </div>

              {/* Radial Dot Matrix Grid Watermark */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
                style={{
                  backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />

              {/* Vector Background Pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay transition-opacity duration-300 group-hover:opacity-[0.22]"
                style={{
                  backgroundImage: patternUrl,
                  backgroundSize:
                    patternKey === "sacredPoly"
                      ? "56px 56px"
                      : patternKey === "celestialOrbits"
                      ? "48px 48px"
                      : patternKey === "circuitNodes"
                      ? "44px 44px"
                      : "36px 36px",
                }}
              />

              {/* Glassmorphic Top Gloss Reflection */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/25 via-white/5 to-transparent rounded-t-3xl" />

              {/* Holographic light sweep on hover */}
              <div className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-35 translate-x-[-150%] transition-transform duration-1000 group-hover:translate-x-[150%]" />

              {/* Top Bar: Tier & Unlocked / Race Status */}
              <div className="relative z-10 flex w-full items-center justify-between gap-1.5 flex-nowrap">
                <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white border border-white/30 shadow-2xs whitespace-nowrap shrink-0">
                  {honor.tier} • {honor.edition}
                </span>

                {!isUnlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/35 backdrop-blur-md px-2.5 py-0.5 text-[9.5px] font-bold text-amber-200 border border-white/20 whitespace-nowrap shrink-0 shadow-xs">
                    <SparklesSVG className="size-2.5 text-amber-300 shrink-0 animate-pulse" />
                    <span>Race in Progress</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/25 backdrop-blur-md px-2.5 py-0.5 text-[9.5px] font-black uppercase text-white border border-white/35 whitespace-nowrap shrink-0 shadow-xs">
                    <CheckCircleSVG className="size-2.5 text-emerald-300 shrink-0" />
                    <span>Champion</span>
                  </span>
                )}
              </div>

              {/* Center 3D SVG Display with Orbital Halo */}
              <div className="relative z-10 my-3 flex size-28 items-center justify-center self-center sm:size-32">
                {/* Radiant Halo behind Badge */}
                <div className="pointer-events-none absolute inset-0 m-auto size-22 sm:size-26 rounded-full bg-white/25 blur-md transition-transform duration-500 group-hover:scale-125" />
                <div className="pointer-events-none absolute inset-0 m-auto size-24 sm:size-28 rounded-full border border-white/25 opacity-70 transition-transform duration-700 group-hover:rotate-45" />

                <div
                  className={cn(
                    "relative flex size-full items-center justify-center transition-transform duration-500 group-hover:scale-115 group-hover:-rotate-2",
                    isUnlocked
                      ? "drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
                      : "drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] hover:brightness-110",
                  )}
                >
                  <Image
                    src={honor.icon}
                    alt={honor.title}
                    width={128}
                    height={128}
                    className="size-full object-contain"
                  />
                </div>
              </div>

              {/* Bottom Details - Truncation Removed */}
              <div className="relative z-10 w-full space-y-2 text-left">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-xs leading-snug">
                    {displayTitle}
                  </h3>
                  <p className="text-xs font-semibold text-white/85 leading-relaxed">
                    {honor.tagline}
                  </p>
                </div>

                {/* Progress / Live Race Stats */}
                {matchingRace && (
                  <div className="rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 p-2.5 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/95">
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Race: Rank #{matchingRace.userRank}
                      </span>
                      <span className="text-amber-300 font-black">
                        +{honor.rewardPoints} pts
                      </span>
                    </div>

                    {/* Vivid Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/40 p-0.5 border border-white/15">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 transition-all duration-700 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                        style={{ width: `${Math.max(matchingRace.progress, 5)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-medium text-white/80">
                      <span>Tests: {matchingRace.testsCompleted}/{matchingRace.minTestsRequired}</span>
                      <span>Accuracy: {matchingRace.userAccuracy}%</span>
                    </div>
                  </div>
                )}

                {/* Click CTA */}
                <div className="flex items-center justify-between pt-0.5 text-[11px] font-bold text-white/85 group-hover:text-white">
                  <span>{isUnlocked ? "View Certificate & Stats" : "View Rules & Criteria"}</span>
                  <ArrowRightSVG className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspection Modal */}
      <PeriodicHonorModal
        honor={selectedHonor}
        race={selectedHonor ? findRace(selectedHonor.periodType) : null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
