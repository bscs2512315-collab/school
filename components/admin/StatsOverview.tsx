"use client";

import StudentsSVG from "@/public/svgs/StudentsSVG";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  stats: {
    totalStudents: number;
    totalSchools: number;
    activeStudents: number;
    totalQuestions?: number;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      subtitle: "Registered Learners",
      icon: StudentsSVG,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Platform",
    },
    {
      title: "Practiced Today",
      value: stats.activeStudents,
      subtitle: "Unique exam submitters today",
      icon: ClassroomSVG,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Today",
    },
    {
      title: "School Records",
      value: stats.totalSchools,
      subtitle: "Registered and listed schools",
      icon: BuildingSVG,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Schools",
    },
    {
      title: "Question Bank",
      value: stats.totalQuestions ?? 0,
      subtitle: "Curated Board Questions",
      icon: QuestionBankSVG,
      cardBg: "bg-linear-to-br from-sidebar-from via-primary to-sidebar-to border-white/20 shadow-primary/20",
      badge: "Repository",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
              card.cardBg,
            )}
          >
            {/* Ambient Background Duotone Watermark & Glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
              <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
              <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
                <Icon className="size-24 sm:size-28 text-white" />
              </div>
            </div>

            {/* Top row with frosted glass icon & badge */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Icon className="size-5 sm:size-6 text-white" />
              </div>
              <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                {card.badge}
              </span>
            </div>

            {/* Value & Labels */}
            <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                {card.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
                {card.title}
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
