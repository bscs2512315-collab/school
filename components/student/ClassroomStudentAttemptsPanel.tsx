"use client";

import { useRouter } from "next/navigation";
import {
  Loader2,
} from "lucide-react";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { parsePaperDifficulty } from "@/lib/paper/difficulty";
import { parsePaperVariant } from "@/lib/paper/variant-parser";
import { GradingStatus } from "@/types/enums";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { queryKeys } from "@/lib/api/query-keys";

interface StudentAttemptRow {
  attemptId: string;
  paperId: string;
  paperTitle: string;
  paperType: string;
  subject?: string;
  classLevel?: string;
  board?: string;
  totalQuestions: number;
  score: number;
  totalMarks: number;
  gradingStatus: string;
  submittedAt: string;
  percentage: number | null;
  attemptNumber: number;
}

interface Props {
  classroomId: string;
}

function statusMeta(status: string, paperType: string) {
  const isPaper1 = String(paperType).includes("1");
  switch (status) {
    case GradingStatus.PENDING_AI:
      return {
        label: "AI grading",
        className: "bg-primary/10 text-primary",
        icon: Loader2,
        spin: true,
      };
    case GradingStatus.AWAITING_APPROVAL:
      return {
        label: "Awaiting teacher",
        className: "bg-rank-2/10 text-rank-2",
        icon: NovaSVG,
        spin: false,
      };
    case GradingStatus.PENDING_MANUAL:
      return {
        label: "Pending",
        className: "bg-muted text-muted-foreground",
        icon: ClockSVG,
        spin: false,
      };
    case GradingStatus.FAILED:
      return {
        label: "Grading failed",
        className: "bg-destructive/10 text-destructive",
        icon: ClockSVG,
        spin: false,
      };
    case GradingStatus.GRADED:
      return {
        label: isPaper1 ? "Auto-graded" : "Approved",
        className: "bg-primary/10 text-primary",
        icon: CheckCircleSVG,
        spin: false,
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground",
        icon: ClockSVG,
        spin: false,
      };
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClassroomStudentAttemptsPanel({ classroomId }: Props) {
  const router = useRouter();
  const attemptsQuery = useApiQuery<{ attempts: StudentAttemptRow[] }>({
    queryKey: queryKeys.student.classroomAttempts(classroomId),
    queryFn: () =>
      apiGet<{ attempts: StudentAttemptRow[] }>(
        API_ENDPOINTS.STUDENT.CLASSROOM_ATTEMPTS(classroomId),
      ),
    refetchInterval: 5000,
  });
  const attempts = attemptsQuery.data?.attempts ?? [];

  if (attemptsQuery.isPending) {
    return <AppLoader className="min-h-[350px] w-full flex-1" />;
  }

  if (attemptsQuery.isError) {
    return (
      <AppState
        variant="error"
        description="Could not load your classroom attempts."
        action={{
          label: "Try again",
          onClick: () => void attemptsQuery.refetch(),
        }}
        fullScreen={false}
      />
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-12">
        <AppState
          isEmpty
          title="No attempts yet"
          description="When you start a Practice Test from Assigned, it will show up here so you can reattempt anytime."
          icon={ClockSVG}
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attempts.map((attempt) => {
        const meta = statusMeta(attempt.gradingStatus, attempt.paperType);
        const StatusIcon = meta.icon;
        const isGraded = attempt.gradingStatus === GradingStatus.GRADED;
        const isPaper2 = String(attempt.paperType).includes("2");
        const diff = parsePaperDifficulty(attempt.paperTitle);

        return (
          <div
            key={attempt.attemptId}
            className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold text-foreground">
                  {parsePaperVariant(diff.cleanTitle || attempt.paperTitle).baseTitle ||
                    diff.cleanTitle ||
                    attempt.paperTitle}
                </p>
                {diff.isTiered && (
                  <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                    ● {diff.badgeLabel}
                  </span>
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    meta.className,
                  )}
                >
                  <StatusIcon
                    className={cn("size-3", { "animate-spin": meta.spin })}
                  />
                  {meta.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Paper {isPaper2 ? "2" : "1"}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Attempt {attempt.attemptNumber}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Submitted · {formatDate(attempt.submittedAt)}
              </p>
            </div>

            {isGraded ? (
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-base font-bold text-foreground">
                  {attempt.score}/{attempt.totalMarks}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {attempt.percentage ?? 0}%
                </p>
              </div>
            ) : null}

            <div className="flex shrink-0 flex-wrap gap-2">
              {isGraded ? (
                <AppButton
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full px-4 text-xs font-semibold"
                  onClick={() =>
                    router.push(
                      FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(attempt.attemptId),
                    )
                  }
                >
                  View result
                </AppButton>
              ) : null}
              <AppButton
                type="button"
                className="h-10 rounded-full px-4 text-xs font-semibold"
                onClick={() =>
                  router.push(
                    FRONTEND_ROUTES.STUDENT_TEACHER_PAPER_ATTEMPT(
                      attempt.paperId,
                    ),
                  )
                }
              >
                <RefreshSVG className="size-4" />
                Reattempt
              </AppButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
