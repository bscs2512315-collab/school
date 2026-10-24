"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HistorySVG from "@/public/svgs/HistorySVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import { AppPagination } from "@/components/AppPagination";
import AppQueryState from "@/components/AppQueryState";
import AppSearch from "@/components/AppSearch";
import AppState from "@/components/AppState";
import AppTabs from "@/components/AppTabs";
import { Typography } from "@/components/ui/Typography";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PastPaperCard from "@/components/PastPaperCard";
import PastPapersYearlyView from "@/components/past-papers/PastPapersYearlyView";
import QuestionBankBrowseCard from "@/components/admin/question-bank/QuestionBankBrowseCard";
import PaperHeaderSponsor from "@/components/exam/PaperHeaderSponsor";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { useStoredUser } from "@/hooks/useStoredUser";
import { useStudentPastPapers } from "@/hooks/student/useStudentPastPapers";
import { Board, Class } from "@/types/enums";
import { GROUP_SUBJECTS } from "@/constants";
import { PastPaperBrowseMode } from "@/types/past-paper-browse";
import type { PastPaperSummary } from "@/types/past-paper";

const PAGE_LIMIT = 9;

interface StudentPastPapersPageContentProps {
  title: string;
  paperNumber: 1 | 2;
}

function filterClassicPapers(
  papers: PastPaperSummary[],
  searchTerm: string,
  classFilter: string,
  boardFilter: string,
  subjectFilter: string,
  yearFilter: string,
): PastPaperSummary[] {
  return papers.filter((paper) => {
    const matchesSearch =
      paper.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.year.toString().includes(searchTerm) ||
      paper.board.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (paper.session?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());

    const matchesClass = classFilter === "all" || paper.class === classFilter;
    const matchesBoard = boardFilter === "all" || paper.board === boardFilter;
    const matchesSubject = subjectFilter === "all" || paper.subject === subjectFilter;
    const matchesYear = yearFilter === "all" || paper.year.toString() === yearFilter;

    return matchesSearch && matchesClass && matchesBoard && matchesSubject && matchesYear;
  });
}

