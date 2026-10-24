"use client";

import React from "react";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import { cn } from "@/lib/utils";

export type PracticeIntent = "myself" | "challenge";

interface PracticeModeSelectorProps {
  selectedIntent: PracticeIntent | null;
  onSelectIntent: (intent: PracticeIntent) => void;
}

interface IntentOption {
  id: PracticeIntent;
  title: string;
  badge: string;
  badgeVariant: "default" | "primary" | "amber";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: "myself",
    title: "Practice for Myself",
    badge: "Solo Study",
    badgeVariant: "primary",
    description: "Generate tailored board exams, chapter quizzes, or AI practice papers to solve on your own.",
    icon: BookOpenSVG,
    features: ["MCQs & Theory (Paper 1 & 2)", "Instant AI Marking", "Past Papers & SLOs"],
  },
  {
    id: "challenge",
    title: "Challenge Friends",
    badge: "Multiplayer",
    badgeVariant: "default",
    description: "Compete 1v1 with classmates or host an exhilarating real-time speed Lightning Round arena.",
    icon: ChallengeSVG,
    features: ["Blitz Arena Matches", "Live Lightning Speed Arena", "Earn Streak & Leaderboard Points"],
  },
];

export default function PracticeModeSelector({
  selectedIntent,
  onSelectIntent,
}: PracticeModeSelectorProps) {
  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground dark:text-white sm:text-2xl">
          What would you like to do?
        </h2>
        <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300 sm:text-sm">
          Select an option below to start practicing or challenge other students
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {INTENT_OPTIONS.map((option) => {
          const isSelected = selectedIntent === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectIntent(option.id)}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-primary p-6 sm:p-7 text-left text-primary-foreground shadow-lg transition-all duration-300 select-none cursor-pointer active:scale-[0.99]",
                isSelected
                  ? "ring-2 ring-white/90 shadow-2xl scale-[1.01] brightness-105"
                  : "hover:-translate-y-1.5 hover:shadow-2xl hover:brightness-105 ring-1 ring-white/15"
              )}
            >
              {/* Ambient Lighting & Watermark Glows */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
                <div className="absolute -right-8 -top-10 size-48 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
                <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

                <Icon
                  aria-hidden
                  className="pointer-events-none absolute -right-4 -top-2 size-36 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 sm:size-40"
                />
                <Icon
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 -left-4 size-24 text-primary-foreground/10 sm:size-28"
                />
              </div>

              <div className="relative z-10">
                {/* Header: Icon + Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-13 sm:size-14 items-center justify-center rounded-2xl bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105">
                    <Icon className="size-6 sm:size-7 text-primary-foreground" />
                  </div>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-xs ring-1 ring-white/30 shadow-xs">
                    {option.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="mt-5 text-xl sm:text-2xl font-black tracking-tight text-primary-foreground">
                  {option.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-primary-foreground/85">
                  {option.description}
                </p>

                {/* Feature Bullets */}
                <ul className="mt-5 space-y-2 border-t border-white/20 pt-4">
                  {option.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-xs font-semibold text-primary-foreground/90"
                    >
                      <span className="size-1.5 rounded-full bg-white ring-2 ring-white/30 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom CTA Arrow */}
              <div className="relative z-10 mt-6 flex items-center justify-between pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-primary-foreground/90 transition-colors group-hover:text-primary-foreground">
                  Continue
                </span>
                <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
                  <span>Continue</span>
                  <ArrowRightSVG className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

