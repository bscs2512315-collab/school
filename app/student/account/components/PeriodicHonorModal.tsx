"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PeriodicHonorBadge, ActivePeriodRace } from "@/lib/gamification/badges";

interface PeriodicHonorModalProps {
  honor: PeriodicHonorBadge | null;
  race?: ActivePeriodRace | null;
  isOpen: boolean;
  onClose: () => void;
}

interface HonorTheme {
  gradient: string;
  badgeAura: string;
  pedestalDisc: string;
  accentPill: string;
  accentText: string;
  progressGradient: string;
  actionGradient: string;
}

const THEMES: Record<string, HonorTheme> = {
  year: {
    gradient: "from-[#f59e0b] via-[#d97706] to-[#92400e]",
    badgeAura: "drop-shadow-[0_16px_28px_rgba(245,158,11,0.55)]",
    pedestalDisc: "bg-amber-300/30 border-amber-200/50 shadow-[0_0_25px_rgba(245,158,11,0.4)]",
    accentPill: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
    accentText: "text-amber-600 dark:text-amber-400",
    progressGradient: "from-amber-400 via-amber-500 to-yellow-400",
    actionGradient: "from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25",
  },
  month: {
    gradient: "from-[#3b82f6] via-[#2563eb] to-[#1e3a8a]",
    badgeAura: "drop-shadow-[0_16px_28px_rgba(59,130,246,0.55)]",
    pedestalDisc: "bg-blue-300/30 border-blue-200/50 shadow-[0_0_25px_rgba(59,130,246,0.4)]",
    accentPill: "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400",
    accentText: "text-blue-600 dark:text-blue-400",
    progressGradient: "from-blue-400 via-indigo-500 to-cyan-400",
    actionGradient: "from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25",
  },
  week: {
    gradient: "from-[#a855f7] via-[#9333ea] to-[#6b21a8]",
    badgeAura: "drop-shadow-[0_16px_28px_rgba(168,85,247,0.55)]",
    pedestalDisc: "bg-purple-300/30 border-purple-200/50 shadow-[0_0_25px_rgba(168,85,247,0.4)]",
    accentPill: "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400",
    accentText: "text-purple-600 dark:text-purple-400",
    progressGradient: "from-purple-400 via-violet-500 to-pink-400",
    actionGradient: "from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-violet-500 shadow-purple-500/25",
  },
};