export default function StudentPastPapersPageContent({
  title,
  paperNumber,
}: StudentPastPapersPageContentProps) {
  const router = useRouter();
  const { user, isReady: isUserReady } = useStoredUser();
  const pastPapersQuery = useStudentPastPapers();

  const [browseMode, setBrowseMode] = useState<PastPaperBrowseMode>(PastPaperBrowseMode.CLASSIC);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [boardFilter, setBoardFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  // Classic view drills subject → papers. null = showing subject cards.
  const [selectedClassicSubject, setSelectedClassicSubject] = useState<string | null>(null);
  // By default the subject cards are scoped to the student's group/stream.
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [isBrowseModeReady, setIsBrowseModeReady] = useState(false);

  const browseModeStorageKey = user?.id
    ? `exboard_past_papers_browse_mode_v1:${user.id}`
    : null;

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

  useEffect(() => {
    if (!isUserReady) return;

    // If we can't determine user (no login), fall back to Classic immediately.
    if (!browseModeStorageKey) {
      setIsBrowseModeReady(true);
      return;
    }

    try {
      const storedMode = localStorage.getItem(browseModeStorageKey);
      if (
        storedMode === PastPaperBrowseMode.CLASSIC ||
        storedMode === PastPaperBrowseMode.YEARLY
      ) {
        setBrowseMode(storedMode);
      }
    } catch {
      // ignore storage read errors
    } finally {
      setIsBrowseModeReady(true);
    }
  }, [browseModeStorageKey, isUserReady]);

  useEffect(() => {
    if (!browseModeStorageKey || !isUserReady) return;
    try {
      localStorage.setItem(browseModeStorageKey, browseMode);
    } catch {
      // ignore storage write errors
    }
  }, [browseMode, browseModeStorageKey]);

  const clearFilters = () => {
    setSearchTerm("");
    setClassFilter(user?.class || "all");
    setBoardFilter(user?.board || "all");
    setSubjectFilter("all");
    setYearFilter("all");
    setSelectedClassicSubject(null);
    setShowAllSubjects(false);
    setCurrentPage(1);
  };

  const handleAttempt = (paperId: string) => {
    const route =
      paperNumber === 1
        ? FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT(paperId)
        : FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT_PAPER2(paperId);
    router.push(route);
  };

  const EmptyIcon = paperNumber === 2 ? P2SVG : P1SVG;

  const browseTabs = [
    { label: "Chapter Wise", value: PastPaperBrowseMode.CLASSIC, icon: SubjectsSVG },
    { label: "Year Wise", value: PastPaperBrowseMode.YEARLY, icon: HistorySVG },
  ];

  if (!isBrowseModeReady) {
    return (
      <PageContainer>
        <AppState
          isLoading={true}
          title="Loading your preferences..."
          description="Please wait."
          icon={EmptyIcon}
          fullScreen={false}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AppQueryState
        query={pastPapersQuery}
        loadingMessage="Loading past papers..."
        errorMessage="Failed to load past papers. Please try again."
        onRetry={() => pastPapersQuery.refetch()}
        fullScreen={false}
      >
        {(pastPapers) => {
          const papersForType = pastPapers.filter((paper) => paper.paperNumber === paperNumber);

          const availableYears = Array.from(
            new Set(papersForType.map((paper) => paper.year)),
          ).sort((a, b) => b - a);

          // Only surface subjects that actually have papers so the filter never
          // lists subjects with zero content.
          const availableSubjects = Array.from(
            new Set(papersForType.map((paper) => paper.subject)),
          ).sort((a, b) => a.localeCompare(b));

          const hasActiveFilters = Boolean(
            searchTerm ||
            classFilter !== "all" ||
            boardFilter !== "all" ||
            subjectFilter !== "all" ||
            yearFilter !== "all",
          );

          const filteredClassicPapers = filterClassicPapers(
            papersForType,
            searchTerm,
            classFilter,
            boardFilter,
            subjectFilter,
            yearFilter,
          );

          // Subject cards: group the filtered papers by subject with counts and board names.
          const allClassicSubjectGroups = Array.from(
            filteredClassicPapers.reduce((map, paper) => {
              const current = map.get(paper.subject) || { count: 0, boards: new Set<string>() };
              current.count += 1;
              if (paper.board) current.boards.add(paper.board);
              map.set(paper.subject, current);
              return map;
            }, new Map<string, { count: number; boards: Set<string> }>()),
          )
            .map(([subject, data]) => {
              let boardLabel: string | undefined = undefined;
              if (boardFilter !== "all") {
                boardLabel = boardFilter;
              } else if (data.boards.size === 1) {
                boardLabel = Array.from(data.boards)[0];
              } else if (data.boards.size > 1) {
                boardLabel =
                  user?.board && data.boards.has(user.board)
                    ? user.board
                    : Array.from(data.boards).join(", ");
              } else if (user?.board) {
                boardLabel = user.board;
              }

              return {
                subject,
                count: data.count,
                board: boardLabel,
              };
            })
            .sort((a, b) => a.subject.localeCompare(b.subject));

          // Default the subject cards to the student's group/stream (e.g. a
          // Pre Engineering student sees Physics/Chemistry/Maths first). The
          // student can still switch to "All subjects".
          const groupSubjects = user?.stream ? GROUP_SUBJECTS[user.stream] ?? [] : [];
          const groupScopedGroups =
            groupSubjects.length > 0 && !showAllSubjects
              ? allClassicSubjectGroups.filter((g) => groupSubjects.includes(g.subject))
              : allClassicSubjectGroups;
          // If the group has no papers yet, don't show an empty screen — fall back to all.
          const classicSubjectGroups =
            groupScopedGroups.length > 0 ? groupScopedGroups : allClassicSubjectGroups;
          const isGroupScoped =
            groupSubjects.length > 0 &&
            !showAllSubjects &&
            groupScopedGroups.length > 0 &&
            groupScopedGroups.length < allClassicSubjectGroups.length;

          // Once a subject card is opened, scope the paper list + pagination to it.
          const classicPapersInView = selectedClassicSubject
            ? filteredClassicPapers.filter((p) => p.subject === selectedClassicSubject)
            : filteredClassicPapers;

          const totalClassicPapers = classicPapersInView.length;
          const totalClassicPages = Math.max(
            1,
            Math.ceil(totalClassicPapers / PAGE_LIMIT),
          );
          const safeClassicPage = Math.min(currentPage, totalClassicPages);
          const classicStartIndex = (safeClassicPage - 1) * PAGE_LIMIT;
          const classicEndIndex = Math.min(classicStartIndex + PAGE_LIMIT, totalClassicPapers);
          const paginatedClassicPapers = classicPapersInView.slice(
            classicStartIndex,
            classicEndIndex,
          );

          const openClassicSubject = (subject: string) => {
            setSelectedClassicSubject(subject);
            setCurrentPage(1);
          };
          const backToClassicSubjects = () => {
            setSelectedClassicSubject(null);
            setCurrentPage(1);
          };

          const browseModeTabs = (
            <div className="w-full shrink-0">
              <AppTabs
                fullWidth
                tabs={browseTabs}
                activeTab={browseMode}
                onChange={(value) => {
                  setBrowseMode(value as PastPaperBrowseMode);
                  setSelectedClassicSubject(null);
                  setCurrentPage(1);
                }}
              />
            </div>
          );

            return (
              <>
                <PageHeader
                  title={title}
                  showLine
                  actions={<PaperHeaderSponsor placement={paperNumber === 1 ? "paper_1" : "paper_2"} />}
                />

              {browseMode === PastPaperBrowseMode.CLASSIC ? (
                <div className="space-y-6">
                  <AppSearch
                    searchLabel="Global Search"
                    placeholder="Search subject, year..."
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
                      {
                        id: "subject-filter",
                        label: "Subject",
                        value: subjectFilter,
                        onChange: (e) => {
                          setSubjectFilter(e.target.value);
                          setCurrentPage(1);
                        },
                        options: [
                          { value: "all", label: "Subjects" },
                          ...availableSubjects.map((sub) => ({ value: sub, label: sub })),
                        ],
                      },
                      {
                        id: "year-filter",
                        label: "Year",
                        value: yearFilter,
                        onChange: (e) => {
                          setYearFilter(e.target.value);
                          setCurrentPage(1);
                        },
                        options: [
                          { value: "all", label: "All Years" },
                          ...availableYears.map((year) => ({
                            value: year.toString(),
                            label: year.toString(),
                          })),
                        ],
                      },
                    ]}
                    resultsCount={filteredClassicPapers.length}
                    resultsLabel={`paper${filteredClassicPapers.length !== 1 ? "s" : ""} found${classFilter !== "all" ? ` · Class ${classFilter}` : ""}${boardFilter !== "all" ? ` · ${boardFilter}` : ""}${yearFilter !== "all" ? ` · ${yearFilter}` : ""}`}
                    onClearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />

                  {browseModeTabs}

                  <AppState
                    isEmpty={filteredClassicPapers.length === 0}
                    emptyMessage={
                      hasActiveFilters
                        ? "No examination papers found. Try adjusting your filters."
                        : "No past papers have been published yet."
                    }
                    title={hasActiveFilters ? "No Match Found" : "Library Empty"}
                    icon={EmptyIcon}
                    fullScreen={false}
                  >
                    {selectedClassicSubject === null ? (
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
                          {classicSubjectGroups.map(({ subject, count, board }) => (
                            <QuestionBankBrowseCard
                              key={subject}
                              title={subject}
                              board={board}
                              subtitle={`${count} paper${count !== 1 ? "s" : ""}`}
                              watermark={subject.slice(0, 2).toUpperCase()}
                              onClick={() => openClassicSubject(subject)}
                              dark
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {paginatedClassicPapers.map((paper) => (
                            <PastPaperCard
                              key={paper.id}
                              paper={paper}
                              variant="student"
                              onAttempt={handleAttempt}
                            />
                          ))}
                        </div>

                        {totalClassicPages > 1 ? (
                          <AppPagination
                            currentPage={safeClassicPage}
                            totalPages={totalClassicPages}
                            totalItems={totalClassicPapers}
                            pageSize={PAGE_LIMIT}
                            itemLabel="papers"
                            onPageChange={setCurrentPage}
                            className="pt-2"
                          />
                        ) : null}
                      </div>
                    )}
                  </AppState>
                </div>
              ) : (
                <PastPapersYearlyView
                  papers={papersForType}
                  paperNumber={paperNumber}
                  onAttempt={handleAttempt}
                  studentClass={user?.class ?? null}
                  studentBoard={user?.board ?? null}
                  afterSearch={browseModeTabs}
                />
              )}
            </>
          );
        }}
      </AppQueryState>
    </PageContainer>
  );
}
