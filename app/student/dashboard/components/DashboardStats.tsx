"use client";

import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import type { ComponentType, SVGProps } from "react";

export interface DashboardStatItem {
  label: string;
  value: string | number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color?: string;
  bg?: string;
  trend?: string;
  trendIcon?: ComponentType<SVGProps<SVGSVGElement>>;
  subtitle?: string;
  badge?: string;
  badgeStyle?: string;
  cardBg?: string;
  iconBg?: string;
}

interface DashboardStatsProps {
  stats: DashboardStatItem[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div>
        <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          Your Progress
        </Typography>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          A real-time snapshot of your academic performance and milestones
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                stat.cardBg || "bg-card border-border/60",
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

              {/* Top Row with frosted icon & badge */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <Icon className="size-5 sm:size-6 text-white" />
                </div>

                {stat.badge && (
                  <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                    {stat.badge}
                  </span>
                )}
              </div>

              {/* Value & Labels */}
              <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
                  {stat.subtitle || stat.trend}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
