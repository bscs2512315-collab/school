"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import { AppPagination } from "@/components/AppPagination";
import PracticalJournalCard from "@/components/practical-journals/PracticalJournalCard";
import {
  getPracticalsForSubject,
  type ClassLevel,
} from "@/constants/practicalJournals";
import { useStoredUser } from "@/hooks/useStoredUser";
import { normalizeClassLevel } from "@/lib/teacher/class-level";
import { Board } from "@/types/enums";
import { FlaskConical } from "lucide-react";

const PAGE_LIMIT = 9;

function sanitizeClassLevel(raw?: string | null): ClassLevel {
  const norm = normalizeClassLevel(raw);
  if (norm === "IX" || norm === "X" || norm === "XI" || norm === "XII") {
    return norm;
  }
  return "XII";
}

export default function PhysicsJournalsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isReady: isUserReady } = useStoredUser();

  const gradeParam = searchParams.get("grade");
  const initialGrade: ClassLevel = gradeParam ? sanitizeClassLevel(gradeParam) : "XII";

  const [activeGrade, setActiveGrade] = useState<ClassLevel>(initialGrade);
  const [searchTerm, setSearchTerm] = useState("");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasInitializedGrade, setHasInitializedGrade] = useState(false);

  useEffect(() => {
    if (isUserReady && !gradeParam && user?.class && !hasInitializedGrade) {
      const userGrade = sanitizeClassLevel(user.class);
      setActiveGrade(userGrade);
      setHasInitializedGrade(true);
    }
  }, [isUserReady, gradeParam, user?.class, hasInitializedGrade]);

  const userGrade = sanitizeClassLevel(user?.class);

  const handleGradeChange = (grade: ClassLevel) => {
    setActiveGrade(grade);
    setCurrentPage(1);
    router.replace(`/student/practical-journals/physics?grade=${grade}`);
  };

  const practicals = useMemo(() => {
    const list = getPracticalsForSubject("physics", activeGrade);
    const q = searchTerm.trim().toLowerCase();

    return list.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.object.toLowerCase().includes(q) ||
        p.apparatus.toLowerCase().includes(q) ||
        p.expNo.toString().includes(q);

      const matchesBoard = boardFilter === "all" || p.board === boardFilter;

      return matchesSearch && matchesBoard;
    });
  }, [activeGrade, searchTerm, boardFilter]);

  const totalItems = practicals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_LIMIT));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_LIMIT;
  const endIndex = Math.min(startIndex + PAGE_LIMIT, totalItems);
  const paginatedPracticals = practicals.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(
    searchTerm || activeGrade !== userGrade || boardFilter !== "all"
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveGrade(userGrade);
    setBoardFilter("all");
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <PageHeader title="Physics Practical Journal" showLine />

      <div className="space-y-6">
        {/* Global Search & Filters Bar */}
        <AppSearch
          searchLabel="Search Experiments"
          placeholder="Search physics experiment title, apparatus, topics..."
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          dropdowns={[
            {
              id: "class-filter",
              label: "Class",
              value: activeGrade,
              onChange: (e) => {
                handleGradeChange(e.target.value as ClassLevel);
              },
              options: [
                { value: "IX", label: "Class IX (SSC-I)" },
                { value: "X", label: "Class X (SSC-II)" },
                { value: "XI", label: "Class XI (HSSC-I)" },
                { value: "XII", label: "Class XII (HSSC-II)" },
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
                { value: "all", label: "All Boards" },
                ...Object.values(Board).map((board) => ({ value: board, label: board })),
              ],
            },
          ]}
          resultsCount={practicals.length}
          resultsLabel={`experiment${practicals.length !== 1 ? "s" : ""} found · Class ${activeGrade}`}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Practicals Grid or Empty State */}
        <AppState
          isEmpty={practicals.length === 0}
          emptyMessage="No practical experiments found matching your search. Try adjusting your filters."
          title="No Experiments Found"
          icon={FlaskConical}
          fullScreen={false}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedPracticals.map((journal) => (
                <PracticalJournalCard key={journal.id} journal={journal} />
              ))}
            </div>

            {totalPages > 1 ? (
              <AppPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_LIMIT}
                itemLabel="practicals"
                onPageChange={setCurrentPage}
                className="pt-2"
              />
            ) : null}
          </div>
        </AppState>
      </div>
    </PageContainer>
  );
}
