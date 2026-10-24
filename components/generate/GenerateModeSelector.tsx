"use client";

import React from "react";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import { cn } from "@/lib/utils";

import type { GenerateMode } from "@/types/generate";

export type { GenerateMode };

interface GenerateModeSelectorProps {
  mode: GenerateMode;
  onChange: (mode: GenerateMode) => void;
  disabled?: boolean;
  showLightning?: boolean;
  label?: string;
  board?: string | null;
}

const BASE_MODES = [
  {
    id: "past_papers" as const,
    title: "Past Papers",
    badge: "Official Bank",
    description: "Official questions from past board examination papers.",
    icon: BookOpenSVG,
  },
  {
    id: "slos" as const,
    title: "SLO's",
    badge: "AI Aligned · 25 Qs",
    description: "Original questions synthesized directly from chapter syllabus SLOs.",
    icon: BookOpenSVG,
  },
  {
    id: "custom" as const,
    title: "Custom",
    badge: "AI / Manual · 25 Qs",
    description: "Generate from uploaded notes, AI prompt, or build manually.",
    icon: GenerateSVG,
  },
  {
    id: "lightning" as const,
    title: "Lightning Round",
    badge: " Multiplayer Challenge",
    description: "Live competitive classroom arena with speed scoring & streaks.",
    icon: ChallengeSVG,
  },
];

export default function GenerateModeSelector({
  mode,
  onChange,
  disabled = false,
  showLightning = true,
  label = "Select Generation Mode",
  board,
}: GenerateModeSelectorProps) {
  const isSindh =
    (board || "").toLowerCase().includes("sindh") ||
    (board || "").toLowerCase().includes("karachi");

  const modesList = BASE_MODES.map((m) => {
    if (m.id === "slos" && isSindh) {
      return {
        ...m,
        title: "Syllabus",
        description: "Original questions synthesized directly from chapter syllabus topics.",
      };
    }
    return m;
  });

  const modes = showLightning ? modesList : modesList.filter((m) => m.id !== "lightning");

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </label>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          showLightning ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
        )}
      >
        {modes.map((item) => {
          const isSelected = mode === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.id)}
              className={cn(
                "group relative flex min-h-[175px] flex-col justify-between rounded-2xl border-2 p-4 sm:p-5 text-left transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md",
                isSelected
                  ? "border-primary bg-card shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-card/90 dark:border-border dark:bg-card/40",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {/* Primary Background Glow when Selected */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent opacity-0 transition-opacity duration-300",
                  isSelected && "opacity-100",
                )}
              />

              <div className="relative z-10 flex w-full items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-primary/10 text-primary dark:bg-muted dark:text-foreground group-hover:bg-primary/15 dark:group-hover:bg-muted/80",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight text-foreground sm:text-base">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <div className="flex size-5.5 shrink-0 items-center justify-center rounded-full transition-all">
                  {isSelected ? (
                    <div className="flex size-5.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20">
                      <svg
                        className="size-3.5 stroke-[3]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="size-5 rounded-full border-2 border-slate-300 dark:border-zinc-600 transition-colors group-hover:border-primary/60" />
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-3 space-y-2">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <div className="pt-0.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider transition-colors",
                      isSelected
                        ? "border-primary/30 bg-primary/15 text-primary"
                        : "border-border/60 bg-muted/60 text-muted-foreground dark:border-border/80 dark:bg-muted/40",
                    )}
                  >
                    {item.badge}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
