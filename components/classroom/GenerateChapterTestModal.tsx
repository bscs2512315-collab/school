"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Sparkles,
  Layers,
  Check,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Send,
  RotateCcw,
  ArrowRight,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";
import AppButton from "@/components/AppButton";
import AppDateTimePicker from "@/components/AppDateTimePicker";
import { cn } from "@/lib/utils";
import type { MappedSloItem } from "@/lib/paper/slo-coverage";
import { startTeacherDraftGeneration } from "@/lib/teacher/teacher-drafts-store";
import toast from "react-hot-toast";

interface SloGroup {
  subtopicNumber: string;
  subtopicName: string;
  slos: MappedSloItem[];
}

interface GenerateChapterTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  chapter: {
    chapterId: string;
    chapterNumber: number;
    chapterName: string;
    totalSlos?: number;
    coveredSlos?: number;
    subtopics?: SloGroup[];
  } | null;
  classroom: {
    subject: string;
    classLevel: string;
    board: string;
    name?: string | null;
  };
  initialPaperType?: "1" | "2";
  initialDifficulty?: DifficultyTier;
  onSuccess?: () => void;
  onDraftCreated?: () => void;
}

type DifficultyTier = "Alpha" | "Beta" | "Gamma";
type PaperTypeSelection = "1" | "2";

