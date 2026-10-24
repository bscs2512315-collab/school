"use client";

import React from "react";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import ZapSVG from "@/public/svgs/ZapSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import { cn } from "@/lib/utils";

export type ChallengeType = "normal" | "lightning";

interface ChallengeTypeSelectorProps {
  selectedType: ChallengeType | null;
  onSelectType: (type: ChallengeType) => void;
  onBack?: () => void;
}

interface ChallengeOption {
  id: ChallengeType;
  title: string;
  badge: string;
  badgeVariant: "default" | "amber";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const CHALLENGE_OPTIONS: ChallengeOption[] = [
  {
    id: "normal",
    title: "Blitz Arena",
    badge: "Async Match",
    badgeVariant: "default",
    description: "Challenge friends or classmates. Each player completes the quiz at their own pace and the winner takes the glory.",
    icon: ChallengeSVG,
    features: [
      "Send direct invites to classmates",
      "Flexible timer & async completion",
      "Head-to-head score comparison & review",
    ],
  },
  {
    id: "lightning",
    title: "Lightning Round Arena",
    badge: "Live Real-Time",
    badgeVariant: "amber",
    description: "Host an energetic live arena with a 6-digit Game PIN. Everyone answers each question together before the timer runs out!",
    icon: ZapSVG,
    features: [
      "Live synchronized timer (15s - 60s per question)",
      "Speed bonus points & streak multipliers",
      "Instant live podium & class leaderboard",
    ],
  },
];

export default function ChallengeTypeSelector({
  selectedType,
  onSelectType,
  onBack,
}: ChallengeTypeSelectorProps) {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Inline Back Navigation */}
      <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="group flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 cursor-pointer"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeftSVG className="size-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary dark:border-border dark:bg-muted dark:text-white">
                Multiplayer Match
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                Step 2 of 3
              </span>
            </div>
            <h2 className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
              Choose Challenge Mode
            </h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Pick how you want to compete with your friends
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {CHALLENGE_OPTIONS.map((option) => {
          const isSelected = selectedType === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectType(option.id)}
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
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider backdrop-blur-xs shadow-xs",
                      option.badgeVariant === "amber"
                        ? "bg-amber-400/25 text-amber-200 ring-1 ring-amber-300/40"
                        : "bg-white/20 text-white ring-1 ring-white/30"
                    )}
                  >
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

                {/* Features */}
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
                  Configure Round
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
