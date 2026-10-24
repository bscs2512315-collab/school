"use client";

import { Calendar, ChevronRight } from "lucide-react";
import type { ReviewExamAttempt } from "@/types/past-paper";
import { cn, formatCapitalizeWords, formatEmail } from "@/lib/utils";

interface ReviewExamCardProps {
  attempt: ReviewExamAttempt;
  onClick: () => void;
}

type ReviewExamCardTone = "primary" | "warning" | "danger";

function ReviewExamCardBackground({ tone }: { tone: ReviewExamCardTone }) {
  const gradientClass = cn("absolute inset-0 bg-linear-to-br", {
    "from-primary via-primary/95 to-primary-dark": tone === "primary",
    "from-rank-1 via-rank-1/95 to-rank-1-dark": tone === "warning",
    "from-error via-error/90 to-error-dark": tone === "danger",
  });

  const glowClass = cn("absolute bottom-[-10%] left-[-10%] size-[60%] rounded-full blur-[60px] transition-colors duration-700", {
    "bg-primary-light/20 group-hover:bg-primary-light/30": tone === "primary",
    "bg-rank-1/30 group-hover:bg-rank-1/40": tone === "warning",
    "bg-error/30 group-hover:bg-error/40": tone === "danger",
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={gradientClass} />
      <div className="absolute top-[-20%] right-[-10%] size-[80%] rounded-full bg-background/10 blur-[80px] transition-colors duration-700 group-hover:bg-background/15" />
      <div className={glowClass} />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}

function getActionButtonClass(tone: ReviewExamCardTone): string {
  return cn(
    "inline-flex w-full items-center justify-center gap-1 rounded-full border px-2.5 py-2 text-[9px] font-bold uppercase tracking-widest shadow-sm transition-all",
    {
      "border-background bg-primary-dark text-primary-foreground group-hover:bg-sidebar-to": tone === "primary",
      "border-background/80 bg-rank-1-dark text-background group-hover:bg-rank-1": tone === "warning",
      "border-background/80 bg-error text-error-foreground group-hover:opacity-90": tone === "danger",
    },
  );
}

export default function ReviewExamCard({ attempt, onClick }: ReviewExamCardProps) {
  const isManualPending = attempt.grading_status === "pending_manual";
  const isNovaPending = attempt.grading_status === "pending";
  const isFailed = attempt.grading_status === "failed";
  const isGraded = attempt.grading_status === "graded";
  const score = isGraded ? (attempt.score ?? 0) : 0;
  const totalMarks = attempt.total_marks ?? 0;
  const percentage =
    isGraded && totalMarks > 0 ? Math.round((score / totalMarks) * 100) : null;
  const cardTone: ReviewExamCardTone =
    percentage === null ? "primary" : percentage < 50 ? "danger" : percentage < 70 ? "warning" : "primary";
  const submittedDate = new Date(attempt.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const studentName = formatCapitalizeWords(attempt.student_name) || "Unknown Student";
  const studentEmail = formatEmail(attempt.student_email);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl text-left transition-all duration-500 hover:shadow-md"
    >
      <ReviewExamCardBackground tone={cardTone} />

      <div className="pointer-events-none absolute top-2.5 right-2.5 z-0 select-none">
        <span className="text-xl font-black tracking-tighter text-background/10 sm:text-2xl">
          {percentage !== null ? `${percentage}%` : "II"}
        </span>
      </div>

      <div className="relative z-10 flex h-full flex-col gap-1 p-3 sm:p-3.5">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-background/10 px-2 py-0.5 shadow-sm backdrop-blur-md">
          <div className="size-1.5 animate-pulse rounded-full bg-background" />
          <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-background">
            Paper II Submission
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-bold leading-none text-background sm:text-base">
            {studentName}
          </span>
          <span className="truncate text-[10px] font-medium leading-none text-background/80 sm:text-xs lowercase">
            {studentEmail || "no email"}
          </span>
        </div>

        <span className="flex w-full items-center justify-between rounded-md border border-white/20 bg-background/15 px-2 py-0.5 text-xs font-bold text-background backdrop-blur-md">
          <span className="truncate">{attempt.subject}</span>
          {totalMarks > 0 ? (
            <span className="shrink-0 text-background/80">{score}/{totalMarks}</span>
          ) : null}
        </span>

        <div className="rounded-lg border border-white/20 bg-background/10 px-2 py-1 backdrop-blur-md">
          <div className="flex items-center gap-1 text-background/60">
            <Calendar className="size-2.5 shrink-0" />
            <span className="text-[7px] font-bold uppercase tracking-widest">Submitted</span>
            <span className="text-[10px] font-bold text-background">{submittedDate}</span>
          </div>
        </div>

        <div className="mt-auto border-t border-white/10 pt-2">
          <span className={getActionButtonClass(cardTone)}>
            <span>
              {isManualPending
                ? "Grade Now"
                : isNovaPending
                  ? "Nova Grading"
                  : isFailed
                    ? "Grading Failed"
                    : "View Result"}
            </span>
            <ChevronRight className="size-3 shrink-0" />
          </span>
        </div>
      </div>
    </button>
  );
}
