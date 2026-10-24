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
  FileText,
  ChevronDown,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TeacherPaperQABugButtonProps {
  paperId?: string | null;
  questionId?: string | null;
  questionNumber?: number | string | null;
  subject?: string | null;
  classLevel?: string | null;
  board?: string | null;
  chapterName?: string | null;
  questionText?: string | null;
  title?: string | null;
  className?: string;
}

const PAPER_BUG_CATEGORIES = [
  { id: "DUPLICATE_QUESTIONS", label: "🔀 Duplicate / Redundant Question", desc: "Same question generated more than once in this paper" },
  { id: "WRONG_CHAPTER_SLO", label: "📚 Wrong Chapter / SLO Mapping", desc: "Question doesn't belong to the selected chapter/topic" },
  { id: "MATH_URDU_FORMAT", label: "🧮 Math / Formula / Urdu Broken", desc: "Equations, chemical reaction arrows, fractions, or Urdu glyphs unreadable" },
  { id: "INCORRECT_KEY_RUBRIC", label: "❌ Incorrect Answer Key / Rubric", desc: "Correct option marked wrong or grading rubric has mistakes" },
  { id: "BAD_DIFFICULTY_DIST", label: "📐 Bad Difficulty / Marks Distribution", desc: "Marks or question cognitive level (K/U/A) unbalanced" },
  { id: "OTHER", label: "💬 Other Generator Issue", desc: "Layout, typography, or test paper formatting defect" },
];

const REJECTION_PRESETS = [
  "🔀 Duplicate questions still present in paper",
  "📚 Questions mapped to wrong SLO/Chapter",
  "🧮 Broken mathematical or Urdu formatting",
  "❌ Incorrect rubric or answer key",
];

export default function TeacherPaperQABugButton({
  paperId,
  questionId,
  questionNumber,
  subject,
  classLevel,
  board = "AKUEB",
  chapterName,
  questionText,
  title,
  className,
}: TeacherPaperQABugButtonProps) {
  const { data: user } = useUserProfile();
  const { settings } = useQASettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [category, setCategory] = useState("DUPLICATE_QUESTIONS");
  const [description, setDescription] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [existingBug, setExistingBug] = useState<any>(null);

  const isQA =
    user?.role === "QA" ||
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com" ||
    user?.email?.toLowerCase().includes("taha");

  if (!isQA || !settings.enabled_teacher_paper) return null;

  const handleSubmitReport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Instant Optimistic Feedback
    setIsOpen(false);
    toast.success("Bug Reported! Fixes are in queue, we will notify you once ready.", {
      icon: "✅",
      duration: 4500,
    });

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
        bugType: "TEACHER_PAPER",
        paperId: paperId || null,
        title: title || `Paper: ${subject || "Test Paper"} ${classLevel ? `Class ${classLevel}` : ""} Q${questionNumber || 1}`,
        category,
        description,
        metadata: {
          paper_id: paperId,
          question_id: questionId,
          question_number: questionNumber,
          subject,
          classLevel,
          board,
          chapterName,
          question_text_preview: questionText?.slice(0, 120),
          paper_title: title,
        },
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.error("Failed to submit teacher paper bug report:", err);
      });
  };

  const handleVerifyFix = async () => {
    if (!existingBug?.id) return;
    try {
      setExistingBug((prev: any) => ({ ...prev, status: "VERIFIED" }));
      toast.success("🎉 Verified! Teacher paper fix marked as tested.", { duration: 4000 });

      await fetch(`/api/qa/bugs/${existingBug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VERIFIED" }),
      });
    } catch (err) {
      console.error("Failed to verify paper fix:", err);
    }
  };

  const handleRejectFix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!existingBug?.id) return;

    const feedback = rejectionReason.trim() || "QA tester rejected teacher paper fix.";

    setIsRejectOpen(false);
    setExistingBug((prev: any) => ({
      ...prev,
      status: "REJECTED",
      metadata: { ...(prev?.metadata || {}), rejection_reason: feedback },
    }));

    toast.error("❌ Fix Rejected! Returned to queue with your feedback.", { duration: 5000 });

    try {
      await fetch(`/api/qa/bugs/${existingBug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: feedback,
        }),
      });
    } catch (err) {
      console.error("Failed to reject paper fix:", err);
    }
  };

  const selectedCategoryObj = PAPER_BUG_CATEGORIES.find((c) => c.id === category) || PAPER_BUG_CATEGORIES[0];

  return (
    <>
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        {existingBug?.status === "FIXED" ? (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handleVerifyFix}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-95 animate-pulse"
              title="Fix deployed! Click to mark verified."
            >
              <CheckCircle2 className="size-3" />
              <span>Verify Fix? ✅</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRejectOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 shadow-xs hover:bg-rose-500/20 active:scale-95"
              title="Reject fix and send feedback"
            >
              <XCircle className="size-3" />
              <span>Reject ❌</span>
            </button>
          </div>
        ) : existingBug?.status === "REJECTED" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
            <RotateCcw className="size-3" />
            <span>Fix Rejected</span>
          </span>
        ) : existingBug?.status === "VERIFIED" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            <span>Verified</span>
          </span>
        ) : existingBug?.status === "IN_PROGRESS" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
            <Wrench className="size-3 animate-spin" />
            <span>Fix in Queue</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:border-emerald-500/60 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95"
            title="Report Teacher Paper Generation Issue (QA Action)"
          >
            <Bug className="size-3 text-emerald-500" />
            <span>Fix Paper</span>
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
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">QA Bug Report · Teacher Paper</h3>
                  <p className="text-xs text-muted-foreground">
                    {subject ? `${subject} • ` : ""}
                    {classLevel ? `Class ${classLevel} • ` : ""}
                    Report Duplicates, SLO Mismatch, or Rubric Issues
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

            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-foreground">
                  Paper Issue Category <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-3.5 py-2.5 text-left text-xs font-semibold shadow-xs transition-all hover:border-primary/50 focus:outline-hidden"
                  >
                    <span>{selectedCategoryObj.label}</span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
                      {PAPER_BUG_CATEGORIES.map((cat) => (
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

              <div>
                <label className="mb-1.5 block text-xs font-bold text-foreground">
                  Issue Description <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Question 3 is identical to Question 8, or Rubric part (b) is missing 2 marks breakdown..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-xs focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-all"
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

      {/* Reject Fix Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-rose-500/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <XCircle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Reject Paper Fix · Return to Queue</h3>
                  <p className="text-xs text-muted-foreground">Explain what still needs correction</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRejectFix} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-foreground">
                  Why is this fix rejected? <span className="text-destructive">*</span>
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {REJECTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      className={cn(
                        "rounded-xl border px-2.5 py-1 text-[11px] font-medium transition-all",
                        rejectionReason === preset
                          ? "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Describe what is still broken in this generated test paper..."
                  rows={4}
                  required
                  className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-xs focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 transition-all active:scale-95"
                >
                  <XCircle className="size-3.5" />
                  <span>Reject Fix & Send to Queue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
