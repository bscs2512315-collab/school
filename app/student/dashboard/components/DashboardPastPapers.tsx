"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import type { PastPaperSummary } from "@/types/past-paper";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";

interface DashboardPastPapersProps {
  pastPapers: PastPaperSummary[];
}

export default function DashboardPastPapers({
  pastPapers,
}: DashboardPastPapersProps) {
  return (
    <section className="flex flex-col h-full space-y-4">
      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <div>
          <Typography className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            Past Papers
          </Typography>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Jump directly into recent exam papers
          </p>
        </div>
        <Link
          href={FRONTEND_ROUTES.STUDENT_PAST_PAPERS_1}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-white transition-colors hover:text-primary/80 dark:hover:text-white/80"
        >
          <span>Browse Papers</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {pastPapers.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 flex-1">
          {pastPapers.slice(0, 4).map((paper) => {
            const isPaper2 = paper.paperNumber === 2;
            const PaperIcon = isPaper2 ? P2SVG : P1SVG;
            return (
              <Link
                key={paper.id}
                href={
                  isPaper2
                    ? FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT_PAPER2(paper.id)
                    : FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT(paper.id)
                }
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-light/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-[#008503] via-[#005f02] to-[#004a02]"
              >
                {/* Ambient Lighting & Duotone Watermark */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                  <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                  <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                  <div
                    className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <PaperIcon
                    aria-hidden
                    className="pointer-events-none absolute -bottom-2 -right-2 size-20 sm:size-24 text-white/15 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                  />
                </div>

                {/* Top Row with frosted icon container & badges */}
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="flex size-10 sm:size-11 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 border border-white/25 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
                    <PaperIcon className="size-5 sm:size-6 text-white" />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                      {isPaper2 ? "Paper 2" : "Paper 1"}
                    </span>
                    {paper.board ? (
                      <span className="rounded-full bg-white/15 border border-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/95 backdrop-blur-md shadow-xs">
                        {paper.board}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Middle Section: Title & Details */}
                <div className="relative z-10 my-3 space-y-0.5">
                  <h4 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug drop-shadow-xs truncate">
                    {paper.subject} · P{paper.paperNumber}
                  </h4>
                  <p className="text-xs font-semibold text-white/85 truncate drop-shadow-2xs">
                    Class {paper.class} · {paper.year}
                    {paper.session ? ` (${paper.session})` : ""}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-2.5">
                  <span className="text-xs font-bold text-white/90">
                    Start Practice
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 border border-white/25 px-3 py-1 text-[11px] font-black text-white backdrop-blur-md transition-all duration-200 group-hover:bg-white group-hover:text-primary shadow-xs">
                    OPEN <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center shadow-2xs">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <P1SVG className="size-7" />
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">No past papers found</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground font-medium">
            Explore past papers to start practicing theory and practical questions.
          </p>
        </div>
      )}
    </section>
  );
}
