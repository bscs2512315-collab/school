"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
  BookOpen,
  Loader2,
  Pencil,
  Check,
  ExternalLink,
  Layers,
  Shield,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import AppDateTimePicker from "@/components/AppDateTimePicker";
import { Typography } from "@/components/ui/Typography";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { apiGet, apiPatch } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { parsePaperDifficulty } from "@/lib/paper/difficulty";
import type { GeneratePaperChapter } from "@/types/generate";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { getChoiceBadgeLabel } from "@/lib/paper/choice-badge";
import TeacherPaperQABugButton from "@/components/qa/TeacherPaperQABugButton";

function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No deadline set";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeRemaining(dateStr: string | null | undefined): {
  isOverdue: boolean;
  text: string;
} {
  if (!dateStr) {
    return { isOverdue: false, text: "Open submission anytime" };
  }
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const isOverdue = diffMs < 0;
  const absSec = Math.floor(Math.abs(diffMs) / 1000);

  const days = Math.floor(absSec / 86400);
  const hours = Math.floor((absSec % 86400) / 3600);
  const minutes = Math.floor((absSec % 3600) / 60);

  let durationStr = "";
  if (days > 0) {
    durationStr = `${days} day${days > 1 ? "s" : ""}${hours > 0 ? ` ${hours} hr${hours > 1 ? "s" : ""}` : ""}`;
  } else if (hours > 0) {
    durationStr = `${hours} hr${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min` : ""}`;
  } else {
    durationStr = `${Math.max(1, minutes)} min`;
  }

  if (isOverdue) {
    return { isOverdue: true, text: `Deadline ended ${durationStr} ago` };
  }
  return { isOverdue: false, text: `${durationStr} remaining` };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateToLocalPickerString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface QuestionData {
  id: string;
  questionNumber: number;
  questionPart?: string | null;
  questionText: string;
  questionType: string;
  marks: number;
  chapterName?: string | null;
  chapterNumber?: number | null;
  sloNumber?: string | null;
  subtopicName?: string | null;
  correctAnswer?: string | null;
  paperIIData?: {
    betterResponse?: string;
    weakerResponse?: string;
    markingNotes?: string;
  } | null;
}

interface ChapterInfo {
  id: string;
  chapterNumber: number;
  chapterName: string;
  curriculumId: string;
}

interface PaperDetail {
  id: string;
  classroomId: string;
  title: string;
  description: string | null;
  paperType: string;
  subject: string;
  classLevel: string;
  board: string;
  totalMarks: number;
  totalQuestions: number;
  dueDate?: string | null;
  chapterIds?: string[];
  chapters?: ChapterInfo[];
  strictMode?: boolean;
  allowResume?: boolean;
  questions: QuestionData[];
}

interface Props {
  paperId: string;
  onClose: () => void;
  onViewAttempts?: () => void;
  onPaperUpdated?: (updated: {
    id: string;
    title: string;
    dueDate?: string | null;
    strictMode?: boolean;
    allowResume?: boolean;
    affectedPaperIds?: string[];
  }) => void;
}

export default function TeacherPaperDetailModal({
  paperId,
  onClose,
  onViewAttempts,
  onPaperUpdated,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  // Editing custom paper title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  // Submission deadline & extension state
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState("");
  const [applyAllSetsDeadline, setApplyAllSetsDeadline] = useState(true);
  const [savingDeadline, setSavingDeadline] = useState(false);

  // Chapter Alignment Modal / Drawer
  const [isAligningChapters, setIsAligningChapters] = useState(false);
  const [availableChapters, setAvailableChapters] = useState<GeneratePaperChapter[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [savingChapters, setSavingChapters] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await apiGet<PaperDetail>(`/teacher/papers/${paperId}`);
        if (!isMounted) return;
        if (res.success && res.data) {
          setPaper(res.data);
          setTitleInput(res.data.title || "");
          setSelectedChapterIds(res.data.chapterIds || []);
          if (res.data.dueDate) {
            const d = new Date(res.data.dueDate);
            if (!Number.isNaN(d.getTime())) {
              setSelectedDeadline(dateToLocalPickerString(d));
            }
          } else {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            d.setHours(23, 59, 0, 0);
            setSelectedDeadline(dateToLocalPickerString(d));
          }
          // Default all expanded
          const init: Record<string, boolean> = {};
          res.data.questions.forEach((q) => {
            init[q.id] = true;
          });
          setExpandedSolutions(init);
        } else {
          setError(res.message || "Failed to load test details");
        }
      } catch {
        if (isMounted) setError("Network error loading paper details");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [paperId]);

  const toggleSolution = (id: string) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSaveTitle = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed) {
      toast.error("Paper name cannot be empty");
      return;
    }
    setSavingTitle(true);
    try {
      const res = await apiPatch<PaperDetail>(`/teacher/papers/${paperId}`, {
        title: trimmed,
      });
      if (res.success && res.data) {
        setPaper((prev) => (prev ? { ...prev, title: trimmed } : null));
        setIsEditingTitle(false);
        toast.success("Paper name updated successfully!");
        onPaperUpdated?.({ id: paperId, title: trimmed });
      } else {
        toast.error(res.message || "Failed to update title");
      }
    } catch {
      toast.error("Failed to update paper title");
    } finally {
      setSavingTitle(false);
    }
  };

  const applyDeadlinePreset = (daysToAdd: number | "endOfWeek") => {
    let base = new Date();
    if (paper?.dueDate) {
      const parsed = new Date(paper.dueDate);
      if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        base = parsed;
      }
    }

    const next = new Date(base);
    if (daysToAdd === "endOfWeek") {
      const dayOfWeek = next.getDay();
      const diffToSunday = (7 - dayOfWeek) % 7 || 7;
      next.setDate(next.getDate() + diffToSunday);
      next.setHours(23, 59, 0, 0);
    } else {
      next.setDate(next.getDate() + daysToAdd);
      if (next.getHours() === 0 && next.getMinutes() === 0) {
        next.setHours(23, 59, 0, 0);
      }
    }

    setSelectedDeadline(dateToLocalPickerString(next));
  };

  const handleSaveDeadline = async (clearDeadline = false) => {
    if (!paper) return;
    const finalDate = clearDeadline
      ? null
      : selectedDeadline
        ? new Date(selectedDeadline).toISOString()
        : null;

    setSavingDeadline(true);
    try {
      const res = await apiPatch<
        PaperDetail & { affectedPaperIds?: string[] }
      >(`/teacher/papers/${paperId}`, {
        dueDate: finalDate,
        applyToAllSets: applyAllSetsDeadline,
      });

      if (res.success && res.data) {
        setPaper((prev) =>
          prev ? { ...prev, dueDate: res.data.dueDate } : null,
        );
        setIsEditingDeadline(false);
        toast.success(
          clearDeadline
            ? "Deadline removed — test is open indefinitely."
            : applyAllSetsDeadline &&
                (res.data.affectedPaperIds?.length ?? 1) > 1
              ? `Deadline extended for all ${res.data.affectedPaperIds?.length} test sets!`
              : "Test deadline extended successfully!",
        );
        onPaperUpdated?.({
          id: paperId,
          title: paper.title,
          dueDate: res.data.dueDate,
          strictMode: paper.strictMode,
          allowResume: paper.allowResume,
          affectedPaperIds: res.data.affectedPaperIds,
        });
      } else {
        toast.error(res.message || "Failed to update deadline");
      }
    } catch {
      toast.error("Failed to update test deadline");
    } finally {
      setSavingDeadline(false);
    }
  };

  const [updatingSettings, setUpdatingSettings] = useState(false);

  const handleToggleSetting = async (
    key: "strictMode" | "allowResume",
    nextValue: boolean,
  ) => {
    if (!paper || updatingSettings) return;
    setUpdatingSettings(true);
    setPaper((prev) => (prev ? { ...prev, [key]: nextValue } : null));

    try {
      const res = await apiPatch<PaperDetail>(`/teacher/papers/${paperId}`, {
        [key]: nextValue,
      });
      if (res.success && res.data) {
        setPaper((prev) =>
          prev
            ? {
                ...prev,
                strictMode: res.data.strictMode,
                allowResume: res.data.allowResume,
              }
            : null,
        );
        toast.success(
          key === "strictMode"
            ? nextValue
              ? "Strict mode enabled (auto-submits on tab switch)"
              : "Relaxed mode enabled (students can switch tabs)"
            : nextValue
              ? "Quit & recontinue enabled (students can save progress)"
              : "Single sitting required (quit & resume disabled)",
        );
        onPaperUpdated?.({
          id: paperId,
          title: paper.title,
          strictMode: res.data.strictMode,
          allowResume: res.data.allowResume,
        });
      } else {
        toast.error(res.message || "Failed to update exam settings");
        setPaper((prev) => (prev ? { ...prev, [key]: !nextValue } : null));
      }
    } catch {
      toast.error("Failed to update exam settings");
      setPaper((prev) => (prev ? { ...prev, [key]: !nextValue } : null));
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleOpenChapterAlignment = async () => {
    if (!paper) return;
    setIsAligningChapters(true);
    setLoadingChapters(true);
    try {
      const paperTypeNum = String(paper.paperType).includes("2") ? "2" : "1";
      const res = await apiGet<GeneratePaperChapter[]>(
        `${API_ENDPOINTS.STUDENT.GENERATE_PAPER_CHAPTERS}?subject=${encodeURIComponent(paper.subject)}&class=${encodeURIComponent(paper.classLevel)}&board=${encodeURIComponent(paper.board || "AKUEB")}&paperType=${paperTypeNum}`,
      );
      if (res.success && res.data) {
        setAvailableChapters(res.data);
      } else {
        toast.error(res.message || "Failed to load syllabus chapters");
      }
    } catch {
      toast.error("Network error loading syllabus chapters");
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleSaveChapterAlignment = async () => {
    if (!paper) return;
    setSavingChapters(true);
    try {
      const res = await apiPatch<PaperDetail>(`/teacher/papers/${paperId}`, {
        chapterIds: selectedChapterIds,
      });
      if (res.success && res.data) {
        setPaper((prev) =>
          prev
            ? {
                ...prev,
                chapterIds: res.data.chapterIds,
                chapters: res.data.chapters,
              }
            : null,
        );
        setIsAligningChapters(false);
        toast.success("Aligned chapters updated successfully!");
      } else {
        toast.error(res.message || "Failed to update aligned chapters");
      }
    } catch {
      toast.error("Failed to update chapter alignment");
    } finally {
      setSavingChapters(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-y-auto animate-in fade-in-0 duration-200"
    >
      {/* Sticky Top Action Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/80 bg-background/95 px-4 py-3 sm:px-6 backdrop-blur-md shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back / Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
              {paper?.title || "Test Paper & Solutions"}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {paper?.paperType === "paper2" || String(paper?.paperType).includes("2")
                  ? "Paper II (CRQ & ERQ)"
                  : "Paper I (MCQ)"}
              </span>
              {paper && (
                <span>
                  • {paper.totalQuestions} Questions • {paper.totalMarks} Total Marks
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onViewAttempts && (
            <AppButton
              type="button"
              size="sm"
              onClick={onViewAttempts}
              className="font-bold hidden sm:inline-flex"
            >
              View Student Attempts
            </AppButton>
          )}
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-bold"
          >
            Close
          </AppButton>
        </div>
      </header>

      {/* Main Full-Page Scrollable Container */}
      <main className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1 pb-24">
        {/* Hero Header Card - Scrolls naturally with content */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-primary-dark p-5 sm:p-7 text-primary-foreground shadow-lg">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-primary-foreground/10 blur-2xl" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {paper?.paperType === "paper2" || String(paper?.paperType).includes("2")
                  ? "Paper II (CRQ & ERQ)"
                  : "Paper I (MCQ)"}
              </span>
              {(() => {
                const diff = parsePaperDifficulty(paper?.title || "");
                if (!diff.isTiered) return null;
                return (
                  <span className="rounded-full border border-primary-foreground/25 bg-primary-foreground/20 px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md text-primary-foreground shadow-xs">
                    ● {diff.badgeLabel}
                  </span>
                );
              })()}
              {paper?.board && (
                <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  {paper.board} · Class {paper.classLevel}
                </span>
              )}
              {paper?.subject && (
                <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  {paper.subject}
                </span>
              )}
            </div>

            {/* Title with inline custom name editor */}
            <div className="pt-1">
              {isEditingTitle ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder="Enter custom test name..."
                      className="flex-1 min-w-[240px] max-w-md rounded-xl border border-primary-foreground/40 bg-primary-foreground/10 px-3 py-1.5 text-base sm:text-lg font-bold text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 backdrop-blur-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSaveTitle();
                        if (e.key === "Escape") setIsEditingTitle(false);
                      }}
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleSaveTitle()}
                        disabled={savingTitle}
                        className="inline-flex items-center gap-1 rounded-xl bg-primary-foreground px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-foreground/90 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {savingTitle ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTitleInput(paper?.title || "");
                          setIsEditingTitle(false);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-foreground/25 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Quick difficulty tier selectors */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-bold text-primary-foreground/70 mr-1">
                      Difficulty Level:
                    </span>
                    {(["Alpha", "Beta", "Gamma"] as const).map((tier) => {
                      const level =
                        tier === "Alpha"
                          ? "Easy"
                          : tier === "Beta"
                            ? "Medium"
                            : "Hard";
                      const isActive = new RegExp(`\\b${tier}\\b`, "i").test(
                        titleInput,
                      );
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => {
                            const diff = parsePaperDifficulty(titleInput);
                            setTitleInput(
                              `${diff.cleanTitle} ${tier}`.trim(),
                            );
                          }}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all",
                            isActive
                              ? "bg-primary-foreground text-primary shadow-sm"
                              : "border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20",
                          )}
                        >
                          {tier} · {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {paper?.title || "Test Paper & Solutions"}
                  </h2>

                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput(paper?.title || "");
                      setIsEditingTitle(true);
                    }}
                    title="Edit custom paper title"
                    className="inline-flex items-center gap-1 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-2 py-1 text-xs font-medium text-primary-foreground/90 hover:bg-primary-foreground/20 transition-colors"
                  >
                    <Pencil className="size-3" />
                    Rename
                  </button>
                </div>
              )}
            </div>

            {paper?.description && (
              <p className="text-xs sm:text-sm text-primary-foreground/80 max-w-2xl leading-relaxed">
                {paper.description}
              </p>
            )}

            {paper && (
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs sm:text-sm font-semibold text-primary-foreground/90">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-4" />
                  <span>{paper.totalQuestions} Questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="size-4" />
                  <span>{paper.totalMarks} Total Marks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <span>{paper.dueDate ? `Due ${formatDisplayDate(paper.dueDate)}` : "No Deadline"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="size-4" />
                  <span>Nova AI Grading Enabled</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-semibold">Loading questions and solutions...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="size-10 text-destructive mx-auto" />
              <p className="text-sm font-bold text-destructive">{error}</p>
              <AppButton variant="outline" onClick={onClose}>
                Close
              </AppButton>
            </div>
          ) : !paper || paper.questions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No questions found in this paper snapshot.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Exam Controls & Anti-Cheat Settings Card */}
              <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                    <Shield className="size-4 text-primary" />
                    <span>Quiz Controls & Anti-Cheat Settings</span>
                  </div>
                  {updatingSettings && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground animate-pulse">
                      <Loader2 className="size-3 animate-spin text-primary" />
                      Saving...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-border/50">
                  {/* Switch 1: Auto-Submit on Tab Switch */}
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <label
                        className="text-xs font-bold text-foreground cursor-pointer"
                        onClick={() =>
                          void handleToggleSetting(
                            "strictMode",
                            !(paper.strictMode ?? true),
                          )
                        }
                      >
                        Auto-Submit on Tab Switch
                      </label>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {paper.strictMode ?? true
                          ? "Strict mode: Automatically ends attempt if student leaves or minimizes the tab."
                          : "Relaxed mode: Students can change tabs without auto-submitting."}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={paper.strictMode ?? true}
                      disabled={updatingSettings}
                      onClick={() =>
                        void handleToggleSetting(
                          "strictMode",
                          !(paper.strictMode ?? true),
                        )
                      }
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50",
                        (paper.strictMode ?? true)
                          ? "bg-primary"
                          : "bg-muted-foreground/30",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                          (paper.strictMode ?? true)
                            ? "translate-x-5"
                            : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>

                  {/* Switch 2: Allow Student to Quit & Recontinue */}
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <label
                        className="text-xs font-bold text-foreground cursor-pointer"
                        onClick={() =>
                          void handleToggleSetting(
                            "allowResume",
                            !Boolean(paper.allowResume),
                          )
                        }
                      >
                        Allow Quit & Recontinue
                      </label>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {paper.allowResume
                          ? "Allowed: Students can 'Save & Exit' midway and resume from where they left off."
                          : "Single sitting: Student must finish in one session without pausing."}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(paper.allowResume)}
                      disabled={updatingSettings}
                      onClick={() =>
                        void handleToggleSetting(
                          "allowResume",
                          !Boolean(paper.allowResume),
                        )
                      }
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50",
                        paper.allowResume
                          ? "bg-primary"
                          : "bg-muted-foreground/30",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                          paper.allowResume
                            ? "translate-x-5"
                            : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Submission Deadline & Extensions Card */}
              <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-xs space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                    <Clock className="size-4 text-primary" />
                    <span>Submission Deadline & Grace Window</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider",
                        !paper.dueDate
                          ? "bg-muted text-muted-foreground"
                          : formatTimeRemaining(paper.dueDate).isOverdue
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                            : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                      )}
                    >
                      {!paper.dueDate
                        ? "Open Submission"
                        : formatTimeRemaining(paper.dueDate).isOverdue
                          ? "Overdue"
                          : "Active Deadline"}
                    </span>

                    {!isEditingDeadline && (
                      <button
                        type="button"
                        onClick={() => {
                          if (paper.dueDate) {
                            const d = new Date(paper.dueDate);
                            if (!Number.isNaN(d.getTime())) {
                              setSelectedDeadline(dateToLocalPickerString(d));
                            }
                          } else {
                            const d = new Date();
                            d.setDate(d.getDate() + 3);
                            d.setHours(23, 59, 0, 0);
                            setSelectedDeadline(dateToLocalPickerString(d));
                          }
                          setIsEditingDeadline(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <Pencil className="size-3" />
                        <span>{paper.dueDate ? "Extend / Edit Deadline" : "Set Deadline"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isEditingDeadline ? (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" />
                        <span>{formatDisplayDate(paper.dueDate)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {paper.dueDate
                          ? `${formatTimeRemaining(paper.dueDate).text}. Students submitting past deadline receive 50% fewer points.`
                          : "No deadline is enforced. Students can complete this paper anytime without late penalties."}
                      </p>
                    </div>

                    {paper.dueDate && (
                      <button
                        type="button"
                        disabled={savingDeadline}
                        onClick={() => void handleSaveDeadline(true)}
                        className="text-xs font-bold text-destructive hover:underline cursor-pointer disabled:opacity-50"
                      >
                        Remove Deadline
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4 animate-in fade-in-0 duration-200">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-primary" />
                          <span>Quick Extension Presets</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyDeadlinePreset(1)}
                            className="rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs font-bold text-foreground transition-all cursor-pointer"
                          >
                            +1 Day
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDeadlinePreset(3)}
                            className="rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs font-bold text-foreground transition-all cursor-pointer"
                          >
                            +3 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDeadlinePreset(7)}
                            className="rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs font-bold text-foreground transition-all cursor-pointer"
                          >
                            +1 Week
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDeadlinePreset("endOfWeek")}
                            className="rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs font-bold text-foreground transition-all cursor-pointer"
                          >
                            End of Week
                          </button>
                        </div>
                      </div>

                      <AppDateTimePicker
                        value={selectedDeadline}
                        onChange={setSelectedDeadline}
                        placeholder="Select new deadline date & time"
                      />
                    </div>

                    {/* Apply to All Sets Checkbox */}
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        id="modalApplyAllSets"
                        type="checkbox"
                        checked={applyAllSetsDeadline}
                        onChange={(e) => setApplyAllSetsDeadline(e.target.checked)}
                        className="mt-0.5 size-4 rounded-sm border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                      <label
                        htmlFor="modalApplyAllSets"
                        className="text-xs font-medium text-foreground cursor-pointer select-none space-y-0.5"
                      >
                        <div className="font-bold flex items-center gap-1">
                          <Layers className="size-3 text-primary" />
                          <span>Apply extended deadline to all sets of this test</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Extends the deadline across all variant sets (Set A, Set B...) in this classroom simultaneously.
                        </p>
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                      <div>
                        {paper.dueDate && (
                          <button
                            type="button"
                            disabled={savingDeadline}
                            onClick={() => void handleSaveDeadline(true)}
                            className="text-xs font-bold text-destructive hover:underline cursor-pointer disabled:opacity-50"
                          >
                            Remove Deadline
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <AppButton
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={savingDeadline}
                          onClick={() => setIsEditingDeadline(false)}
                          className="font-bold cursor-pointer"
                        >
                          Cancel
                        </AppButton>
                        <AppButton
                          type="button"
                          size="sm"
                          disabled={savingDeadline || !selectedDeadline}
                          onClick={() => void handleSaveDeadline(false)}
                          className="font-bold cursor-pointer min-w-[120px]"
                        >
                          {savingDeadline ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="size-3.5 mr-1" />
                              <span>Save Deadline</span>
                            </>
                          )}
                        </AppButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Aligned Syllabus Chapters Banner */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Layers className="size-4" />
                    <span>Aligned Syllabus Chapters</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleOpenChapterAlignment()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Pencil className="size-3" />
                    {paper.chapters && paper.chapters.length > 0
                      ? "Re-align Chapters"
                      : "Align Chapters"}
                  </button>
                </div>

                {paper.chapters && paper.chapters.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {paper.chapters.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-1.5 shadow-xs"
                      >
                        <span className="text-xs font-black text-primary">
                          Unit {ch.chapterNumber}:
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {ch.chapterName}
                        </span>
                        {ch.curriculumId && (
                          <button
                            type="button"
                            onClick={() => {
                              router.push(
                                `/teacher/curriculum/${ch.curriculumId}/chapter/${ch.id}`,
                              );
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors ml-1"
                            title="Open chapter in syllabus"
                          >
                            <span>Syllabus</span>
                            <ExternalLink className="size-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No specific chapter mapped yet. Click &quot;Align Chapters&quot; to link this test to syllabus units and student learning outcomes.
                  </p>
                )}
              </div>

              {/* Align Chapters Drawer / Selection Inline */}
              {isAligningChapters && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <Typography className="text-sm font-bold text-foreground">
                      Select Chapters from Syllabus
                    </Typography>
                    <button
                      type="button"
                      onClick={() => setIsAligningChapters(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {loadingChapters ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      Loading syllabus chapters...
                    </div>
                  ) : availableChapters.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No chapters found for this subject and class.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {availableChapters.map((ch) => {
                        const isChecked = selectedChapterIds.includes(ch.id);
                        return (
                          <label
                            key={ch.id}
                            className={cn(
                              "flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors",
                              isChecked
                                ? "border-primary/40 bg-primary/5 font-semibold text-primary"
                                : "border-border/50 bg-muted/20 text-foreground hover:bg-muted/40",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedChapterIds((prev) =>
                                  prev.includes(ch.id)
                                    ? prev.filter((id) => id !== ch.id)
                                    : [...prev, ch.id],
                                );
                              }}
                              className="size-4 rounded text-primary focus:ring-primary/40 cursor-pointer"
                            />
                            <span>
                              Unit {ch.chapterNumber}: {ch.chapterName}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <AppButton
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAligningChapters(false)}
                    >
                      Cancel
                    </AppButton>
                    <AppButton
                      size="sm"
                      onClick={() => void handleSaveChapterAlignment()}
                      disabled={savingChapters}
                    >
                      {savingChapters ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Save Alignment
                    </AppButton>
                  </div>
                </div>
              )}

              {/* Header for Questions */}
              <div className="flex items-center justify-between pt-1">
                <Typography className="text-sm font-bold text-foreground">
                  Questions & Reference Solutions ({paper.questions.length})
                </Typography>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      paper.questions.forEach((q) => {
                        all[q.id] = true;
                      });
                      setExpandedSolutions(all);
                    }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Expand all
                  </button>
                  <span className="text-muted-foreground/40">•</span>
                  <button
                    type="button"
                    onClick={() => setExpandedSolutions({})}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Collapse all
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {paper.questions.map((q, qIdx) => {
                const isExpanded = expandedSolutions[q.id] ?? false;
                const p2 = q.paperIIData;
                const isSindh = Boolean(paper.board?.toLowerCase().includes("sindh"));
                const choiceLabel = getChoiceBadgeLabel(paper.questions, qIdx, isSindh);

                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-border/80 bg-background overflow-hidden transition-all shadow-xs hover:border-border"
                  >
                    {/* Question Header */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                            Q{isSindh ? (qIdx + 1) : `${q.questionNumber}${q.questionPart || ""}`}
                          </span>
                          {choiceLabel && (
                            <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                              {choiceLabel}
                            </span>
                          )}
                          <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-bold text-muted-foreground uppercase">
                            {isSindh
                              ? q.questionType === "ERQ"
                                ? "Long QnA"
                                : "Short QnA"
                              : (q.questionType || q.questionPart || "CRQ")}
                          </span>
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                            {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                          </span>
                          {q.chapterName && (
                            <span className="rounded-md bg-muted/50 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {q.chapterName}
                            </span>
                          )}
                          {q.sloNumber && (
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                              SLO {q.sloNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <TeacherPaperQABugButton
                            paperId={paper.id}
                            questionId={q.id}
                            questionNumber={qIdx + 1}
                            subject={paper.subject}
                            classLevel={paper.classLevel}
                            board={paper.board}
                            chapterName={q.chapterName}
                            questionText={q.questionText}
                            title={paper.title}
                          />
                          <button
                            type="button"
                            onClick={() => toggleSolution(q.id)}
                            className="shrink-0 text-xs font-bold text-primary hover:underline px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
                          >
                            {isExpanded ? "Hide Solution" : "View Solution"}
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div
                        dir={isUrduText(q.questionText) ? "rtl" : "ltr"}
                        className={cn(
                          "text-sm font-semibold text-foreground/95 whitespace-pre-line",
                          isUrduText(q.questionText) ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                        )}
                        dangerouslySetInnerHTML={{
                          __html: convertMathToHTML(q.questionText || ""),
                        }}
                      />

                      {/* Correct Answer Summary */}
                      {q.correctAnswer && (
                        <div className="flex items-center gap-2 pt-1 text-xs font-bold text-primary">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span>Final Answer: {q.correctAnswer}</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Model Solution & Rubrics */}
                    {isExpanded && p2 && (
                      <div className="border-t border-border/60 bg-muted/20 p-4 sm:p-5 space-y-4">
                        {/* Better Response */}
                        {p2.betterResponse && (
                          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                              <CheckCircle2 className="size-4" />
                              <span>Model Solution / Benchmark (Full Marks)</span>
                            </div>
                            <div
                              className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-mono whitespace-pre-line"
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(p2.betterResponse),
                              }}
                            />
                          </div>
                        )}

                        {/* Marking Scheme */}
                        {p2.markingNotes && (
                          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs uppercase tracking-wider">
                              <Award className="size-4" />
                              <span>Marking Scheme / Rubric</span>
                            </div>
                            <div
                              className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-mono whitespace-pre-line"
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(p2.markingNotes),
                              }}
                            />
                          </div>
                        )}

                        {/* Weaker Response */}
                        {p2.weakerResponse && (
                          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                              <AlertCircle className="size-4" />
                              <span>Common Pitfalls & Weaker Responses</span>
                            </div>
                            <div
                              className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-mono whitespace-pre-line"
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(p2.weakerResponse),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions Card */}
        {paper && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="text-xs text-muted-foreground">
              {paper.totalQuestions} Questions • {paper.totalMarks} Total Marks
            </div>
            <div className="flex items-center gap-2">
              {onViewAttempts && (
                <AppButton
                  type="button"
                  onClick={onViewAttempts}
                  className="font-bold"
                >
                  View Student Attempts
                </AppButton>
              )}
              <AppButton
                type="button"
                variant="outline"
                onClick={onClose}
                className="font-bold"
              >
                Close Preview
              </AppButton>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
