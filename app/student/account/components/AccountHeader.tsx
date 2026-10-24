"use client";

import React from "react";
import Link from "next/link";
import { AtSign } from "lucide-react";
import CrownSVG from "@/public/svgs/CrownSVG";
import EditSVG from "@/public/svgs/EditSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import AppButton from "@/components/AppButton";
import UserAvatar from "@/components/UserAvatar";
import StarSVG from "@/public/svgs/StarSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import { cn, formatSchoolName } from "@/lib/utils";

interface MilestoneStyle {
  gradient: string;
  glow: string;
  textColor: string;
}

const milestoneStyles: Record<string, MilestoneStyle> = {
  Novice: {
    gradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
    glow: "shadow-amber-500/25",
    textColor: "text-amber-200",
  },
  Apprentice: {
    gradient: "from-[#10b981] via-[#059669] to-[#047857]",
    glow: "shadow-emerald-500/25",
    textColor: "text-emerald-200",
  },
  Scholar: {
    gradient: "from-[#06b6d4] via-[#0891b2] to-[#0e7490]",
    glow: "shadow-cyan-500/25",
    textColor: "text-cyan-200",
  },
  Warrior: {
    gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
    glow: "shadow-blue-500/25",
    textColor: "text-blue-200",
  },
  Knight: {
    gradient: "from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]",
    glow: "shadow-purple-500/25",
    textColor: "text-purple-200",
  },
  Hero: {
    gradient: "from-[#f43f5e] via-[#e11d48] to-[#be123c]",
    glow: "shadow-rose-500/25",
    textColor: "text-rose-200",
  },
  Champion: {
    gradient: "from-[#eab308] via-[#ca8a04] to-[#a16207]",
    glow: "shadow-yellow-500/30",
    textColor: "text-yellow-100",
  },
  Master: {
    gradient: "from-[#ef4444] via-[#dc2626] to-[#b91c1c]",
    glow: "shadow-red-500/25",
    textColor: "text-red-200",
  },
  Grandmaster: {
    gradient: "from-[#6366f1] via-[#4f46e5] to-[#4338ca]",
    glow: "shadow-indigo-500/25",
    textColor: "text-indigo-200",
  },
  Elite: {
    gradient: "from-[#d946ef] via-[#c026d3] to-[#a21caf]",
    glow: "shadow-fuchsia-500/25",
    textColor: "text-fuchsia-200",
  },
  Legend: {
    gradient: "from-[#fbbf24] via-[#f59e0b] to-[#d97706]",
    glow: "shadow-amber-500/35",
    textColor: "text-amber-100",
  },
  Mythic: {
    gradient: "from-[#a855f7] via-[#9333ea] to-[#7e22ce]",
    glow: "shadow-purple-500/35",
    textColor: "text-purple-100",
  },
};

import Image from "next/image";
import { CARD_PATTERNS, MILESTONE_PATTERN_MAP } from "@/lib/gamification/badgePatterns";
import type { UserBadgeStatus, PeriodicHonorBadge } from "@/lib/gamification/badges";
import type { StudentMilestone } from "@/types/student";

interface AccountHeaderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profileData?: any;
  milestones: StudentMilestone[];
  badges?: UserBadgeStatus[];
  periodicHonors?: PeriodicHonorBadge[];
  rankBadgeMap: Record<string, React.ComponentType<{ className?: string }>>;
  isOwnProfile?: boolean;
  onMilestoneClick?: (milestone: StudentMilestone) => void;
}

