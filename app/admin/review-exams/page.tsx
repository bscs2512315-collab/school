"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import { AppPagination } from "@/components/AppPagination";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppQueryState from "@/components/AppQueryState";
import AppState from "@/components/AppState";
import AppTabs from "@/components/AppTabs";
import ReviewExamCard from "@/components/admin/review-exams/ReviewExamCard";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { cn } from "@/lib/utils";
import {
  useAdminReviewExams,
  useAdminSetting,
  useUpdateAdminSetting,
} from "@/hooks/admin/useAdminPastPaperDetail";

const GRADING_MODE_KEY = "PAPER2_GRADING_MODE";

type ReviewExamTab = "pending" | "graded";

function isGradedAttempt(status: string): boolean {
  return status === "graded";
}

export default function ReviewExamsPage() {
  const router = useRouter();
  const gradingModeQuery = useAdminSetting(GRADING_MODE_KEY);
  const updateSettingMutation = useUpdateAdminSetting();

  const [gradingMode, setGradingMode] = useState<"AI" | "MANUAL">("MANUAL");
  const [activeTab, setActiveTab] = useState<ReviewExamTab>("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewExamsQuery = useAdminReviewExams({
    status: activeTab,
    page: currentPage,
    limit: 20,
  });

  useEffect(() => {
    if (gradingModeQuery.data === "AI" || gradingModeQuery.data === "MANUAL") {
      setGradingMode(gradingModeQuery.data);
    }
  }, [gradingModeQuery.data]);

  const handleSelectMode = async (newMode: "AI" | "MANUAL") => {
    if (newMode === gradingMode || updateSettingMutation.isPending) return;

    const previousMode = gradingMode;
    setGradingMode(newMode);

    try {
      await updateSettingMutation.mutateAsync({ key: GRADING_MODE_KEY, value: newMode });
      toast.success(
        newMode === "AI"
          ? "Nova will grade Paper II submissions automatically"
          : `Grading mode set to ${newMode}`,
      );
    } catch {
      toast.error("Error setting mode");
      setGradingMode(previousMode);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Review Exams" showLine={true} />

      <AppQueryState
        query={reviewExamsQuery}
        loadingMessage="Loading review exams..."
        errorMessage="Failed to load review exams."
        onRetry={() => reviewExamsQuery.refetch()}
        fullScreen={false}
      >
        {(data) => {
          const attempts = data.attempts;
          const pagination = data.pagination;
          const counts = data.counts;

          return (
            <>
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ReviewExamsSVG className="size-5 text-primary" />
                      <h2 className="text-lg font-bold text-foreground">Paper II Submissions</h2>
                    </div>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                      When AI is enabled, Nova grades uploaded answers using exemplars from your
                      question bank.
                    </p>
                  </div>

                  <div className="flex w-full flex-col items-stretch gap-3 sm:items-end lg:w-auto">
                    <div className="flex w-full flex-col gap-2 sm:w-auto">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Grading Mode
                      </span>
                      <button
                        type="button"
                        disabled={updateSettingMutation.isPending}
                        onClick={() => void handleSelectMode(gradingMode === "AI" ? "MANUAL" : "AI")}
                        className={cn(
                          "relative flex h-11 w-full items-center rounded-full border px-1.5 transition-colors sm:w-64",
                          {
                            "border-primary bg-primary/10": gradingMode === "AI",
                            "border-border bg-muted/30": gradingMode !== "AI",
                          },
                        )}
                      >
                        <span
                          className={cn(
                            "h-8 w-1/2 rounded-full bg-primary shadow-sm transition-transform",
                            {
                              "translate-x-full": gradingMode === "AI",
                              "translate-x-0": gradingMode !== "AI",
                            },
                          )}
                        />
                        <span className="pointer-events-none absolute inset-x-0 flex items-center justify-between px-5 text-sm font-bold">
                          <span
                            className={cn({
                              "text-primary-foreground": gradingMode !== "AI",
                              "text-muted-foreground": gradingMode === "AI",
                            })}
                          >
                            Manual
                          </span>
                          <span
                            className={cn({
                              "text-primary-foreground": gradingMode === "AI",
                              "text-muted-foreground": gradingMode !== "AI",
                            })}
                          >
                            Nova AI
                          </span>
                        </span>
                      </button>
                    </div>

                    {updateSettingMutation.isPending ? (
                      <div className="flex items-center gap-1.5 sm:justify-end">
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          Saving...
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <AppTabs
                  tabs={[
                    {
                      label: "Pending",
                      value: "pending",
                      icon: Clock,
                      count: counts.pending,
                    },
                    {
                      label: "Graded",
                      value: "graded",
                      icon: TrophySVG,
                      count: counts.graded,
                    },
                  ]}
                  activeTab={activeTab}
                  onChange={(value) => {
                    setActiveTab(value as ReviewExamTab);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {counts.total === 0 ? (
                <AppState
                  isEmpty={true}
                  title="No Exams Found"
                  description="There are no Paper II submissions to review at this time."
                  icon={CheckCircle2}
                  fullScreen={false}
                />
              ) : attempts.length === 0 ? (
                <AppState
                  isEmpty={true}
                  title={activeTab === "pending" ? "No Pending Submissions" : "No Graded Submissions"}
                  description={
                    activeTab === "pending"
                      ? "All Paper II submissions have been graded."
                      : "No graded submissions yet."
                  }
                  icon={CheckCircle2}
                  fullScreen={false}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {attempts.map((attempt) => (
                      <ReviewExamCard
                        key={attempt.id}
                        attempt={attempt}
                        onClick={() =>
                          router.push(FRONTEND_ROUTES.ADMIN_REVIEW_EXAM_DETAIL(attempt.id))
                        }
                      />
                    ))}
                  </div>

                  <AppPagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    pageSize={pagination.limit}
                    itemLabel="submissions"
                    onPageChange={setCurrentPage}
                    className="mt-6 pt-0"
                    reverseMobileOrder={false}
                  />
                </>
              )}
            </>
          );
        }}
      </AppQueryState>
    </PageContainer>
  );
}
