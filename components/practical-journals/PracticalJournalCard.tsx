"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import PhysicsSVG from "@/public/svgs/PhysicsSVG";
import ChemistrySVG from "@/public/svgs/ChemistrySVG";
import BiologySVG from "@/public/svgs/BiologySVG";
import ComputerSVG from "@/public/svgs/ComputerSVG";
import { cn } from "@/lib/utils";
import type { JournalContent, PracticalSubject } from "@/constants/practicalJournals";

const SUBJECT_ICONS: Record<PracticalSubject, React.ComponentType<{ className?: string }>> = {
  physics: PhysicsSVG,
  chemistry: ChemistrySVG,
  biology: BiologySVG,
  "computer-science": ComputerSVG,
};

const SUBJECT_NAMES: Record<PracticalSubject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  "computer-science": "Computer Science",
};

export interface PracticalJournalCardProps {
  journal: JournalContent;
  className?: string;
}

export default function PracticalJournalCard({ journal, className }: PracticalJournalCardProps) {
  const [isOpening, setIsOpening] = useState(false);
  const Icon = SUBJECT_ICONS[journal.subject] || PhysicsSVG;
  const subjectName = SUBJECT_NAMES[journal.subject] || journal.subject;
  const journalHref = `/student/practical-journals/${journal.subject}/${journal.id}`;

  return (
    <div
      className={cn(
        "group relative flex h-full min-h-[250px] flex-col overflow-hidden rounded-3xl bg-primary p-5 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl",
        className
      )}
    >
      {/* Ambient Lighting & Dual Watermark SVGs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
        <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
        <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />
        <Icon className="absolute -right-4 -top-2 size-36 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 sm:size-40" />
        <Icon className="absolute -bottom-6 -left-4 size-24 text-primary-foreground/10 sm:size-28" />
      </div>

      {/* Top Meta Badges */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-primary-foreground/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground ring-1 ring-primary-foreground/20 backdrop-blur-sm">
            Practical {journal.expNo < 10 ? `0${journal.expNo}` : journal.expNo}
          </span>
          <span className="inline-flex items-center rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/90">
            Class {journal.classLevel}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/75">
          {subjectName}
        </span>
      </div>

      {/* Main Body */}
      <div className="relative z-10 my-auto pt-3">
        <h3 className="line-clamp-2 text-base sm:text-lg font-black leading-snug tracking-tight text-primary-foreground">
          {journal.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-primary-foreground/80 sm:text-sm">
          {journal.object}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 mt-5 flex items-center justify-center border-t border-primary-foreground/15 pt-4">
        <Link
          href={journalHref}
          onClick={(event) => {
            if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setIsOpening(true);
          }}
          aria-busy={isOpening}
          className={cn("inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-foreground px-4 py-2.5 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]", isOpening && "pointer-events-none")}
        >
          {isOpening ? <LoaderCircle className="size-3.5 animate-spin" /> : <SyllabusSVG className="size-3.5 text-primary" />}
          <span>{isOpening ? "Opening…" : "Open Journal"}</span>
          {!isOpening && <ArrowRight className="size-3.5" />}
        </Link>
      </div>
    </div>
  );
}
