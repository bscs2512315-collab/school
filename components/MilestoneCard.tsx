"use client";

import { Typography } from "@/components/ui/Typography";
import { Shield, Star } from "lucide-react";
import LockSVG from "@/public/svgs/LockSVG";
import { cn } from "@/lib/utils";

interface MilestoneCardProps {
    item: any;
    idx: number;
    BadgeComp: any;
}

export default function MilestoneCard({ item, idx, BadgeComp }: MilestoneCardProps) {
    const isUnlocked = item.unlocked;

    return (
        <div className="relative flex flex-col items-center group mb-4 h-full">
            <div className={cn(
                "relative flex flex-col items-center w-36 md:w-48 p-4 md:p-5 rounded-[2rem] transition-all duration-500 overflow-hidden backdrop-blur-md h-full",
                isUnlocked
                    ? "bg-card border border-primary/30 shadow-[0_8px_30px_rgba(var(--primary),0.15)] hover:shadow-[0_8px_40px_rgba(var(--primary),0.3)] hover:-translate-y-2"
                    : "bg-card/40 border border-border/40 hover:bg-card/60"
            )}>

                {isUnlocked && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
                )}

                {/* Badge Section */}
                <div className={cn(
                    "relative w-24 h-24 md:w-28 md:h-28 mb-3 transition-transform duration-500 flex items-center justify-center shrink-0",
                    isUnlocked ? "group-hover:scale-110 group-hover:rotate-[5deg] drop-shadow-[0_0_20px_rgba(var(--primary),0.4)]" : "opacity-40 grayscale"
                )}>
                    <BadgeComp className="w-full h-full object-contain" />

                    {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] rounded-full">
                            <LockSVG className="size-8 text-foreground/70 drop-shadow-lg md:size-10" />
                        </div>
                    )}
                </div>

                {/* Level Tag */}
                <div className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 transition-colors w-max",
                    isUnlocked
                        ? "bg-primary/10 text-primary dark:bg-muted dark:text-foreground border border-primary/20 dark:border-border"
                        : "bg-muted/50 text-muted-foreground border border-border/50"
                )}>
                    {isUnlocked ? <Star size={10} className="text-primary fill-primary dark:text-foreground dark:fill-foreground" /> : <Shield size={10} />}
                    LV. {item.level || idx + 1}
                </div>

                {/* Title */}
                <Typography className={cn(
                    "text-lg md:text-xl font-black text-center mb-0 tracking-tight leading-none",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                    {item.name}
                </Typography>

                {/* Fixed Height Container for Points / Progress */}
                <div className="w-full h-[52px] md:h-[60px] flex flex-col justify-end mt-2 shrink-0">
                    {isUnlocked ? (
                        <div className="flex items-center justify-center gap-1.5 w-full h-full bg-background/50 rounded-xl border border-white/5 shadow-inner">
                            <span className="text-xl md:text-2xl font-black text-primary drop-shadow-sm leading-none">{item.points_required}</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">PTS</span>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col justify-center">
                            <div className="flex items-center justify-between px-1 mb-1.5 mt-2">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest leading-none">Progress</span>
                                <span className="text-[10px] font-black text-foreground/70 leading-none">{item.progress || 0}%</span>
                            </div>
                            <div className="w-full h-[6px] bg-muted/50 rounded-full overflow-hidden border border-border/50 mb-1.5">
                                <div
                                    className="h-full bg-muted-foreground/40 rounded-full transition-all duration-1000"
                                    style={{ width: `${item.progress || 0}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-none">Req: {item.points_required} PTS</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
