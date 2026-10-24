"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import StudentsSVG from "@/public/svgs/StudentsSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import MedalSVG from "@/public/svgs/MedalSVG";
import MilestonesSVG from "@/public/svgs/MilestonesSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ZapSVG from "@/public/svgs/ZapSVG";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiGet } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import AppState from "@/components/AppState";
import AppDropdown from "@/components/AppDropdown";
import AppLoader from "@/components/AppLoader";

interface DifficultyTierStat {
  attempted: number;
  earned: number;
  possible: number;
  percentage: number;
}

interface RecentAttempt {
  attemptId: string;
  paperTitle: string;
  fullTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  gradingStatus: string;
  submittedAt: string;
}

interface ChapterPerformance {
  chapterId: string;
  chapterNumber: number;
  chapterName: string;
  totalSlos?: number;
  coveredSlos?: number;
  sloCoveragePercentage?: number;
  testsAssigned: number;
  testsAttempted: number;
  marksEarned: number;
  marksPossible: number;
  accuracyPercentage: number;
  bestScorePercentage: number;
  status: "Mastered" | "In Progress" | "Needs Practice" | "Not Started" | "Not Assigned";
  difficultyBreakdown: {
    alpha: DifficultyTierStat;
    beta: DifficultyTierStat;
    gamma: DifficultyTierStat;
  };
  recentAttempts: RecentAttempt[];
}

interface PerformanceSummary {
  overallPercentage: number;
  totalMarksEarned: number;
  totalMarksPossible: number;
  totalTestsAssigned: number;
  totalTestsAttempted: number;
  gradedAttemptsCount: number;
  strongestChapter: { name: string; percentage: number } | null;
  focusChapter: { name: string; percentage: number } | null;
  difficultyBreakdown: {
    alpha: DifficultyTierStat;
    beta: DifficultyTierStat;
    gamma: DifficultyTierStat;
  };
  totalSyllabusChapters?: number;
  assignedChaptersCount?: number;
  unassignedChaptersCount?: number;
  totalSlos?: number;
  coveredSlosCount?: number;
  uncoveredSlosCount?: number;
  syllabusCoveragePercentage?: number;
}

interface PerformanceData {
  classroom: {
    id: string;
    name: string;
    subject: string;
    classLevel: string;
  };
  student: { id: string; name: string; email: string } | null;
  summary: PerformanceSummary;
  chapters: ChapterPerformance[];
}

interface ClassroomMemberItem {
  id: string;
  studentId: string;
  name: string;
  email: string;
  status?: string;
}

