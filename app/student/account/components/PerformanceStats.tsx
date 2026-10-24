"use client";

import React from "react";
import StarSVG from "@/public/svgs/StarSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import LeaderboardSVG from "@/public/svgs/LeaderboardSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import type { StudentHistoryItem } from "@/types/student";

interface PerformanceStatsProps {
  profileData: any;
  milestones: any[];
  history?: StudentHistoryItem[];
}

export default function PerformanceStats({
  profileData,
  milestones,
  history = [],
}: PerformanceStatsProps) {
  const points = profileData?.points ?? 0;
  const unlockedCount = milestones.filter((m) => m.unlocked).length;

  const gradedAttempts = history.filter(
    (h) => (h.total_marks || 0) > 0 && h.score !== null && h.grading_status === "graded",
  );

  const totalAttempts = history.length;
  const avgScore =
    gradedAttempts.length > 0
      ? Math.round(
          gradedAttempts.reduce(
            (acc, curr) => acc + ((curr.score ?? 0) / curr.total_marks) * 100,
            0,
          ) / gradedAttempts.length,
        )
      : 0;

  const paper1Attempts = history.filter((h) => h.paper_type !== "paper2").length;
  const paper2Attempts = history.filter((h) => h.paper_type === "paper2").length;

  // Group by Subject
  const subjectMap = new Map<string, { total: number; sumPercent: number; count: number }>();
  gradedAttempts.forEach((item) => {
    const sub = item.subject || "General";
    const percent = ((item.score ?? 0) / item.total_marks) * 100;
    const current = subjectMap.get(sub) || { total: 0, sumPercent: 0, count: 0 };
    subjectMap.set(sub, {
      total: current.total + 1,
      sumPercent: current.sumPercent + percent,
      count: current.count + 1,
    });
  });

  const subjectStats = Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    avg: Math.round(data.sumPercent / Math.max(1, data.count)),
    attempts: data.total,
  }));

  const kpis = [
    {
      label: "Total Points",
      value: points.toLocaleString(),
      subtext: "Earned across all activities",
      icon: StarSVG,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Average Score",
      value: `${avgScore}%`,
      subtext: `${gradedAttempts.length} graded papers`,
      icon: LeaderboardSVG,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Total Attempts",
      value: totalAttempts.toString(),
      subtext: `${paper1Attempts} MCQs · ${paper2Attempts} Theory`,
      icon: CheckCircleSVG,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Milestones",
      value: `${unlockedCount} / ${milestones.length}`,
      subtext: "Ranks achieved",
      icon: TrophySVG,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={cn(
              "relative overflow-hidden rounded-3xl border bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
              kpi.border,
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </span>
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-2xl",
                  kpi.bg,
                  kpi.color,
                )}
              >
                <kpi.icon className="size-5" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {kpi.value}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{kpi.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Subject Performance Breakdown */}
      <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpenSVG className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-foreground sm:text-lg">
                Subject Performance Breakdown
              </h3>
              <p className="text-xs text-muted-foreground">
                Average accuracy across examined subjects
              </p>
            </div>
          </div>
        </div>

        {subjectStats.length > 0 ? (
          <div className="space-y-4">
            {subjectStats.map((item) => {
              const isHigh = item.avg >= 75;
              const isMid = item.avg >= 50 && item.avg < 75;

              return (
                <div key={item.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-foreground">{item.subject}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {item.attempts} attempt{item.attempts > 1 ? "s" : ""}
                      </span>
                      <span
                        className={cn("font-black", {
                          "text-emerald-600 dark:text-emerald-400": isHigh,
                          "text-amber-600 dark:text-amber-400": isMid,
                          "text-rose-600 dark:text-rose-400": !isHigh && !isMid,
                        })}
                      >
                        {item.avg}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", {
                        "bg-emerald-500": isHigh,
                        "bg-amber-500": isMid,
                        "bg-rose-500": !isHigh && !isMid,
                      })}
                      style={{ width: `${Math.max(item.avg, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-10 text-center">
            <BookOpenSVG className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-semibold text-muted-foreground">
              No subject attempts recorded yet. Start practicing to see your analytics!
            </p>
          </div>
        )}
      </div>

      {/* Motivational Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-r from-sidebar-from via-primary to-sidebar-to p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight sm:text-xl">
              Keep Pushing Towards Higher Ranks!
            </h3>
            <p className="text-xs text-white/80 leading-relaxed sm:text-sm">
              Each solved past paper, quiz, and laboratory challenge earns you valuable XP to climb the
              leaderboards and unlock prestigious badges.
            </p>
          </div>

          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 p-3 backdrop-blur-md self-start sm:self-auto">
            <TrophySVG className="size-full text-amber-300 drop-shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
