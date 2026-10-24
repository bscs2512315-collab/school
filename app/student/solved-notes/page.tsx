"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import QuestionBankBrowseCard from "@/components/admin/question-bank/QuestionBankBrowseCard";
import { useSolvedNotes } from "@/hooks/student/useSolvedNotes";
import { useStoredUser } from "@/hooks/useStoredUser";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { GROUP_SUBJECTS } from "@/constants";
import {
  SOLVED_NOTES_SUBJECTS,
  subjectToSlug,
  sanitizeClassLevel,
  getExerciseDisplayTitle,
  getExerciseWatermark,
} from "@/constants/solvedNotes";
import { Board } from "@/types/enums";
import { getSubjectIcon } from "@/lib/generate/subject-icons";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";
import LockSVG from "@/public/svgs/LockSVG";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SolvedExercise } from "@/types/solved-notes";

export default function StudentSolvedNotesPage() {
  const router = useRouter();
  const { user, isReady } = useStoredUser();

  const userGrade = sanitizeClassLevel(user?.class);
  const userBoard = user?.board || "Sindh Board";

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("X");
  const [boardFilter, setBoardFilter] = useState<string>("Sindh Board");
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [hasInitializedDefaults, setHasInitializedDefaults] = useState(false);
  const [openingSubject, setOpeningSubject] = useState<string | null>(null);
  const [openingExerciseId, setOpeningExerciseId] = useState<string | null>(null);

  // Sync defaults to user's class and board on initial load
  useEffect(() => {
    if (isReady && !hasInitializedDefaults) {
      if (user?.class) {
        setClassFilter(userGrade);
      }
      if (user?.board) {
        setBoardFilter(user.board);
      }
      setHasInitializedDefaults(true);
    }
  }, [isReady, user, userGrade, hasInitializedDefaults]);

  // Fetch solved exercises for active class and board
  const solvedNotesQuery = useSolvedNotes({
    class: classFilter,
    board: boardFilter,
    subject: undefined,
    chapter: "all",
    search: searchTerm,
  });

  const exercises = solvedNotesQuery.data?.exercises || [];

  // Group exercises by subject and calculate counts
  const subjectExerciseCounts = useMemo(() => {
    const counts: Record<
      string,
      {
        totalExercises: number;
        availableCount: number;
        lockedCount: number;
        totalUnits: Set<number>;
        totalQuestions: number;
      }
    > = {};

    for (const ex of exercises) {
      if (!counts[ex.subject]) {
        counts[ex.subject] = {
          totalExercises: 0,
          availableCount: 0,
          lockedCount: 0,
          totalUnits: new Set(),
          totalQuestions: 0,
        };
      }
      counts[ex.subject].totalExercises++;
      counts[ex.subject].totalUnits.add(ex.chapterNumber);
      counts[ex.subject].totalQuestions += ex.questionCount || ex.pageCount || 1;
      if (ex.isLocked) {
        counts[ex.subject].lockedCount++;
      } else {
        counts[ex.subject].availableCount++;
      }
    }
    return counts;
  }, [exercises]);

  const hasActiveFilters = Boolean(
    searchTerm || classFilter !== userGrade || boardFilter !== userBoard
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setClassFilter(userGrade);
    setBoardFilter(userBoard);
  };

  const handleCardClick = (ex: SolvedExercise) => {
    if (ex.isLocked) {
      toast.info(`${ex.exerciseNumber || "SLO"} Note Coming Soon`, {
        description: `This note for Examination 2027 is currently in preparation by our subject experts and will unlock soon!`,
        icon: <LockSVG className="size-4 text-amber-400" />,
      });
      return;
    }
    setOpeningExerciseId(ex.id);
    router.push(
      FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(
        ex.id,
        subjectToSlug(ex.subject)
      )
    );
  };

  // Determine which subjects to show in group overview
  const groupSubjects = user?.stream ? GROUP_SUBJECTS[user.stream] ?? [] : [];
  const groupScopedSubjects =
    groupSubjects.length > 0 && !showAllSubjects
      ? SOLVED_NOTES_SUBJECTS.filter((s) =>
          groupSubjects.some(
            (gs) =>
              gs.toLowerCase() === s.title.toLowerCase() ||
              s.title.toLowerCase().includes(gs.toLowerCase())
          )
        )
      : SOLVED_NOTES_SUBJECTS;
  const subjectsInView = groupScopedSubjects.length > 0 ? groupScopedSubjects : SOLVED_NOTES_SUBJECTS;
  const isAKUEB = boardFilter === "AKUEB";

  return (
    <PageContainer>
      <PageHeader title="Solved Notes" showLine />

      <div className="space-y-6 flex-1 flex flex-col">
        {/* 🔍 Global Search & Filters Bar */}
        <AppSearch
          searchLabel="Global Search"
          placeholder={`Search ${isAKUEB ? "SLOs" : "exercises"}, chapters, subjects...`}
          searchTerm={searchTerm}
          onSearchChange={(value) => setSearchTerm(value)}
          dropdowns={[
            {
              id: "class-filter",
              label: "Level",
              value: classFilter,
              onChange: (e) => setClassFilter(e.target.value),
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
              onChange: (e) => setBoardFilter(e.target.value),
              options: [
                { value: "all", label: "All Boards" },
                ...Object.values(Board).map((b) => ({ value: b, label: b })),
              ],
            },
            {
              id: "subject-filter",
              label: "Subject",
              value: "all",
              onChange: (e) => {
                const val = e.target.value;
                if (val !== "all") {
                  router.push(FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_SUBJECT(val));
                }
              },
              options: [
                { value: "all", label: "All Subjects" },
                ...SOLVED_NOTES_SUBJECTS.map((sub) => ({ value: sub.key, label: sub.title })),
              ],
            },
          ]}
          resultsCount={exercises.length}
          resultsLabel={`${isAKUEB ? "SLO" : "exercise"}${exercises.length !== 1 ? "s" : ""} found${classFilter !== "all" ? ` · Class ${classFilter}` : ""}${boardFilter !== "all" ? ` · ${boardFilter}` : ""}`}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* 📚 Main Content Views */}
        <AppQueryState
          query={solvedNotesQuery}
          loadingMessage="Loading solved notes & exercises..."
          errorMessage="Failed to load solved notes."
          onRetry={() => solvedNotesQuery.refetch()}
          fullScreen={false}
        >
          {() => {
            // VIEW 1: Direct Search Results (When search input is actively typed)
            if (searchTerm.trim()) {
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        Search Results
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Found {exercises.length} {isAKUEB ? "SLO" : "exercise"}{exercises.length !== 1 ? "s" : ""} matching &quot;{searchTerm}&quot;
                      </p>
                    </div>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </div>

                  <AppState
                    isEmpty={exercises.length === 0}
                    title="No Results Found"
                    description="Try a different search term or adjust your filters."
                    icon={BookOpen}
                    fullScreen={false}
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {exercises.map((ex) => {
                        const displayTitle = getExerciseDisplayTitle(
                          ex.exerciseNumber,
                          ex.title,
                          ex.chapterName ?? undefined
                        );
                        const watermark = getExerciseWatermark(ex.exerciseNumber);
                        const subtitle = ex.subject || subjectToSlug(ex.subject);

                        return (
                          <QuestionBankBrowseCard
                            key={ex.id}
                            title={displayTitle}
                            board={ex.board || boardFilter}
                            classLevel={ex.class || classFilter}
                            subtitle={subtitle}
                            watermark={watermark}
                            subject={ex.subject}
                            buttonLabel={ex.isLocked ? "Coming Soon" : "Open"}
                            isLoading={openingExerciseId === ex.id}
                            isLocked={ex.isLocked}
                            badge={ex.cognitiveLevel || undefined}
                            onClick={() => handleCardClick(ex)}
                            dark
                          />
                        );
                      })}
                    </div>
                  </AppState>
                </div>
              );
            }

            // VIEW 2: Default Subject Overview Grid
            return (
              <div className="space-y-4">
                {/* Group Scoped Header */}
                {groupSubjects.length > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Showing your group&apos;s subjects ·{" "}
                      <span className="font-semibold text-foreground">{user?.stream}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAllSubjects((prev) => !prev)}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {showAllSubjects ? "Show My Group Only" : "Show All Subjects"}
                    </button>
                  </div>
                ) : null}

                {/* Green Subject Cards Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {subjectsInView.map((sub) => {
                    const SubjectIcon = getSubjectIcon(sub.key);
                    const stats = subjectExerciseCounts[sub.key] || {
                      totalExercises: 0,
                      availableCount: 0,
                      lockedCount: 0,
                      totalUnits: new Set(),
                      totalPages: 0,
                    };
                    const isSubjectLocked = stats.availableCount === 0;
                    const unitsCount = stats.totalUnits.size;
                    const unitsLabel = isSubjectLocked
                      ? `${unitsCount} Units · In Preparation`
                      : isAKUEB
                        ? `${unitsCount} Units · ${stats.availableCount} Solved`
                        : `${unitsCount} Unit${unitsCount !== 1 ? "s" : ""}`;
                    const subtitleMeta = `Class ${classFilter} · ${boardFilter}`;

                    return (
                      <div
                        key={sub.key}
                        onClick={() => {
                          if (isSubjectLocked) {
                            toast.info(`${sub.title} Notes Coming Soon`, {
                              description: `Solved notes for ${sub.title} Class ${classFilter} (${boardFilter}) are currently in preparation by our subject experts and will unlock soon!`,
                              icon: <LockSVG className="size-4 text-amber-400" />,
                            });
                            return;
                          }
                          setOpeningSubject(sub.key);
                          router.push(FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_SUBJECT(sub.key));
                        }}
                        className={cn(
                          "group relative flex h-full min-h-60 sm:min-h-68 flex-col overflow-hidden rounded-3xl bg-primary p-5 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 text-center",
                          isSubjectLocked
                            ? "hover:-translate-y-1 hover:shadow-md cursor-pointer opacity-90"
                            : "hover:-translate-y-1.5 hover:shadow-xl cursor-pointer"
                        )}
                      >
                        {/* Ambient Lighting & Watermark Glows */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                          <div
                            className={cn(
                              "absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark",
                              isSubjectLocked && "from-slate-800 via-slate-900 to-primary-dark/80"
                            )}
                          />
                          <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
                          <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

                          <SubjectIcon
                            aria-hidden
                            className="pointer-events-none absolute -right-4 -top-2 size-36 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 sm:size-40"
                          />
                          <SubjectIcon
                            aria-hidden
                            className="pointer-events-none absolute -bottom-6 -left-4 size-24 text-primary-foreground/10 sm:size-28"
                          />
                        </div>

                        {/* Top Tag */}
                        <div className="relative z-20 flex items-start justify-end w-full min-h-6">
                          {stats.availableCount > 0 ? (
                            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs ring-1 ring-white/30">
                              {stats.availableCount} Solved
                            </span>
                          ) : null}
                        </div>

                        {/* Centered Hero Body */}
                        <div className="relative z-10 flex flex-1 flex-col items-center justify-center mt-1">
                          <div
                            className={cn(
                              "mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105",
                              isSubjectLocked && "bg-white/10 ring-amber-400/30"
                            )}
                          >
                            {isSubjectLocked ? (
                              <LockSVG className="size-6 sm:size-7 text-amber-300" />
                            ) : (
                              <SubjectIcon className="size-7 sm:size-8 text-primary-foreground" />
                            )}
                          </div>

                          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-primary-foreground line-clamp-2">
                            {sub.title}
                          </h3>

                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
                              {subtitleMeta}
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
                              {unitsLabel}
                            </p>
                          </div>
                        </div>

                        {/* Centered Pill Action Button */}
                        <div className="relative z-10 mt-4 flex items-center justify-center">
                          {isSubjectLocked ? (
                            <span className="inline-flex items-center justify-center rounded-full bg-white/15 px-3 py-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-200 backdrop-blur-sm ring-1 ring-white/20 shadow-md transition-transform duration-300 group-hover:scale-105 whitespace-nowrap">
                              Coming Soon
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
                              {openingSubject === sub.key ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Opening…
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="size-3.5" />
                                  Open
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground pt-2 text-center sm:text-left">
                  Showing <span className="font-semibold text-foreground">{subjectsInView.length}</span> subjects
                </p>
              </div>
            );
          }}
        </AppQueryState>
      </div>
    </PageContainer>
  );
}
