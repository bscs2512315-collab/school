"use client";

import React from "react";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import StarSVG from "@/public/svgs/StarSVG";
import CalendarSVG from "@/public/svgs/CalendarSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import LockSVG from "@/public/svgs/LockSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import { cn } from "@/lib/utils";

interface MilestoneTheme {
    gradient: string;
    borderGlow: string;
    textColor: string;
    accentBg: string;
    accentBorder: string;
    glowColor: string;
}

const defaultTheme: MilestoneTheme = {
    gradient: "from-emerald-600 via-teal-600 to-emerald-800",
    borderGlow: "shadow-emerald-500/25",
    textColor: "text-emerald-300",
    accentBg: "bg-emerald-500/15",
    accentBorder: "border-emerald-400/30",
    glowColor: "rgba(16, 185, 129, 0.35)",
};

const milestoneThemeMap: Record<string, MilestoneTheme> = {
    Novice: {
        gradient: "from-amber-500 via-amber-600 to-yellow-800",
        borderGlow: "shadow-amber-500/30",
        textColor: "text-amber-300",
        accentBg: "bg-amber-500/15",
        accentBorder: "border-amber-400/30",
        glowColor: "rgba(245, 158, 11, 0.4)",
    },
    Apprentice: {
        gradient: "from-emerald-500 via-emerald-600 to-teal-800",
        borderGlow: "shadow-emerald-500/30",
        textColor: "text-emerald-300",
        accentBg: "bg-emerald-500/15",
        accentBorder: "border-emerald-400/30",
        glowColor: "rgba(16, 185, 129, 0.4)",
    },
    Scholar: {
        gradient: "from-cyan-500 via-teal-600 to-blue-800",
        borderGlow: "shadow-cyan-500/30",
        textColor: "text-cyan-300",
        accentBg: "bg-cyan-500/15",
        accentBorder: "border-cyan-400/30",
        glowColor: "rgba(6, 182, 212, 0.4)",
    },
    Warrior: {
        gradient: "from-blue-500 via-indigo-600 to-blue-900",
        borderGlow: "shadow-blue-500/30",
        textColor: "text-blue-300",
        accentBg: "bg-blue-500/15",
        accentBorder: "border-blue-400/30",
        glowColor: "rgba(59, 130, 246, 0.4)",
    },
    Knight: {
        gradient: "from-violet-500 via-purple-600 to-purple-900",
        borderGlow: "shadow-purple-500/30",
        textColor: "text-purple-300",
        accentBg: "bg-purple-500/15",
        accentBorder: "border-purple-400/30",
        glowColor: "rgba(139, 92, 246, 0.4)",
    },
    Hero: {
        gradient: "from-rose-500 via-pink-600 to-rose-900",
        borderGlow: "shadow-rose-500/30",
        textColor: "text-rose-300",
        accentBg: "bg-rose-500/15",
        accentBorder: "border-rose-400/30",
        glowColor: "rgba(244, 63, 94, 0.4)",
    },
    Champion: {
        gradient: "from-amber-400 via-yellow-500 to-amber-700",
        borderGlow: "shadow-yellow-500/35",
        textColor: "text-yellow-200",
        accentBg: "bg-yellow-500/15",
        accentBorder: "border-yellow-400/30",
        glowColor: "rgba(234, 179, 8, 0.45)",
    },
    Master: {
        gradient: "from-red-500 via-rose-600 to-red-900",
        borderGlow: "shadow-red-500/35",
        textColor: "text-red-300",
        accentBg: "bg-red-500/15",
        accentBorder: "border-red-400/30",
        glowColor: "rgba(239, 68, 68, 0.4)",
    },
    Grandmaster: {
        gradient: "from-indigo-500 via-violet-600 to-indigo-900",
        borderGlow: "shadow-indigo-500/35",
        textColor: "text-indigo-300",
        accentBg: "bg-indigo-500/15",
        accentBorder: "border-indigo-400/30",
        glowColor: "rgba(99, 102, 241, 0.4)",
    },
    Elite: {
        gradient: "from-fuchsia-500 via-pink-600 to-purple-900",
        borderGlow: "shadow-fuchsia-500/35",
        textColor: "text-fuchsia-300",
        accentBg: "bg-fuchsia-500/15",
        accentBorder: "border-fuchsia-400/30",
        glowColor: "rgba(217, 70, 239, 0.4)",
    },
    Legend: {
        gradient: "from-amber-400 via-orange-500 to-yellow-700",
        borderGlow: "shadow-amber-500/40",
        textColor: "text-amber-200",
        accentBg: "bg-amber-500/15",
        accentBorder: "border-amber-400/30",
        glowColor: "rgba(251, 191, 36, 0.5)",
    },
    Mythic: {
        gradient: "from-purple-500 via-fuchsia-600 to-indigo-950",
        borderGlow: "shadow-purple-500/40",
        textColor: "text-purple-200",
        accentBg: "bg-purple-500/15",
        accentBorder: "border-purple-400/30",
        glowColor: "rgba(168, 85, 247, 0.5)",
    },
};