export default function ClassroomStudentPerformancePanel({
  classroomId,
  studentId: initialStudentId,
  isTeacher = false,
}: {
  classroomId: string;
  studentId?: string;
  isTeacher?: boolean;
}) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || "",
  );
  const [members, setMembers] = useState<ClassroomMemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & interaction state
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(new Set());
  const [filterTab, setFilterTab] = useState<"all" | "assigned" | "unassigned">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleChapter = (chapterId: string) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  // If teacher, fetch classroom members for the student switcher
  useEffect(() => {
    if (!isTeacher) return;
    let mounted = true;
    (async () => {
      setLoadingMembers(true);
      try {
        const res = await apiGet<ClassroomMemberItem[]>(
          API_ENDPOINTS.TEACHER.CLASSROOM_MEMBERS(classroomId),
        );
        if (mounted && res.success && Array.isArray(res.data)) {
          setMembers(res.data);
        }
      } catch {
        // silence
      } finally {
        if (mounted) setLoadingMembers(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [classroomId, isTeacher]);

  // Fetch performance report (student-specific or classroom aggregate)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = API_ENDPOINTS.STUDENT.CLASSROOM_PERFORMANCE(classroomId);
        const queryId = isTeacher ? selectedStudentId : initialStudentId;
        if (queryId) {
          endpoint += `?studentId=${encodeURIComponent(queryId)}`;
        }
        const res = await apiGet<PerformanceData>(endpoint);
        if (!mounted) return;
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || "Failed to load performance data");
        }
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Error loading performance",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [classroomId, isTeacher, selectedStudentId, initialStudentId]);

  const assignedCount = useMemo(() => {
    return data?.chapters.filter((c) => c.testsAssigned > 0).length || 0;
  }, [data]);

  const unassignedCount = useMemo(() => {
    return data?.chapters.filter((c) => c.testsAssigned === 0).length || 0;
  }, [data]);

  const filteredChapters = useMemo(() => {
    if (!data) return [];
    return data.chapters.filter((ch) => {
      if (filterTab === "assigned" && ch.testsAssigned === 0) return false;
      if (filterTab === "unassigned" && ch.testsAssigned > 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = ch.chapterName.toLowerCase().includes(q);
        const matchNum = `ch ${ch.chapterNumber}`.toLowerCase().includes(q) || String(ch.chapterNumber) === q;
        if (!matchName && !matchNum) return false;
      }
      return true;
    });
  }, [data, filterTab, searchQuery]);

  if (loading) {
    return <AppLoader className="min-h-[350px] w-full flex-1" />;
  }

  if (error || !data) {
    return (
      <AppState
        variant="error"
        title="Could not load performance"
        description={error || "Please check your network connection and try again."}
        fullScreen={false}
      />
    );
  }

  const { summary, student } = data;
  const hasAttempts = summary.totalTestsAttempted > 0;
  const totalSyllabus = summary.totalSyllabusChapters ?? data.chapters.length;
  const assignedChapters = summary.assignedChaptersCount ?? assignedCount;
  const totalSlos = summary.totalSlos ?? 0;
  const coveredSlos = summary.coveredSlosCount ?? 0;
  const uncoveredSlos =
    summary.uncoveredSlosCount ?? (totalSlos > 0 ? Math.max(0, totalSlos - coveredSlos) : 0);
  const coveragePct =
    summary.syllabusCoveragePercentage ??
    (totalSlos > 0
      ? Math.round((coveredSlos / totalSlos) * 100)
      : totalSyllabus > 0
        ? Math.round((assignedChapters / totalSyllabus) * 100)
        : 0);

  const studentOptions = [
    { value: "", label: "📊 All Students (Class Aggregate)" },
    ...members.map((m) => ({
      value: m.studentId || m.id,
      label: `${m.name} (${m.email})`,
    })),
  ];

  return (
    <div className="space-y-8">
      {/* Teacher Filter Controls with Reusable AppDropdown */}
      {isTeacher ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
              <StudentsSVG className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Classroom Scope
              </p>
              <p className="text-sm font-black text-foreground">
                {student
                  ? `${student.name} (${student.email})`
                  : `Classroom Aggregate (${members.length} enrolled student${members.length === 1 ? "" : "s"})`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              Filter Student:
            </span>
            <div className="w-full sm:w-80">
              <AppDropdown
                id="student-filter"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={loadingMembers}
                placeholder="Select a student..."
                options={studentOptions}
                className="h-10 text-xs font-bold"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* 1. Overall Classroom Summary Cards with Syllabus Coverage */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Syllabus Progress Coverage */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-light/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-primary via-primary to-primary-dark">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
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
              className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                <SyllabusSVG className="size-3.5 text-white" />
                Syllabus Covered
              </span>
              <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                Coverage
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                {coveragePct}%
              </span>
              <span className="text-xs text-white/80 font-semibold">
                {totalSlos > 0
                  ? `(${coveredSlos}/${totalSlos} SLOs)`
                  : `(${assignedChapters}/${totalSyllabus})`}
              </span>
            </div>

            <div className="mt-2 w-full bg-black/25 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${coveragePct}%` }}
              />
            </div>

            <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
              {totalSlos > 0
                ? uncoveredSlos > 0
                  ? `${uncoveredSlos} SLO${uncoveredSlos === 1 ? "" : "s"} left to test`
                  : "All syllabus SLOs tested"
                : unassignedCount > 0
                  ? `${unassignedCount} chapter${unassignedCount === 1 ? "" : "s"} left to assign`
                  : "All syllabus chapters assigned"}
            </span>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-light/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-primary via-primary to-primary-dark">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
            <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
            <div
              className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />
            <TrophySVG
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                <TrophySVG className="size-3.5 text-white" />
                {isTeacher && !student ? "Class Mastery" : "Overall Mastery"}
              </span>
              <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                Mastery
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                {summary.overallPercentage}%
              </span>
            </div>

            <div className="mt-2 w-full bg-black/25 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${summary.overallPercentage}%` }}
              />
            </div>

            <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
              {summary.overallPercentage >= 80
                ? "Exemplary progress"
                : summary.overallPercentage >= 50
                  ? "On track to mastery"
                  : hasAttempts
                    ? "Practice recommended"
                    : "No tests graded yet"}
            </span>
          </div>
        </div>

        {/* Tests Attempted vs Assigned */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-light/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-primary via-primary to-primary-dark">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
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
              className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                <BookOpenSVG className="size-3.5 text-white" />
                Tests Attempted
              </span>
              <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                Attempts
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                {summary.totalTestsAttempted}
              </span>
              <span className="text-xs text-white/80 font-semibold">
                / {summary.totalTestsAssigned} assigned
              </span>
            </div>

            <div className="mt-2 w-full bg-black/25 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
                style={{
                  width: `${
                    summary.totalTestsAssigned > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (summary.totalTestsAttempted /
                              summary.totalTestsAssigned) *
                              100,
                          ),
                        )
                      : 0
                  }%`,
                }}
              />
            </div>

            <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
              {summary.gradedAttemptsCount} graded attempt{summary.gradedAttemptsCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Marks Scored */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-light/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-primary via-primary to-primary-dark">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
            <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
            <div
              className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "18px 18px",
              }}
            />
            <MedalSVG
              aria-hidden
              className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                <MedalSVG className="size-3.5 text-white" />
                Marks Earned
              </span>
              <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                Scored
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                {summary.totalMarksEarned}
              </span>
              <span className="text-xs text-white/80 font-semibold">
                / {summary.totalMarksPossible}
              </span>
            </div>

            <div className="mt-2 w-full bg-black/25 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
                style={{
                  width: `${
                    summary.totalMarksPossible > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (summary.totalMarksEarned /
                              summary.totalMarksPossible) *
                              100,
                          ),
                        )
                      : 0
                  }%`,
                }}
              />
            </div>

            <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
              {summary.strongestChapter
                ? `Top: ${summary.strongestChapter.name}`
                : "Complete tests to reveal"}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Difficulty Tier Matrix (Alpha · Beta · Gamma) */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              Difficulty Mastery
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Performance breakdown across difficulty levels (Alpha, Beta, Gamma)
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary uppercase tracking-wider">
            <MilestonesSVG className="size-3.5" /> 3 Tiers
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {/* Alpha / Easy */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-light/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-[#008503] via-[#005f02] to-[#004a02]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
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
                className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                  <CheckCircleSVG className="size-3.5 text-white" />
                  Alpha · Foundation
                </span>
                <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                  {summary.difficultyBreakdown.alpha.attempted} attempt{summary.difficultyBreakdown.alpha.attempted === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                  {summary.difficultyBreakdown.alpha.percentage}%
                </span>
                <span className="text-xs text-white/80 font-semibold">
                  {summary.difficultyBreakdown.alpha.earned} / {summary.difficultyBreakdown.alpha.possible} marks
                </span>
              </div>

              <div className="mt-2 w-full bg-black/25 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${summary.difficultyBreakdown.alpha.percentage}%` }}
                />
              </div>

              <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
                Foundation SLO mastery level
              </span>
            </div>
          </div>

          {/* Beta / Medium */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-blue-300/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
              <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
              <div
                className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />
              <MilestonesSVG
                aria-hidden
                className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                  <MilestonesSVG className="size-3.5 text-white" />
                  Beta · Standard
                </span>
                <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                  {summary.difficultyBreakdown.beta.attempted} attempt{summary.difficultyBreakdown.beta.attempted === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                  {summary.difficultyBreakdown.beta.percentage}%
                </span>
                <span className="text-xs text-white/80 font-semibold">
                  {summary.difficultyBreakdown.beta.earned} / {summary.difficultyBreakdown.beta.possible} marks
                </span>
              </div>

              <div className="mt-2 w-full bg-black/25 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${summary.difficultyBreakdown.beta.percentage}%` }}
                />
              </div>

              <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
                Standard curriculum proficiency
              </span>
            </div>
          </div>

          {/* Gamma / Hard */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-300/30 p-4 sm:p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl bg-linear-to-br from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <div className="absolute -top-[20%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[25px]" />
              <div className="absolute -bottom-[20%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[30px]" />
              <div
                className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />
              <ZapSVG
                aria-hidden
                className="pointer-events-none absolute -bottom-2 -right-2 size-18 sm:size-20 text-white/15 transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/95 flex items-center gap-1.5 drop-shadow-2xs">
                  <ZapSVG className="size-3.5 text-white" />
                  Gamma · Advanced
                </span>
                <span className="rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
                  {summary.difficultyBreakdown.gamma.attempted} attempt{summary.difficultyBreakdown.gamma.attempted === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-xs">
                  {summary.difficultyBreakdown.gamma.percentage}%
                </span>
                <span className="text-xs text-white/80 font-semibold">
                  {summary.difficultyBreakdown.gamma.earned} / {summary.difficultyBreakdown.gamma.possible} marks
                </span>
              </div>

              <div className="mt-2 w-full bg-black/25 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${summary.difficultyBreakdown.gamma.percentage}%` }}
                />
              </div>

              <span className="text-[11px] text-white/85 font-semibold mt-1.5 truncate">
                Advanced &amp; application mastery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Chapter-Wise Performance Breakdown (Overview First, Click for Details & Graphs) */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-foreground">
              Syllabus Chapter Mastery
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Track syllabus coverage, click any chapter card to open details and performance graphs
            </p>
          </div>

          {/* Tab Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                filterTab === "all"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All ({data.chapters.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("assigned")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                filterTab === "assigned"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Assigned ({assignedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unassigned")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                filterTab === "unassigned"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Left to Assign ({unassignedCount})
            </button>
          </div>
        </div>

        {/* Search Bar for chapters */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters by name or number (e.g., Quadratic, Ch 15)..."
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {filteredChapters.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
            <p className="text-sm font-bold text-muted-foreground">
              No syllabus chapters matching the current filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredChapters.map((ch) => {
              const isExpanded = expandedChapterIds.has(ch.chapterId);
              const isUnassigned = ch.testsAssigned === 0;

              const statusColors = {
                Mastered: "bg-primary/10 text-primary border-primary/30",
                "In Progress": "bg-primary/10 text-primary dark:bg-muted dark:text-foreground border-primary/30 dark:border-border",
                "Needs Practice": "bg-amber-500/10 text-amber-600 border-amber-500/30",
                "Not Started": "bg-muted text-muted-foreground border-border/40",
                "Not Assigned": "bg-amber-500/10 text-amber-600 border-amber-500/30",
              };

              const chartData = [
                {
                  tier: "Alpha",
                  label: "Foundation",
                  accuracy: ch.difficultyBreakdown.alpha.percentage,
                  attempts: ch.difficultyBreakdown.alpha.attempted,
                  color: "#10b981",
                },
                {
                  tier: "Beta",
                  label: "Standard",
                  accuracy: ch.difficultyBreakdown.beta.percentage,
                  attempts: ch.difficultyBreakdown.beta.attempted,
                  color: "#3b82f6",
                },
                {
                  tier: "Gamma",
                  label: "Advanced",
                  accuracy: ch.difficultyBreakdown.gamma.percentage,
                  attempts: ch.difficultyBreakdown.gamma.attempted,
                  color: "#8b5cf6",
                },
              ];

              return (
                <div
                  key={ch.chapterId}
                  className={cn(
                    "overflow-hidden rounded-3xl border bg-card transition-all duration-200",
                    isExpanded ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "border-border/60 hover:border-primary/40 shadow-xs",
                  )}
                >
                  {/* Card Overview (Click to expand/collapse) */}
                  <div
                    onClick={() => toggleChapter(ch.chapterId)}
                    className="flex cursor-pointer flex-col gap-3 p-5 transition-colors hover:bg-muted/10 sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-black text-primary dark:bg-muted dark:text-foreground shrink-0">
                            Ch {ch.chapterNumber}
                          </span>
                          <h4 className="truncate text-base font-black tracking-tight text-foreground sm:text-lg">
                            {ch.chapterName}
                          </h4>
                        </div>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {isUnassigned
                            ? ch.totalSlos && ch.totalSlos > 0
                              ? `Not assigned yet · ${ch.totalSlos} SLOs in syllabus`
                              : "Not assigned yet according to syllabus"
                            : ch.totalSlos && ch.totalSlos > 0
                              ? `${ch.coveredSlos || 0}/${ch.totalSlos} SLOs tested (${ch.sloCoveragePercentage || 0}%) · ${ch.testsAssigned} test group${ch.testsAssigned === 1 ? "" : "s"} · ${ch.testsAttempted} attempt${ch.testsAttempted === 1 ? "" : "s"}`
                              : `${ch.testsAssigned} test group${ch.testsAssigned === 1 ? "" : "s"} assigned · ${ch.testsAttempted} attempt${ch.testsAttempted === 1 ? "" : "s"}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
                        {isUnassigned ? (
                          isTeacher ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `${FRONTEND_ROUTES.TEACHER_CREATE_PAPER}?classroomId=${encodeURIComponent(classroomId)}&chapterId=${encodeURIComponent(ch.chapterId)}`,
                                );
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow-xs transition-transform hover:-translate-y-0.5"
                            >
                              <Plus className="size-3.5" />
                              Assign Test
                            </button>
                          ) : null
                        ) : (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary dark:bg-muted dark:text-foreground">
                            {ch.accuracyPercentage}% Accuracy
                          </span>
                        )}

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider",
                            statusColors[ch.status],
                          )}
                        >
                          {ch.status === "Mastered" ? (
                            <CheckCircle2 className="size-3" />
                          ) : ch.status === "Needs Practice" ? (
                            <Flame className="size-3" />
                          ) : ch.status === "In Progress" ? (
                            <Target className="size-3" />
                          ) : null}
                          {ch.status === "Not Assigned" ? "Left to Assign" : ch.status}
                        </span>

                        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground">
                          <span>{isExpanded ? "Hide" : "Details & Graph"}</span>
                          {isExpanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mastery Progress Bar */}
                    <div className="mt-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isUnassigned
                              ? "bg-transparent border border-dashed border-border"
                              : ch.accuracyPercentage >= 80
                                ? "bg-primary"
                                : ch.accuracyPercentage >= 50
                                  ? "bg-primary"
                                  : "bg-amber-500",
                          )}
                          style={{
                            width: `${isUnassigned ? 0 : Math.max(ch.accuracyPercentage, ch.testsAttempted > 0 ? 5 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View: Graphs & Deep Stats */}
                  {isExpanded ? (
                    <div className="border-t border-border/50 bg-muted/10 p-5 sm:p-6 space-y-6">
                      {/* Interactive Recharts Graph */}
                      {!isUnassigned && (
                        <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xs">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="size-4 text-primary" />
                              <h5 className="text-sm font-black text-foreground">
                                Tier Accuracy & Attempts Performance
                              </h5>
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground">
                              Alpha vs Beta vs Gamma
                            </span>
                          </div>

                          <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis
                                  dataKey="tier"
                                  stroke="#888888"
                                  fontSize={11}
                                  tickLine={false}
                                />
                                <YAxis
                                  domain={[0, 100]}
                                  unit="%"
                                  stroke="#888888"
                                  fontSize={11}
                                  tickLine={false}
                                />
                                <Tooltip
                                  formatter={(value: any) => [`${value}%`, "Accuracy"]}
                                  labelFormatter={(label: any) => `Tier: ${label}`}
                                  contentStyle={{
                                    borderRadius: "12px",
                                    border: "1px solid var(--border)",
                                    backgroundColor: "var(--card)",
                                    color: "var(--foreground)",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                  }}
                                />
                                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                                  {chartData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="rounded-2xl border border-border/50 bg-card p-3.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            SLO Coverage
                          </span>
                          <p className="text-xl font-black text-foreground mt-0.5">
                            {ch.sloCoveragePercentage ?? 0}%
                            {ch.totalSlos ? (
                              <span className="text-xs text-muted-foreground font-semibold">
                                {" "}
                                ({ch.coveredSlos || 0}/{ch.totalSlos})
                              </span>
                            ) : null}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-3.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Accuracy
                          </span>
                          <p className="text-xl font-black text-foreground mt-0.5">
                            {ch.accuracyPercentage}%
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-3.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Marks Earned
                          </span>
                          <p className="text-xl font-black text-foreground mt-0.5">
                            {ch.marksEarned}{" "}
                            <span className="text-xs text-muted-foreground font-semibold">
                              / {ch.marksPossible}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-3.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Best Attempt
                          </span>
                          <p className="text-xl font-black text-foreground mt-0.5">
                            {ch.bestScorePercentage}%
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-3.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Tests & Sets
                          </span>
                          <p className="text-xl font-black text-foreground mt-0.5">
                            {ch.testsAssigned}{" "}
                            <span className="text-xs text-muted-foreground font-semibold">
                              group{ch.testsAssigned === 1 ? "" : "s"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Difficulty Spread */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border/40 bg-card p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-primary">Alpha · Foundation</span>
                            <span className="font-bold text-muted-foreground">{ch.difficultyBreakdown.alpha.attempted} attempts</span>
                          </div>
                          <p className="mt-1 text-base font-black text-foreground">{ch.difficultyBreakdown.alpha.percentage}%</p>
                        </div>

                        <div className="rounded-2xl border border-border/40 bg-card p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-blue-600 dark:text-blue-400">Beta · Standard</span>
                            <span className="font-bold text-muted-foreground">{ch.difficultyBreakdown.beta.attempted} attempts</span>
                          </div>
                          <p className="mt-1 text-base font-black text-foreground">{ch.difficultyBreakdown.beta.percentage}%</p>
                        </div>

                        <div className="rounded-2xl border border-border/40 bg-card p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-purple-600 dark:text-purple-400">Gamma · Advanced</span>
                            <span className="font-bold text-muted-foreground">{ch.difficultyBreakdown.gamma.attempted} attempts</span>
                          </div>
                          <p className="mt-1 text-base font-black text-foreground">{ch.difficultyBreakdown.gamma.percentage}%</p>
                        </div>
                      </div>

                      {/* Recent Attempts for this chapter */}
                      {ch.recentAttempts.length > 0 ? (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                            Recent Chapter Attempts
                          </p>
                          <div className="divide-y divide-border/30 rounded-2xl border border-border/40 bg-card">
                            {ch.recentAttempts.map((att) => (
                              <button
                                key={att.attemptId}
                                type="button"
                                onClick={() => {
                                  if (isTeacher) {
                                    router.push(
                                      FRONTEND_ROUTES.TEACHER_CLASSROOM_ATTEMPT(
                                        classroomId,
                                        att.attemptId,
                                      ),
                                    );
                                  } else {
                                    router.push(
                                      FRONTEND_ROUTES.STUDENT_HISTORY_DETAIL(
                                        att.attemptId,
                                      ),
                                    );
                                  }
                                }}
                                className="group flex w-full flex-col gap-2 p-3 text-left sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                    {att.fullTitle || att.paperTitle}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                      <Clock className="size-3" />
                                      {new Date(att.submittedAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold capitalize text-muted-foreground">
                                      {att.gradingStatus.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center">
                                  <span className="text-sm font-black text-foreground">
                                    {att.score} / {att.totalMarks}
                                  </span>
                                  <span
                                    className={cn(
                                      "rounded-full px-2.5 py-0.5 text-xs font-black",
                                      att.percentage >= 80
                                        ? "bg-primary/10 text-primary"
                                        : att.percentage >= 50
                                          ? "bg-primary/10 text-primary"
                                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                    )}
                                  >
                                    {att.percentage}%
                                  </span>
                                  <ChevronRight className="size-4 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Quick CTA to assign test */}
                      {isTeacher ? (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `${FRONTEND_ROUTES.TEACHER_CREATE_PAPER}?classroomId=${encodeURIComponent(classroomId)}&chapterId=${encodeURIComponent(ch.chapterId)}`,
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                          >
                            <Plus className="size-4" />
                            {isUnassigned ? "Assign First Test for this Chapter" : "Assign Another Set / Test"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
