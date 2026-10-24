"use client";

import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { calculateLevel, getLevelName, cn, formatSchoolName, formatCapitalizeWords } from "@/lib/utils";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import type { LeaderboardEntry } from "@/components/LeaderboardView";
import UserAvatar from "@/components/UserAvatar";
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

interface LeaderboardListEntryProps {
  user: LeaderboardEntry;
  rank: number;
  currentUserId?: string;
}

export default function LeaderboardListEntry({
  user,
  rank,
  currentUserId,
}: LeaderboardListEntryProps) {
  const level = calculateLevel(user.points);
  const rankName = getLevelName(level);
  const MilestoneBadge = rankBadgeMap[rankName] || NoviceSVG;
  const isCurrentUser = user.id === currentUserId;

  return (
    <Link
      href={FRONTEND_ROUTES.STUDENT_FRIEND_DETAIL(user.id)}
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3.5 border-b border-border/40 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted/30 sm:grid-cols-[3.5rem_1fr_auto] sm:px-6",
        { "bg-primary/5": isCurrentUser },
      )}
    >
      <span className="text-sm font-black text-foreground/75 sm:text-base">#{rank}</span>

      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <UserAvatar
            src={user.profilePic}
            name={user.name}
            username={user.username}
            id={user.id}
            size={48}
            showRing
            className="size-12 shrink-0 shadow-sm"
          />
          {MilestoneBadge ? (
            <div
              title={`Rank: ${rankName}`}
              className="pointer-events-none absolute -bottom-1 -right-1 z-10 flex size-6 items-center justify-center rounded-full bg-card p-0.5 shadow-md border border-background"
            >
              <MilestoneBadge className="size-full object-contain drop-shadow-xs" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Typography className="break-words text-sm font-extrabold leading-snug text-foreground">
              {formatCapitalizeWords(user.name)}
            </Typography>
            {isCurrentUser ? (
              <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary-foreground">
                You
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 break-words text-[10px] font-bold uppercase tracking-wide text-muted-foreground/80">
            Student Of
          </p>
          <p className="break-words text-xs font-medium text-muted-foreground">
            {user.schoolName ? formatSchoolName(user.schoolName) : "Independent Student"}
          </p>
        </div>
      </div>

      <div className="text-right">
        <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-black uppercase text-primary dark:bg-muted dark:text-foreground">
          LV {level}
        </span>
        <p className="mt-1 text-lg font-black text-primary dark:text-white leading-none">{user.points.toLocaleString()}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Points</p>
      </div>
    </Link>
  );
}
