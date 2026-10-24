"use client";

import { User, Award, Star, Flame, BookOpen, Shield, Crown, Zap, Heart, MapPin, Loader2, UserCheck, UserPlus, X } from "lucide-react";
import TrophySVG from "@/public/svgs/TrophySVG";
import Image from "next/image";
import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import MilestoneCard from "@/components/MilestoneCard";
import UserAvatar from "@/components/UserAvatar";

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

const iconMap: Record<string, any> = {
    Star, Flame, BookOpen, Trophy: TrophySVG, Shield, Crown, Zap, Heart, Award
};

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

interface UserProfileHeaderProps {
    profileData: any;
    milestones?: any[]; // For achievements
    isOwnProfile?: boolean;
    onFollowClick?: () => void;
    followLoading?: boolean;
}

export default function UserProfileHeader({
    profileData,
    milestones = [],
    isOwnProfile = false,
    onFollowClick,
    followLoading = false
}: UserProfileHeaderProps) {
    const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);

    // Find highest unlocked milestone
    const unlockedMilestones = milestones.filter((m: any) => m.unlocked);
    const highestMilestone = [...milestones].reverse().find((m: any) => m.unlocked);
    const currentRankName = highestMilestone ? highestMilestone.name : (profileData?.rank || "Novice");
    const BadgeIcon = rankBadgeMap[currentRankName] || Award;

    return (
        <div className="py-2 px-6 md:py-4 mb-8 border-b border-border/40 relative overflow-hidden">
            <div className="flex flex-row items-center justify-between">
                {/* Left: Avatar */}
                <div className="relative shrink-0">
                    <div className="h-20 w-20 md:h-28 md:w-28 rounded-full overflow-hidden border-2 md:border-4 border-background shadow-md p-[2px] md:p-1 bg-linear-to-tr from-primary to-primary/60">
                        <UserAvatar
                            src={profileData?.profileImage}
                            name={profileData?.name}
                            username={profileData?.username}
                            id={profileData?.id}
                            size={112}
                            className="size-full border-2 md:border-4 border-background"
                        />
                    </div>
                    <div className="absolute bottom-0 right-0 h-8 w-8 md:h-10 md:w-10 bg-card rounded-full border-2 md:border-[3px] border-background flex items-center justify-center shadow-sm overflow-hidden p-0.5">
                        <BadgeIcon className="h-full w-full object-contain drop-shadow-sm" />
                    </div>
                </div>

                {/* Right: Stats */}
                <div className="flex-1 flex justify-around items-center">
                    <div className="flex flex-col items-center justify-center">
                        <Typography className="text-lg md:text-2xl font-bold">{profileData?.points ?? 0}</Typography>
                        <Typography variant="muted" className="text-[11px] md:text-sm">Points</Typography>
                    </div>
                </div>
            </div>

            {/* Bottom: Bio / Info */}
            <div className="mt-4 flex flex-col gap-0.5">
                <span className="text-[10px] bg-primary/20 text-primary border border-primary/60 w-fit rounded-full flex justify-center items-center font-black uppercase tracking-widest leading-none mt-0.5 overflow-hidden">
                    <Typography className="text-[10px] font-black px-2 py-1 uppercase tracking-widest flex items-center justify-center leading-none">
                        {profileData?.rank || "Novice"}
                    </Typography>
                </span>
                <Typography variant="muted" className="text-base mt-2 text-foreground md:text-lg font-bold leading-none">{profileData?.name}</Typography>

                {profileData?.username && (
                    <Typography variant="muted" className="text-[11px] text-primary font-bold mb-1 mt-0.5">@{profileData.username}</Typography>
                )}
            </div>

            {/* Action Buttons */}
            {isOwnProfile && (
                <div className="mt-4 flex gap-2">
                    <Link href="/student/settings">
                        <Button className="text-primary-foreground rounded-full px-6 font-bold shadow-md hover:shadow-lg transition-all">Edit profile</Button>
                    </Link>
                </div>
            )}

            {/* Unlocked Badges Highlights (Instagram Stories style) */}
            {milestones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/40 w-full animate-in fade-in slide-in-from-bottom-2">
                    <Typography className="text-sm font-bold mb-4 px-2">Achievements</Typography>
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 px-2 snap-x">
                        {unlockedMilestones.map((badge: any, idx: number) => {
                            const BadgeIcon = rankBadgeMap[badge.name] || iconMap[badge.icon] || Award;
                            return (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center gap-1 shrink-0 snap-center w-[72px] md:w-[84px] group cursor-pointer"
                                    onClick={() => setSelectedMilestone(badge)}
                                >
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[1.5px] bg-primary transition-transform group-hover:scale-105">
                                        <div className="w-full h-full bg-card rounded-full p-2.5 flex items-center justify-center border-2 border-background shadow-inner">
                                            <BadgeIcon className="w-[120%] h-[120%] drop-shadow-md text-foreground" />
                                        </div>
                                    </div>
                                    <Typography className="text-[10px] md:text-xs font-bold text-foreground text-center truncate w-full" variant="muted">
                                        {badge.name}
                                    </Typography>
                                </div>
                            );
                        })}
                        {unlockedMilestones.length === 0 && (
                            <Typography variant="muted" className="text-sm px-2">No achievements unlocked yet.</Typography>
                        )}
                    </div>
                </div>
            )}

            {/* Milestone Details Dialog */}
            {selectedMilestone && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm shadow-2xl">
                    <div className="relative w-full max-w-sm rounded-3xl bg-transparent sm:max-w-md">
                        <button
                            onClick={() => setSelectedMilestone(null)}
                            className="absolute -top-12 right-0 p-2 text-foreground/50 hover:text-foreground transition-colors bg-card border border-border/40 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <MilestoneCard
                            item={selectedMilestone}
                            idx={0}
                            BadgeComp={rankBadgeMap[selectedMilestone.name] || iconMap[selectedMilestone.icon] || Award}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
