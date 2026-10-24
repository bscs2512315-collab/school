"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import type { ComponentType, SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export interface NavigationCard {
  title: string;
  badge?: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>> | LucideIcon;
  href: string;
  isBeta?: boolean;
}

interface QuickAccessProps {
  cards: NavigationCard[];
}

export default function QuickAccess({ cards }: QuickAccessProps) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            Study Tools
          </Typography>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Jump into interactive practice, past papers, syllabus frameworks, and virtual labs
          </p>
        </div>
      </div>

      {/* Mobile Compact 3-Column Button Grid */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:hidden">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <span className="relative flex size-14 items-center justify-center rounded-2xl border border-border/50 bg-primary/10 text-primary shadow-xs transition-all active:scale-95 dark:bg-muted dark:text-foreground">
                <Icon className="size-6 transition-transform duration-200 group-hover:scale-110" />
                {card.isBeta && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[8px] font-black uppercase text-white shadow-xs">
                    Beta
                  </span>
                )}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-foreground truncate max-w-full">
                {card.badge || card.title}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Desktop / Tablet Full Administrative Consoles Grid */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl bg-primary p-4 sm:p-5 text-primary-foreground shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Ambient Lighting & Dual Watermarks */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to opacity-95 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -right-6 -top-8 size-36 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:bg-white/15" />
                <div className="absolute -bottom-8 -left-6 size-32 rounded-full bg-black/20 blur-xl" />

                {/* Ambient watermark icon */}
                <div className="absolute -right-3 -top-1 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="size-28" />
                </div>
              </div>

              {/* Top Row with frosted icon container & badge */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                  <Icon className="size-6 text-white" />
                </div>

                <div className="flex items-center gap-1.5">
                  {card.isBeta && (
                    <span className="rounded-full bg-amber-400/30 border border-amber-300/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200 backdrop-blur-sm">
                      Beta
                    </span>
                  )}
                  {card.badge && (
                    <span className="rounded-full bg-white/15 border border-white/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm shadow-xs">
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Section: Title & Description */}
              <div className="relative z-10 my-3.5 space-y-1">
                <h4 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug drop-shadow-xs">
                  {card.title}
                </h4>
                <p className="text-[11px] sm:text-xs font-medium text-white/80 leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              </div>

              {/* Bottom Row: Explore Pill Button */}
              <div className="relative z-10 flex items-center justify-between pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-primary shadow-xs transition-transform duration-200 group-hover:scale-105">
                  <span>Open</span>
                  <ArrowRight className="size-3" />
                </span>

                <Sparkles className="size-3.5 text-white/40 transition-opacity duration-300 group-hover:text-white/80" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
