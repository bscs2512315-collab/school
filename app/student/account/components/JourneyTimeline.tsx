"use client";

import React from "react";
import { Activity } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import MilestoneCard from "@/components/MilestoneCard";
import { cn } from "@/lib/utils";
import { Award } from "lucide-react";

interface JourneyTimelineProps {
    milestones: any[];
    rankBadgeMap: Record<string, any>;
    iconMap: Record<string, any>;
    onMilestoneClick: (milestone: any) => void;
}

export default function JourneyTimeline({
    milestones,
    rankBadgeMap,
    iconMap,
    onMilestoneClick
}: JourneyTimelineProps) {
    if (milestones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center w-full rounded-2xl border border-dashed border-border/70 bg-muted/20 py-14 text-center">
                <Activity className="size-10 text-muted-foreground/40 mb-4" />
                <Typography className="text-sm font-bold text-muted-foreground">Mapping your journey...</Typography>
                <Typography variant="muted" className="mt-1 text-xs">
                    Your ranks will appear here as you learn and earn points.
                </Typography>
            </div>
        );
    }

    const renderSnakePath = (cols: number) => {
        const rows: any[][] = [];
        for (let i = 0; i < milestones.length; i += cols) {
            rows.push(milestones.slice(i, i + cols));
        }

        return rows.map((row, rowIndex) => {
            const isEvenRow = rowIndex % 2 === 0;
            const hasNextRow = rowIndex < rows.length - 1;
            const displayItems = isEvenRow ? [...row] : [...row].reverse();

            return (
                <div key={rowIndex} className="relative flex w-full flex-row pb-12 md:pb-16">
                    {/* Horizontal Segment connecting cards */}
                    {displayItems.length > 1 ? (
                        displayItems.map((_, i) => {
                            if (i === displayItems.length - 1) return null;
                            const targetItem = displayItems[isEvenRow ? i + 1 : i];
                            const isUnlocked = targetItem?.unlocked;

                            return (
                                <div
                                    key={`h-${i}`}
                                    className={cn(
                                        "absolute top-[40px] md:top-[56px] h-[8px] -translate-y-1/2 z-0 transition-colors duration-700 rounded-full",
                                        isUnlocked ? "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "bg-muted"
                                    )}
                                    style={{
                                        left: `${(100 / cols) * i + (50 / cols)}%`,
                                        width: `${100 / cols}%`
                                    }}
                                />
                            );
                        })
                    ) : null}

                    {/* Vertical Loop connecting to the NEXT row */}
                    {hasNextRow && (
                        <div
                            className={cn(
                                "absolute top-[36px] md:top-[52px] h-[calc(100%+8px)] z-0 transition-colors duration-700",
                                isEvenRow
                                    ? "border-y-8 border-r-8 border-l-0 rounded-r-[40px] md:rounded-r-[60px]"
                                    : "border-y-8 border-l-8 border-r-0 rounded-l-[40px] md:rounded-l-[60px]",
                                rows[rowIndex + 1]?.[0]?.unlocked ? "border-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]" : "border-muted"
                            )}
                            style={{
                                width: `${50 / cols}%`,
                                left: isEvenRow ? `${100 - (50 / cols)}%` : `0%`,
                            }}
                        />
                    )}

                    {/* Items */}
                    <div className="flex w-full z-10">
                        {displayItems.map((item) => {
                            const originalIndex = milestones.indexOf(item);
                            return (
                                <div
                                    key={originalIndex}
                                    className="flex justify-center cursor-pointer"
                                    style={{ width: `${100 / cols}%` }}
                                    onClick={() => onMilestoneClick(item)}
                                >
                                    <MilestoneCard
                                        item={item}
                                        idx={originalIndex}
                                        BadgeComp={rankBadgeMap[item.name] || iconMap[item.icon] || Award}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 text-center">
                <Typography className="text-lg font-black tracking-tight sm:text-xl">
                    Your <span className="text-primary">Journey</span>
                </Typography>
                <Typography variant="muted" className="mt-1 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                    Trace your path to greatness. Unlock new ranks by participating, learning, and earning points.
                </Typography>
            </div>

            <div className="relative w-full py-6 px-2 md:px-8">
                <div className="block md:hidden">
                    {renderSnakePath(2)}
                </div>
                <div className="hidden md:block lg:hidden">
                    {renderSnakePath(3)}
                </div>
                <div className="hidden lg:block">
                    {renderSnakePath(4)}
                </div>
            </div>
        </div>
    );
}
