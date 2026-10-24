"use client";

import React from "react";
import Link from "next/link";
import StarSVG from "@/public/svgs/StarSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import NoviceSVG from "@/public/svgs/NoviceSVG";
import ApprenticeSVG from "@/public/svgs/ApprenticeSVG";
import ScholarSVG from "@/public/svgs/ScholarSVG";
import WarriorSVG from "@/public/svgs/WarriorSVG";
import KnightSVG from "@/public/svgs/KnightSVG";
import HeroSVG from "@/public/svgs/HeroSVG";
import ChampionSVG from "@/public/svgs/ChampionSVG";
import MasterSVG from "@/public/svgs/MasterSVG";
import GrandmasterSVG from "@/public/svgs/GrandmasterSVG";
import EliteSVG from "@/public/svgs/EliteSVG";
import LegendSVG from "@/public/svgs/LegendSVG";
import MythicSVG from "@/public/svgs/MythicSVG";
import { useStudentMilestones } from "@/hooks/student/useStudentMilestones";
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { cn } from "@/lib/utils";

export const rankBadgeMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Novice: NoviceSVG,
  Apprentice: ApprenticeSVG,
  Scholar: ScholarSVG,
  Warrior: WarriorSVG,
  Knight: KnightSVG,
  Hero: HeroSVG,
  Champion: ChampionSVG,
  Master: MasterSVG,
  Grandmaster: GrandmasterSVG,
  Elite: EliteSVG,
  Legend: LegendSVG,
  Mythic: MythicSVG,
};

interface SidebarRankCardProps {
  onItemClick?: () => void;
  className?: string;
}

export default function SidebarRankCard({ onItemClick, className }: SidebarRankCardProps) {
  const milestonesQuery = useStudentMilestones();
  const profileQuery = useUserProfile();

  const milestones = milestonesQuery.data ?? [];
  const profile = profileQuery.data ?? null;

  const points = Number(profile?.points ?? 0);
  const highestMilestone = [...milestones].reverse().find((m) => m.unlocked) || null;
  const currentRankName = String(highestMilestone?.name || profile?.rank || "Novice");

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

  const BadgeIcon = rankBadgeMap[currentRankName] || NoviceSVG;
  const NextBadgeIcon = nextMilestone ? rankBadgeMap[nextMilestone.name] : null;

  return (
    <Link
      href="/student/account"
      prefetch={true}
      onClick={onItemClick}
      title="View Academic Rank & Achievements"
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-white/20 bg-black/25 backdrop-blur-md px-3 py-2.5 text-white transition-all duration-300 hover:border-white/40 hover:bg-black/35 shadow-md active:scale-[0.98]",
        className,
      )}
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />
        <div className="absolute -top-[30%] -right-[20%] size-24 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-[30%] -left-[20%] size-24 rounded-full bg-black/40 blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)",
            backgroundSize: "12px 12px",
          }}
        />
      </div>

      {/* Top watermark icons */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <TrophySVG className="absolute -bottom-2 -right-1 size-12 text-white/10 -rotate-12 select-none" />
        <CrownSVG className="absolute -top-2 right-12 size-7 text-white/10 rotate-12 select-none" />
        <MedalSVG className="absolute bottom-0 left-12 size-6 text-white/[0.06] -rotate-6 select-none" />
      </div>

      {/* Top Glassmorphic Shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-t-xl" />

      {/* Row 1: Current Rank on Left, Next Milestone on Right in ONE LINE */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Left: Current Rank */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <BadgeIcon className="size-full object-contain drop-shadow-md" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-wider text-white/70 leading-none truncate">
              Current Rank
            </p>
            <p className="mt-0.5 text-[12px] font-black text-white leading-tight drop-shadow-xs truncate">
              {currentRankName}
            </p>
          </div>
        </div>

        {/* Right: Next Milestone */}
        {nextMilestone ? (
          <div className="flex items-center gap-2 min-w-0 text-right">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-wider text-white/70 leading-none truncate">
                Next Milestone
              </p>
              <p className="mt-0.5 text-[12px] font-bold text-white leading-tight drop-shadow-xs truncate">
                {nextMilestone.name}
              </p>
            </div>
            {NextBadgeIcon ? (
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center opacity-85 transition-transform duration-300 group-hover:scale-105">
                <NextBadgeIcon className="size-full object-contain drop-shadow-md" />
              </div>
            ) : null}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/40 px-2 py-0.5 text-[9px] font-black text-amber-200 shadow-2xs">
            <TrophySVG className="size-2.5" />
            Max Rank!
          </span>
        )}
      </div>

      {/* Row 2: Target Points badge on left, Progress % on right */}
      <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-sm bg-white/20 backdrop-blur-md border border-white/25 px-2 py-0.5 text-[9.5px] font-black text-white shadow-2xs">
          <StarSVG className="size-2.5 text-amber-300 shrink-0" />
          <span className="leading-none">
            {nextMilestone
              ? `${nextMilestone.points_required.toLocaleString()} PTS`
              : `${points.toLocaleString()} PTS`}
          </span>
        </span>

        <span className="text-[10px] font-black text-white drop-shadow-xs leading-none">
          {tierProgress}% Progress
        </span>
      </div>

      {/* Row 3: Progress bar: Golden to Green gradient spanning full width */}
      <div className="relative z-10 mt-2 h-2 w-full overflow-hidden rounded-full bg-black/40 p-[1.5px] border border-white/20 shadow-inner">
        <div
          className="h-full rounded-full bg-emerald-400 bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-700 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
          style={{ width: `${Math.max(tierProgress, 6)}%` }}
        />
      </div>
    </Link>
  );
}
