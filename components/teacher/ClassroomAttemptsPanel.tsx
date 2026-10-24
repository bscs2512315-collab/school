"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import TrophySVG from "@/public/svgs/TrophySVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import UserAvatar from "@/components/UserAvatar";
import AppState from "@/components/AppState";
import AppLoader from "@/components/AppLoader";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { parsePaperDifficulty } from "@/lib/paper/difficulty";
import { GradingStatus } from "@/types/enums";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { queryKeys } from "@/lib/api/query-keys";

interface ClassroomAttemptRow {
  id: string;
  studentId: string;
  studentName: string;
  studentImage: string | null;
  paperId: string;
  paperTitle: string;
  paperType: string;
  score: number;
  totalMarks: number;
  gradingStatus: string;
  submittedAt: string;
  percentage: number | null;
  attemptNumber?: number;
}

interface Props {
  classroomId: string;
  mode: "attempted" | "result";
}

function statusMeta(status: string, paperType?: string) {
  const isPaper1 = String(paperType || "").includes("1");
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
        label: "Needs review",
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
        label: "AI failed",
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

export default function ClassroomAttemptsPanel({ classroomId, mode }: Props) {
  const router = useRouter();
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const attemptsQuery = useApiQuery<{ attempts: ClassroomAttemptRow[] }>({
    queryKey: queryKeys.teacher.classroomAttempts(classroomId, mode),
    queryFn: () =>
      apiGet<{ attempts: ClassroomAttemptRow[] }>(
        `${API_ENDPOINTS.TEACHER.CLASSROOM_ATTEMPTS(classroomId)}?tab=${mode}`,
      ),
    refetchInterval: mode === "attempted" ? 5000 : false,
  });
  const attempts = attemptsQuery.data?.attempts ?? [];

  const handleRetryGrading = useCallback(async (attemptId: string) => {
    setRetryingIds((prev) => new Set(prev).add(attemptId));
    try {
      await apiPost(
        API_ENDPOINTS.STUDENT.ATTEMPT_PAPER2_GRADE,
        { attemptId },
      );
    } catch {
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(attemptId);
        return next;
      });
    }
    void attemptsQuery.refetch();
  }, [attemptsQuery]);

  if (attemptsQuery.isPending) {
    return <AppLoader className="min-h-[350px] w-full flex-1" />;
  }

  if (attemptsQuery.isError) {
    return (
      <AppState
        variant="error"
        description="Could not load classroom attempts."
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
      <div className="flex min-h-[440px] sm:min-h-[500px] w-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 sm:p-12">
        <AppState
          isEmpty
          title={mode === "result" ? "No approved results yet" : "No attempts yet"}
          description={
            mode === "result"
              ? "When you approve AI-graded Paper 2 submissions, they appear here."
              : "Student submissions show here while Nova grades and while waiting for your review."
          }
          icon={mode === "result" ? TrophySVG : ClockSVG}
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
        const canOpen =
          attempt.gradingStatus === GradingStatus.AWAITING_APPROVAL ||
          attempt.gradingStatus === GradingStatus.GRADED ||
          attempt.gradingStatus === GradingStatus.FAILED ||
          attempt.gradingStatus === GradingStatus.PENDING_MANUAL;

        return (
          <button
            key={attempt.id}
            type="button"
            disabled={!canOpen}
            onClick={() => {
              if (!canOpen) return;
              router.push(
                FRONTEND_ROUTES.TEACHER_CLASSROOM_ATTEMPT(
                  classroomId,
                  attempt.id,
                ),
              );
            }}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border border-border/50 bg-card p-4 text-left shadow-sm transition-all sm:items-center sm:p-5",
              {
                "hover:border-primary/30 hover:shadow-md": canOpen,
                "cursor-default opacity-80": !canOpen,
              },
            )}
          >
            <UserAvatar
              src={attempt.studentImage}
              name={attempt.studentName}
              id={attempt.studentId}
              size={44}
              className="size-11 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold text-foreground">
                  {attempt.studentName}
                </p>
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
                {(attempt.attemptNumber ?? 1) > 1 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Attempt {attempt.attemptNumber}
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {(() => {
                  const diff = parsePaperDifficulty(attempt.paperTitle);
                  return (
                    <>
                      {diff.isTiered && (
                        <span className="rounded-full bg-primary/15 text-primary px-2 py-0.2 text-[10px] font-black uppercase tracking-wider">
                          ● {diff.badgeLabel}
                        </span>
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        {diff.cleanTitle || attempt.paperTitle}
                      </p>
                    </>
                  );
                })()}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatDate(attempt.submittedAt)}
              </p>
            </div>

            {attempt.gradingStatus === GradingStatus.AWAITING_APPROVAL ||
            attempt.gradingStatus === GradingStatus.GRADED ? (
              <div className="shrink-0 text-right">
                <p className="text-base font-bold text-foreground">
                  {attempt.score}/{attempt.totalMarks}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {attempt.percentage ?? 0}%
                </p>
              </div>
            ) : attempt.gradingStatus === GradingStatus.PENDING_AI ||
              attempt.gradingStatus === GradingStatus.FAILED ? (
              <div className="shrink-0 self-center">
                <button
                  type="button"
                  disabled={retryingIds.has(attempt.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleRetryGrading(attempt.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 active:scale-95",
                    retryingIds.has(attempt.id) && "pointer-events-none animate-pulse opacity-70",
                  )}
                >
                  {retryingIds.has(attempt.id) ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-3" />
                  )}
                  {attempt.gradingStatus === GradingStatus.FAILED ? "Regrade" : "Retry"}
                </button>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
