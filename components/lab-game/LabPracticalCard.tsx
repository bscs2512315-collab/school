"use client";

import Link from "next/link";
import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { LoaderCircle } from "lucide-react";
import LockSVG from "@/public/svgs/LockSVG";
import PlaySVG from "@/public/svgs/PlaySVG";
import { cn } from "@/lib/utils";

interface LabPracticalCardProps {
  index: number;
  title: string;
  objective: string;
  route?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export default function LabPracticalCard({
  index,
  title,
  objective,
  route,
  icon: Icon,
}: LabPracticalCardProps) {
  // Only real game simulations under /student/lab-game/ are playable.
  // Digital journal placeholders are locked until their game ships.
  const ready = Boolean(route && route.startsWith("/student/lab-game/"));
  const [isLaunching, setIsLaunching] = useState(false);

  const inner = (
    <article
      className={cn(
        "group relative flex h-full min-h-60 flex-col overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl sm:p-6",
        { "opacity-75": !ready },
      )}
    >
      {/* Shine sweep on hover */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-primary-foreground/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
      <div className="pointer-events-none absolute -bottom-14 -left-10 size-44 rounded-full bg-primary-foreground/5 blur-3xl" />

      {/* Watermarks */}
      <Icon
        aria-hidden
        className="pointer-events-none absolute -bottom-3 -right-3 size-28 rotate-12 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-0 sm:size-32"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-4 -top-3 select-none text-5xl font-black tracking-tighter text-primary-foreground/10"
      >
        {index}
      </span>

      {/* Centered Hero */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/15 shadow-md ring-1 ring-primary-foreground/25 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 sm:size-16">
          <span className="text-2xl font-black tracking-tight text-primary-foreground sm:text-3xl">
            {index}
          </span>
        </div>

        <h3 className="line-clamp-2 text-lg font-black leading-tight text-primary-foreground">
          {title}
        </h3>
        <p className="mt-1.5 line-clamp-2 max-w-xs text-xs font-medium leading-snug text-primary-foreground/75">
          {objective}
        </p>
      </div>

      {/* Action Pill */}
      <div className="relative z-10 mt-4 flex items-center justify-center">
        <span
          className={cn(
            "relative inline-flex min-w-56 items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest shadow-md transition-transform duration-300 group-hover:scale-105",
            ready
              ? "bg-primary-foreground text-primary"
              : "border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/60",
          )}
        >
          {ready ? (
            isLaunching ? <LoaderCircle className="relative z-10 size-4 animate-spin" /> : <PlaySVG className="relative z-10 size-3.5" />
          ) : (
            <LockSVG className="relative z-10 size-3.5" />
          )}
          <span className="relative z-10">{ready ? (isLaunching ? "Starting Game…" : "Play Now") : "Coming Soon"}</span>
        </span>
      </div>
    </article>
  );

  return ready && route ? (
    <Link href={route} onClick={(event) => {
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setIsLaunching(true);
    }} aria-busy={isLaunching} className={cn("block h-full", isLaunching && "pointer-events-none")}>
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}
