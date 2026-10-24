"use client";

import Image from "next/image";
import { useEffect } from "react";
import AppButton from "@/components/AppButton";
import { cn } from "@/lib/utils";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import { usePageTitle } from "@/components/layout/PageTitleContext";
import SparklesSVG from "@/public/svgs/SparklesSVG";

interface GeneratePendingScreenProps {
  subject: string;
  classLevel?: string;
  year?: number | string;
  board?: string;
  paperNumber?: number;
  onReattempt: () => void;
  onDashboard?: () => void;
  onBack?: () => void;
  /** Classroom Practice Tests wait for teacher approval after AI grades */
  awaitingTeacherApproval?: boolean;
}

export default function GeneratePendingScreen({
  subject,
  classLevel,
  year,
  board,
  paperNumber = 2,
  onReattempt,
  onDashboard,
  onBack,
  awaitingTeacherApproval = false,
}: GeneratePendingScreenProps) {
  const handleBack = onBack || onDashboard;
  const setHeaderBack = usePageTitle()?.setHeaderBack;
  useEffect(() => {
    setHeaderBack?.(handleBack ?? null);
    return () => setHeaderBack?.(null);
  }, [handleBack, setHeaderBack]);

  const steps = awaitingTeacherApproval
    ? [
        {
          label: "Answers uploaded securely",
          description: "Every question image reached our servers.",
          icon: CheckCircleSVG,
          done: true,
        },
        {
          label: "Nova is grading your answers",
          description: "Marks are compared against exemplar responses.",
          icon: NovaSVG,
          done: false,
        },
        {
          label: "Teacher reviews and approves",
          description: "Your teacher can adjust marks before release.",
          icon: ReviewExamsSVG,
          done: false,
        },
      ]
    : [
        {
          label: "Answers uploaded securely",
          description: "Every question image reached our servers.",
          icon: CheckCircleSVG,
          done: true,
        },
        {
          label: "Nova is grading your answers",
          description: "Marks are compared against exemplar responses.",
          icon: NovaSVG,
          done: false,
        },
        {
          label: "Result lands in your history",
          description: "You will get an email once the report is ready.",
          icon: ClockSVG,
          done: false,
        },
      ];

  const speechMessage = awaitingTeacherApproval
    ? `Nova is grading your ${subject} Paper II. Your teacher approves the marks before your final result is released.`
    : `Nova is grading your ${subject} Paper II answers. Your scorecard appears in history as soon as grading finishes.`;

  return (
    <div className="flex w-full flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 sm:gap-6">
      {/* Hero Card */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="relative overflow-hidden bg-primary px-4 pt-5 pb-0 sm:px-6 sm:pt-6 sm:pb-0 md:px-7 md:pt-7 md:pb-0 text-primary-foreground">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />

          {/* Mobile Nova Speech Bubble (< md) */}
          <div className="relative z-10 mb-3 w-full rounded-2xl border border-primary-foreground/25 bg-primary-foreground/15 p-2.5 sm:p-3 text-left shadow-xs backdrop-blur-md md:hidden">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/90">
              <SparklesSVG className="size-3 text-amber-300 shrink-0" />
              <span className="shrink-0">Nova AI Tutor</span>
              <span className="text-primary-foreground/60">•</span>
              <span className="truncate text-amber-200">
                {awaitingTeacherApproval ? "Awaiting Approval" : "Grading In Progress"}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium leading-snug text-primary-foreground">
              &ldquo;{speechMessage}&rdquo;
            </p>
          </div>

          {/* Main Content: Info + Desktop Speech Bubble + Nova Mascot */}
          <div className="relative z-10 flex items-end justify-between gap-4 md:gap-6">
            {/* Details Section */}
            <div className="shrink-0 pb-2.5 text-left sm:pb-3 md:pb-3.5">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/25 bg-primary-foreground/15 px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs backdrop-blur-sm">
                <ClockSVG className="size-3.5 sm:size-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  {awaitingTeacherApproval ? "Awaiting Approval" : "Grading In Progress"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-primary-foreground">
                Paper II submitted
              </h1>

              <div className="mt-2 sm:mt-2.5">
                <p className="text-sm sm:text-base font-bold tracking-tight text-primary-foreground">
                  {subject}
                </p>
                <p className="mt-0.5 text-xs sm:text-sm font-medium text-primary-foreground/80">
                  {classLevel ? `Class ${classLevel} • ` : ""}
                  {year ? `Year ${year} • ` : ""}
                  {board ? `${board} • ` : ""}
                  Paper {paperNumber}
                </p>
              </div>
            </div>

            {/* Desktop Nova Speech Bubble */}
            <div className="hidden md:flex flex-1 min-w-0 my-auto self-center flex-col rounded-2xl border border-primary-foreground/25 bg-primary-foreground/15 p-3.5 lg:p-4 text-left shadow-xs backdrop-blur-md">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground/90">
                <SparklesSVG className="size-3.5 text-amber-300 shrink-0" />
                <span className="shrink-0">Nova AI Tutor</span>
                <span className="text-primary-foreground/60">•</span>
                <span className="truncate text-amber-200">
                  {awaitingTeacherApproval ? "Awaiting Approval" : "Grading In Progress"}
                </span>
              </div>
              <p className="text-xs lg:text-sm font-medium leading-relaxed text-primary-foreground">
                &ldquo;{speechMessage}&rdquo;
              </p>
            </div>

            {/* Nova Mascot */}
            <div className="relative -mb-px flex h-36 w-28 shrink-0 items-end justify-center self-end sm:h-40 sm:w-32 md:h-48 md:w-40 lg:h-52 lg:w-44">
              <Image
                src="/nova-tutor.webp"
                alt="Nova AI Tutor"
                fill
                priority
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 176px, 192px"
                className="object-contain object-bottom drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Steps Tracker */}
        <div className="divide-y divide-border bg-card">
          {steps.map((step) => (
            <div key={step.label} className="flex items-start gap-3 p-4 sm:p-5">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  {
                     "bg-primary/10 text-primary dark:bg-muted dark:text-foreground": step.done,
                    "bg-muted text-muted-foreground": !step.done,
                  },
                )}
              >
                <step.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn("break-words text-sm font-bold", {
                    "text-foreground": step.done,
                    "text-muted-foreground": !step.done,
                  })}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 break-words text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-row items-center gap-3">
        <AppButton
          type="button"
          onClick={onReattempt}
          className="h-11 sm:h-12 flex-1 rounded-xl sm:rounded-2xl font-semibold"
        >
          <RefreshSVG className="mr-2 size-4" />
          <span>Re Attempt</span>
        </AppButton>
      </div>
    </div>
  );
}
