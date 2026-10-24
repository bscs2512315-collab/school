"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn } from "@/lib/utils";

export interface GradingQueueSummaryData {
  pendingManual: number;
  pendingAI: number;
  graded: number;
  failed: number;
  total: number;
}

interface GradingQueueSummaryProps {
  data: GradingQueueSummaryData;
}

function QueueStatusCard({
  label,
  value,
  subtitle,
  icon,
  watermarkIcon,
  badge,
  href,
  gradientClass,
  borderClass,
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  watermarkIcon: ReactNode;
  badge?: string;
  href?: string;
  gradientClass: string;
  borderClass: string;
}) {
  const content = (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer min-w-[130px]",
        gradientClass,
        borderClass,
      )}
    >
      {/* Ambient Background & Watermark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
        <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="pointer-events-none absolute -bottom-2 -right-2 opacity-15 transition-transform duration-500 group-hover:scale-110">
          {watermarkIcon}
        </div>
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1 drop-shadow-2xs">
            {icon}
            {label}
          </span>
          {badge && (
            <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
              {badge}
            </span>
          )}
        </div>

        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
            {value.toLocaleString()}
          </span>
        </div>

        <span className="text-[11px] text-white/85 font-semibold mt-1 truncate">
          {subtitle}
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function GradingQueueSummary({ data }: GradingQueueSummaryProps) {
  const pendingTotal = data.pendingManual + data.pendingAI;

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* 4 Status Cards matching Coverage Cards Aesthetic */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        <QueueStatusCard
          label="Manual Review"
          subtitle="Teacher scoring"
          value={data.pendingManual}
          badge="Awaiting"
          href={FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS}
          gradientClass="bg-linear-to-br from-[#f59e0b] via-[#d97706] to-[#b45309]"
          borderClass="border-amber-300/30"
          icon={<ClockSVG className="size-3.5 text-white" />}
          watermarkIcon={<ClockSVG className="size-18 sm:size-20 text-white" />}
        />
        <QueueStatusCard
          label="Nova AI Queue"
          subtitle="Automated checks"
          value={data.pendingAI}
          badge="In-Progress"
          href={FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS}
          gradientClass="bg-linear-to-br from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]"
          borderClass="border-purple-300/30"
          icon={<NovaSVG className="size-3.5 text-white" />}
          watermarkIcon={<NovaSVG className="size-18 sm:size-20 text-white" />}
        />
        <QueueStatusCard
          label="Graded Papers"
          subtitle="Completed results"
          value={data.graded}
          badge="Finished"
          href={FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS}
          gradientClass="bg-linear-to-br from-[#008503] via-[#005f02] to-[#004a02]"
          borderClass="border-primary-light/30"
          icon={<CheckCircleSVG className="size-3.5 text-white" />}
          watermarkIcon={<CheckCircleSVG className="size-18 sm:size-20 text-white" />}
        />
        <QueueStatusCard
          label="Needs Retry"
          subtitle="Failed evaluations"
          value={data.failed}
          badge="Attention"
          href={FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS}
          gradientClass="bg-linear-to-br from-[#ef4444] via-[#dc2626] to-[#b91c1c]"
          borderClass="border-rose-300/30"
          icon={<CloseCircleSVG className="size-3.5 text-white" />}
          watermarkIcon={<CloseCircleSVG className="size-18 sm:size-20 text-white" />}
        />
      </div>

      {/* Summary Strip & Direct Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Submissions Logged
          </p>
          <p className="text-base font-black text-foreground">
            {data.total.toLocaleString()} Exam Papers
          </p>
        </div>

        <Link
          href={FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:brightness-110 shrink-0 cursor-pointer"
        >
          <span>Open Review Queue ({pendingTotal})</span>
          <ArrowRightSVG className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
