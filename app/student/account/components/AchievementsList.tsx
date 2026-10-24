"use client";

import React from "react";
import LockSVG from "@/public/svgs/LockSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import StarSVG from "@/public/svgs/StarSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import { cn } from "@/lib/utils";
import PerformanceBadgesSection from "./PerformanceBadgesSection";
import PeriodicHonorsSection from "./PeriodicHonorsSection";
import { useStudentBadges } from "@/hooks/student/useStudentBadges";
import type { UserBadgeStatus, PeriodicHonorBadge, ActivePeriodRace } from "@/lib/gamification/badges";

import { CARD_PATTERNS, MILESTONE_PATTERN_MAP } from "@/lib/gamification/badgePatterns";

interface MilestoneCardTheme {
  gradient: string;
  glow: string;
}

const milestoneThemes: Record<string, MilestoneCardTheme> = {
  Novice: {
    gradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
    glow: "shadow-amber-500/25",
  },
  Apprentice: {
    gradient: "from-[#10b981] via-[#059669] to-[#047857]",
    glow: "shadow-emerald-500/25",
  },
  Scholar: {
    gradient: "from-[#06b6d4] via-[#0891b2] to-[#0e7490]",
    glow: "shadow-cyan-500/25",
  },
  Warrior: {
    gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
    glow: "shadow-blue-500/25",
  },
  Knight: {
    gradient: "from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]",
    glow: "shadow-purple-500/25",
  },
  Hero: {
    gradient: "from-[#f43f5e] via-[#e11d48] to-[#be123c]",
    glow: "shadow-rose-500/25",
  },
  Champion: {
    gradient: "from-[#eab308] via-[#ca8a04] to-[#a16207]",
    glow: "shadow-yellow-500/30",
  },
  Master: {
    gradient: "from-[#ef4444] via-[#dc2626] to-[#b91c1c]",
    glow: "shadow-red-500/25",
  },
  Grandmaster: {
    gradient: "from-[#6366f1] via-[#4f46e5] to-[#4338ca]",
    glow: "shadow-indigo-500/25",
  },
  Elite: {
    gradient: "from-[#d946ef] via-[#c026d3] to-[#a21caf]",
    glow: "shadow-fuchsia-500/25",
  },
  Legend: {
    gradient: "from-[#fbbf24] via-[#f59e0b] to-[#d97706]",
    glow: "shadow-amber-500/35",
  },
  Mythic: {
    gradient: "from-[#a855f7] via-[#9333ea] to-[#7e22ce]",
    glow: "shadow-purple-500/35",
  },
};

const defaultTheme: MilestoneCardTheme = {
  gradient: "from-primary via-primary-light to-primary-dark",
  glow: "shadow-primary/25",
};

import type { StudentMilestone } from "@/types/student";

interface AchievementsListProps {
  milestones: StudentMilestone[];
  rankBadgeMap: Record<string, React.ComponentType<{ className?: string }>>;
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  badges?: UserBadgeStatus[];
  periodicHonors?: PeriodicHonorBadge[];
  activeRaces?: ActivePeriodRace[];
  onMilestoneClick: (milestone: StudentMilestone) => void;
}

