"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import PlaySVG from "@/public/svgs/PlaySVG";
import type { ComponentType, SVGProps } from "react";
import LockSVG from "@/public/svgs/LockSVG";
import { cn } from "@/lib/utils";

type LabIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface LabSubjectCardProps {
  title: string;
  description: string;
  href: string;
  icon: LabIcon;
  practicalCount: number;
  ready?: boolean;
  actionLabel?: string;
}

export default function LabSubjectCard({
  title,
  description,
  href,
  icon: Icon,
  practicalCount,
  ready = true,
  actionLabel = "Explore",
}: LabSubjectCardProps) {
  const [isOpening, setIsOpening] = useState(false);
  const content = (
    <div
      className={cn(
        "group relative flex h-full min-h-72 flex-col overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg transition-all duration-500",
        {
          "cursor-pointer hover:-translate-y-1.5 hover:shadow-xl": ready,
          "opacity-70": !ready,
        },
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
        <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
        <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />
        <Icon className="absolute -right-4 -top-2 size-40 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110" />
        <Icon className="absolute -bottom-6 -left-4 size-28 text-primary-foreground/10" />
      </div>

      {!ready ? (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
          <LockSVG className="size-3" /> Soon
        </span>
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm transition-transform duration-500 group-hover:scale-105">
          <Icon className="size-8 text-primary-foreground" />
        </div>

        <h3 className="text-2xl font-black tracking-tight text-primary-foreground">
          {title}
        </h3>

        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
          {practicalCount} {practicalCount === 1 ? "Practical" : "Practicals"}
        </p>

        <p className="mt-3 max-w-xs text-sm leading-snug text-primary-foreground/75">
          {description}
        </p>
      </div>

      {ready ? (
        <div className="relative z-10 mt-5 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
            {isOpening ? <LoaderCircle className="size-3.5 animate-spin" /> : <PlaySVG className="size-3.5" />}
            {isOpening ? "Opening…" : actionLabel}
          </span>
        </div>
      ) : null}
    </div>
  );

  return ready ? (
    <Link href={href} onClick={(event) => {
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setIsOpening(true);
    }} aria-busy={isOpening} className={cn("block h-full", isOpening && "pointer-events-none")}>
      {content}
    </Link>
  ) : (
    <div className="h-full">{content}</div>
  );
}
