"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSearch from "@/components/AppSearch";
import { FileText, ChevronRight, Target, Zap, Activity } from "lucide-react";
import TrophySVG from "@/public/svgs/TrophySVG";
import { Typography } from "@/components/ui/Typography";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import HistoryStatsCard from "@/components/HistoryStatsCard";
import HistoryAttemptCard from "@/components/HistoryAttemptCard";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { useStudentHistory } from "@/hooks/student/useStudentHistory";
import type { StudentHistoryItem } from "@/types/student";

export default function StudentHistoryPage() {
  const router = useRouter();
  const historyQuery = useStudentHistory();

  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  const filterAttempts = (attempts: StudentHistoryItem[]) => {
    return attempts.filter((attempt) => {
      const matchesSearch = (attempt.subject || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSubject = subjectFilter === "all" || attempt.subject === subjectFilter;
      const matchesDate =
        !dateFilter || new Date(attempt.created_at).toISOString().split("T")[0] === dateFilter;
      return matchesSearch && matchesSubject && matchesDate;
    });
  };

  const computeStats = (attempts: StudentHistoryItem[]) => {
    const gradedAttempts = attempts.filter(
      (attempt) =>
        (attempt.total_marks || 0) > 0 &&
        attempt.grading_status === "graded" &&
        attempt.score !== null,
    );

    const avgPercentage =
      gradedAttempts.length > 0
        ? Math.round(
            gradedAttempts.reduce(
              (acc, curr) => acc + ((curr.score ?? 0) / curr.total_marks) * 100,
              0,
            ) / gradedAttempts.length,
          )
        : 0;

    const totalPoints = gradedAttempts.reduce((acc, curr) => {
      const percentage = ((curr.score ?? 0) / curr.total_marks) * 100;
      const bonusPoints = Math.floor(percentage / 10) * 5;
      return acc + (10 + bonusPoints);
    }, 0);

    return {
      totalTests: attempts.length,
      avgPercentage,
      totalPoints,
    };
  };

  return (
    <PageContainer>
      <AppQueryState
        query={historyQuery}
        loadingMessage="Loading examination history..."
        errorMessage="Failed to load history. Please try again."
        onRetry={() => historyQuery.refetch()}
        fullScreen={false}
      >
        {(attempts) => {
          const subjects = Array.from(new Set(attempts.map((attempt) => attempt.subject))).filter(
            Boolean,
          );
          const filteredAttempts = filterAttempts(attempts);
          const visibleAttempts = filteredAttempts.slice(0, visibleCount);
          const hasMore = visibleCount < filteredAttempts.length;
          const { totalTests, avgPercentage, totalPoints } = computeStats(attempts);

          return (
            <>
              <PageHeader title="History" showLine={true} />

              <div className="mb-10 grid grid-cols-3 gap-3 sm:gap-6">
                <HistoryStatsCard
                  title="Total Attempts"
                  value={totalTests}
                  icon={TrophySVG}
                  bottomLabel="Lifetime"
                />

                <HistoryStatsCard
                  title="Average Score"
                  value={`${avgPercentage}%`}
                  icon={Activity}
                  bottomLabel="Accuracy"
                  progressWidthClass="w-12 sm:w-24"
                />

                <HistoryStatsCard
                  title="Points Earned"
                  value={totalPoints}
                  icon={Zap}
                  bottomLabel="Rewarded"
                  progressColorClass="bg-yellow-500"
                />
              </div>

              <AppSearch
                searchLabel="Find by subject"
                placeholder="Search by subject..."
                searchTerm={searchQuery}
                onSearchChange={setSearchQuery}
                dropdowns={[
                  {
                    id: "subject-filter",
                    label: "Subject",
                    value: subjectFilter,
                    onChange: (e) => setSubjectFilter(e.target.value),
                    options: [
                      { value: "all", label: "All Subjects" },
                      ...subjects.map((subject) => ({ value: subject, label: subject })),
                    ],
                  },
                ]}
                dateLabel="Date"
                dateValue={dateFilter}
                onDateChange={setDateFilter}
                resultsCount={filteredAttempts.length}
                resultsLabel="attempts found"
                onClearFilters={() => {
                  setSearchQuery("");
                  setSubjectFilter("all");
                  setDateFilter("");
                }}
                hasActiveFilters={
                  searchQuery !== "" || subjectFilter !== "all" || dateFilter !== ""
                }
              />

              <AppState
                isEmpty={attempts.length === 0}
                title="No Exam History"
                description="You haven't attempted any papers yet. Start your journey by attempting a paper from the library."
                icon={FileText}
                fullScreen={false}
              >
                {visibleAttempts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
                    {visibleAttempts.map((attempt) => (
                      <HistoryAttemptCard
                        key={attempt.id}
                        attempt={attempt}
                        onClick={() =>
                          router.push(FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(attempt.id))
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[2.5rem] border border-border bg-card p-12 text-center shadow-sm">
                    <Typography variant="muted">
                      No matches found for your search or filters.
                    </Typography>
                  </div>
                )}

                {hasMore ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 6)}
                      className="flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>Load More Attempts</span>
                      <ChevronRight className="size-4 rotate-90" />
                    </button>
                  </div>
                ) : null}
              </AppState>
            </>
          );
        }}
      </AppQueryState>
      <div className="pb-10" />
    </PageContainer>
  );
}