export default function AchievementsList({
  milestones,
  rankBadgeMap,
  iconMap,
  badges: propBadges,
  periodicHonors: propPeriodicHonors,
  activeRaces: propActiveRaces,
  onMilestoneClick,
}: AchievementsListProps) {
  const badgesQuery = useStudentBadges();
  
  // Extract data from query or props
  const queryData = badgesQuery.data;
  const performanceBadges =
    propBadges ??
    (queryData && "performanceBadges" in queryData
      ? queryData.performanceBadges
      : Array.isArray(queryData)
      ? queryData
      : []);

  const periodicHonors =
    propPeriodicHonors ??
    (queryData && "periodicHonors" in queryData ? queryData.periodicHonors : []);

  const activeRaces =
    propActiveRaces ??
    (queryData && "activeRaces" in queryData ? queryData.activeRaces : []);

  const unlockedMilestones = milestones.filter((m) => m.unlocked);
  const total = milestones.length;
  const progress = total > 0 ? Math.round((unlockedMilestones.length / total) * 100) : 0;

  // Identify the active target milestone (first locked milestone)
  const activeMilestoneId = milestones.find((m) => !m.unlocked)?.id;

  return (
    <div className="space-y-8">
      {/* 1. Hall of Fame & Periodic Honors (Student of the Year, Month, Week) */}
      <PeriodicHonorsSection
        honors={periodicHonors}
        activeRaces={activeRaces}
        isLoading={badgesQuery.isLoading}
      />

      {/* 2. Performance Badges & Mastery Honors Section */}
      <PerformanceBadgesSection
        badges={performanceBadges}
        isLoading={badgesQuery.isLoading}
      />

      {/* 3. Overview Progress Card for XP Milestone Ranks */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
              Ranks & Milestone Journey
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
              Unlock higher ranks by solving past papers, attempting quizzes, and earning XP.
            </p>
          </div>

          {total > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-black text-primary border border-primary/20 shadow-2xs">
                {unlockedMilestones.length} / {total} Unlocked
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground border border-border/50">
                {progress}% Complete
              </span>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="relative z-10 mt-5">
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted/70 p-0.5 border border-border/60">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000 shadow-xs"
                style={{ width: `${Math.max(progress, 3)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. All Rank Milestone Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
        {milestones.map((milestone, idx) => {
          const BadgeIcon =
            rankBadgeMap[milestone.name] || (milestone.icon ? iconMap[milestone.icon] : undefined) || TrophySVG;
          const isUnlocked = milestone.unlocked;
          const isCurrentTarget = milestone.id === activeMilestoneId;
          const theme = milestoneThemes[milestone.name] || defaultTheme;
          const levelDisplay = String(milestone.level || idx + 1);
          const patternKey = MILESTONE_PATTERN_MAP[milestone.name] || "hexLattice";
          const patternUrl = CARD_PATTERNS[patternKey];

          return (
            <div
              key={milestone.id || `${milestone.name}-${idx}`}
              onClick={() => onMilestoneClick(milestone)}
              className={cn(
                "group relative flex flex-col items-center justify-between rounded-3xl p-4 transition-all duration-300 cursor-pointer text-center overflow-hidden border min-h-[220px]",
                isUnlocked && [
                  "border-white/25 text-white shadow-lg hover:-translate-y-1.5 hover:shadow-2xl hover:border-white/45",
                  `bg-linear-to-br ${theme.gradient}`,
                  theme.glow,
                ],
                isCurrentTarget && [
                  "border-2 border-amber-400 text-white shadow-xl shadow-amber-500/25 hover:-translate-y-1.5",
                  `bg-linear-to-br ${theme.gradient}`,
                  theme.glow,
                ],
                !isUnlocked && !isCurrentTarget && [
                  "border-border/60 bg-linear-to-br from-slate-800 via-slate-900 to-black text-white/80 hover:-translate-y-0.5 hover:border-white/25 shadow-sm",
                ],
              )}
            >
              {/* Atmospheric lighting highlights */}
              <div className="pointer-events-none absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
              <div className="pointer-events-none absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/30 blur-[30px]" />
              
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
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-white/25 via-white/5 to-transparent rounded-t-3xl" />

              {/* Holographic light sweep on hover */}
              <div className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-35 translate-x-[-150%] transition-transform duration-1000 group-hover:translate-x-[150%]" />

              {/* Watermark Level Number */}
              <span className="pointer-events-none absolute top-2 left-2.5 select-none text-3xl sm:text-4xl font-black text-white/15 drop-shadow-xs">
                #{levelDisplay}
              </span>

              {/* Level / Status Top Tag */}
              <div className="relative z-10 flex w-full items-center justify-between gap-1">
                <span className="rounded-full bg-white/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white border border-white/25 shadow-2xs">
                  LV. {levelDisplay}
                </span>

                {isCurrentTarget ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase text-slate-900 shadow-md animate-pulse">
                    <SparklesSVG className="size-2.5 text-slate-900" />
                    Target
                  </span>
                ) : !isUnlocked ? (
                  <LockSVG className="size-3.5 text-white/40" />
                ) : null}
              </div>

              {/* Badge Icon Display on Pedestal with Orbital Halo */}
              <div className="relative z-10 my-3 flex size-20 items-center justify-center sm:size-24">
                {/* Radial Glow Aura behind Badge */}
                <div className="pointer-events-none absolute inset-0 m-auto size-16 sm:size-20 rounded-full bg-white/20 blur-md transition-transform duration-500 group-hover:scale-125" />
                <div className="pointer-events-none absolute inset-0 m-auto size-18 sm:size-22 rounded-full border border-white/20 opacity-60 transition-transform duration-700 group-hover:rotate-45" />

                <div
                  className={cn(
                    "relative flex size-full items-center justify-center transition-transform duration-500 group-hover:scale-115 group-hover:-rotate-3",
                    {
                      "drop-shadow-xl": isUnlocked,
                      "opacity-95 drop-shadow-lg": isCurrentTarget,
                      "opacity-40 grayscale contrast-125": !isUnlocked && !isCurrentTarget,
                    },
                  )}
                >
                  <BadgeIcon className="size-full object-contain" />
                </div>
              </div>

              {/* Rank Name & Info */}
              <div className="relative z-10 w-full">
                <h3 className="truncate text-sm font-black tracking-tight text-white sm:text-base drop-shadow-xs">
                  {milestone.name}
                </h3>

                <div className="mt-1.5 flex items-center justify-center">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/25 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                      <StarSVG className="size-2.5 text-amber-200" />
                      <span>{milestone.points_required.toLocaleString()} PTS</span>
                    </span>
                  ) : isCurrentTarget ? (
                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-white/90">
                        <span>{milestone.progress || 0}%</span>
                        <span>{milestone.points_required.toLocaleString()} PTS</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40 border border-white/20">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-amber-400 to-emerald-300 transition-all duration-700 shadow-xs"
                          style={{ width: `${milestone.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">
                      Req: {milestone.points_required.toLocaleString()} PTS
                    </span>
                  )}
                </div>
              </div>

              {/* Hover Quick Action Indicator */}
              <div className="relative z-10 mt-2 flex items-center gap-1 text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100 text-white/90">
                <span>Inspect</span>
                <ArrowRightSVG className="size-3 text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}