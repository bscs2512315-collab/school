"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  Share2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Award,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import QuestionImage from "@/components/exam/QuestionImage";
import PaperShareModal from "@/components/papers-bank/PaperShareModal";
import UserAvatar from "@/components/UserAvatar";
import { apiGet } from "@/lib/api/api-client";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";

export default function TeacherPaperBankViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: paperId } = use(params);
  const router = useRouter();

  const [paper, setPaper] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiGet<any>(`/papers-bank/${paperId}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setPaper(res.data);
          // Auto-expand first few solutions
          const initialExpanded: Record<string, boolean> = {};
          (res.data.questions || []).forEach((q: any, idx: number) => {
            if (idx < 5) initialExpanded[q.id] = true;
          });
          setExpandedSolutions(initialExpanded);
        } else {
          setError(res.message || "Failed to load paper");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Error loading paper");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [paperId]);

  const toggleSolution = (qId: string) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <AppLoader />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <PageContainer className="max-w-2xl py-16 text-center space-y-4">
        <AlertCircle className="mx-auto size-12 text-destructive" />
        <h2 className="text-xl font-black text-foreground">
          {error || "Paper Not Found"}
        </h2>
        <p className="text-xs text-muted-foreground">
          This paper may have been removed or set to private.
        </p>
        <AppButton
          onClick={() => router.push("/teacher/papers-bank")}
          className="rounded-xl text-xs font-bold"
        >
          Back to Papers Bank
        </AppButton>
      </PageContainer>
    );
  }

  const questions: any[] = paper.questions || [];
  const isPaper1 = paper.paperType === 1;

  return (
    <PageContainer className="w-full max-w-5xl space-y-6 pb-24 sm:pb-32 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/teacher/papers-bank")}
            className="group flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-2xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer"
            title="Back to Papers Bank"
          >
            <ArrowLeftSVG className="size-5 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Teacher Review Mode
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                {paper.subject} · Class {paper.classLevel}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {paper.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <AppButton
            variant="outline"
            onClick={() => window.print()}
            className="h-10 rounded-xl px-4 text-xs font-bold gap-1.5"
          >
            <Printer className="size-4" />
            <span>Print Paper</span>
          </AppButton>

          <AppButton
            onClick={() => setIsShareModalOpen(true)}
            className="h-10 rounded-xl px-4 text-xs font-black uppercase tracking-wider shadow-md gap-1.5"
          >
            <Share2 className="size-4" />
            <span>Share Paper</span>
          </AppButton>
        </div>
      </div>

      {/* Meta Summary Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider",
                isPaper1
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-purple-500/15 text-purple-700 dark:text-purple-400"
              )}
            >
              Paper {paper.paperType} · {isPaper1 ? "MCQs" : "Theory / CRQs"}
            </span>

            <span className="rounded-xl bg-muted px-3 py-1 text-xs font-bold text-foreground">
              {paper.totalQuestions} Questions · {paper.totalMarks} Total Marks
            </span>

            <span className="rounded-xl bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              {paper.board} Curriculum
            </span>
          </div>

          <div className="flex items-center gap-2">
            <UserAvatar
              src={paper.creator?.profileImage}
              name={paper.creator?.name}
              username={paper.creator?.username}
              id={paper.creator?.id}
              size={28}
              className="size-7"
            />
            <div className="text-xs">
              <span className="font-bold text-foreground">
                {paper.creator?.name}
              </span>
              <span className="text-muted-foreground"> ({paper.creator?.role || "Educator"})</span>
            </div>
          </div>
        </div>

        {/* Chapters Covered */}
        {paper.chapterNames && paper.chapterNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
            <span className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1 mr-1">
              <Layers className="size-3 text-primary" /> Units Tested:
            </span>
            {paper.chapterNames.map((ch: string, idx: number) => (
              <span
                key={idx}
                className="rounded-lg border border-border/70 bg-muted/40 px-2 py-0.5 text-xs font-semibold text-foreground"
              >
                {ch}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Questions with Marking Schemes &amp; Benchmark Rubrics ({questions.length})
        </h2>

        <div className="space-y-5">
          {questions.map((q, idx) => {
            const isExpanded = expandedSolutions[q.id];

            return (
              <div
                key={q.id}
                className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-4"
              >
                {/* Chapter Name */}
                {q.chapterName ? (
                  <div className="flex items-center sm:hidden mb-1.5">
                    <span className="inline-flex items-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold shadow-2xs">
                      {q.chapterName}
                    </span>
                  </div>
                ) : null}

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex size-7 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-2xs">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Question {idx + 1}
                    </span>
                    {q.chapterName ? (
                      <span className="hidden sm:inline-flex items-center rounded-lg bg-muted px-2.5 py-0.5 text-xs font-bold text-foreground">
                        {q.chapterName}
                      </span>
                    ) : null}
                  </div>

                  <span className="rounded-lg bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                    {q.marks || 1} Mark{(q.marks || 1) > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Question Text */}
                <div
                  className={cn(
                    "text-base font-bold text-foreground leading-relaxed",
                    isUrduText(q.questionText) && "text-right font-serif text-lg"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: convertMathToHTML(q.questionText),
                  }}
                />

                {q.imageUrl && (
                  <div className="pt-2">
                    <QuestionImage
                      src={q.imageUrl}
                      alt={`Question ${idx + 1}`}
                      className="max-h-60 rounded-2xl border border-border/60 object-contain shadow-2xs"
                    />
                  </div>
                )}

                {/* MCQ Options Display (with Correct Answer in Emerald) */}
                {Array.isArray(q.mcqOptions) && q.mcqOptions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {q.mcqOptions.map((opt: any, optIdx: number) => {
                      const optId = opt.id || String.fromCharCode(65 + optIdx);
                      const isCorrect = q.correctAnswer === optId;

                      return (
                        <div
                          key={optId}
                          className={cn(
                            "flex items-center justify-between gap-2.5 rounded-2xl border p-3 text-xs font-medium transition-colors",
                            isCorrect
                              ? "border-primary bg-primary/10 text-foreground font-bold ring-1 ring-primary/30"
                              : "border-border/70 bg-background text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black",
                                isCorrect
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {optId}
                            </span>
                            <span
                              className="truncate"
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(opt.text || ""),
                              }}
                            />
                          </div>

                          {isCorrect && (
                            <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                              Correct Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Paper 2 Model Solution & Rubrics Accordion */}
                {!isPaper1 && (
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => toggleSolution(q.id)}
                      className="flex w-full items-center justify-between text-xs font-black text-primary cursor-pointer hover:underline"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5" />
                        {isExpanded ? "Hide Model Solution & Rubrics" : "Show Model Solution & Rubrics"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 pt-2 text-xs border-t border-border/60">
                        {q.paperIIData?.betterResponse && (
                          <div className="space-y-1">
                            <p className="font-extrabold text-primary">
                              ✓ Benchmark / Model Student Answer:
                            </p>
                            <div
                              className="text-muted-foreground leading-relaxed pl-2 border-l-2 border-primary/40"
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(q.paperIIData.betterResponse),
                              }}
                            />
                          </div>
                        )}

                        {q.paperIIData?.weakerResponse && (
                          <div className="space-y-1">
                            <p className="font-extrabold text-amber-700 dark:text-amber-400">
                              ⚠ Common Misconceptions / Weaker Responses:
                            </p>
                            <div
                              className="text-muted-foreground leading-relaxed pl-2 border-l-2 border-amber-500/40"
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(q.paperIIData.weakerResponse),
                              }}
                            />
                          </div>
                        )}

                        {q.paperIIData?.markingNotes && (
                          <div className="space-y-1">
                            <p className="font-extrabold text-blue-700 dark:text-blue-400">
                              📋 Examiner Marking Rubrics:
                            </p>
                            <div
                              className="text-muted-foreground leading-relaxed pl-2 border-l-2 border-blue-500/40"
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(q.paperIIData.markingNotes),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <PaperShareModal
        paperId={paper.id}
        paperTitle={paper.title}
        subject={paper.subject}
        paperType={paper.paperType}
        classLevel={paper.classLevel}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </PageContainer>
  );
}
