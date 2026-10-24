"use client";

import { Crown, User, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { cn, calculateLevel, formatCapitalizeWords } from "@/lib/utils";
import type { LeaderboardEntry } from "@/components/LeaderboardView";
import { LeaderboardTab } from "@/types/enums";

// SVGs
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

import UserAvatar from "@/components/UserAvatar";

const rankBadgeMap: Record<string, any> = {
    'Novice': NoviceSVG,
    'Apprentice': ApprenticeSVG,
    'Scholar': ScholarSVG,
    'Warrior': WarriorSVG,
    'Knight': KnightSVG,
    'Hero': HeroSVG,
    'Champion': ChampionSVG,
    'Master': MasterSVG,
    'Grandmaster': GrandmasterSVG,
    'Elite': EliteSVG,
    'Legend': LegendSVG,
    'Mythic': MythicSVG
};

const getLevelName = (level: number) => {
    const names = [
        "Novice", "Apprentice", "Scholar", "Warrior", 
        "Knight", "Hero", "Champion", "Master", 
        "Grandmaster", "Elite", "Legend", "Mythic"
    ];
    return names[Math.max(0, Math.min(level - 1, 11))];
};

interface PodiumProps {
    topThree: LeaderboardEntry[];
    currentUserId?: string;
    type: LeaderboardTab;
}

const RenderMember = ({ member, rank, rankColor, currentUserId, isStudent }: { 
    member: LeaderboardEntry, 
    rank: number, 
    rankColor: string, 
    currentUserId?: string,
    isStudent: boolean
}) => {
    const isUser = member.id === currentUserId && isStudent;
    const level = calculateLevel(member.points);
    const rankName = getLevelName(level);
    const BadgeIcon = rankBadgeMap[rankName] || NoviceSVG;
    
    // Aesthetic mapping for podium ranks
    const rankConfig = {
        1: { border: "border-rank-1", bg: "bg-rank-1/5 shadow-rank-1/20", glow: "shadow-[0_0_30px_rgba(255,183,0,0.15)]", badge: "bg-rank-1" },
        2: { border: "border-rank-2", bg: "bg-rank-2/5 shadow-rank-2/10", glow: "shadow-[0_0_20px_rgba(192,192,192,0.1)]", badge: "bg-rank-2" },
        3: { border: "border-rank-3", bg: "bg-rank-3/5 shadow-rank-3/10", glow: "shadow-[0_0_20px_rgba(205,127,50,0.1)]", badge: "bg-rank-3" }
    }[rank as 1|2|3];

    const Content = (
        <div className={cn(
            "flex flex-col items-center w-full max-w-[280px] sm:max-w-xs p-6 sm:p-8 rounded-[2rem] border-2 bg-card relative transition-all duration-500 group overflow-hidden",
            rankConfig.border, rankConfig.bg, rankConfig.glow,
            rank === 1 ? "scale-105 sm:scale-110 z-20 border-opacity-100" : "scale-100 z-10 border-opacity-40 hover:border-opacity-100 hover:scale-[1.02]"
        )}>
            {/* Profile Section */}
            <div className="relative mb-6">
                <div className={cn(
                    "rounded-full border-4 p-1 transition-all duration-500 relative",
                    rankConfig.border,
                    rank === 1 ? "h-24 w-24 sm:h-28 sm:w-28" : "h-20 w-20 sm:h-24 sm:w-24"
                )}>
                    <UserAvatar
                        src={member.profilePic}
                        name={member.name}
                        username={member.username}
                        id={member.id}
                        size={rank === 1 ? 112 : 96}
                        className="size-full"
                    />
                    {/* Level Badge Over Avatar (Bottom Right) */}
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 sm:h-10 sm:w-10 bg-card rounded-full border-2 border-background flex items-center justify-center shadow-sm overflow-hidden p-0.5 z-10">
                        <BadgeIcon className="h-full w-full object-contain drop-shadow-sm" />
                    </div>
                </div>
                {/* Rank Float Badge (Top Center) */}
                <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full h-7 w-7 flex items-center justify-center text-white text-xs font-black border-2 border-background shadow-lg z-20",
                    rankConfig.badge
                )}>
                    {rank}
                </div>
            </div>

            {/* Identity */}
            <div className="text-center space-y-1 w-full flex flex-col items-center">
                <Typography variant="h3" className={cn("font-black tracking-tight truncate w-full", rank === 1 ? "text-lg sm:text-xl" : "text-base sm:text-lg")}>
                    {formatCapitalizeWords(member.name)}
                </Typography>
                
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary dark:bg-muted dark:text-foreground text-[8px] font-black uppercase tracking-widest border border-primary/20 dark:border-border">{rankName} (Lvl {level})</span>
                    {isUser && (
                        <span className="px-2 py-0.5 rounded-md bg-linear-to-r from-primary to-[#008A03] text-white text-[8px] font-black uppercase tracking-widest shadow-sm">You</span>
                    )}
                </div>
                
                {isStudent && member.username && (
                    <Typography variant="small" className="text-[10px] text-muted-foreground/60 font-medium truncate w-full opacity-70">@{member.username}</Typography>
                )}
            </div>

            {/* Points Visual */}
            <div className="mt-8 py-4 px-6 bg-primary/5 dark:bg-card/70 rounded-2xl border border-primary/10 dark:border-border/60 w-full text-center group-hover:bg-primary/10 transition-colors">
                <Typography className={cn("font-black text-primary dark:text-white leading-none", rank === 1 ? "text-3xl" : "text-2xl")}>
                    {member.points.toLocaleString()}
                </Typography>
                <Typography variant="small" className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                    Total Points
                </Typography>
            </div>
        </div>
    );

    if (isStudent) {
        return (
            <Link key={member.id} href={`/student/friends/${member.id}`} className="contents">
                {Content}
            </Link>
        );
    }

    return <div key={member.id} className="contents">{Content}</div>;
};