interface MilestoneDetailsModalProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    milestone: any;
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rankBadgeMap: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    iconMap: Record<string, any>;
}

export default function MilestoneDetailsModal({
    milestone,
    isOpen,
    onClose,
    rankBadgeMap,
    iconMap,
}: MilestoneDetailsModalProps) {
    if (!isOpen || !milestone) return null;

    const BadgeIcon = rankBadgeMap[milestone.name] || iconMap[milestone.icon] || TrophySVG;
    const isUnlocked = Boolean(milestone.unlocked);
    const theme = milestoneThemeMap[milestone.name] || defaultTheme;

    return (
        <div className="fixed inset-0 z-100 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
                {/* Modal Container */}
                <div className="relative bg-card border border-border/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 text-foreground max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col">
                    {/* TOP GLOWING HERO HEADER */}
                    <div
                        className={cn(
                            "relative overflow-hidden px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6 text-center text-white shrink-0 border-b border-white/15 bg-gradient-to-br transition-all duration-700",
                            theme.gradient,
                        )}
                    >
                        {/* Ambient Lighting Orbs */}
                        <div className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-white/25 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 size-52 rounded-full bg-black/40 blur-3xl" />
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
                                backgroundSize: "16px 16px",
                            }}
                        />

                        {/* Top Bar: Status Tag, Level Tag & Close Button */}
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-black uppercase tracking-wider backdrop-blur-md border shadow-xs",
                                        isUnlocked
                                            ? "bg-white/25 text-white border-white/35 shadow-emerald-950/20"
                                            : "bg-black/40 text-white/90 border-white/20",
                                    )}
                                >
                                    {isUnlocked ? (
                                        <TrophySVG className="size-3 text-amber-300" />
                                    ) : (
                                        <LockSVG className="size-3 text-white/70" />
                                    )}
                                    <span>{isUnlocked ? "Achieved" : "Locked Tier"}</span>
                                </span>

                                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-md px-2.5 py-1 text-[10.5px] font-bold text-white border border-white/20">
                                    <StarSVG className="size-2.5 text-amber-300" />
                                    <span>Level {milestone.level || 1}</span>
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex size-7.5 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 text-white/80 hover:text-white transition-all cursor-pointer border border-white/25 shadow-xs active:scale-90"
                                aria-label="Close modal"
                            >
                                <CloseCircleSVG className="size-4" />
                            </button>
                        </div>

                        {/* Celebratory 3D Badge Pedestal Stage */}
                        <div className="relative z-10 my-3 flex flex-col items-center justify-center">
                            <div className="relative size-28 sm:size-32 flex items-center justify-center group">
                                {/* Backlight Aura */}
                                <div
                                    className={cn(
                                        "absolute inset-1 rounded-full blur-2xl transition-all duration-700",
                                        isUnlocked ? "bg-white/35 animate-pulse" : "bg-black/30",
                                    )}
                                />

                                {/* Concentric Glass Ring Halo */}
                                <div className="absolute inset-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-xs shadow-inner" />
                                <div className="absolute inset-2 rounded-full border border-white/20" />

                                {/* The Badge Icon */}
                                <div
                                    className={cn(
                                        "relative z-10 size-20 sm:size-24 flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                                        isUnlocked
                                            ? "drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
                                            : "opacity-75 contrast-110 grayscale-[30%] drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]",
                                    )}
                                >
                                    <BadgeIcon className="size-full object-contain" />
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 rounded-full backdrop-blur-[1px]">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-black/60 border border-white/30 shadow-md">
                                                <LockSVG className="size-4 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Milestone Name & Tagline */}
                            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                                {milestone.name}
                            </h2>
                            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-white/80 drop-shadow-xs">
                                Academic Milestone Tier
                            </p>
                        </div>
                    </div>

                    {/* SCROLLABLE BODY CONTENT */}
                    <div className="relative overflow-y-auto p-5 sm:p-6 flex flex-col flex-1 overscroll-contain space-y-4">
                        {/* Description Callout */}
                        <div className="relative rounded-2xl border border-border/70 bg-muted/30 p-3.5 sm:p-4 text-center">
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                                {milestone.description ||
                                    `Awarded for exceptional academic performance and reaching the ${milestone.name.toLowerCase()} milestone threshold.`}
                            </p>
                        </div>

                        {/* Modern Stat Cards (2 Columns) */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            {/* Card 1: Points Required */}
                            <div className="relative rounded-2xl border border-border/70 bg-background/80 p-3.5 text-center shadow-xs transition-colors hover:border-primary/40">
                                <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                                    <StarSVG className="size-3.5 text-amber-500 shrink-0" />
                                    <span>Threshold</span>
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                                    {Number(milestone.points_required || 0).toLocaleString()}
                                    <span className="ml-1 text-[11px] font-bold text-muted-foreground">
                                        PTS
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[10px] font-medium text-muted-foreground/80">
                                    Points Required
                                </p>
                            </div>

                            {/* Card 2: Progress */}
                            <div className="relative rounded-2xl border border-border/70 bg-background/80 p-3.5 text-center shadow-xs transition-colors hover:border-primary/40">
                                <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                                    <TrophySVG className="size-3.5 text-emerald-500 shrink-0" />
                                    <span>Status</span>
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                    {isUnlocked ? "100%" : `${milestone.progress || 0}%`}
                                </div>
                                <p className="mt-0.5 text-[10px] font-medium text-muted-foreground/80">
                                    {isUnlocked ? "Completed" : "In Progress"}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar for Locked / In Progress */}
                        {!isUnlocked && (
                            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
                                <div className="flex justify-between items-center text-[10.5px] font-bold">
                                    <span className="uppercase tracking-wider text-muted-foreground">
                                        Progress To Unlock
                                    </span>
                                    <span className="font-black text-primary">
                                        {milestone.progress || 0}%
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/50 p-0.5">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-1000 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                        style={{ width: `${Math.max(milestone.progress || 0, 4)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Unlocked Date Pill */}
                        {isUnlocked && milestone.unlockedAt && (
                            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                <CheckCircleSVG className="size-4 shrink-0 text-emerald-500" />
                                <span>
                                    Unlocked on{" "}
                                    {new Date(milestone.unlockedAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className={cn(
                                "group relative w-full rounded-2xl h-12 font-black text-sm text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 overflow-hidden border border-white/20 bg-gradient-to-r",
                                theme.gradient,
                            )}
                        >
                            {/* Glossy Button Highlight */}
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-2xl" />

                            <span className="relative z-10 flex items-center gap-2">
                                {isUnlocked ? (
                                    <>
                                        <SparklesSVG className="size-4 text-amber-200 transition-transform duration-300 group-hover:rotate-12" />
                                        <span>Awesome! Keep Climbing</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Keep Working to Unlock</span>
                                        <ArrowRightSVG className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
