"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSearch from "@/components/AppSearch";
import AppButton from "@/components/AppButton";
import { AppPagination } from "@/components/AppPagination";
import { BookOpen } from "lucide-react";
import AppState from "@/components/AppState";
import { Class, Board } from "@/types/enums";
import CurriculumCard from "@/components/CurriculumCard";
import AppQueryState from "@/components/AppQueryState";
import { useStudentCurriculums } from "@/hooks/student/useStudentCurriculums";
import type { StudentCurriculum } from "@/types/student";
import { getLearningRoutes, getStoredUserRole } from "@/lib/routes/learning-routes";

import { useStoredUser } from "@/hooks/useStoredUser";

const PAGE_LIMIT = 10;

export default function StudentCurriculumsPage() {
  const router = useRouter();
  const { user } = useStoredUser();
  const curriculumsQuery = useStudentCurriculums();
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const learningRoutes = getLearningRoutes(getStoredUserRole());

  useEffect(() => {
    if (user?.class) {
      setClassFilter(user.class);
      setCurrentPage(1);
    }
  }, [user?.class]);

  useEffect(() => {
    if (user?.board) {
      setBoardFilter(user.board);
      setCurrentPage(1);
    }
  }, [user?.board]);

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <PageContainer>
      <AppQueryState
        query={curriculumsQuery}
        loadingMessage="Loading your syllabus library..."
        errorMessage="Failed to load syllabus. Please try again later."
        onRetry={() => curriculumsQuery.refetch()}
        fullScreen={false}
      >
        {(curriculums) => {
          const filteredCurriculums = curriculums.filter((c: StudentCurriculum) => {
            const matchesSearch =
              c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.board.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesClass = classFilter === "all" || c.class === classFilter;
            const matchesBoard = boardFilter === "all" || c.board === boardFilter;

            return matchesSearch && matchesClass && matchesBoard;
          });

          const totalCurriculums = filteredCurriculums.length;
          const totalPages = Math.max(1, Math.ceil(totalCurriculums / PAGE_LIMIT));
          const safeCurrentPage = Math.min(currentPage, totalPages);
          const startIndex = (safeCurrentPage - 1) * PAGE_LIMIT;
          const endIndex = Math.min(startIndex + PAGE_LIMIT, totalCurriculums);
          const paginatedCurriculums = filteredCurriculums.slice(startIndex, endIndex);

          return (
            <>
              <PageHeader
                title="Syllabus"
                showLine={true}
              />

              <AppSearch
                searchLabel="Find your subject"
                placeholder="Search subject, class..."
                searchTerm={searchTerm}
                onSearchChange={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                dropdowns={[
                  {
                    id: "class-filter",
                    label: "Class",
                    value: classFilter,
                    onChange: (e) => {
                      setClassFilter(e.target.value);
                      setCurrentPage(1);
                    },
                    options: [
                      { value: "all", label: "Classes" },
                      ...Object.values(Class).map((cls) => ({ value: cls, label: cls })),
                    ],
                  },
                  {
                    id: "board-filter",
                    label: "Board",
                    value: boardFilter,
                    onChange: (e) => {
                      setBoardFilter(e.target.value);
                      setCurrentPage(1);
                    },
                    options: [
                      { value: "all", label: "Boards" },
                      ...Object.values(Board).map((board) => ({ value: board, label: board })),
                    ],
                  },
                ]}
                resultsCount={filteredCurriculums.length}
                resultsLabel="subjects found"
                onClearFilters={() => {
                  setSearchTerm("");
                  setClassFilter(user?.class || "all");
                  setBoardFilter(user?.board || "all");
                  setCurrentPage(1);
                }}
                hasActiveFilters={
                  searchTerm !== "" || classFilter !== "all" || boardFilter !== "all"
                }
              />

              {totalCurriculums === 0 ? (
                <AppState
                  variant="empty"
                  emptyMessage={
                    searchTerm
                      ? `No subjects found matching "${searchTerm}"`
                      : "Your syllabus library is currently empty."
                  }
                  title={searchTerm ? "No Matches Found" : "Not Enrolled Yet"}
                  icon={BookOpen}
                  fullScreen={false}
                />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {paginatedCurriculums.map((c) => (
                      <CurriculumCard
                        key={c.id}
                        curriculum={{
                          ...c,
                          fileName: c.fileName || "N/A",
                          createdAt: c.createdAt || new Date().toISOString(),
                        }}
                        onView={(id) => router.push(learningRoutes.curriculum(id))}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>

                  <AppPagination
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    totalItems={totalCurriculums}
                    pageSize={PAGE_LIMIT}
                    itemLabel="subjects"
                    onPageChange={setCurrentPage}
                    className="mt-2 pt-2"
                    reverseMobileOrder={false}
                  />
                </div>
              )}
            </>
          );
        }}
      </AppQueryState>
    </PageContainer>
  );
}
