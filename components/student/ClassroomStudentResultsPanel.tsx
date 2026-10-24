"use client";

import { useRouter } from "next/navigation";
import TrophySVG from "@/public/svgs/TrophySVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { parsePaperVariant } from "@/lib/paper/variant-parser";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { queryKeys } from "@/lib/api/query-keys";

interface StudentResultRow {
  id: string;
  paperId: string;
  paperTitle: string;
  paperType: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
  attemptNumber: number;
}

interface Props {
  classroomId: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClassroomStudentResultsPanel({ classroomId }: Props) {
  const router = useRouter();
  const resultsQuery = useApiQuery<{ results: StudentResultRow[] }>({
    queryKey: queryKeys.student.classroomResults(classroomId),
    queryFn: () =>
      apiGet<{ results: StudentResultRow[] }>(
        API_ENDPOINTS.STUDENT.CLASSROOM_RESULTS(classroomId),
      ),
    refetchInterval: 5000,
  });
  const results = resultsQuery.data?.results ?? [];

  if (resultsQuery.isPending) {
    return <AppLoader className="min-h-[350px] w-full flex-1" />;
  }

  if (resultsQuery.isError) {
    return (
      <AppState
        variant="error"
        description="Could not load your classroom results."
        action={{
          label: "Try again",
          onClick: () => void resultsQuery.refetch(),
        }}
        fullScreen={false}
      />
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-12">
        <AppState
          isEmpty
          title="No results yet"
          description="Paper 1 scores appear here right after you submit. Paper 2 appears after your teacher approves."
          icon={TrophySVG}
          fullScreen={false}
          action={{
            label: "Open history",
            onClick: () => router.push(FRONTEND_ROUTES.STUDENT_HISTORY),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => {
        const isPaper1 = String(result.paperType).includes("1");
        return (
          <button
            key={result.id}
            type="button"
            onClick={() =>
              router.push(FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(result.id))
            }
            className="flex w-full items-start gap-3 rounded-2xl border border-border/50 bg-card p-4 text-left shadow-sm sm:items-center sm:p-5"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
              <CheckCircleSVG className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold text-foreground">
                  {parsePaperVariant(result.paperTitle).baseTitle || result.paperTitle}
                </p>
                <span
                  className={cn(
                    "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-primary dark:bg-muted dark:text-foreground",
                  )}
                >
                  {isPaper1 ? "Auto-graded" : "Approved"}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Attempt {result.attemptNumber}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatDate(result.submittedAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-base font-bold text-foreground">
                {result.score}/{result.totalMarks}
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {result.percentage}%
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