export default function PeriodicHonorModal({
  honor,
  race,
  isOpen,
  onClose,
}: PeriodicHonorModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !honor) return null;

  const isUnlocked = honor.unlocked;
  const theme = THEMES[honor.periodType] || THEMES.year;
  const displayTitle = isUnlocked
    ? honor.title
    : honor.title.toLowerCase().startsWith("who will be")
      ? honor.title
      : `Who Will Be ${honor.title}?`;

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Safe Centering Container */}
      <div className="flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4 md:p-6 py-6 sm:py-8 pointer-events-none">
        {/* Modal Dialog Card */}
        <div
          className={cn(
            "pointer-events-auto relative w-full max-w-lg rounded-3xl border border-white/20 dark:border-white/10 bg-card text-foreground shadow-2xl overflow-hidden flex flex-col",
            "max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-4rem)] m-auto animate-in zoom-in-95 duration-200",
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Hero Glowing Header with Curated Theme */}
          <div
            className={cn(
              "relative flex flex-col items-center justify-center px-4 pt-3.5 pb-4 sm:px-6 sm:pt-4 sm:pb-5 text-center overflow-hidden border-b border-white/15 text-white shrink-0 bg-gradient-to-br transition-all duration-500",
              theme.gradient,
            )}
          >
            {/* Ambient Lighting Orbs */}
            <div className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-white/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-52 rounded-full bg-black/40 blur-3xl" />

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

            {/* Glassmorphic Top Gloss Reflection */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/30 via-white/5 to-transparent" />

            {/* Tier & Period Tag & Close Button */}
            <div className="relative z-10 flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="rounded-full bg-black/40 backdrop-blur-md px-3 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white border border-white/30 shadow-xs">
                  {honor.tier} Honor
                </span>
                <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-white border border-white/25 shadow-xs">
                  {honor.edition}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white/90 hover:text-white transition-all cursor-pointer border border-white/30 shadow-md hover:scale-105 active:scale-95"
                aria-label="Close modal"
              >
                <CloseCircleSVG className="size-4.5" />
              </button>
            </div>

            {/* 3D Badge Pedestal Display */}
            <div className="relative z-10 my-2 flex flex-col items-center justify-center">
              {/* Radial aura glow behind badge */}
              <div className="pointer-events-none absolute size-24 rounded-full bg-white/25 blur-xl" />

              <div
                className={cn(
                  "relative flex size-20 sm:size-24 items-center justify-center transition-transform duration-500 hover:scale-105",
                  theme.badgeAura,
                )}
              >
                <Image
                  src={honor.icon}
                  alt={honor.title}
                  width={96}
                  height={96}
                  className="size-full object-contain"
                  priority
                />
              </div>

              {/* 3D Floating Pedestal Disc */}
              <div
                className={cn(
                  "w-20 h-2 sm:w-24 sm:h-2.5 rounded-full border blur-[0.5px] mt-1 transition-all",
                  theme.pedestalDisc,
                )}
              />
            </div>

            {/* Title & Tagline */}
            <div className="relative z-10 space-y-1 px-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white drop-shadow-md leading-snug">
                {displayTitle}
              </h2>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md px-3 py-0.5 text-[11px] sm:text-xs font-semibold text-white/95 border border-white/20 shadow-xs">
                <SparklesSVG className="size-3 text-amber-300" />
                <span>{honor.tagline}</span>
              </div>
            </div>
          </div>

          {/* Modal Body Content (Scrolls smoothly when height is constrained) */}
          <div className="space-y-3.5 p-4 sm:p-5 overflow-y-auto min-h-0 flex-1 overscroll-contain scrollbar-thin">
            {/* Status Banner */}
            <div
              className={cn(
                "flex items-center justify-between rounded-2xl border p-3 px-3.5 shadow-2xs",
                isUnlocked
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
              )}
            >
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  <CheckCircleSVG className="size-4 text-emerald-500" />
                ) : (
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
                  </span>
                )}
                <span className="text-xs font-black">
                  {isUnlocked ? "Distinction Conferred" : "Active Live Academic Race"}
                </span>
              </div>

              <span className="text-[11px] font-bold">
                {isUnlocked
                  ? `Awarded on ${honor.unlockedAt ? new Date(honor.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "This Period"}`
                  : race ? race.timeRemainingLabel : "Race in Progress"}
              </span>
            </div>

            {/* Description & Official Winning Criteria */}
            <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-2xs">
              <div className="space-y-1">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  About this Distinction
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                  {honor.description}
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <TrophySVG className="size-3.5 text-amber-500" />
                  <span>Official Winning Criteria</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                  {honor.criteria}
                </p>
              </div>
            </div>

            {/* Live Race Standing Dashboard (if contest is in progress) */}
            {race && (
              <div className="rounded-2xl border border-border/80 bg-muted/25 p-3.5 sm:p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CrownSVG className="size-3.5 text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      Current Race Standing
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                    {race.timeRemainingLabel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Rank</div>
                    <div className="mt-0.5 text-sm sm:text-base font-black text-foreground">
                      #{race.userRank}{" "}
                      <span className="text-[10px] font-medium text-muted-foreground">/ {race.totalCompetitors}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Accuracy</div>
                    <div
                      className={cn(
                        "mt-0.5 text-sm sm:text-base font-black",
                        race.userAccuracy >= race.minAccuracyRequired ? "text-emerald-500" : "text-foreground",
                      )}
                    >
                      {race.userAccuracy}%
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground">
                      ({race.minAccuracyRequired}% Req)
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tests Done</div>
                    <div
                      className={cn(
                        "mt-0.5 text-sm sm:text-base font-black",
                        race.testsCompleted >= race.minTestsRequired ? "text-emerald-500" : "text-foreground",
                      )}
                    >
                      {race.testsCompleted}{" "}
                      <span className="text-[10px] font-medium text-muted-foreground">/ {race.minTestsRequired}</span>
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground">
                      (Min Req)
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-muted-foreground">Contest Qualification Progress</span>
                    <span className="text-foreground">{race.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border/60">
                    <div
                      className={cn("h-full transition-all duration-500 bg-gradient-to-r", theme.progressGradient)}
                      style={{ width: `${Math.min(100, Math.max(0, race.progress))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Honor Reward Bonus Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/25 bg-linear-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-3 px-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                  <SparklesSVG className="size-3.5" />
                </span>
                <span className="text-xs font-black text-foreground">Honor Conferred Reward</span>
              </div>
              <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                +{honor.rewardPoints} pts
              </span>
            </div>
          </div>

          {/* Pinned Modal Footer Action Buttons - ALWAYS VISIBLE */}
          <div className="shrink-0 border-t border-border/60 p-3 sm:p-4 bg-card/95 backdrop-blur-md flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-border/80 bg-muted/40 hover:bg-muted/80 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              Close
            </button>
            <Link
              href="/student/past-papers"
              onClick={onClose}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs sm:text-sm font-black text-white transition-all shadow-md active:scale-[0.98] cursor-pointer bg-gradient-to-r",
                theme.actionGradient,
              )}
            >
              <span>Practice & Climb</span>
              <ArrowRightSVG className="size-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
