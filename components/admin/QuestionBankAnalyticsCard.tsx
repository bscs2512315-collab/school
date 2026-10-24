"use client";

import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import ImageSVG from "@/public/svgs/ImageSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";

export interface QuestionBankAnalyticsData {
  totalQuestions: number;
  paper1Questions: number;
  paper2Questions: number;
  questionsWithImages: number;
}

interface QuestionBankAnalyticsCardProps {
  data: QuestionBankAnalyticsData;
}

export default function QuestionBankAnalyticsCard({
  data,
}: QuestionBankAnalyticsCardProps) {
  const totalQuestions = Number(data?.totalQuestions || 0);
  const paper1Questions = Number(data?.paper1Questions || 0);
  const paper2Questions = Number(data?.paper2Questions || 0);
  const questionsWithImages = Number(data?.questionsWithImages || 0);

  const p1Percent =
    totalQuestions > 0
      ? Math.round((paper1Questions / totalQuestions) * 100)
      : 0;
  const p2Percent =
    totalQuestions > 0
      ? Math.round((paper2Questions / totalQuestions) * 100)
      : 0;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-xs">
      <div>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
          <div>
            <Typography variant="h3" className="text-base font-bold sm:text-lg text-foreground">
              Question Bank Inventory
            </Typography>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              Curated AKUEB & Board repository
            </p>
          </div>

          <Link
            href={FRONTEND_ROUTES.ADMIN_QUESTION_BANK}
            className="group flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary/80"
          >
            <span>Explore Bank</span>
            <ArrowRightSVG className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Total Questions Console Highlight Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-4 sm:p-5 text-primary-foreground shadow-sm">
          {/* Ambient Watermark */}
          <div className="pointer-events-none absolute -right-3 -bottom-3 opacity-10">
            <QuestionBankSVG className="size-28" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/80">
                Total Questions in Bank
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-primary-foreground tracking-tight">
                {totalQuestions.toLocaleString()}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-xs ring-1 ring-white/30 shrink-0">
              <QuestionBankSVG className="size-6 text-white" />
            </div>
          </div>

          {/* Progress Bar Distribution (No Truncation) */}
          <div className="mt-4 space-y-1.5 relative z-10">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-black/25">
              <div
                style={{ width: `${p1Percent}%` }}
                className="bg-primary-foreground/90 transition-all duration-500"
                title={`Paper 1: ${p1Percent}%`}
              />
              <div
                style={{ width: `${p2Percent}%` }}
                className="bg-amber-300 transition-all duration-500"
                title={`Paper 2: ${p2Percent}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-primary-foreground/90">
              <span>Paper 1 ({p1Percent}%)</span>
              <span>Paper 2 ({p2Percent}%)</span>
            </div>
          </div>
        </div>

        {/* Breakdown 3 Mini Cards in Primary Signature Console Style */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* Card 1: Paper 1 MCQs */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-2.5 sm:p-3 text-primary-foreground shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            {/* Ambient Watermark */}
            <div className="pointer-events-none absolute -right-2 -bottom-2 opacity-10 transition-transform duration-300 group-hover:scale-110">
              <P1SVG className="size-14 text-white" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-1.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30 backdrop-blur-md shadow-xs shrink-0">
                <P1SVG className="size-3.5 text-white" />
              </div>
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-white/90">
                {p1Percent}%
              </span>
            </div>

            <div className="relative z-10 mt-2 min-w-0">
              <p className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-xs leading-none">
                {paper1Questions.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-bold text-white/90 leading-tight truncate">
                Paper 1 MCQs
              </p>
            </div>
          </div>

          {/* Card 2: Paper 2 Theory */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-2.5 sm:p-3 text-primary-foreground shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            {/* Ambient Watermark */}
            <div className="pointer-events-none absolute -right-2 -bottom-2 opacity-10 transition-transform duration-300 group-hover:scale-110">
              <P2SVG className="size-14 text-white" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-1.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30 backdrop-blur-md shadow-xs shrink-0">
                <P2SVG className="size-3.5 text-white" />
              </div>
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-white/90">
                {p2Percent}%
              </span>
            </div>

            <div className="relative z-10 mt-2 min-w-0">
              <p className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-xs leading-none">
                {paper2Questions.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-bold text-white/90 leading-tight truncate">
                Paper 2 Theory
              </p>
            </div>
          </div>

          {/* Card 3: With Diagrams */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to p-2.5 sm:p-3 text-primary-foreground shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            {/* Ambient Watermark */}
            <div className="pointer-events-none absolute -right-2 -bottom-2 opacity-10 transition-transform duration-300 group-hover:scale-110">
              <ImageSVG className="size-14 text-white" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-1.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/30 backdrop-blur-md shadow-xs shrink-0">
                <ImageSVG className="size-3.5 text-white" />
              </div>
              <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-white/90">
                Media
              </span>
            </div>

            <div className="relative z-10 mt-2 min-w-0">
              <p className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-xs leading-none">
                {questionsWithImages.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-bold text-white/90 leading-tight truncate">
                With Diagrams
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-4 pt-1">
        <Link
          href={FRONTEND_ROUTES.ADMIN_QUESTION_BANK}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/40 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted hover:text-primary cursor-pointer"
        >
          <QuestionBankSVG className="size-4 text-primary" />
          <span>Curate & Manage Question Bank</span>
        </Link>
      </div>
    </div>
  );
}
