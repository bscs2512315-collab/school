"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import { AppPagination } from "@/components/AppPagination";
import LabPracticalCard from "@/components/lab-game/LabPracticalCard";
import PhysicsSVG from "@/public/svgs/PhysicsSVG";
import { useStoredUser } from "@/hooks/useStoredUser";
import { getPracticals } from "@/constants/labPracticals";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { normalizeClassLevel } from "@/lib/teacher/class-level";
import { Board } from "@/types/enums";
import { FlaskConical } from "lucide-react";

const PAGE_LIMIT = 9;

function sanitizeClassLevel(raw?: string | null): string {
  const norm = normalizeClassLevel(raw);
  if (norm === "IX" || norm === "X" || norm === "XI" || norm === "XII") {
    return norm;
  }
  return "XII";
}

function PhysicsLabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady: isUserReady } = useStoredUser();

  const gradeParam = searchParams.get("grade") || searchParams.get("class");
  const initialGrade = gradeParam ? sanitizeClassLevel(gradeParam) : "XII";

  const [activeGrade, setActiveGrade] = useState<string>(initialGrade);
  const [searchTerm, setSearchTerm] = useState("");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasInitializedGrade, setHasInitializedGrade] = useState(false);

  useEffect(() => {
    if (gradeParam) {
      setActiveGrade(sanitizeClassLevel(gradeParam));
    }
  }, [gradeParam]);

  useEffect(() => {
    if (isUserReady && !gradeParam && user?.class && !hasInitializedGrade) {
      const userGrade = sanitizeClassLevel(user.class);
      setActiveGrade(userGrade);
      setHasInitializedGrade(true);
    }
  }, [isUserReady, gradeParam, user?.class, hasInitializedGrade]);

  const userGrade = sanitizeClassLevel(user?.class);

  const handleGradeChange = (grade: string) => {
    setActiveGrade(grade);
    setCurrentPage(1);
    router.replace(`${FRONTEND_ROUTES.STUDENT_LAB_GAME}/physics?grade=${grade}`);
  };

  const rawPracticals = useMemo(() => {
    return getPracticals("physics", activeGrade);
  }, [activeGrade]);

  const practicals = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rawPracticals.filter((p) => {
      return (
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.objective.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [rawPracticals, searchTerm]);

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
    handleGradeChange(userGrade);
    setBoardFilter("all");
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <PageHeader title="Physics Lab" showLine />

      <div className="space-y-6">
        <AppSearch
          searchLabel="Search Experiments"
          placeholder="Search experiment title, mechanics, electricity, optics..."
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          dropdowns={[
            {
              id: "class-filter",
              label: "Level",
              value: activeGrade,
              onChange: (e) => {
                handleGradeChange(e.target.value);
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

        <AppState
          isEmpty={practicals.length === 0}
          emptyMessage="No practical experiments found matching your search. Try adjusting your filters."
          title="No Experiments Found"
          icon={FlaskConical}
          fullScreen={false}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedPracticals.map((p, idx) => (
                <LabPracticalCard
                  key={p.id}
                  index={startIndex + idx + 1}
                  title={p.title}
                  objective={p.objective}
                  route={p.route}
                  icon={PhysicsSVG}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <AppPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_LIMIT}
                itemLabel="experiments"
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

export default function PhysicsLabPage() {
  return (
    <Suspense fallback={null}>
      <PhysicsLabContent />
    </Suspense>
  );
}
