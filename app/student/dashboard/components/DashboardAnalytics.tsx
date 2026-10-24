"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import HistorySVG from "@/public/svgs/HistorySVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import MilestonesSVG from "@/public/svgs/MilestonesSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Typography } from "@/components/ui/Typography";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import type { StudentHistoryItem } from "@/types/student";

interface DashboardAnalyticsProps {
  recentHistory: StudentHistoryItem[];
  rank: number | null;
}

export default function DashboardAnalytics({
  recentHistory,
  rank,
}: DashboardAnalyticsProps) {
  const scoreTrend = useMemo(() => {
    return [...recentHistory]
      .slice(0, 8)
      .reverse()
      .map((item, index) => {
        const pct =
          item.total_marks > 0
            ? Math.round((item.score / item.total_marks) * 100)
            : 0;
        return {
          label: `T${index + 1}`,
          score: pct,
        };
      });
  }, [recentHistory]);

  const subjectBars = useMemo(() => {
    const bySubject = new Map<string, { total: number; count: number }>();
    recentHistory.forEach((item) => {
      const key = item.subject || "Other";
      const current = bySubject.get(key) ?? { total: 0, count: 0 };
      const pct =
        item.total_marks > 0 ? (item.score / item.total_marks) * 100 : 0;
      bySubject.set(key, {
        total: current.total + pct,
        count: current.count + 1,
      });
    });

    return Array.from(bySubject.entries())
      .map(([subject, value]) => ({
        subject,
        avg: Math.round(value.total / value.count),
      }))
      .slice(0, 5);
  }, [recentHistory]);

  const avgScore = useMemo(() => {
    if (recentHistory.length === 0) return null;
    const sum = recentHistory.reduce((acc, item) => {
      if (item.total_marks <= 0) return acc;
      return acc + (item.score / item.total_marks) * 100;
    }, 0);
    return Math.round(sum / recentHistory.length);
  }, [recentHistory]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            Analytics & Performance
          </Typography>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Your recent score trajectory and subject averages
          </p>
        </div>
        <Link
          href={FRONTEND_ROUTES.STUDENT_HISTORY}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-white transition-colors hover:text-primary/80 dark:hover:text-white/80"
        >
          <span>Full History</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Analytics Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Average Score */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-light/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-[#008503] via-[#005f02] to-[#004a02]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
            <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
            <div
              className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />
            <MilestonesSVG
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                <MilestonesSVG className="size-3.5 text-white" />
                Average Score
              </span>
              <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                Score
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                {avgScore !== null ? `${avgScore}%` : "—"}
              </span>
            </div>

            <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
              Across recent tests
            </span>
          </div>
        </div>

        {/* Tests Completed */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-blue-300/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
            <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
            <div
              className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />
            <HistorySVG
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                <HistorySVG className="size-3.5 text-white" />
                Tests Completed
              </span>
              <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                Practice
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                {recentHistory.length}
              </span>
            </div>

            <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
              Total practice sessions
            </span>
          </div>
        </div>

        {/* Current Rank */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-300/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-[#f59e0b] via-[#d97706] to-[#b45309]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
            <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
            <div
              className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />
            <LeaderboardSVG
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                <LeaderboardSVG className="size-3.5 text-white" />
                Current Rank
              </span>
              <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                Active
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                {rank !== null ? `#${rank}` : "—"}
              </span>
            </div>

            <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
              On the active board
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Score Trend Area Chart */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                <TrendingUp className="size-4" />
              </div>
              <p className="text-sm font-bold text-foreground">Score Trend</p>
            </div>
            <span className="text-xs text-muted-foreground">Last {scoreTrend.length} tests</span>
          </div>

          {scoreTrend.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={scoreTrend}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoreFillDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value}%`, "Score"]}
                    itemStyle={{ color: "var(--color-foreground)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#scoreFillDesktop)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 text-center p-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
                <HistorySVG className="size-5.5" />
              </div>
              <p className="mt-2 text-xs font-bold text-foreground">No test trend yet</p>
              <p className="text-[11px] text-muted-foreground">Complete tests to visualize your progress curve</p>
            </div>
          )}
        </div>

        {/* Subject Averages Bar Chart */}
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                <TrendingUp className="size-4" />
              </div>
              <p className="text-sm font-bold text-foreground">Subject Averages</p>
            </div>
            <span className="text-xs text-muted-foreground">Recent accuracy</span>
          </div>

          {subjectBars.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectBars}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="subject"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickFormatter={(value: string) =>
                      value.length > 10 ? `${value.slice(0, 9)}…` : value
                    }
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value}%`, "Average"]}
                    labelFormatter={(label) => String(label)}
                    itemStyle={{ color: "var(--color-foreground)" }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="avg"
                    fill="var(--color-primary)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 text-center p-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
                <SubjectsSVG className="size-5.5" />
              </div>
              <p className="mt-2 text-xs font-bold text-foreground">No subject breakdown yet</p>
              <p className="text-[11px] text-muted-foreground">Practice papers across subjects to compare averages</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
