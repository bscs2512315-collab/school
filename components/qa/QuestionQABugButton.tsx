"use client";

import React, { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { useQASettings } from "@/hooks/useQASettings";
import {
  Bug,
  CheckCircle2,
  AlertCircle,
  Wrench,
  X,
  Send,
  Sparkles,
  ChevronDown,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface QuestionQABugButtonProps {
  questionId: string;
  questionNumber?: number | string | null;
  pastPaperId?: string | null;
  subject?: string | null;
  classNameStr?: string | null;
  year?: number | string | null;
  paperNumber?: number | string | null;
  board?: string | null;
  currentChapter?: string | null;
  questionText?: string | null;
  imageUrl?: string | null;
  className?: string;
}

const BUG_CATEGORIES = [
  { id: "CUTOFF_DIAGRAM", label: "✂️ Cut-off / Clipped Diagram", desc: "Diagram edges, labels, or arrows are cut off" },
  { id: "MISSING_DIAGRAM", label: "❓ Missing Diagram", desc: "Question refers to diagram/graph/circuit but none is attached" },
  { id: "REDUNDANT_TEXT", label: "📝 Redundant Option Descriptions", desc: "Options duplicate table/diagram text (should be A, B, C, D)" },
  { id: "WRONG_CHAPTER", label: "📚 Wrong Chapter / Topic Mapping", desc: "Question belongs to a different chapter or SLO" },
  { id: "MATH_CHEM_FORMATTING", label: "🧮 Math / Chem Formula Formatting", desc: "Fractions, transpose, roots, matrices, or reaction arrows broken" },
  { id: "INCORRECT_KEY_OPTIONS", label: "❌ Incorrect Answer Key / Options", desc: "Correct answer key is wrong or options are broken" },
  { id: "OTHER", label: "💬 Other Issue / Notes", desc: "General quality or spelling issue" },
];

export default function QuestionQABugButton({
  questionId,
  questionNumber,
  pastPaperId,
  subject,
  classNameStr,
  year,
  paperNumber,
  board = "AKUEB",
  currentChapter,
  questionText,
  imageUrl,
  className,
}: QuestionQABugButtonProps) {
  const { data: user } = useUserProfile();
  const { settings } = useQASettings();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("CUTOFF_DIAGRAM");
  const [description, setDescription] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [existingBug, setExistingBug] = useState<any>(null);

  // Check if current user has QA or Admin privileges
  const isQA =
    user?.role === "QA" ||
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com" ||
    user?.email?.toLowerCase().includes("taha");

  // Fetch active bug for this question
  const fetchBugStatus = async () => {
    if (!questionId || !isQA) return;
    try {
      const res = await fetch(`/api/qa/bugs/question/${questionId}`);
      if (res.ok) {
        const data = await res.json();
        setExistingBug(data.bug);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBugStatus();
  }, [questionId, isQA]);

  if (!isQA || !settings.enabled_questions) return null;

  const handleSubmitReport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsOpen(false);
    toast.success("Bug reported successfully to QA Tracker! 🐞", {
      icon: "✅",
      duration: 3500,
    });

    // Set local optimistic state
    setExistingBug({
      status: "IN_PROGRESS",
      category,
      description,
    });

    // 2. Fire and forget in background
    fetch("/api/qa/bugs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bugType: "QUESTION",
        questionId,
        pastPaperId,
        category,
        description,
        metadata: {
          question_number: questionNumber,
          subject,
          class: classNameStr,
          year,
          paper_number: paperNumber,
          board,
          current_chapter: currentChapter,
          question_text_preview: questionText?.slice(0, 120),
          image_url: imageUrl,
        },
      }),
    })
      .then((res) => res.json())
      .then(() => {
        fetchBugStatus();
      })
      .catch((err) => {
        console.error("Failed to submit bug report:", err);
      });
  };

  const handleVerifyFix = async () => {
    if (!existingBug?.id) return;
    try {
      // Optimistic update
      setExistingBug((prev: any) => ({ ...prev, status: "VERIFIED" }));
      toast.success("🎉 Verified! Fix marked as tested and accurate.", { duration: 4000 });

      await fetch(`/api/qa/bugs/${existingBug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VERIFIED" }),
      });
      fetchBugStatus();
    } catch (err) {
      console.error("Failed to verify fix:", err);
    }
  };

  const handleRejectFix = async () => {
    if (!existingBug?.id) return;

    // 1-Click Instant Optimistic update
    setExistingBug((prev: any) => ({
      ...prev,
      status: "REJECTED",
    }));

    toast.error("❌ Fix Rejected! Marked as Rejected.", {
      duration: 3500,
    });

    try {
      await fetch(`/api/qa/bugs/${existingBug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
        }),
      });
      fetchBugStatus();
    } catch (err) {
      console.error("Failed to reject fix:", err);
    }
  };

  const selectedCategoryObj = BUG_CATEGORIES.find((c) => c.id === category) || BUG_CATEGORIES[0];

  return (
    <>
      {/* QA Status Action Pill */}
      <div className={cn("inline-flex flex-wrap items-center gap-2", className)}>
        {existingBug?.status === "FIXED" ? (
          <div className="inline-flex items-center gap-1.5">
            {/* Verify Button */}
            <button
              type="button"
              onClick={handleVerifyFix}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:scale-105 active:scale-95 animate-pulse"
              title="Fix deployed! Click to mark verified."
            >
              <CheckCircle2 className="size-3.5" />
              <span>Verify Fix? ✅</span>
            </button>

            {/* Reject Button (1-Click Instant) */}
            <button
              type="button"
              onClick={handleRejectFix}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-xs transition-all hover:bg-rose-500/20 hover:border-rose-500/60 active:scale-95"
              title="Click to reject this fix"
            >
              <XCircle className="size-3.5" />
              <span>Reject Fix ❌</span>
            </button>
          </div>
        ) : existingBug?.status === "REJECTED" ? (
          <div className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <RotateCcw className="size-3" />
              <span>Fix Rejected</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="rounded-full bg-muted/60 p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              title="Report additional bug details"
            >
              <Bug className="size-3.5" />
            </button>
          </div>
        ) : existingBug?.status === "VERIFIED" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            <span>Verified</span>
          </span>
        ) : existingBug?.status === "IN_PROGRESS" || existingBug?.status === "OPEN" ? (
          <div className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Bug className="size-3" />
              <span>Bug Reported</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="rounded-full bg-muted/60 p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              title="Edit report or add notes"
            >
              <Bug className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 transition-all hover:bg-amber-500/20 hover:border-amber-500/60 active:scale-95 dark:text-amber-400"
            title="Report question bug (QA Action)"
          >
            <Bug className="size-3.5" />
            <span>Report Bug</span>
          </button>
        )}
      </div>

      {/* Quick Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Bug className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">QA Bug Report · Question</h3>
                  <p className="text-xs text-muted-foreground">
                    {subject || "Subject"} {classNameStr ? `• Class ${classNameStr}` : ""}{" "}
                    {year ? `• ${year}` : ""}{" "}
                    {questionNumber ? `• Question ${questionNumber}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              {/* Category Dropdown */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-foreground">
                  Bug Category <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-3.5 py-2.5 text-left text-xs font-semibold shadow-xs transition-all hover:border-primary/50 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  >
                    <span>{selectedCategoryObj.label}</span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
                      {BUG_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.id);
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full flex-col rounded-xl px-3 py-2 text-left text-xs transition-colors",
                            category === cat.id
                              ? "bg-primary text-primary-foreground font-bold"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <span className="font-semibold">{cat.label}</span>
                          <span
                            className={cn(
                              "text-[10px]",
                              category === cat.id ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}
                          >
                            {cat.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-foreground">
                  Specific Details / Notes <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Diagram bottom axis is cut off, or option B should be 1/3(m+ni)..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-xs focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Context Preview Badge */}
              <div className="rounded-2xl bg-muted/40 p-3 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center justify-between font-medium">
                  <span>Question ID:</span>
                  <span className="font-mono text-[10px] truncate max-w-[200px]">{questionId}</span>
                </div>
                {currentChapter && (
                  <div className="flex items-center justify-between font-medium">
                    <span>Current Chapter:</span>
                    <span className="text-foreground font-semibold truncate max-w-[220px]">
                      {currentChapter}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Send className="size-3.5" />
                  <span>Submit Bug Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
