"use client";

import Link from "next/link";
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
import TrophySVG from "@/public/svgs/TrophySVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import CrownSVG from "@/public/svgs/CrownSVG";
import StarSVG from "@/public/svgs/StarSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { calculateLevel, getLevelName, cn, formatSchoolName, formatCapitalizeWords } from "@/lib/utils";
import type { PodiumUser } from "@/lib/leaderboard/podium-order";
import UserAvatar from "@/components/UserAvatar";

const rankBadgeMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
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

interface LeaderboardTopCardsProps {
  podiumUsers: PodiumUser[];
  currentUserId?: string;
}

function getRankGradient(rank: number) {
  if (rank === 1) return "from-[#f59e0b] via-[#d97706] to-[#b45309]"; // Gold
  if (rank === 2) return "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]"; // Blue
  if (rank === 3) return "from-[#a855f7] via-[#9333ea] to-[#7e22ce]"; // Purple
  if (rank === 4) return "from-[#10b981] via-[#059669] to-[#047857]"; // Emerald
  if (rank === 5) return "from-[#f43f5e] via-[#e11d48] to-[#9f1239]"; // Rose / Ruby
  return "from-slate-600 via-slate-700 to-slate-800";
}

function RankWatermark({ rank }: { rank: number }) {
  const positions = [
    "top-2 right-2",
    "bottom-14 left-2",
    "top-1/3 right-3",
  ];

  const Icon =
    rank === 1 ? MedalSVG : rank <= 3 ? TrophySVG : rank === 4 ? CrownSVG : StarSVG;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {positions.map((position, index) => (
        <Icon
          key={index}
          className={cn(
            "absolute size-8 text-white/15 sm:size-10",
            {
              "rotate-12": index % 2 === 0,
              "-rotate-12": index % 2 === 1,
              [position]: true,
            },
          )}
        />
      ))}
      <span className="absolute top-2.5 left-3 select-none text-4xl font-black text-white/20 drop-shadow-xs sm:text-5xl">
        #{rank}
      </span>
    </div>
  );
}

function GradientCardBackground({ rank }: { rank: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className={cn("absolute inset-0 bg-linear-to-br", getRankGradient(rank))} />
      <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[50px]" />
      <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[45px]" />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
    </div>
  );
}

export default function LeaderboardTopCards({ podiumUsers, currentUserId }: LeaderboardTopCardsProps) {
  if (podiumUsers.length === 0) return null;

  return (
    <div className="mb-0 w-full min-w-0">
      <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
        Top Performers
      </p>

      <div className="w-full min-w-0 max-w-full">
        <div className="flex w-full min-w-0 gap-3.5 overflow-x-auto overscroll-x-contain px-1 pb-3 pt-1 snap-x snap-mandatory scrollbar-hide">
          {podiumUsers.map(({ user: entry, rank }) => {
            const level = calculateLevel(entry.points);
            const rankName = getLevelName(level);
            const MilestoneBadge = rankBadgeMap[rankName] || NoviceSVG;
            const isCurrentUser = entry.id === currentUserId;

            return (
              <Link
                key={entry.id}
                href={FRONTEND_ROUTES.STUDENT_FRIEND_DETAIL(entry.id)}
                className="group relative flex min-h-[310px] w-[80%] min-w-[80%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-white/20 p-3.5 sm:p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:shadow-2xl sm:w-60 sm:min-w-60 md:w-64 md:min-w-64"
              >
                <GradientCardBackground rank={rank} />
                <RankWatermark rank={rank} />

                {/* Top Header: YOU badge at top left */}
                <div className="relative z-10 flex min-h-5 items-center justify-start">
                  {isCurrentUser ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-900 shadow-md">
                      You
                    </span>
                  ) : null}
                </div>

                {/* Student Avatar with Milestone Badge & Basic Info */}
                <div className="relative z-10 my-auto flex flex-col items-center text-center">
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={entry.profilePic}
                      name={entry.name}
                      username={entry.username}
                      id={entry.id}
                      size={72}
                      showRing
                      ringClassName="ring-4 ring-white/40 shadow-xl"
                      className="size-18 transition-transform duration-300 group-hover:scale-105"
                    />
                    {MilestoneBadge ? (
                      <div
                        title={`Rank: ${rankName}`}
                        className="pointer-events-none absolute -bottom-1 -right-1 z-10 flex size-9 sm:size-10 items-center justify-center drop-shadow-xl"
                      >
                        <MilestoneBadge className="size-full object-contain" />
                      </div>
                    ) : null}
                  </div>

                   <p className="mt-1.5 line-clamp-1 break-words text-sm font-extrabold tracking-tight text-white drop-shadow-xs group-hover:text-white/95 sm:text-base">
                     {formatCapitalizeWords(entry.name)}
                   </p>

                   {/* Points, Class & Level Stats Grid */}
                  <div className="mt-2.5 grid w-full grid-cols-3 divide-x divide-white/20 rounded-2xl border border-white/20 bg-white/15 p-2 backdrop-blur-md shadow-xs">
                    <div className="px-1 text-center">
                      <p className="text-sm font-black leading-none text-white sm:text-base">
                        {entry.points.toLocaleString()}
                      </p>
                      <p className="mt-1 text-[7.5px] font-bold uppercase tracking-wider text-white/70">
                        Points
                      </p>
                    </div>
                    <div className="px-1 text-center">
                      <p className="text-sm font-black leading-none text-white sm:text-base">
                        {entry.classLevel || "—"}
                      </p>
                      <p className="mt-1 text-[7.5px] font-bold uppercase tracking-wider text-white/70">
                        Class
                      </p>
                    </div>
                    <div className="px-1 text-center">
                      <p className="text-sm font-black leading-none text-white sm:text-base">
                        LV {level}
                      </p>
                      <p className="mt-1 text-[7.5px] font-bold uppercase tracking-wider text-white/70">
                        Level
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom School Info (Square rounded logo + full school name without truncation) */}
                <div className="relative z-10 mt-auto flex items-center gap-2.5 pt-2">
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/30 bg-white p-1 shadow-sm">
                    {entry.schoolLogo ? (
                      <img
                        src={entry.schoolLogo}
                        alt={entry.schoolName || "School"}
                        className="size-full object-contain"
                      />
                    ) : (
                      <BuildingSVG className="size-4 text-slate-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[7.5px] font-bold uppercase tracking-wider text-white/70">
                      Student Of
                    </p>
                    <p className="break-words text-[9.5px] sm:text-[10px] font-semibold leading-[1.25] text-white drop-shadow-xs">
                      {entry.schoolName && entry.schoolName !== "—" ? formatSchoolName(entry.schoolName) : "Independent Student"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
