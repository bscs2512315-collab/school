"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import QuestionBankBrowseCard from "@/components/admin/question-bank/QuestionBankBrowseCard";
import SolvedNotesReader from "@/components/solved-notes/SolvedNotesReader";
import { useSolvedNotes } from "@/hooks/student/useSolvedNotes";
import { useSolvedExerciseDetail } from "@/hooks/student/useSolvedExerciseDetail";
import { useStoredUser } from "@/hooks/useStoredUser";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import {
  slugToSubject,
  subjectToSlug,
  isKnownSubject,
  sanitizeClassLevel,
  getExerciseDisplayTitle,
  getExerciseWatermark,
} from "@/constants/solvedNotes";
import { Board } from "@/types/enums";
import { BookOpen } from "lucide-react";
import LockSVG from "@/public/svgs/LockSVG";
import { toast } from "sonner";
import type { SolvedExercise } from "@/types/solved-notes";

export default function SolvedNotesSubjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isReady } = useStoredUser();

  const rawParam = String(params?.subject || "");
  const isSubjectRoute = isKnownSubject(rawParam);

  // Fallback for legacy direct exercise IDs hitting /student/solved-notes/[id]
  const exerciseDetailQuery = useSolvedExerciseDetail(isSubjectRoute ? "" : rawParam);

  const subjectTitle = isSubjectRoute ? slugToSubject(rawParam) : "";
  const subjectSlug = isSubjectRoute ? subjectToSlug(subjectTitle) : "";

  const userGrade = sanitizeClassLevel(user?.class);
  const userBoard = user?.board || "Sindh Board";

  const gradeParam = searchParams.get("class") || searchParams.get("grade");
  const boardParam = searchParams.get("board");

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>(gradeParam ? sanitizeClassLevel(gradeParam) : "X");
  const [boardFilter, setBoardFilter] = useState<string>(boardParam || "Sindh Board");
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number | null>(null);
  const [hasInitializedDefaults, setHasInitializedDefaults] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Sync defaults to user's class and board on initial load if no search params
  useEffect(() => {
    if (isReady && !hasInitializedDefaults) {
      if (!gradeParam && user?.class) {
        setClassFilter(userGrade);
      }
      if (!boardParam && user?.board) {
        setBoardFilter(user.board);
      }
      setHasInitializedDefaults(true);
    }
  }, [isReady, user, userGrade, gradeParam, boardParam, hasInitializedDefaults]);

  // Fetch solved exercises for this subject, class and board
  const solvedNotesQuery = useSolvedNotes({
    class: classFilter,
    board: boardFilter,
    subject: subjectTitle,
    chapter: "all",
    search: searchTerm,
  });

  const exercises = solvedNotesQuery.data?.exercises || [];
  const stats = solvedNotesQuery.data?.stats;

  // Group active exercises by Chapter
  const groupedByChapter = useMemo(() => {
    const map = new Map<
      number,
      {
        chapterNumber: number;
        chapterName: string;
        exercises: SolvedExercise[];
        availableCount: number;
        lockedCount: number;
      }
    >();

    for (const ex of exercises) {
      if (!map.has(ex.chapterNumber)) {
        map.set(ex.chapterNumber, {
          chapterNumber: ex.chapterNumber,
          chapterName: ex.chapterName || `Unit ${ex.chapterNumber}`,
          exercises: [],
          availableCount: 0,
          lockedCount: 0,
        });
      }
      const entry = map.get(ex.chapterNumber)!;
      entry.exercises.push(ex);
      if (ex.isLocked) {
        entry.lockedCount++;
      } else {
        entry.availableCount++;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);
  }, [exercises]);

  const handleCardClick = (ex: SolvedExercise) => {
    if (ex.isLocked) {
      toast.info(`${ex.exerciseNumber || "SLO"} Note Coming Soon`, {
        description: `This note for Examination 2027 is currently in preparation by our subject experts and will unlock soon!`,
        icon: <LockSVG className="size-4 text-amber-400" />,
      });
      return;
    }
    setOpeningId(ex.id);
    router.push(FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(ex.id, subjectSlug));
  };

  // If the route segment is not a subject (e.g. an exercise ID), render the exercise reader fallback
  if (!isSubjectRoute) {
    return (
      <PageContainer>
        <AppQueryState
          query={exerciseDetailQuery}
          loadingMessage="Loading solved exercise notes..."
          errorMessage="Failed to load exercise notes."
          onRetry={() => exerciseDetailQuery.refetch()}
          fullScreen={false}
        >
          {(exercise) => (
            <div className="animate-in fade-in duration-300">
              <SolvedNotesReader exercise={exercise} />
            </div>
          )}
        </AppQueryState>
      </PageContainer>
    );
  }

  const hasActiveFilters = Boolean(
    searchTerm || classFilter !== userGrade || boardFilter !== userBoard
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setClassFilter(userGrade);
    setBoardFilter(userBoard);
    setSelectedChapterNumber(null);
  };

  const isAKUEB = boardFilter === "AKUEB";

  return (
    <PageContainer>
      {/* 🧭 Top Page Header: Subject Title */}
      <PageHeader title={subjectTitle} showLine />

      <div className="space-y-6 flex-1 flex flex-col">
        {/* 🔍 Search & Filters Bar */}
        <AppSearch
          searchLabel={`Search ${subjectTitle}`}
          placeholder={`Search chapters, exercises, or SLOs in ${subjectTitle}...`}
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setSelectedChapterNumber(null);
          }}
          dropdowns={[
            {
              id: "class-filter",
              label: "Level",
              value: classFilter,
              onChange: (e) => {
                setClassFilter(e.target.value);
                setSelectedChapterNumber(null);
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
                setSelectedChapterNumber(null);
              },
              options: [
                { value: "all", label: "All Boards" },
                ...Object.values(Board).map((b) => ({ value: b, label: b })),
              ],
            },
          ]}
          resultsCount={exercises.length}
          resultsLabel={`${isAKUEB ? "SLO" : "exercise"}${exercises.length !== 1 ? "s" : ""} found${classFilter !== "all" ? ` · Class ${classFilter}` : ""}${boardFilter !== "all" ? ` · ${boardFilter}` : ""}`}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* 🌟 AKUEB Syllabus Notice Banner */}
        {isAKUEB && stats && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-card p-4 border border-primary/20">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                AKUEB Examination 2027 &amp; Onwards Syllabus
              </h4>
              <p className="text-xs text-muted-foreground">
                Notes are structured per Student Learning Objective (SLO) with cognitive level taxonomy.
              </p>
            </div>
            {stats.availableCount !== undefined && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary border border-primary/25">
                  {stats.availableCount} Available
                </span>
                {stats.lockedCount !== undefined && stats.lockedCount > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {stats.lockedCount} In Preparation
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 📚 Main Content Views */}
        <AppQueryState
          query={solvedNotesQuery}
          loadingMessage={`Loading ${subjectTitle} solved notes...`}
          errorMessage={`Failed to load ${subjectTitle} solved notes.`}
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
                        Search Results in {subjectTitle}
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
                    description={`No ${isAKUEB ? "SLOs" : "exercises"} matching "${searchTerm}" found in ${subjectTitle}.`}
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
                        const subtitle = ex.subject || subjectTitle;

                        return (
                          <QuestionBankBrowseCard
                            key={ex.id}
                            title={displayTitle}
                            board={ex.board || boardFilter}
                            classLevel={ex.class || classFilter}
                            subtitle={subtitle}
                            watermark={watermark}
                            subject={subjectTitle}
                            buttonLabel={ex.isLocked ? "Coming Soon" : "Open"}
                            isLoading={openingId === ex.id}
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

            // VIEW 2: Chapter Cards Grid (Show all Units/Chapters for this subject)
            if (selectedChapterNumber === null) {
              return (
                <div className="space-y-6">
                  {/* Chapters Cards Grid */}
                  <AppState
                    isEmpty={groupedByChapter.length === 0}
                    title="No Chapters Found"
                    description={`No units found for ${boardFilter} Class ${classFilter} ${subjectTitle}.`}
                    icon={BookOpen}
                    fullScreen={false}
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {groupedByChapter.map((chapter) => {
                        const count = chapter.exercises.length;
                        const isChapterLocked = isAKUEB && chapter.availableCount === 0;
                        const subtitle = isAKUEB
                          ? isChapterLocked
                            ? "In Preparation"
                            : `${chapter.availableCount}/${count} Available`
                          : `${count} ${count === 1 ? "Exercise" : "Exercises"}`;

                        return (
                          <QuestionBankBrowseCard
                            key={chapter.chapterNumber}
                            title={chapter.chapterName}
                            board={`Unit ${chapter.chapterNumber}`}
                            classLevel={classFilter}
                            subtitle={subtitle}
                            watermark={chapter.chapterNumber.toString()}
                            subject={subjectTitle}
                            buttonLabel={isChapterLocked ? "Coming Soon" : "Open"}
                            isLocked={isChapterLocked}
                            onClick={() => {
                              if (isChapterLocked) {
                                toast.info(`Unit ${chapter.chapterNumber} Notes Coming Soon`, {
                                  description: `Solved notes for ${chapter.chapterName} are currently in preparation by our subject experts and will unlock soon!`,
                                  icon: <LockSVG className="size-4 text-amber-400" />,
                                });
                                return;
                              }
                              setSelectedChapterNumber(chapter.chapterNumber);
                            }}
                            dark
                          />
                        );
                      })}
                    </div>
                  </AppState>
                </div>
              );
            }

            // VIEW 3: Exercise Cards Grid (Specific Chapter selected -> Show its exercises/SLOs)
            const activeChapter =
              groupedByChapter.find((c) => c.chapterNumber === selectedChapterNumber) ||
              groupedByChapter[0];

            if (!activeChapter) return null;

            return (
              <div className="space-y-6">
                {/* Active Chapter Header */}
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-extrabold text-primary">
                        Unit {activeChapter.chapterNumber}
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        {activeChapter.chapterName}
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subjectTitle} · Class {classFilter} · {boardFilter} ·{" "}
                      {activeChapter.availableCount} of {activeChapter.exercises.length} {isAKUEB ? "SLOs" : "Exercises"} Available
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedChapterNumber(null)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      View All Chapters
                    </button>
                    <span className="text-muted-foreground/40 hidden sm:inline">·</span>
                    <button
                      onClick={() => router.push(FRONTEND_ROUTES.STUDENT_SOLVED_NOTES)}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline hidden sm:inline cursor-pointer"
                    >
                      All Subjects
                    </button>
                  </div>
                </div>

                {/* Exercise / SLO Cards Grid */}
                <AppState
                  isEmpty={activeChapter.exercises.length === 0}
                  title="No Exercises Found"
                  description={`No ${isAKUEB ? "SLOs" : "exercises"} found for Unit ${activeChapter.chapterNumber}.`}
                  icon={BookOpen}
                  fullScreen={false}
                >
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {activeChapter.exercises.map((ex) => {
                      const displayTitle = getExerciseDisplayTitle(
                        ex.exerciseNumber,
                        ex.title,
                        activeChapter.chapterName
                      );
                      const watermark = getExerciseWatermark(ex.exerciseNumber);
                      const subtitle = ex.subject || subjectTitle;

                      return (
                        <QuestionBankBrowseCard
                          key={ex.id}
                          title={displayTitle}
                          board={ex.board || boardFilter}
                          classLevel={ex.class || classFilter}
                          subtitle={subtitle}
                          watermark={watermark}
                          subject={subjectTitle}
                          buttonLabel={ex.isLocked ? "Coming Soon" : "Open"}
                          isLoading={openingId === ex.id}
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
          }}
        </AppQueryState>
      </div>
    </PageContainer>
  );
}
