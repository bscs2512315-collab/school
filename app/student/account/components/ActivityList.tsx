"use client";

import React, { useState } from "react";
import Link from "next/link";
import SearchSVG from "@/public/svgs/SearchSVG";
import CalendarSVG from "@/public/svgs/CalendarSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import AppButton from "@/components/AppButton";
import type { StudentHistoryItem } from "@/types/student";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";

interface ActivityListProps {
  history: StudentHistoryItem[];
}

export default function ActivityList({ history }: ActivityListProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "paper1" | "paper2">("all");

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      !search || (item.subject || "").toLowerCase().includes(search.toLowerCase());
    const isPaper2 = item.paper_type === "paper2";
    const matchesType =
      selectedType === "all" ||
      (selectedType === "paper2" && isPaper2) ||
      (selectedType === "paper1" && !isPaper2);

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchSVG className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-2xl border border-border/70 bg-card pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl border border-border/70 bg-card p-1 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedType("all")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              selectedType === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("paper1")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              selectedType === "paper1"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            MCQs
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("paper2")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
              selectedType === "paper2"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Theory
          </button>
        </div>
      </div>

      {/* Attempts List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item, idx) => {
            const isPaper2 = item.paper_type === "paper2";
            const score = item.score ?? 0;
            const total = item.total_marks || 0;
            const percent = total > 0 ? Math.round((score / total) * 100) : 0;
            const isGraded = item.grading_status === "graded";

            const isHigh = percent >= 75;
            const isMid = percent >= 50 && percent < 75;

            return (
              <div
                key={item.id || idx}
                className="group relative flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105",
                      isPaper2 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary",
                    )}
                  >
                    {isPaper2 ? <P2SVG className="size-6" /> : <P1SVG className="size-6" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-black text-foreground sm:text-base">
                        {item.subject || "General Paper"}
                      </h4>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-black uppercase",
                          isPaper2
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-primary/15 text-primary",
                        )}
                      >
                        {isPaper2 ? "Paper 2 · Theory" : "Paper 1 · MCQs"}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarSVG className="size-3.5 text-primary" />
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {item.time_taken ? (
                        <span className="flex items-center gap-1">
                          <ClockSVG className="size-3.5 text-primary" />
                          {Math.round(item.time_taken / 60)} min
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Score and Status */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3 sm:border-0 sm:pt-0 sm:justify-end sm:gap-5">
                  <div className="text-left sm:text-right">
                    {isGraded ? (
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-foreground sm:text-xl">{score}</span>
                          <span className="text-xs font-bold text-muted-foreground">/ {total}</span>
                        </div>
                        <span
                          className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-black", {
                            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300": isHigh,
                            "bg-amber-500/15 text-amber-700 dark:text-amber-300": isMid,
                            "bg-rose-500/15 text-rose-700 dark:text-rose-300": !isHigh && !isMid,
                          })}
                        >
                          {percent}% Accuracy
                        </span>
                      </div>
                    ) : (
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                        Pending Grade
                      </span>
                    )}
                  </div>

                  <Link href="/student/history">
                    <button
                      type="button"
                      className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    >
                      <ArrowRightSVG className="size-4" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mb-3 text-muted-foreground">
            <ClockSVG className="size-6" />
          </div>
          <h4 className="text-base font-bold text-foreground">No Practice Records Found</h4>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {search
              ? "No examination attempts match your search keyword."
              : "You haven't attempted any papers yet. Start with Past Papers or Play & Prep!"}
          </p>
          <div className="mt-5 flex gap-3">
            <Link href="/student/past-papers-1">
              <AppButton className="rounded-xl px-4 py-2 font-bold shadow-sm gap-1.5">
                <span>Start Past Paper 1</span>
                <ArrowRightSVG className="size-3.5" />
              </AppButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
