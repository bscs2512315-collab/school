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
  Bot,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface NovaQABugButtonProps {
  sessionId?: string | null;
  messageId?: string | null;
  userPrompt?: string | null;
  assistantResponse?: string | null;
  chapterContext?: string | null;
  subject?: string | null;
  className?: string;
}

const NOVA_BUG_CATEGORIES = [
  { id: "HALLUCINATION", label: "🤖 Hallucination / Factually Incorrect", desc: "AI stated incorrect facts, false definitions, or invalid reasoning" },
  { id: "MATH_CHEM_FORMULA", label: "🧮 Math / Formula / LaTeX Error", desc: "Broken LaTeX equation, fractions, radicals, or matrix formatting" },
  { id: "CUTOFF_INCOMPLETE", label: "✂️ Cut-off / Incomplete Answer", desc: "Response stopped midway or omitted requested steps" },
  { id: "IRRELEVANT_OFFTOPIC", label: "📝 Irrelevant / Ignored Prompt", desc: "Nova gave an answer that doesn't answer the student's question" },
  { id: "WRONG_SLO_TOPIC", label: "📚 Wrong Curriculum / SLO Level", desc: "Explanation assumes wrong grade or board curriculum standards" },
  { id: "OTHER", label: "💬 Other Nova Issue", desc: "Quality, tone, repetitive text, or formatting glitch" },
];

const REJECTION_PRESETS = [
  "🤖 Response still contains factual hallucination",
  "🧮 LaTeX math/chemistry formulas still broken",
  "✂️ Reply is still cut off or incomplete",
  "📝 Explanation is off-topic or confusing",
];

export default function NovaQABugButton({
  sessionId,
  messageId,
  userPrompt,
  assistantResponse,
  chapterContext,
  subject,
  className,
}: NovaQABugButtonProps) {
  const { data: user } = useUserProfile();
  const { settings } = useQASettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [category, setCategory] = useState("HALLUCINATION");
  const [description, setDescription] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [existingBug, setExistingBug] = useState<any>(null);

  const isQA =
    user?.role === "QA" ||
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com" ||
    user?.email?.toLowerCase().includes("taha");

  const fetchBugStatus = async () => {
    if (!sessionId || !isQA) return;
    try {
      const res = await fetch(`/api/qa/bugs/session/${sessionId}`);
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
  }, [sessionId, isQA]);

  if (!isQA || !settings.enabled_nova) return null;

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
        bugType: "NOVA_CHAT",
        sessionId,
        title: `Nova Chat: ${userPrompt?.slice(0, 50) || "Student Query"}`,
        category,
        description,
        metadata: {
          session_id: sessionId,
          message_id: messageId,
          subject,
          chapter: chapterContext,
          prompt: userPrompt,
          response_preview: assistantResponse?.slice(0, 300),
        },
      }),
    })
      .then((res) => res.json())
      .then(() => {
        fetchBugStatus();
      })
      .catch((err) => {
        console.error("Failed to submit Nova bug report:", err);
      });
  };

  const handleVerifyFix = async () => {
    if (!existingBug?.id) return;
    try {
      setExistingBug((prev: any) => ({ ...prev, status: "VERIFIED" }));
      toast.success("🎉 Verified! Nova fix marked as tested.", { duration: 4000 });

      await fetch(`/api/qa/bugs/${existingBug.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VERIFIED" }),
      });
      fetchBugStatus();
    } catch (err) {
      console.error("Failed to verify Nova fix:", err);
    }
  };

  const handleRejectFix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!existingBug?.id) return;

    const feedback = rejectionReason.trim() || "QA tester rejected Nova fix.";

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
      fetchBugStatus();
    } catch (err) {
      console.error("Failed to reject Nova fix:", err);
    }
  };

  const selectedCategoryObj = NOVA_BUG_CATEGORIES.find((c) => c.id === category) || NOVA_BUG_CATEGORIES[0];

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
            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-2 py-1 text-[10px] font-bold text-muted-foreground hover:border-amber-500/60 hover:text-amber-600 dark:hover:text-amber-400 transition-all active:scale-95"
            title="Report Nova AI Hallucination / Error (QA Action)"
          >
            <Bug className="size-3 text-amber-500" />
            <span>Fix AI Reply</span>
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
                <div className="flex size-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">QA Bug Report · Nova AI</h3>
                  <p className="text-xs text-muted-foreground">
                    {subject ? `${subject} • ` : ""}
                    {chapterContext ? `${chapterContext} • ` : ""}
                    Report AI Tutor Hallucination or Formatting
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
                  AI Issue Type <span className="text-destructive">*</span>
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
                      {NOVA_BUG_CATEGORIES.map((cat) => (
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
                  Specific Details <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Formula in step 2 should be integral of x^2 dx, or Nova gave definition of mitosis for meiosis..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 shadow-xs focus:border-primary focus:outline-hidden"
                />
              </div>

              {userPrompt && (
                <div className="rounded-2xl bg-muted/40 p-3 border border-border/50 text-[11px] space-y-1">
                  <span className="font-bold text-muted-foreground">Prompt Snippet:</span>
                  <p className="text-foreground line-clamp-2 italic">"{userPrompt}"</p>
                </div>
              )}

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
                  <h3 className="text-base font-bold text-foreground">Reject Nova Fix · Return to Queue</h3>
                  <p className="text-xs text-muted-foreground">Provide feedback on what remains incorrect</p>
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
                  placeholder="Describe what is still broken in Nova's response..."
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