// Inline error badge shown beneath a section
function FieldError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-xs font-bold">
      <AlertCircle className="size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default function GenerateChapterTestModal({
  isOpen,
  onClose,
  classroomId,
  chapter,
  classroom,
  initialPaperType,
  initialDifficulty,
  onSuccess,
  onDraftCreated,
}: GenerateChapterTestModalProps) {
  // Main wizard step: "config1" (difficulty + SLOs) → "config2" (questions/format/sets)
  const [step, setStep] = useState<"config1" | "config2">("config1");

  // Selection states
  const [difficulty, setDifficulty] = useState<DifficultyTier | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [setsCount, setSetsCount] = useState<number | null>(null);
  const [paperType, setPaperType] = useState<PaperTypeSelection | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [sloScope, setSloScope] = useState<"untested" | "retest" | "all" | null>(null);
  const [selectedSlos, setSelectedSlos] = useState<Set<string>>(new Set());

  // Inline validation error messages per field
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Flatten all testable SLOs
  const chapterSlos = useMemo(() => {
    const groups = chapter?.subtopics ?? [];
    const flattened: Array<MappedSloItem & { subtopicNumber: string; subtopicName: string }> = [];
    for (const group of groups) {
      for (const slo of group.slos) {
        const cog = slo.cognitiveLevel?.toUpperCase();
        const isCA =
          slo.isClassroomActivity ||
          cog === "CA" ||
          cog === "FA";
        if (isCA) continue;
        flattened.push({
          ...slo,
          subtopicNumber: group.subtopicNumber,
          subtopicName: group.subtopicName,
        });
      }
    }
    return flattened;
  }, [chapter]);

  const untestedSlos = useMemo(
    () => chapterSlos.filter((s) => !s.isCovered),
    [chapterSlos],
  );
  const testedSlos = useMemo(
    () => chapterSlos.filter((s) => s.isCovered),
    [chapterSlos],
  );

  const applySloScope = (scope: "untested" | "retest" | "all") => {
    if (sloScope === scope) {
      setSloScope(null);
      setSelectedSlos(new Set());
      return;
    }
    setSloScope(scope);
    const source =
      scope === "untested" ? untestedSlos : scope === "retest" ? testedSlos : chapterSlos;
    setSelectedSlos(new Set(source.map((s) => s.sloNumber)));
  };

  const toggleSlo = (sloNumber: string) => {
    setSloScope(null);
    setSelectedSlos((prev) => {
      const next = new Set(prev);
      if (next.has(sloNumber)) {
        next.delete(sloNumber);
      } else {
        next.add(sloNumber);
      }
      return next;
    });
  };

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) return;
    setDifficulty(initialDifficulty || null);
    setPaperType(initialPaperType || null);
    setQuestionCount(null);
    setSetsCount(null);
    setSloScope(null);
    setSelectedSlos(new Set());
    setErrors({});
    setStep("config1");
  }, [isOpen, initialDifficulty, initialPaperType]);

  if (!isOpen || !chapter) return null;

  // Validate page 1 (difficulty + SLOs)
  const validatePage1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!difficulty) {
      errs.difficulty = "Please select a difficulty level to continue.";
    }
    if (chapterSlos.length > 0 && selectedSlos.size === 0) {
      errs.slos = "Select at least one SLO to test.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate page 2 (questions, format, sets)
  const validatePage2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!questionCount) {
      errs.questionCount = "Please choose a question count.";
    }
    if (!paperType) {
      errs.paperType = "Please select a paper format (Paper 1 or Paper 2).";
    }
    if (!setsCount) {
      errs.setsCount = "Please select how many variant sets to generate.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextPage = () => {
    if (validatePage1()) {
      setErrors({});
      setStep("config2");
    }
  };

  const handleGenerateDrafts = () => {
    if (!validatePage2()) return;

    const resolvedCount = questionCount!;
    const resolvedSets = setsCount!;
    const resolvedType = paperType!;
    const resolvedDifficulty = difficulty!;

    // Start background generation in Drafts store (non-blocking!)
    startTeacherDraftGeneration({
      classroomId,
      chapterId: chapter.chapterId,
      chapterNumber: chapter.chapterNumber,
      chapterName: chapter.chapterName,
      subject: classroom.subject,
      classLevel: classroom.classLevel,
      board: classroom.board,
      paperType: resolvedType,
      difficulty: resolvedDifficulty,
      questionCount: resolvedCount,
      setsCount: resolvedSets,
      sloNumbers: Array.from(selectedSlos),
      dueDate: dueDate || undefined,
    });

    toast.success(
      resolvedSets > 1
        ? `Generating ${resolvedSets} sets for Chapter ${chapter.chapterNumber} in the background! Check the Drafts tab.`
        : `Generating Practice Test for Chapter ${chapter.chapterNumber} in the background! Check the Drafts tab.`,
      { icon: "🚀", duration: 4000 },
    );

    onDraftCreated?.();
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 bg-card shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                <Sparkles className="size-3" />
                Syllabus Test Generator
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                Step {step === "config1" ? "1 of 2" : "2 of 2"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
              Chapter {chapter.chapterNumber}: {chapter.chapterName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {classroom.subject} · Class {classroom.classLevel} ({classroom.board})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Wizard Steps */}
        {step === "config1" ? (
          /* ── PAGE 1: Difficulty + SLOs ── */
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* 1. Difficulty Tier */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>1. Difficulty Level</span>
                <span className="text-[11px] font-bold text-primary">Target Cognitive Tier</span>
              </label>
              <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-2.5">
                {(["Alpha", "Beta", "Gamma"] as DifficultyTier[]).map((tier) => {
                  const colorMap: Record<DifficultyTier, { ring: string; badge: string; check: string }> = {
                    Alpha: { ring: "border-emerald-500 bg-emerald-500/10 ring-emerald-500/30", badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", check: "bg-emerald-600" },
                    Beta: { ring: "border-blue-500 bg-blue-500/10 ring-blue-500/30", badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400", check: "bg-blue-600" },
                    Gamma: { ring: "border-purple-500 bg-purple-500/10 ring-purple-500/30", badge: "bg-purple-500/15 text-purple-700 dark:text-purple-400", check: "bg-purple-600" },
                  };
                  const labels: Record<DifficultyTier, { title: string; desc: string }> = {
                    Alpha: { title: "Foundation", desc: "Core definitions & direct solutions" },
                    Beta: { title: "Standard", desc: "Official board exam application questions" },
                    Gamma: { title: "Advanced", desc: "Analytical & high-order reasoning" },
                  };
                  const c = colorMap[tier];
                  const l = labels[tier];
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        setDifficulty(tier);
                        setErrors((e) => ({ ...e, difficulty: "" }));
                      }}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer",
                        difficulty === tier
                          ? `${c.ring} shadow-xs ring-1`
                          : "border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40",
                      )}
                    >
                      <div>
                        <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md", c.badge)}>
                          {tier}
                        </span>
                        <p className="text-xs font-black text-foreground mt-1.5">{l.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{l.desc}</p>
                      </div>
                      {difficulty === tier && (
                        <div className={cn("size-4 rounded-full text-white flex items-center justify-center mt-2 ml-auto", c.check)}>
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.difficulty && <FieldError message={errors.difficulty} />}
            </div>

            {/* 2. Select SLOs to Test */}
            {chapterSlos.length > 0 ? (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>2. Select SLOs to Test</span>
                  <span className="text-[11px] font-bold text-primary">
                    {selectedSlos.size} of {chapterSlos.length} selected
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-1.5">
                  {(["untested", "retest", "all"] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => {
                        applySloScope(scope);
                        setErrors((e) => ({ ...e, slos: "" }));
                      }}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        sloScope === scope
                          ? scope === "untested"
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400"
                            : "bg-primary/15 border-primary/40 text-primary"
                          : "bg-muted/30 border-border text-foreground hover:bg-muted/60",
                      )}
                    >
                      {scope === "untested" ? `Untested (${untestedSlos.length})` : scope === "retest" ? (
                        <span className="inline-flex items-center justify-center gap-1">
                          <RotateCcw className="size-3" />Tested ({testedSlos.length})
                        </span>
                      ) : (
                        `All SLOs (${chapterSlos.length})`
                      )}
                    </button>
                  ))}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-muted/20 border border-border">
                  {chapterSlos.map((slo) => {
                    const isSelected = selectedSlos.has(slo.sloNumber);
                    return (
                      <button
                        key={slo.sloNumber}
                        type="button"
                        onClick={() => {
                          toggleSlo(slo.sloNumber);
                          setErrors((e) => ({ ...e, slos: "" }));
                        }}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer",
                          isSelected
                            ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                            : "bg-card border-border/60 hover:border-border hover:bg-muted/30",
                        )}
                      >
                        <div
                          className={cn(
                            "size-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-primary font-mono">
                              SLO {slo.sloNumber}
                            </span>
                            {slo.cognitiveLevel && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {slo.cognitiveLevel}
                              </span>
                            )}
                            {slo.isCovered ? (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                • Tested
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                • Untested
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground mt-0.5 leading-snug line-clamp-2">
                            {slo.sloText}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.slos && <FieldError message={errors.slos} />}
              </div>
            ) : null}
          </div>
        ) : (
          /* ── PAGE 2: Questions / Format / Sets ── */
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* 3. Question Count */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                3. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setQuestionCount(count);
                      setErrors((e) => ({ ...e, questionCount: "" }));
                    }}
                    className={cn(
                      "py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                      questionCount === count
                        ? "border-primary bg-primary/10 text-primary font-black shadow-xs ring-1 ring-primary/30"
                        : "border-border/80 bg-muted/20 text-foreground hover:bg-muted/40",
                    )}
                  >
                    <p className="text-sm font-black">{count}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Questions</p>
                  </button>
                ))}
              </div>
              {errors.questionCount && <FieldError message={errors.questionCount} />}
            </div>

            {/* 4. Paper Format */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                4. Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaperType("1");
                    setErrors((e) => ({ ...e, paperType: "" }));
                  }}
                  className={cn(
                    "py-3 px-3 rounded-xl text-sm font-bold border transition-all cursor-pointer text-center",
                    paperType === "1"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/30 border-border text-foreground hover:bg-muted/60",
                  )}
                >
                  Paper 1 (MCQs)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaperType("2");
                    setErrors((e) => ({ ...e, paperType: "" }));
                  }}
                  className={cn(
                    "py-3 px-3 rounded-xl text-sm font-bold border transition-all cursor-pointer text-center",
                    paperType === "2"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/30 border-border text-foreground hover:bg-muted/60",
                  )}
                >
                  Paper 2 (CRQs)
                </button>
              </div>
              {errors.paperType && <FieldError message={errors.paperType} />}
            </div>

            {/* 5. Variant Sets */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-2">
                <span className="truncate">5. Multi-Set Rotation</span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[11px] font-bold text-muted-foreground">
                  <SecureExamSVG className="size-3 text-primary shrink-0" />
                  Anti-Cheating
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setSetsCount(num);
                      setErrors((e) => ({ ...e, setsCount: "" }));
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between",
                      setsCount === num
                        ? "border-primary bg-primary/10 text-primary font-black shadow-xs ring-1 ring-primary/30"
                        : "border-border/80 bg-muted/20 text-foreground hover:bg-muted/40 font-bold",
                    )}
                  >
                    <p className="text-xs font-bold">{num} {num === 1 ? "Set" : "Sets"}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      {num === 1 ? "Single" : num === 2 ? "Set A & B" : `Set A-${String.fromCharCode(64 + num)}`}
                    </p>
                  </button>
                ))}
              </div>
              {errors.setsCount && <FieldError message={errors.setsCount} />}
              <p className="text-[11px] text-muted-foreground font-medium">
                Enrolled students will receive randomized sets to foster authentic test completion.
              </p>
            </div>

            {/* 6. Submission Deadline (Optional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  6. Submission Deadline (Optional)
                </label>
                {dueDate ? (
                  <button
                    type="button"
                    onClick={() => setDueDate("")}
                    className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <AppDateTimePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select deadline date & time"
              />
              <p className="text-[11px] text-muted-foreground font-medium">
                Optional. Students who submit after the deadline receive 50% fewer points.
              </p>
            </div>

            {/* Summary callout */}
            {questionCount && paperType && setsCount && difficulty ? (
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Sparkles className="size-4" />
                </div>
                <div className="text-xs font-medium text-foreground min-w-0">
                  <span className="font-bold text-primary">Non-blocking Generation: </span>
                  Will generate{" "}
                  <strong className="font-black text-foreground">
                    {setsCount} {setsCount === 1 ? "set" : "variant sets"}
                  </strong>{" "}
                  ({questionCount} {paperType === "1" ? "MCQs" : "CRQs"} each, {difficulty} Tier) in the background. You can navigate freely and review/publish the draft anytime from the <strong className="font-black text-primary">Drafts</strong> tab.
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Modal Footer */}
        {step === "config1" ? (
          <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex items-center gap-3 shrink-0">
            <AppButton
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl h-11 text-sm font-semibold"
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              onClick={handleNextPage}
              className="flex-1 rounded-xl h-11 text-sm font-bold shadow-md inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              Next
              <ArrowRight className="size-4" />
            </AppButton>
          </div>
        ) : (
          <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex items-center gap-3 shrink-0">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => { setErrors({}); setStep("config1"); }}
              className="flex-1 rounded-xl h-11 text-sm font-semibold inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back
            </AppButton>
            <AppButton
              type="button"
              onClick={handleGenerateDrafts}
              className="flex-1 rounded-xl h-11 text-sm font-bold shadow-md inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              <GenerateSVG className="size-4" />
              Generate in Background
            </AppButton>
          </div>
        )}
      </div>
    </div>
  );
}
