"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import AppButton from "@/components/AppButton";
import LockSVG from "@/public/svgs/LockSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import StarSVG from "@/public/svgs/StarSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ZapSVG from "@/public/svgs/ZapSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import type { UserBadgeStatus } from "@/lib/gamification/badges";
import { cn } from "@/lib/utils";

interface BadgeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: UserBadgeStatus | null;
}

export default function BadgeDetailsModal({
  isOpen,
  onClose,
  badge,
}: BadgeDetailsModalProps) {
  if (!isOpen || !badge) return null;

  const isUnlocked = badge.unlocked;

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative bg-card border border-border/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 text-foreground max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col">
          {/* Dynamic Header Glow & Background */}
          <div className="relative overflow-hidden px-5 pt-4 pb-4 sm:px-6 sm:pt-5 sm:pb-5 text-center text-white shrink-0">
            <div
              className={cn(
                "absolute inset-0 bg-linear-to-br transition-all duration-700",
                badge.gradient,
              )}
            />
            <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-white/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-black/30 blur-3xl" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
                backgroundSize: "16px 16px",
              }}
            />

            {/* Top Tag Bar */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                <SparklesSVG className="size-3 text-amber-200" />
                <span>{badge.tier} Tier</span>
              </span>

              <div className="flex items-center gap-2">
                {!isUnlocked && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold text-white/90">
                    <LockSVG className="size-3 text-white/70" />
                    <span>Locked</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-7 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors cursor-pointer border border-white/20"
                  aria-label="Close modal"
                >
                  <CloseCircleSVG className="size-4" />
                </button>
              </div>
            </div>

            {/* 3D Badge Display */}
            <div className="relative z-10 my-2 flex items-center justify-center">
              <div className="relative size-24 sm:size-28 flex items-center justify-center transition-transform duration-500 hover:scale-110">
                {/* Backlight halo */}
                <div className="absolute inset-2 rounded-full bg-white/30 blur-xl animate-pulse" />
                <Image
                  src={badge.icon}
                  alt={badge.name}
                  width={110}
                  height={110}
                  className={cn(
                    "relative z-10 size-full object-contain drop-shadow-2xl transition-all duration-300",
                    !isUnlocked && "opacity-75 contrast-110",
                  )}
                  priority
                />
              </div>
            </div>

            {/* Badge Title & Tagline */}
            <div className="relative z-10 space-y-0.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                {badge.name}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-white/90">
                {badge.tagline}
              </p>
            </div>
          </div>

          {/* Modal Body Info */}
          <div className="space-y-4 p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain">
            {/* Unlock Requirements Box */}
            <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5 text-foreground font-black">
                  <TrophySVG className="size-3.5 text-primary" />
                  <span>Unlock Criteria</span>
                </span>
                <span className="text-[11px] font-extrabold text-primary">
                  +{badge.rewardPoints} Bonus XP
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                {badge.criteria}
              </p>

              {/* Live Progress Meter */}
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-black">
                    {isUnlocked ? "100% Completed" : `${badge.progress}% (${badge.progressLabel})`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted border border-border/60">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      isUnlocked
                        ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                        : "bg-primary shadow-xs shadow-primary/50",
                    )}
                    style={{ width: `${Math.max(isUnlocked ? 100 : badge.progress, 4)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lore & Overview */}
            <div className="space-y-1 px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Badge Overview
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {badge.description}
              </p>
            </div>

            {/* Unlocked timestamp if achieved */}
            {isUnlocked && badge.unlockedAt && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <StarSVG className="size-3.5 text-emerald-500" />
                <span>
                  Earned on{" "}
                  {new Date(badge.unlockedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <AppButton variant="secondary" onClick={onClose} className="text-xs px-4">
                Close
              </AppButton>
              {!isUnlocked && (
                <Link href="/student/past-papers" onClick={onClose}>
                  <AppButton variant="default" className="text-xs gap-1.5 px-4 shadow-sm">
                    <ZapSVG className="size-3.5" />
                    <span>Practice Now</span>
                    <ArrowRightSVG className="size-3" />
                  </AppButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
