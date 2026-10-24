"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import type { StudentHistoryItem } from "@/types/student";
import HistorySVG from "@/public/svgs/HistorySVG";
import { cn } from "@/lib/utils";

interface DashboardRecentActivityProps {
  recentHistory: StudentHistoryItem[];
}

export default function DashboardRecentActivity({
  recentHistory,
}: DashboardRecentActivityProps) {
  return (
    <section className="flex flex-col h-full space-y-4">
      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <div>
          <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            Recent Activity
          </Typography>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Your latest tests and attempts
          </p>
        </div>
        <Link
          href={FRONTEND_ROUTES.STUDENT_HISTORY}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-white transition-colors hover:text-primary/80 dark:hover:text-white/80"
        >
          <span>View All</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {recentHistory.length > 0 ? (
        <div className="flex-1 space-y-2.5">
          {recentHistory.slice(0, 5).map((item) => {
            const pct =
              item.total_marks > 0
                ? Math.round((item.score / item.total_marks) * 100)
                : 0;

            const isPassed = pct >= 50;

            return (
              <Link
                key={item.id}
                href={FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(item.id)}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card p-3.5 shadow-xs transition-all hover:border-primary/30 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                    <HistorySVG className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground group-hover:text-primary dark:group-hover:text-white transition-colors">
                      {item.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.paper_type || "Practice Paper"} ·{" "}
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black tabular-nums border",
                      isPassed
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
                    )}
                  >
                    {pct}%
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center shadow-2xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <HistorySVG className="size-7" />
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">No recent activity</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground font-medium">
            Attempt a theory paper, challenge or quiz to track your history here.
          </p>
        </div>
      )}
    </section>
  );
}
