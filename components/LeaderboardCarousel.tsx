"use client";

import React, { useEffect, useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { School, Star } from "lucide-react";
import UserSVG from "@/public/svgs/UserSVG";
import { LeaderboardTab } from "@/types/enums";
import { cn, formatSchoolName } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";

// Types for Carousel
export interface CarouselStudent {
    id: string;
    name: string;
    username: string;
    level: number;
    rank: number;
    badges: string[];
    points: number;
    profilePic?: string;
}

export interface CarouselSchool {
    id: string;
    name: string;
    rank: number;
    points: number;
    studentCount?: number;
    location?: string;
}

interface LeaderboardCarouselProps {
    students: CarouselStudent[];
    schools: CarouselSchool[];
    intervalMs?: number; // default 60000 (1 minute)
    type?: LeaderboardTab;
}

export default function LeaderboardCarousel({ students, schools, intervalMs = 60000, type }: LeaderboardCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Flatten to a single items list mixing type
    const items = [
        ...students.map(s => ({ type: "student" as const, data: s })),
        ...schools.map(s => ({ type: "school" as const, data: s })),
    ];

    // Reset index when data changes
    useEffect(() => {
        setCurrentIndex(0);
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: 0, behavior: "instant" as any });
        }
    }, [students.length, schools.length, type]);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % items.length;
                if (scrollRef.current) {
                    const el = scrollRef.current;
                    const child = el.children[next] as HTMLElement;
                    if (child && child.offsetLeft !== undefined) {
                        el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
                    }
                }
                return next;
            });
        }, intervalMs);
        return () => clearInterval(timer);
    }, [items.length, intervalMs]);

    const goToIndex = (idx: number) => {
        setCurrentIndex(idx);
        if (scrollRef.current) {
            const el = scrollRef.current;
            const child = el.children[idx] as HTMLElement;
            if (child && child.offsetLeft !== undefined) {
                el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
            }
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="flex items-center justify-between mb-4 px-1">
            <div
                ref={scrollRef}
                className="relative flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 pt-1"
                style={{ scrollBehavior: 'smooth' }}
                onScroll={(e) => {
                    // Update indicator dot softly manually (if needed)
                    // We can just rely on dots updating mostly automatically
                    const el = e.currentTarget;
                    if (items.length === 0) return;
                    const itemWidth = el.scrollWidth / items.length;
                    const index = Math.round(el.scrollLeft / itemWidth);
                    if (index >= 0 && index < items.length && index !== currentIndex) {
                        setCurrentIndex(index);
                    }
                }}
            >
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)] shrink-0 snap-center h-full"
                    >
                        {item.type === "student" ? (
                            <StudentCard student={item.data} />
                        ) : (
                            <SchoolCard school={item.data} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

import Image from "next/image";

import Link from "next/link";

function StudentCard({ student }: { student: CarouselStudent }) {
    return (
        <Link
            href={`/student/friends/${student.id}`}
            className="bg-primary/5 dark:bg-card/70 border border-primary/20 dark:border-border/60 rounded-2xl p-2.5 sm:p-3 flex flex-row items-center gap-3 shadow-sm hover:shadow-md transition-shadow h-full relative group overflow-hidden"
        >
            <div className="relative shrink-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-primary/40 dark:border-primary/60 bg-background/50 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    <UserAvatar
                        src={student.profilePic}
                        name={student.name}
                        username={student.username}
                        id={student.id}
                        size={56}
                        className="size-full"
                    />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 shadow-sm border border-card">
                    #{student.rank}
                </div>
            </div>

            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between w-full">
                    <Typography variant="small" className="text-xs sm:text-sm font-black text-foreground truncate leading-tight group-hover:text-primary transition-colors">{student.name}</Typography>
                    <span className="text-xs font-black text-primary dark:text-white shrink-0 leading-tight group-hover:scale-110 transition-transform">{student.points} <span className="text-[9px] text-muted-foreground group-hover:text-primary/70 dark:group-hover:text-white/70 transition-colors">pts</span></span>
                </div>
                <Typography variant="small" className="text-[10px] text-muted-foreground/80 uppercase tracking-widest truncate leading-tight">{student.username}</Typography>

                <div className="flex items-center mt-1 -mb-0.5">
                    <span className="bg-background/80 dark:bg-muted px-2 py-0.5 rounded-md text-[9px] uppercase tracking-widest text-foreground font-bold border border-primary/20 dark:border-border/60 shadow-sm leading-none">Lvl {student.level}</span>
                </div>
            </div>
        </Link>
    );
}

function SchoolCard({ school }: { school: CarouselSchool }) {
    return (
        <div className="bg-rank-2/5 dark:bg-card/70 border border-rank-2/20 dark:border-border/60 rounded-2xl p-2.5 sm:p-3 flex flex-row items-center gap-3 shadow-sm hover:shadow-md transition-shadow h-full relative group overflow-hidden">
            <div className="relative shrink-0">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border-2 border-rank-2/40 dark:border-rank-2/60 bg-background/50 flex items-center justify-center transform rotate-3 group-hover:scale-105 transition-transform">
                    <School className="h-7 w-7 sm:h-8 sm:w-8 text-rank-2/70 dark:text-rank-2" />
                </div>
                <div className="absolute -bottom-1 -right-1 transform -rotate-3 bg-rank-2 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10 shadow-sm border border-card">
                    #{school.rank}
                </div>
            </div>

            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 w-full">
                    <Typography variant="small" className="text-xs sm:text-sm font-black text-foreground truncate leading-tight">{formatSchoolName(school.name)}</Typography>
                    <span className="text-xs font-black text-rank-2 dark:text-white shrink-0 leading-tight">{school.points} <span className="text-[9px] text-muted-foreground">pts</span></span>
                </div>

                <div className="flex items-center gap-2 mt-1 -mb-0.5">
                    <span className="bg-background/80 dark:bg-muted text-foreground border border-rank-2/20 dark:border-border/60 shadow-sm px-2 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-black leading-none">Top School</span>
                </div>
            </div>
        </div>
    );
}
