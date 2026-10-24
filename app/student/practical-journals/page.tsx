"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import { AppPagination } from "@/components/AppPagination";
import QuestionBankBrowseCard from "@/components/admin/question-bank/QuestionBankBrowseCard";
import PracticalJournalCard from "@/components/practical-journals/PracticalJournalCard";
import { Typography } from "@/components/ui/Typography";
import { FlaskConical } from "lucide-react";
import { useStoredUser } from "@/hooks/useStoredUser";
import {
  type ClassLevel,
  type PracticalSubject,
  getSubjectCounts,
  getAllPracticals,
} from "@/constants/practicalJournals";
import { Board } from "@/types/enums";
import { GROUP_SUBJECTS } from "@/constants";
import { normalizeClassLevel } from "@/lib/teacher/class-level";

const PAGE_LIMIT = 9;

const SUBJECT_ITEMS: { key: PracticalSubject; title: string }[] = [
  { key: "physics", title: "Physics" },
  { key: "chemistry", title: "Chemistry" },
  { key: "biology", title: "Biology" },
  { key: "computer-science", title: "Computer Science" },
];

function sanitizeClassLevel(raw?: string | null): ClassLevel {
  const norm = normalizeClassLevel(raw);
  if (norm === "IX" || norm === "X" || norm === "XI" || norm === "XII") {
    return norm;
  }
  return "XII";
}

export default function PracticalJournalsPage() {
  const router = useRouter();
  const { user, isReady: isUserReady } = useStoredUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<ClassLevel | "all">("XII");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasInitializedUserClass, setHasInitializedUserClass] = useState(false);
  const [openingSubject, setOpeningSubject] = useState<PracticalSubject | null>(null);

  // Sync default class to user's class on initial load
  useEffect(() => {
    if (isUserReady && user?.class && !hasInitializedUserClass) {
      const userGrade = sanitizeClassLevel(user.class);
      setClassFilter(userGrade);
      setHasInitializedUserClass(true);
    }
  }, [isUserReady, user?.class, hasInitializedUserClass]);

  const userGrade = sanitizeClassLevel(user?.class);

  // Retrieve subject practical counts for the active class (or all classes combined)
  const counts = useMemo(() => {
    if (classFilter === "all") {
      const grades: ClassLevel[] = ["IX", "X", "XI", "XII"];
      const total = { physics: 0, chemistry: 0, biology: 0, "computer-science": 0 };
      for (const g of grades) {
        const c = getSubjectCounts(g);
        total.physics += c.physics;
        total.chemistry += c.chemistry;
        total.biology += c.biology;
        total["computer-science"] += c["computer-science"];
      }
      return total;
    }
    return getSubjectCounts(classFilter);
  }, [classFilter]);

  // Retrieve all practicals matching search and active filters
  const filteredPracticals = useMemo(() => {
    const all = getAllPracticals("all");
    const q = searchTerm.trim().toLowerCase();

    return all.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.object.toLowerCase().includes(q) ||
        p.apparatus.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        p.board.toLowerCase().includes(q) ||
        p.expNo.toString().includes(q);

      const matchesClass = classFilter === "all" || p.classLevel === classFilter;
      const matchesBoard = boardFilter === "all" || p.board === boardFilter;
      const matchesSubject = subjectFilter === "all" || p.subject === subjectFilter;

      return matchesSearch && matchesClass && matchesBoard && matchesSubject;
    });
  }, [searchTerm, classFilter, boardFilter, subjectFilter]);

  const isSearchOrSubjectActive = Boolean(searchTerm.trim() || subjectFilter !== "all");

  const totalItems = filteredPracticals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_LIMIT));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_LIMIT;
  const endIndex = Math.min(startIndex + PAGE_LIMIT, totalItems);
  const paginatedPracticals = filteredPracticals.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(
    searchTerm ||
    classFilter !== userGrade ||
    boardFilter !== "all" ||
    subjectFilter !== "all"
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setClassFilter(userGrade);
    setBoardFilter("all");
    setSubjectFilter("all");
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <PageHeader title="Practicals" showLine />

      <div className="space-y-6">
        {/* Global Search & Filters Bar */}
        <AppSearch
          searchLabel="Global Search"
          placeholder="Search practicals, subjects, experiments..."
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          dropdowns={[
            {
              id: "class-filter",
              label: "Level",
              value: classFilter,
              onChange: (e) => {
                setClassFilter(e.target.value as ClassLevel);
                setCurrentPage(1);
              },
              options: [
                { value: "all", label: "All Classes" },
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
            {
              id: "subject-filter",
              label: "Subject",
              value: subjectFilter,
              onChange: (e) => {
                setSubjectFilter(e.target.value);
                setCurrentPage(1);
              },
              options: [
                { value: "all", label: "All Subjects" },
                ...SUBJECT_ITEMS.map((sub) => ({ value: sub.key, label: sub.title })),
              ],
            },
          ]}
          resultsCount={filteredPracticals.length}
          resultsLabel={`practical${filteredPracticals.length !== 1 ? "s" : ""} found${classFilter !== "all" ? ` · Class ${classFilter}` : ""}${boardFilter !== "all" ? ` · ${boardFilter}` : ""}`}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Main Content View */}
        {!isSearchOrSubjectActive ? (
          /* Default Subject Overview Grid (Matches Past Papers 1 Browse Cards) */
          (() => {
            const groupSubjects = user?.stream ? GROUP_SUBJECTS[user.stream] ?? [] : [];
            const groupScopedSubjects =
              groupSubjects.length > 0 && !showAllSubjects
                ? SUBJECT_ITEMS.filter((s) =>
                    groupSubjects.some(
                      (gs) =>
                        gs.toLowerCase() === s.title.toLowerCase() ||
                        s.title.toLowerCase().includes(gs.toLowerCase()),
                    ),
                  )
                : SUBJECT_ITEMS;
            const subjectsInView =
              groupScopedSubjects.length > 0 ? groupScopedSubjects : SUBJECT_ITEMS;
            const isGroupScoped =
              groupSubjects.length > 0 &&
              !showAllSubjects &&
              groupScopedSubjects.length > 0 &&
              groupScopedSubjects.length < SUBJECT_ITEMS.length;

            return (
              <div className="space-y-4">
                {groupSubjects.length > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <Typography variant="small" className="font-medium text-muted-foreground">
                      {isGroupScoped
                        ? `Showing your group's subjects${user?.stream ? ` · ${user.stream}` : ""}`
                        : "Showing all subjects"}
                    </Typography>
                    <button
                      type="button"
                      onClick={() => setShowAllSubjects((v) => !v)}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {showAllSubjects ? "Show my group" : "Show all subjects"}
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {subjectsInView.map((sub) => {
                    const count = counts[sub.key] || 0;
                    return (
                      <QuestionBankBrowseCard
                        key={sub.key}
                        title={sub.title}
                        subtitle={`${count} ${count === 1 ? "PRACTICAL" : "PRACTICALS"}`}
                        watermark={sub.title.slice(0, 2).toUpperCase()}
                        isLoading={openingSubject === sub.key}
                        disabled={openingSubject !== null && openingSubject !== sub.key}
                        onClick={() => {
                          setOpeningSubject(sub.key);
                          router.push(`/student/practical-journals/${sub.key}?grade=${classFilter}`);
                        }}
                        dark
                      />
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          /* Search Results & Filtered Practicals View */
          <AppState
            isEmpty={filteredPracticals.length === 0}
            emptyMessage="No practical journals found matching your search. Try adjusting your filters."
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
        )}
      </div>
    </PageContainer>
  );
}
