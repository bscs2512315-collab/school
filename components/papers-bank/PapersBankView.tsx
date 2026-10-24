"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowRight,
  Plus,
  FileQuestion,
} from "lucide-react";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppSearch from "@/components/AppSearch";
import AppTabs from "@/components/AppTabs";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import { useStoredUser } from "@/hooks/useStoredUser";
import { useStudentCurriculums } from "@/hooks/student/useStudentCurriculums";
import { apiGet } from "@/lib/api/api-client";
import { getSubjectIcon } from "@/lib/generate/subject-icons";
import { cn } from "@/lib/utils";
import type { PaperBankItem } from "@/lib/papers-bank";
import PaperCard from "./PaperCard";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import GenerateSVG from "@/public/svgs/GenerateSVG";

interface SubjectSummaryCard {
  key: string;
  subject: string;
  classLevel: string;
  board: string;
  paper1Count: number;
  paper2Count: number;
  totalCount: number;
}

interface PapersBankViewProps {
  userRole?: string | null;
  baseRoute?: string;
}

export default function PapersBankView({
  userRole = "STUDENT",
  baseRoute = "/student",
}: PapersBankViewProps) {
  const router = useRouter();
  const { user, isReady } = useStoredUser();

  const isTeacher = userRole === "TEACHER" || userRole === "teacher";

  // Filter States (by default filtered as per user's details)
  const [boardFilter, setBoardFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"1" | "2">("1");
  const [showAllGrades, setShowAllGrades] = useState(false);

  // Data States
  const [papers, setPapers] = useState<PaperBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize filters from user profile
  useEffect(() => {
    if (user?.board) {
      setBoardFilter(user.board);
    }
    if (user?.class) {
      setClassFilter(user.class);
    }
  }, [user?.board, user?.class]);

  const hasActiveFilters = Boolean(
    searchTerm ||
    boardFilter !== "all" ||
    classFilter !== "all"
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setBoardFilter(user?.board || "all");
    setClassFilter(user?.class || "all");
    setShowAllGrades(false);
  };

  // Fetch papers from API
  const fetchPapers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ papers: PaperBankItem[]; total: number }>(
        `/papers-bank?limit=50`
      );
      if (res.success && res.data?.papers) {
        setPapers(res.data.papers);
      } else {
        setPapers([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load papers";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  // Compute Subject summary groups
  const subjectGroups = useMemo(() => {
    const map = new Map<string, SubjectSummaryCard>();

    for (const paper of papers) {
      const key = `${paper.subject}__${paper.classLevel}__${paper.board}`;
      const existing = map.get(key);
      if (existing) {
        if (paper.paperType === 1) existing.paper1Count++;
        else existing.paper2Count++;
        existing.totalCount++;
      } else {
        map.set(key, {
          key,
          subject: paper.subject,
          classLevel: paper.classLevel,
          board: paper.board,
          paper1Count: paper.paperType === 1 ? 1 : 0,
          paper2Count: paper.paperType === 2 ? 1 : 0,
          totalCount: 1,
        });
      }
    }

    // Also include standard curriculum subjects if no papers yet
    const standardSubjects = [
      { subject: "Physics", classLevel: user?.class || "IX", board: user?.board || "AKUEB" },
      { subject: "Chemistry", classLevel: user?.class || "IX", board: user?.board || "AKUEB" },
      { subject: "Biology", classLevel: user?.class || "IX", board: user?.board || "AKUEB" },
      { subject: "Mathematics", classLevel: user?.class || "IX", board: user?.board || "AKUEB" },
      { subject: "English", classLevel: user?.class || "IX", board: user?.board || "AKUEB" },
      { subject: "Urdu", classLevel: user?.class || "IX", board: user?.board || "AKUEB" },
      { subject: "Computer Science", classLevel: user?.class || "IX", board: user?.board || "AKUEB" },
    ];

    for (const s of standardSubjects) {
      const key = `${s.subject}__${s.classLevel}__${s.board}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          subject: s.subject,
          classLevel: s.classLevel,
          board: s.board,
          paper1Count: 0,
          paper2Count: 0,
          totalCount: 0,
        });
      }
    }

    return Array.from(map.values());
  }, [papers, user?.class, user?.board]);

  // Filter subject groups based on user filter selections
  const filteredSubjectGroups = useMemo(() => {
    return subjectGroups.filter((g) => {
      const matchesSearch =
        !searchTerm.trim() ||
        g.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.board.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.classLevel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBoard =
        boardFilter === "all" ||
        g.board.toLowerCase().includes(boardFilter.toLowerCase());

      const matchesClass =
        showAllGrades || classFilter === "all" || g.classLevel === classFilter;

      return matchesSearch && matchesBoard && matchesClass;
    });
  }, [subjectGroups, searchTerm, boardFilter, classFilter, showAllGrades]);

  // Selected subject object
  const selectedSubjectGroup = useMemo(() => {
    if (!selectedSubjectKey) return null;
    return subjectGroups.find((g) => g.key === selectedSubjectKey) || null;
  }, [selectedSubjectKey, subjectGroups]);

  // Papers inside selected subject and tab
  const papersInSelectedSubject = useMemo(() => {
    if (!selectedSubjectGroup) return [];

    return papers.filter((p) => {
      const matchesSubject =
        p.subject.toLowerCase() === selectedSubjectGroup.subject.toLowerCase() &&
        p.classLevel.toLowerCase() === selectedSubjectGroup.classLevel.toLowerCase() &&
        p.board.toLowerCase() === selectedSubjectGroup.board.toLowerCase();

      const matchesTab = String(p.paperType) === activeTab;

      const matchesSearch =
        !searchTerm.trim() ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.chapterNames.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSubject && matchesTab && matchesSearch;
    });
  }, [papers, selectedSubjectGroup, activeTab, searchTerm]);

  const handleGenerateNew = () => {
    if (isTeacher) {
      router.push("/teacher/create-paper");
    } else {
      router.push(
        selectedSubjectGroup
          ? `/student/generate?subject=${encodeURIComponent(selectedSubjectGroup.subject)}`
          : "/student/generate"
      );
    }
  };

  const generateButton = (
    <AppButton
      onClick={handleGenerateNew}
      className="h-10 rounded-xl px-5 text-xs font-black uppercase tracking-wider shadow-md gap-1.5 w-full sm:w-auto"
    >
      <Plus className="size-4 stroke-[3]" />
      <span>Generate New Paper</span>
    </AppButton>
  );

  return (
    <PageContainer className="w-full max-w-7xl space-y-6 pb-24 sm:pb-32">
      <PageHeader
        title={selectedSubjectGroup ? `${selectedSubjectGroup.subject} Papers Bank` : "Papers Bank"}
        onBack={selectedSubjectGroup ? () => setSelectedSubjectKey(null) : undefined}
        showLine
        actions={generateButton}
        actionsFullWidth
      />

      {/* 🔍 Global Search & Filters Bar */}
      <AppSearch
        searchLabel="Global Search"
        placeholder={
          selectedSubjectKey
            ? "Search papers by chapter, title, or creator in this subject..."
            : "Search subjects, chapters, paper titles, or creators..."
        }
        searchTerm={searchTerm}
        onSearchChange={(value) => setSearchTerm(value)}
        dropdowns={[
          {
            id: "class-filter",
            label: "Level",
            value: classFilter,
            onChange: (e) => setClassFilter(e.target.value),
            options: [
              { value: "all", label: "All Grades" },
              { value: "IX", label: "Class IX (9th)" },
              { value: "X", label: "Class X (10th)" },
              { value: "XI", label: "Class XI (1st Year)" },
              { value: "XII", label: "Class XII (2nd Year)" },
            ],
          },
          {
            id: "board-filter",
            label: "Board",
            value: boardFilter,
            onChange: (e) => setBoardFilter(e.target.value),
            options: [
              { value: "all", label: "All Boards" },
              { value: "AKUEB", label: "Aga Khan (AKUEB)" },
              { value: "Sindh Board", label: "Sindh Board" },
              { value: "Federal Board", label: "Federal Board" },
            ],
          },
        ]}
        resultsCount={
          selectedSubjectKey
            ? papersInSelectedSubject.length
            : filteredSubjectGroups.length
        }
        resultsLabel={
          selectedSubjectKey
            ? `paper${papersInSelectedSubject.length !== 1 ? "s" : ""} found`
            : `subject${filteredSubjectGroups.length !== 1 ? "s" : ""} found`
        }
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ================= STEP 1: SUBJECT CARDS GRID ================= */}
      {!selectedSubjectKey && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <SyllabusSVG className="size-3.5 text-primary" />
              Select Subject to Explore Papers ({filteredSubjectGroups.length})
            </h2>

            {user?.class && (
              <button
                type="button"
                onClick={() => setShowAllGrades((prev) => !prev)}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                {showAllGrades
                  ? `Filter to My Class (${user.class})`
                  : "Show All Grades"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <AppLoader />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-xs text-destructive space-y-3">
              <p>{error}</p>
              <AppButton variant="outline" onClick={fetchPapers} className="rounded-xl text-xs">
                Retry
              </AppButton>
            </div>
          ) : filteredSubjectGroups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center space-y-3">
              <BookOpen className="mx-auto size-10 text-muted-foreground opacity-50" />
              <h3 className="text-base font-bold text-foreground">No Subjects Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No subjects matching your active filter. Try resetting your search or selecting a different board/grade.
              </p>
              <AppButton
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setBoardFilter("all");
                  setClassFilter("all");
                }}
                className="rounded-xl text-xs font-bold"
              >
                Reset Filters
              </AppButton>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredSubjectGroups.map((grp) => {
                const Icon = getSubjectIcon(grp.subject);
                const totalPapers = grp.totalCount;

                return (
                  <button
                    key={grp.key}
                    type="button"
                    onClick={() => setSelectedSubjectKey(grp.key)}
                    className="group relative flex h-full min-h-60 sm:min-h-68 w-full flex-col overflow-hidden rounded-3xl bg-primary p-5 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl text-center select-none cursor-pointer"
                  >
                    {/* Ambient Lighting & Glows */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                      <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
                      <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
                      <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

                      <Icon
                        aria-hidden
                        className="pointer-events-none absolute -right-4 -top-2 size-36 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 sm:size-40"
                      />
                      <Icon
                        aria-hidden
                        className="pointer-events-none absolute -bottom-6 -left-4 size-24 text-primary-foreground/10 sm:size-28"
                      />
                    </div>

                    {/* Top Tag: Paper Count Badge */}
                    <div className="relative z-20 flex items-start justify-end w-full min-h-6">
                      {totalPapers > 0 ? (
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs ring-1 ring-white/30">
                          {totalPapers} {totalPapers === 1 ? "Paper" : "Papers"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-xs">
                          0 Papers
                        </span>
                      )}
                    </div>

                    {/* Centered Hero Body */}
                    <div className="relative z-10 flex flex-1 flex-col items-center justify-center mt-1">
                      <div className="mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105">
                        <Icon className="size-7 sm:size-8 text-primary-foreground" />
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-primary-foreground line-clamp-2">
                        {grp.subject}
                      </h3>

                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
                          Class {grp.classLevel} · {grp.board}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
                          {grp.paper1Count} P1 · {grp.paper2Count} P2
                        </p>
                      </div>
                    </div>

                    {/* Centered Pill Action Button */}
                    <div className="relative z-10 mt-4 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
                        <ArrowRight className="size-3.5" />
                        Open
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 2: INSIDE SUBJECT VIEW (PAPER 1 & PAPER 2 TABS) ================= */}
      {selectedSubjectGroup && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Two Tabs: Paper 1 and Paper 2 */}
          <div className="flex items-center justify-center sm:justify-start">
            <div className="inline-flex rounded-2xl border border-border/80 bg-card p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("1")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer",
                  activeTab === "1"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <P1SVG className="size-4 shrink-0" />
                <span>Paper 1</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.2 text-[10px] font-black",
                    activeTab === "1"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {selectedSubjectGroup.paper1Count}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("2")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer",
                  activeTab === "2"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <P2SVG className="size-4 shrink-0" />
                <span>Paper 2</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.2 text-[10px] font-black",
                    activeTab === "2"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {selectedSubjectGroup.paper2Count}
                </span>
              </button>
            </div>
          </div>

          {/* Paper Cards Grid */}
          {papersInSelectedSubject.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileQuestion className="size-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  No Paper {activeTab} Examination Papers Available Yet
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Be the first to generate a Paper {activeTab} for {selectedSubjectGroup.subject} (Class {selectedSubjectGroup.classLevel}). Once generated, it will be automatically indexed here for reusability!
                </p>
              </div>

              <AppButton
                onClick={handleGenerateNew}
                className="h-10 rounded-xl px-6 text-xs font-black uppercase tracking-wider shadow-md gap-2"
              >
                <GenerateSVG className="size-4" />
                <span>Generate Paper {activeTab} with AI</span>
              </AppButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {papersInSelectedSubject.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  userRole={userRole}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
