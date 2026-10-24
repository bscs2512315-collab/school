"use client";

import React, { useState } from "react";
import Image from "next/image";
import LockSVG from "@/public/svgs/LockSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import StarSVG from "@/public/svgs/StarSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import BadgeDetailsModal from "./BadgeDetailsModal";
import type { UserBadgeStatus } from "@/lib/gamification/badges";
import { CARD_PATTERNS, BADGE_PATTERN_MAP } from "@/lib/gamification/badgePatterns";
import { cn } from "@/lib/utils";

interface PerformanceBadgesSectionProps {
  badges: UserBadgeStatus[];
  isLoading?: boolean;
}

export default function PerformanceBadgesSection({
  badges,
  isLoading = false,
}: PerformanceBadgesSectionProps) {
  const [selectedBadge, setSelectedBadge] = useState<UserBadgeStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  const handleBadgeClick = (badge: UserBadgeStatus) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  if (isLoading && badges.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 w-full rounded-3xl bg-muted/40 border border-border/50" />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-60 rounded-3xl bg-muted/30 border border-border/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <TrophySVG className="size-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                Performance Badges & Mastery Honors
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pl-9">
              Exclusive performance badges earned by hitting flawless accuracy, consecutive streaks, and leaderboard dominance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-9 sm:pl-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-500/25 px-3.5 py-1 text-xs font-black text-amber-700 dark:text-amber-300 shadow-2xs">
              <SparklesSVG className="size-3 text-amber-500" />
              <span>
                {unlockedCount} / {totalCount} Badges Unlocked
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {badges.map((badge, idx) => {
          const isUnlocked = badge.unlocked;
          const patternKey = BADGE_PATTERN_MAP[badge.key] || "hexLattice";
          const patternUrl = CARD_PATTERNS[patternKey];

          return (
            <div
              key={badge.key || idx}
              onClick={() => handleBadgeClick(badge)}
              className={cn(
                "group relative flex flex-col items-center justify-between rounded-3xl p-4 transition-all duration-300 cursor-pointer text-center overflow-hidden border min-h-[250px]",
                isUnlocked && [
                  "border-white/25 text-white shadow-lg hover:-translate-y-1.5 hover:shadow-2xl hover:border-white/45",
                  `bg-linear-to-br ${badge.gradient}`,
                  badge.borderGlow,
                ],
                !isUnlocked && [
                  "border-border/60 bg-linear-to-br from-slate-900 via-slate-950 to-black text-white/80 hover:-translate-y-1 hover:border-white/25 shadow-sm",
                ],
              )}
            >
              {/* Atmospheric lighting highlights */}
              <div className="pointer-events-none absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
              <div className="pointer-events-none absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/40 blur-[30px]" />
              
              {/* Vector Background Pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay transition-opacity duration-300 group-hover:opacity-[0.24]"
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
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-white/25 via-white/5 to-transparent rounded-t-3xl" />

              {/* Holographic light sweep on hover */}
              <div className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-35 translate-x-[-150%] transition-transform duration-1000 group-hover:translate-x-[150%]" />

              {/* Tier & Status Tag Top Bar */}
              <div className="relative z-10 flex w-full items-center justify-between gap-1">
                <span className="rounded-full bg-white/20 backdrop-blur-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white border border-white/25 shadow-2xs">
                  {badge.tier}
                </span>

                {!isUnlocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/60">
                    <LockSVG className="size-2.5 text-white/50" />
                    <span>Locked</span>
                  </span>
                )}
              </div>

              {/* 3D Badge Image with Orbital Glow Halo */}
              <div className="relative z-10 my-2.5 flex size-24 items-center justify-center sm:size-26">
                {/* Radiant Pedestal Halo behind Badge */}
                <div className="pointer-events-none absolute inset-0 m-auto size-18 sm:size-20 rounded-full bg-white/20 blur-md transition-transform duration-500 group-hover:scale-125" />
                <div className="pointer-events-none absolute inset-0 m-auto size-20 sm:size-24 rounded-full border border-white/20 opacity-60 transition-transform duration-700 group-hover:rotate-45" />

                <div
                  className={cn(
                    "relative flex size-full items-center justify-center transition-transform duration-500 group-hover:scale-115 group-hover:-rotate-2",
                    isUnlocked
                      ? "drop-shadow-2xl"
                      : "opacity-45 grayscale-[35%] contrast-115",
                  )}
                >
                  <Image
                    src={badge.icon}
                    alt={badge.name}
                    width={104}
                    height={104}
                    className="size-full object-contain drop-shadow-lg"
                  />
                </div>
              </div>

              {/* Badge Details */}
              <div className="relative z-10 w-full space-y-1.5">
                <div>
                  <h3 className="truncate text-sm font-black tracking-tight text-white sm:text-base drop-shadow-xs">
                    {badge.name}
                  </h3>
                  <p className="line-clamp-1 text-[10px] font-semibold text-white/80">
                    {badge.tagline}
                  </p>
                </div>

                {/* Progress / Requirement Status */}
                <div className="pt-0.5">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/20 backdrop-blur-md border border-white/25 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                      <StarSVG className="size-2.5 text-amber-200" />
                      <span>+{badge.rewardPoints} XP EARNED</span>
                    </span>
                  ) : (
                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-white/80">
                        <span>{badge.progress}%</span>
                        <span className="truncate max-w-[90px]">{badge.progressLabel}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50 border border-white/15">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-amber-400 to-emerald-400 transition-all duration-700 shadow-xs"
                          style={{ width: `${Math.max(badge.progress, 3)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Quick Action Indicator */}
              <div className="relative z-10 mt-2 flex items-center gap-1 text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100 text-white/90">
                <span>View Details</span>
                <ArrowRightSVG className="size-3 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <BadgeDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        badge={selectedBadge}
      />
    </div>
  );
}
