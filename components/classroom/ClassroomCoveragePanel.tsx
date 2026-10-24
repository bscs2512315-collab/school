"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
} from "lucide-react";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import AlertCircleSVG from "@/public/svgs/AlertCircleSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import AppInput from "@/components/AppInput";
import AppSelect from "@/components/AppSelect";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { ClassroomCoverageReport, ChapterCoverage, MappedSloItem } from "@/lib/paper/slo-coverage";

import GenerateChapterTestModal from "@/components/classroom/GenerateChapterTestModal";

interface ClassroomCoveragePanelProps {
  classroomId: string;
  isTeacher: boolean;
  onNavigateToCreateTest?: (chapterId?: string) => void;
  onNavigateToDrafts?: () => void;
}

type StatusFilter = "all" | "covered" | "uncovered";

function getCognitiveLevelLabel(level: string): { label: string; bg: string; text: string } {
  switch (level?.toUpperCase()) {
    case "R":
      return { label: "Remembering", bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-600 dark:text-blue-400" };
    case "K":
      return { label: "Remembering / Knowledge", bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-600 dark:text-blue-400" };
    case "U":
      return { label: "Understanding", bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-600 dark:text-purple-400" };
    case "A":
    case "AP":
      return { label: "Application & Beyond", bg: "bg-primary/10 border-primary/20", text: "text-primary" };
    case "AN":
      return { label: "Analysis", bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600 dark:text-amber-400" };
    case "E":
      return { label: "Evaluation", bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" };
    case "C":
      return { label: "Creating", bg: "bg-pink-500/10 border-pink-500/20", text: "text-pink-600 dark:text-pink-400" };
    case "FA":
      return { label: "Formative Assessment", bg: "bg-slate-500/10 border-slate-500/20", text: "text-slate-600 dark:text-slate-300" };
    case "CA":
      return { label: "Classroom Activity", bg: "bg-slate-500/10 border-slate-500/20", text: "text-slate-600 dark:text-slate-300" };
    default:
      return { label: level || "Outcome", bg: "bg-muted border-border", text: "text-muted-foreground" };
  }
}

export default function ClassroomCoveragePanel({
  classroomId,
  isTeacher,
  onNavigateToCreateTest,
  onNavigateToDrafts,
}: ClassroomCoveragePanelProps) {
  const router = useRouter();
  const [report, setReport] = useState<ClassroomCoverageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Chapter Test Generation Modal State
  const [modalChapter, setModalChapter] = useState<ChapterCoverage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Per-SLO "Tested in" refs expand state
  const [expandedPaperRefs, setExpandedPaperRefs] = useState<Record<string, boolean>>({});

  const loadCoverage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<ClassroomCoverageReport>(API_ENDPOINTS.CLASSROOMS.COVERAGE(classroomId));
      if (res.success && res.data) {
        setReport(res.data);
        setExpandedChapters({});
      } else {
        setError(res.message || "Failed to load syllabus coverage report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoverage();
  }, [classroomId]);

  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const toggleExpandAll = () => {
    const isAllExpanded =
      filteredChapters.length > 0 &&
      filteredChapters.every((ch) => Boolean(expandedChapters[ch.chapterId]));

    if (isAllExpanded) {
      setExpandedChapters({});
    } else {
      const next: Record<string, boolean> = {};
      filteredChapters.forEach((ch) => {
        next[ch.chapterId] = true;
      });
      setExpandedChapters(next);
    }
  };

  // Filtered chapters & SLOs
  const filteredChapters = useMemo(() => {
    if (!report?.chapters) return [];

    return report.chapters
      .filter((ch) => selectedChapterId === "all" || ch.chapterId === selectedChapterId)
      .map((ch) => {
        const filteredSubtopics = ch.subtopics
          .map((sub) => {
            const filteredSlos = sub.slos.filter((slo) => {
              // Status filter
              if (statusFilter === "covered" && !slo.isCovered) return false;
              if (statusFilter === "uncovered") {
                const cog = slo.cognitiveLevel?.toUpperCase();
                const isCA = slo.isClassroomActivity || cog === "CA" || cog === "FA";
                if (slo.isCovered || isCA) return false;
              }

              // Search query
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchNumber = slo.sloNumber.toLowerCase().includes(q);
                const matchText = slo.sloText.toLowerCase().includes(q);
                const matchTopic = sub.subtopicName.toLowerCase().includes(q);
                if (!matchNumber && !matchText && !matchTopic) return false;
              }

              return true;
            });

            return {
              ...sub,
              slos: filteredSlos,
            };
          })
          .filter((sub) => sub.slos.length > 0);

        return {
          ...ch,
          subtopics: filteredSubtopics,
        };
      })
      .filter((ch) => ch.subtopics.length > 0);
  }, [report, selectedChapterId, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <AppLoader />
        <p className="text-xs font-semibold text-muted-foreground animate-pulse">
          Analyzing syllabus & exam question mappings...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
        <AlertCircleSVG className="size-8 mx-auto text-destructive" />
        <h4 className="text-base font-bold text-foreground">Failed to Load Coverage</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">{error || "No coverage data available"}</p>
        <AppButton
          type="button"
          variant="outline"
          className="rounded-xl h-9 px-4 text-xs font-semibold"
          onClick={() => window.location.reload()}
        >
          Retry
        </AppButton>
      </div>
    );
  }

  const { summary, classroom } = report;

  if (report.chapters.length === 0) {
    const boardName = classroom.board || "your education board";
    return (
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                <GenerateSVG className="size-3.5" />
                <span>Syllabus & SLO Mastery Tracker</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                {classroom.subject} · Class {classroom.classLevel} ({boardName})
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                Track which Student Learning Outcomes (SLOs) have been assessed in assigned tests and identify untested learning areas in the curriculum.
              </p>
            </div>
          </div>
        </div>

        {/* Dedicated Curriculum Under Preparation Card */}
        <div className="rounded-3xl border border-dashed border-border/80 bg-card p-10 sm:p-14 text-center shadow-xs space-y-4">
          <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <BookOpen className="size-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
              <AlertCircleSVG className="size-3.5" />
              <span>Curriculum in Progress</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              We are currently working on {boardName}
            </h4>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed">
              Your {classroom.subject} (Class {classroom.classLevel}) syllabus and SLO tracking for <strong className="text-foreground">{boardName}</strong> will be available soon.
            </p>
          </div>
          {isTeacher ? (
            <div className="pt-2">
              <AppButton
                type="button"
                onClick={() => {
                  if (onNavigateToCreateTest) {
                    onNavigateToCreateTest();
                  } else {
                    router.push(`${FRONTEND_ROUTES.TEACHER_CREATE_PAPER}?classroomId=${encodeURIComponent(classroomId)}`);
                  }
                }}
                className="rounded-xl h-10 px-5 text-xs font-bold shadow-xs inline-flex items-center gap-2"
              >
                <Plus className="size-4" />
                Assign Practice Test
              </AppButton>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & High-Level Metrics */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <GenerateSVG className="size-3.5" />
              <span>Syllabus & SLO Mastery Tracker</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {classroom.subject} · {classroom.classLevel} Coverage
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Track which Student Learning Outcomes (SLOs) have been assessed in assigned tests and identify untested learning areas in the {classroom.board} curriculum.
            </p>
          </div>

          {/* Quick Stats Grid - Top Performers Card Styling */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {/* Overall Coverage Card */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/20 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl min-w-[130px]">
              {/* Ambient Background & Watermark */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
                <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                <div
                  className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <SyllabusSVG
                  aria-hidden
                  className="pointer-events-none absolute -bottom-2 -right-2 size-18 text-white/15 transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="relative z-10 flex flex-col justify-between h-full">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/90 drop-shadow-2xs flex items-center gap-1">
                  <SyllabusSVG className="size-3.5 text-white" />
                  Exam Coverage
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                    {summary.coveragePercentage}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-black/25 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${summary.coveragePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Covered SLOs Card */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/20 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl min-w-[130px]">
              {/* Ambient Background & Watermark */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
                <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                <div
                  className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <CheckCircleSVG
                  aria-hidden
                  className="pointer-events-none absolute -bottom-2 -right-2 size-18 text-white/15 transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="relative z-10 flex flex-col justify-between h-full">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/90 flex items-center gap-1 drop-shadow-2xs">
                  <CheckCircleSVG className="size-3.5" />
                  Covered
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                    {summary.coveredSlosCount}
                  </span>
                  <span className="text-xs text-white/80 font-semibold">
                    / {summary.totalSlos}
                  </span>
                </div>
                <span className="text-[11px] text-white/80 font-semibold mt-1">
                  SLOs tested
                </span>
              </div>
            </div>

            {/* Left / Untested Card */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-300/30 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl min-w-[130px]">
              {/* Ambient Background & Watermark */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute inset-0 bg-linear-to-br from-[#f59e0b] via-[#d97706] to-[#b45309]" />
                <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                <div
                  className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <AlertCircleSVG
                  aria-hidden
                  className="pointer-events-none absolute -bottom-2 -right-2 size-18 text-white/15 transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="relative z-10 flex flex-col justify-between h-full">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1 drop-shadow-2xs">
                  <AlertCircleSVG className="size-3.5" />
                  Left / Untested
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                    {summary.uncoveredSlosCount}
                  </span>
                  <span className="text-xs text-white/80 font-semibold">
                    remaining
                  </span>
                </div>
                <span className="text-[11px] text-white/80 font-semibold mt-1">
                  Gaps to cover
                </span>
              </div>
            </div>

            {/* Total Questions Mapped Card */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-blue-300/30 p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl min-w-[130px]">
              {/* Ambient Background & Watermark */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="absolute inset-0 bg-linear-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]" />
                <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
                <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
                <div
                  className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                  style={{
                    backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <BookOpenSVG
                  aria-hidden
                  className="pointer-events-none absolute -bottom-2 -right-2 size-18 text-white/15 transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="relative z-10 flex flex-col justify-between h-full">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1 drop-shadow-2xs">
                  <BookOpenSVG className="size-3.5 text-white" />
                  Questions
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                    {summary.totalQuestions}
                  </span>
                </div>
                <span className="text-[11px] text-white/80 font-semibold mt-1 truncate">
                  Across {summary.totalPapers} tests
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-3 rounded-2xl shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SLO code (e.g. 15.1) or keyword (e.g. Quadratic)..."
            className="w-full rounded-xl border border-border bg-muted/30 pl-9 pr-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-hidden transition-all"
          />
        </div>

        {/* Chapter Select */}
        <div className="flex items-center gap-2">
          <div className="w-full sm:w-64">
            <AppSelect
              value={selectedChapterId}
              searchable
              placeholder="All Chapters"
              className="h-9 rounded-xl px-3 text-xs font-semibold"
              options={[
                { value: "all", label: `All Chapters (${report.chapters.length})` },
                ...report.chapters.map((ch) => ({
                  value: ch.chapterId,
                  label: `Ch ${ch.chapterNumber}: ${ch.chapterName} (${ch.coveragePercentage}%)`,
                })),
              ]}
              onChange={(e) => setSelectedChapterId(e.target.value)}
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/80">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                statusFilter === "all"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("covered")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                statusFilter === "covered"
                  ? "bg-primary/15 text-primary font-black shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CheckCircleSVG className="size-3.5" />
              Covered
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("uncovered")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                statusFilter === "uncovered"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <AlertCircleSVG className="size-3.5" />
              Left
            </button>
          </div>

          {/* Expand / Collapse All Button */}
          {filteredChapters.length > 0 ? (
            <button
              type="button"
              onClick={toggleExpandAll}
              className="px-3 py-2 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title={
                filteredChapters.every((ch) => Boolean(expandedChapters[ch.chapterId]))
                  ? "Collapse all chapters"
                  : "Expand all chapters"
              }
            >
              {filteredChapters.every((ch) => Boolean(expandedChapters[ch.chapterId])) ? (
                <>
                  <ChevronUp className="size-3.5" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" />
                  <span>Expand All</span>
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Chapters List */}
      {filteredChapters.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
          <BookOpen className="size-10 mx-auto text-muted-foreground/60" />
          <h4 className="text-base font-bold text-foreground">No SLOs Match Your Filter</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query or selecting a different chapter or status filter.
          </p>
          <AppButton
            type="button"
            variant="outline"
            className="rounded-xl h-8 px-4 text-xs font-bold"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setSelectedChapterId("all");
            }}
          >
            Clear Filters
          </AppButton>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChapters.map((chapter) => {
            const isExpanded = Boolean(expandedChapters[chapter.chapterId]);
            return (
              <div
                key={chapter.chapterId}
                className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Chapter Accordion Header */}
                <div
                  onClick={() => toggleChapterExpand(chapter.chapterId)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="size-8 rounded-xl bg-muted hidden sm:flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          Chapter {chapter.chapterNumber}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-foreground">
                          {chapter.chapterName}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {chapter.coveredSlos} of {chapter.totalSlos} SLOs tested ({chapter.coveragePercentage}% coverage)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center sm:justify-end">
                    {/* Chapter Progress Bar */}
                    <div className="w-28 sm:w-36 hidden sm:block">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary">{chapter.coveragePercentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${chapter.coveragePercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Teacher Quick Action to create test for remaining SLOs */}
                    {isTeacher && (
                      <>
                        {/* Mobile expand/collapse dropdown inline with Test button */}
                        <button
                          type="button"
                          className="flex-1 sm:hidden px-3 py-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/70 text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChapterExpand(chapter.chapterId);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                          <span>{isExpanded ? "Collapse" : "Expand"}</span>
                        </button>

                        <AppButton
                          type="button"
                          className="rounded-xl h-9 w-full flex-1 sm:flex-none sm:w-44 px-3.5 text-xs font-bold shrink-0 justify-center whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs inline-flex items-center gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalChapter(chapter);
                            setIsModalOpen(true);
                          }}
                        >
                          <GenerateSVG className="size-3.5 mr-1" />
                          {chapter.coveredSlos === 0 ? "Assign Test" : "Test Untested SLOs"}
                        </AppButton>
                      </>
                    )}
                  </div>
                </div>

                {/* Subtopics & SLOs List */}
                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/10 p-5 space-y-6">
                    {chapter.subtopics.map((subtopic) => (
                      <div key={subtopic.subtopicNumber} className="space-y-3">
                        {/* Subtopic Header */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-muted-foreground">
                            {subtopic.subtopicNumber}
                          </span>
                          <h5 className="text-xs sm:text-sm font-bold text-foreground">
                            {subtopic.subtopicName}
                          </h5>
                          <span className="text-[11px] font-semibold text-muted-foreground ml-auto">
                            {(() => {
                              const testable = subtopic.slos.filter(
                                (s) => !s.isClassroomActivity && s.cognitiveLevel?.toUpperCase() !== "CA" && s.cognitiveLevel?.toUpperCase() !== "FA",
                              );
                              const coveredCount = testable.filter((s) => s.isCovered).length;
                              if (testable.length === 0) {
                                return "Formative Assessment · Non-examinable";
                              }
                              return `${coveredCount} / ${testable.length} Covered`;
                            })()}
                          </span>
                        </div>

                        {/* Individual SLO Cards */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {subtopic.slos.map((slo) => {
                            const cogLevel = slo.cognitiveLevel?.toUpperCase();
                            const isCA =
                              slo.isClassroomActivity ||
                              cogLevel === "CA" ||
                              cogLevel === "FA";
                            const cog = getCognitiveLevelLabel(slo.cognitiveLevel);
                            return (
                              <div
                                key={slo.sloNumber}
                                className={cn(
                                  "rounded-2xl border p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                                  isCA
                                    ? "bg-card border-border/70 hover:border-border"
                                    : slo.isCovered
                                      ? "bg-card border-primary/20 hover:border-primary/40"
                                      : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30",
                                )}
                              >
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={cn(
                                        "text-[11px] font-black px-2 py-0.5 rounded-md border",
                                        isCA
                                          ? "bg-muted border-border text-foreground/80 dark:text-muted-foreground"
                                          : slo.isCovered
                                            ? "bg-primary/10 border-primary/20 text-primary"
                                            : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
                                      )}
                                    >
                                      SLO {slo.sloNumber}
                                    </span>

                                    <span
                                      className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                        cog.bg,
                                        cog.text,
                                      )}
                                    >
                                      {cog.label}
                                    </span>

                                    {/* Student Mastery Badge if available */}
                                    {slo.studentPerformance && slo.studentPerformance.totalMarks > 0 ? (
                                      <span
                                        className={cn(
                                          "text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
                                          slo.studentPerformance.status === "mastered"
                                            ? "bg-primary/10 border-primary/30 text-primary"
                                            : "bg-rose-500/10 border-rose-500/30 text-rose-600",
                                        )}
                                      >
                                        My Mastery: {slo.studentPerformance.masteryPercentage}%
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                                    {slo.sloText}
                                  </p>

                                  {/* Test references if covered */}
                                  {slo.isCovered && slo.papersCoveredIn.length > 0 ? (
                                    <div className="space-y-1.5 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const key = `${chapter.chapterId}::${slo.sloNumber}`;
                                          setExpandedPaperRefs((prev) => ({
                                            ...prev,
                                            [key]: !prev[key],
                                          }));
                                        }}
                                        className={cn(
                                          "w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer",
                                          expandedPaperRefs[`${chapter.chapterId}::${slo.sloNumber}`]
                                            ? "bg-primary/10 border-primary/30 text-primary"
                                            : "bg-muted/60 border-border text-muted-foreground hover:text-foreground hover:bg-muted/90",
                                        )}
                                      >
                                        {expandedPaperRefs[`${chapter.chapterId}::${slo.sloNumber}`] ? (
                                          <ChevronUp className="size-3.5" />
                                        ) : (
                                          <Eye className="size-3.5" />
                                        )}
                                        {expandedPaperRefs[`${chapter.chapterId}::${slo.sloNumber}`]
                                          ? `Hide Tests (${slo.papersCoveredIn.length})`
                                          : `View Tests (${slo.papersCoveredIn.length})`}
                                      </button>
                                      {expandedPaperRefs[`${chapter.chapterId}::${slo.sloNumber}`] ? (
                                        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1.5 -mx-1 px-1">
                                          {slo.papersCoveredIn.map((pRef, idx) => (
                                            <span
                                              key={`${pRef.paperId}-${idx}`}
                                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border flex items-center gap-1 whitespace-nowrap shrink-0"
                                            >
                                              {pRef.paperTitle} · Q{pRef.questionNumber}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>

                                {/* Status Tag on Right */}
                                <div className="shrink-0 self-start sm:self-center">
                                  {slo.isCovered ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
                                      <CheckCircleSVG className="size-4" />
                                      Covered ({slo.coveredCount})
                                    </span>
                                  ) : isCA ? (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-300 text-xs font-bold shadow-2xs"
                                      title="Formative Assessment · Non-examinable"
                                    >
                                      <BookOpen className="size-3.5" />
                                      {slo.cognitiveLevel?.toUpperCase() === "FA" ? "Formative Assessment" : "Classroom Activity"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-2xs">
                                      <AlertCircleSVG className="size-4" />
                                      Not Yet Tested
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chapter Test Generation Modal */}
      <GenerateChapterTestModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalChapter(null);
        }}
        classroomId={classroomId}
        chapter={modalChapter}
        classroom={report.classroom}
        onDraftCreated={() => {
          onNavigateToDrafts?.();
        }}
        onSuccess={() => {
          void loadCoverage();
        }}
      />
    </div>
  );
}