export default function Podium({ topThree, currentUserId, type }: PodiumProps) {
    if (topThree.length === 0) return null;

    const isStudent = type === LeaderboardTab.STUDENTS;
    const first = topThree[0];
    const second = topThree[1];
    const third = topThree[2];

    return (
        <div className="w-full flex flex-col gap-8 pb-10">
            {/* Header section from screenshot */}
            <div className="flex flex-col mb-4 px-4 sm:px-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground shadow-sm border border-primary/20 dark:border-border">
                        <Crown className="w-5 h-5" />
                    </div>
                    <Typography variant="h2" className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Global Rankings</Typography>
                </div>
                <Typography variant="small" className="text-muted-foreground/70 font-bold text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
                    The elite circle of {isStudent ? 'testers' : 'institutions'} pushing the boundaries of {isStudent ? 'software quality' : 'academic excellence'}.
                </Typography>
            </div>

            <div className="relative w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 px-1 overflow-visible">
                {/* Mobile/Tablet: Natural Sort (1, 2, 3) | Desktop: (2, 1, 3) */}
                <div className="contents lg:hidden">
                    {first && <RenderMember member={first} rank={1} rankColor="var(--color-rank-1)" currentUserId={currentUserId} isStudent={isStudent} />}
                    {second && <RenderMember member={second} rank={2} rankColor="var(--color-rank-2)" currentUserId={currentUserId} isStudent={isStudent} />}
                    {third && <RenderMember member={third} rank={3} rankColor="var(--color-rank-3)" currentUserId={currentUserId} isStudent={isStudent} />}
                </div>

                <div className="hidden lg:contents">
                    {second && <RenderMember member={second} rank={2} rankColor="var(--color-rank-2)" currentUserId={currentUserId} isStudent={isStudent} />}
                    {first && <RenderMember member={first} rank={1} rankColor="var(--color-rank-1)" currentUserId={currentUserId} isStudent={isStudent} />}
                    {third && <RenderMember member={third} rank={3} rankColor="var(--color-rank-3)" currentUserId={currentUserId} isStudent={isStudent} />}
                </div>
            </div>
        </div>
    );
}