export default function AccountHeader({
  user,
  profileData,
  milestones,
  badges = [],
  periodicHonors = [],
  rankBadgeMap,
  isOwnProfile = true,
  onMilestoneClick,
}: AccountHeaderProps) {
  const points = Number(profileData?.points ?? user?.points ?? 0);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const unlockedPeriodicHonors = periodicHonors.filter((p) => p.unlocked);

  const unlockedMilestones = milestones.filter((m) => m.unlocked);
  const highestMilestone = [...milestones].reverse().find((m) => m.unlocked) || null;
  const currentRankName = String(highestMilestone?.name || profileData?.rank || "Novice");

  // Find next milestone to unlock
  const nextMilestone = milestones.find((m) => !m.unlocked) || null;
  const currentTierPoints = highestMilestone ? highestMilestone.points_required : 0;
  const nextTierPoints = nextMilestone ? nextMilestone.points_required : points;

  const tierProgress = nextMilestone
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((points - currentTierPoints) / Math.max(1, nextTierPoints - currentTierPoints)) *
              100,
          ),
        ),
      )
    : 100;

  const BadgeIcon = rankBadgeMap[currentRankName];
  const NextBadgeIcon = nextMilestone ? rankBadgeMap[nextMilestone.name] : null;

  const name = String(profileData?.name || user?.name || "Student");
  const username = String(profileData?.username || user?.username || "");
  const schoolName = (profileData?.schoolName || user?.schoolName || null) as string | null;
  const schoolLogo = (profileData?.schoolLogo || null) as string | null;
  const userClass = (profileData?.class || user?.class || null) as string | number | null;
  const board = (profileData?.board || user?.board || null) as string | null;
  const rankPosition = Number(profileData?.rankPosition ?? user?.rank ?? 0);

  return (
    <div className="w-full">
      {/* GREEN HERO SECTION: Profile on left, Current Rank on right */}
      <section className="relative overflow-hidden bg-primary px-4 pb-6 pt-6 text-primary-foreground sm:rounded-3xl sm:border sm:border-primary/20 sm:p-6 sm:px-8 sm:shadow-lg">
        {/* Dynamic Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
          <div className="absolute -right-16 -top-16 size-72 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -left-16 bottom-0 size-60 rounded-full bg-black/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1.5px 1.5px, var(--color-primary-foreground) 1.5px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Profile Info Left */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Avatar with level badge without bg or border */}
            <div className="relative shrink-0">
              <UserAvatar
                src={profileData?.profileImage || user?.profileImage}
                name={name}
                username={username}
                id={profileData?.id || user?.id}
                size={104}
                showRing
                ringClassName="ring-4 ring-white/30 shadow-xl"
                className="size-22 sm:size-26"
              />
              {BadgeIcon ? (
                <div
                  title={`Current Rank: ${currentRankName}`}
                  className="pointer-events-none absolute -bottom-2 -right-2 z-10 flex size-10 sm:size-11 items-center justify-center drop-shadow-lg"
                >
                  <BadgeIcon className="size-full object-contain" />
                </div>
              ) : null}
            </div>

            {/* Profile Text & Academic Metadata */}
            <div className="min-w-0 flex-1">
              {/* Name Row with little circle & Rank #1 (simple text, not badge) */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {name}
                </h1>
                <span className="size-1.5 rounded-full bg-white/70 shrink-0" aria-hidden="true" />
                <Link
                  href="/student/leaderboard"
                  title="View Leaderboard"
                  className="text-sm sm:text-base font-bold text-white/85 hover:text-white transition-colors whitespace-nowrap"
                >
                  Rank #{rankPosition > 0 ? rankPosition : "1"}
                </Link>

                {isOwnProfile && (
                  <div className="ml-1 sm:ml-2">
                    <Link href="/student/settings">
                      <AppButton
                        type="button"
                        variant="outline"
                        className="flex items-center justify-center gap-1.5 rounded-xl border-white/30 bg-white/15 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-primary dark:bg-white/15 dark:text-white dark:hover:bg-white dark:hover:text-primary"
                      >
                        <EditSVG className="size-3" />
                        <span>Edit</span>
                      </AppButton>
                    </Link>
                  </div>
                )}
              </div>

              {/* Username */}
              {username ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-white/75">
                  <AtSign className="size-3.5 shrink-0 text-white/50" />
                  <span>{username}</span>
                </p>
              ) : null}

              {/* School info: "Student Of" at top, class & board below, increased logo */}
              <div className="mt-3.5 flex items-center gap-3 text-white/95">
                <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md border border-white/40">
                  {schoolLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={schoolLogo}
                      alt={schoolName || "School"}
                      className="size-full object-contain"
                    />
                  ) : (
                    <BuildingSVG className="size-6 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/70 leading-none">
                    Student Of
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-white leading-tight break-words">
                    {schoolName ? formatSchoolName(schoolName) : "Independent Student"}
                  </p>
                  {(userClass || board) && (
                    <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-white/80 leading-none">
                      {userClass ? `Class ${userClass}` : ""}
                      {userClass && board ? " · " : ""}
                      {board ? board : ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Unlocked Badges & Honors Preview Bar */}
              {unlockedPeriodicHonors.length > 0 || unlockedBadges.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {unlockedPeriodicHonors.length > 0 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      {unlockedPeriodicHonors.map((honor) => (
                        <div
                          key={honor.badgeKey}
                          title={`${honor.title}: ${honor.tagline}`}
                          className="group/badge relative flex items-center gap-1.5 rounded-xl bg-amber-400/20 px-2.5 py-1 border border-amber-300/40 shadow-xs backdrop-blur-md transition-all hover:scale-105 hover:bg-amber-400/30 cursor-pointer"
                        >
                          <div className="relative size-5 shrink-0">
                            <Image
                              src={honor.icon}
                              alt={honor.title}
                              width={20}
                              height={20}
                              className="size-full object-contain drop-shadow-xs"
                            />
                          </div>
                          <span className="text-[10px] font-black text-amber-200 whitespace-nowrap">
                            {honor.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {unlockedBadges.length > 0 ? (
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/70 shrink-0 mr-0.5">
                        Mastery:
                      </span>
                      {unlockedBadges.map((b) => (
                        <div
                          key={b.key}
                          title={`${b.name}: ${b.tagline}`}
                          className="group/badge relative flex size-6.5 sm:size-7 shrink-0 items-center justify-center transition-transform hover:scale-120 cursor-pointer"
                        >
                          <Image
                            src={b.icon}
                            alt={b.name}
                            width={28}
                            height={28}
                            className="size-full object-contain drop-shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: Current Rank Section inside Hero */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-black/20 backdrop-blur-md p-4 sm:p-5 shadow-lg text-white">
              {/* Card Atmospheric Background Layers */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/25" />
                <div className="absolute -top-[25%] -right-[15%] size-[80%] rounded-full bg-white/15 blur-[35px]" />
                <div className="absolute -bottom-[25%] -left-[15%] size-[70%] rounded-full bg-black/30 blur-[30px]" />
                <div
                  className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "16px 16px",
                  }}
                />
              </div>

              {/* Top Performer Watermark Icons */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <TrophySVG className="absolute -bottom-3 -right-2 size-20 text-white/10 -rotate-12 select-none" />
                <CrownSVG className="absolute -top-3 right-20 size-12 text-white/10 rotate-12 select-none" />
                <MedalSVG className="absolute bottom-2 left-28 size-10 text-white/[0.08] -rotate-6 select-none" />
              </div>

              {/* Current and Next Rank in ONE LINE */}
              <div className="relative z-10 flex flex-row items-center justify-between gap-3">
                {/* Left: Current Rank */}
                <div className="flex items-center gap-3">
                  {BadgeIcon ? (
                    <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center">
                      <BadgeIcon className="size-full object-contain drop-shadow-md" />
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/70 leading-none">
                      Current Rank
                    </p>
                    <p className="mt-1 text-sm sm:text-base font-black text-white leading-tight drop-shadow-xs">
                      {currentRankName}
                    </p>
                  </div>
                </div>

                {/* Right: Next Milestone */}
                {nextMilestone ? (
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/70 leading-none">
                        Next Milestone
                      </p>
                      <p className="mt-1 text-sm sm:text-base font-bold text-white leading-tight drop-shadow-xs">
                        {nextMilestone.name}
                      </p>
                    </div>
                    {NextBadgeIcon ? (
                      <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center">
                        <NextBadgeIcon className="size-full object-contain opacity-85" />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 px-3 py-1 text-xs font-black text-amber-200 shadow-2xs">
                    <TrophySVG className="size-3.5" />
                    Max Rank Reached!
                  </span>
                )}
              </div>

              {/* Target Points badge at left, Progress % at center */}
              <div className="relative z-10 mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/25 px-2.5 py-0.5 text-[11px] font-black text-white shadow-2xs">
                  <StarSVG className="size-3 text-amber-200" />
                  <span>
                    {nextMilestone
                      ? `${nextMilestone.points_required.toLocaleString()} PTS`
                      : `${points.toLocaleString()} PTS`}
                  </span>
                </span>

                <span className="text-xs sm:text-sm font-black text-white drop-shadow-xs">
                  {tierProgress}% Progress
                </span>

                {/* Spacer to keep center aligned */}
                <span className="w-16" />
              </div>

              {/* Progress bar: Only Golden and Green as landing page colors */}
              <div className="relative z-10 mt-2 h-3 w-full overflow-hidden rounded-full bg-black/35 p-0.5 border border-white/20">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-400 via-amber-300 to-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.35)]"
                  style={{ width: `${Math.max(tierProgress, 4)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHITE SECTION: Badges Achieved */}
      <div className="mt-4 sm:mt-6 px-4 sm:px-0">

        {/* 11- Badges Achieved: Colorful Leaderboard-Style Cards */}
        <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <MedalSVG className="size-4.5 text-amber-500" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                Badges Achieved
              </h2>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black text-primary border border-primary/20 shadow-2xs">
              {unlockedMilestones.length} {unlockedMilestones.length === 1 ? "Badge" : "Badges"} Earned
            </span>
          </div>

          {unlockedMilestones.length > 0 ? (
            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-none snap-x">
              {unlockedMilestones.map((m, idx) => {
                const ItemBadge = rankBadgeMap[m.name];
                const style = milestoneStyles[m.name] || {
                  gradient: "from-primary via-primary-light to-primary-dark",
                  glow: "shadow-primary/25",
                  textColor: "text-primary-foreground",
                };
                const patternKey = MILESTONE_PATTERN_MAP[m.name] || "hexLattice";
                const patternUrl = CARD_PATTERNS[patternKey];

                return (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() => onMilestoneClick?.(m)}
                    className={cn(
                      "group relative flex flex-col items-center shrink-0 w-28 sm:w-32 overflow-hidden rounded-2xl p-3 text-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer text-center snap-start border border-white/25",
                      `bg-linear-to-br ${style.gradient}`,
                      style.glow,
                    )}
                  >
                    {/* Atmospheric Highlights & Low-Opacity Pattern */}
                    <div className="pointer-events-none absolute -top-8 -right-8 size-20 rounded-full bg-white/20 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 size-20 rounded-full bg-black/30 blur-xl" />
                    
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

                    {/* Top Gloss Reflection */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-linear-to-b from-white/25 via-white/5 to-transparent rounded-t-2xl" />

                    {/* Level Pill Top */}
                    <div className="relative z-10 flex w-full items-center justify-start">
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md border border-white/25">
                        LV. {String(m.level || idx + 1)}
                      </span>
                    </div>

                    {/* Badge Icon with Aura */}
                    <div className="relative z-10 my-2 flex size-14 sm:size-16 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <div className="pointer-events-none absolute inset-0 m-auto size-12 rounded-full bg-white/20 blur-xs" />
                      {ItemBadge ? (
                        <ItemBadge className="relative size-full object-contain drop-shadow-md" />
                      ) : (
                        <MedalSVG className="relative size-8 text-white drop-shadow-md" />
                      )}
                    </div>

                    {/* Badge Name */}
                    <span className="relative z-10 text-xs font-black text-white truncate max-w-full leading-tight drop-shadow-xs">
                      {m.name}
                    </span>

                    {/* Points Pill */}
                    <span className="relative z-10 mt-1 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-md border border-white/25">
                      <StarSVG className="size-2 text-amber-200" />
                      <span>{m.points_required.toLocaleString()} PTS</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs font-medium text-muted-foreground py-2">
              No badges achieved yet. Solve past papers and attempt quizzes to earn achievements!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}