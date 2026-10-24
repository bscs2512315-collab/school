"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  RefreshCw,
  Share2,
  Award,
  Check,
  X,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppLoader from "@/components/AppLoader";
import ConfirmationModal from "@/components/ConfirmationModal";
import ExamNavigation from "@/components/exam/ExamNavigation";
import McqOptionButton from "@/components/exam/McqOptionButton";
import ExamAntiCheatShell from "@/components/exam/ExamAntiCheatShell";
import QuestionQABugButton from "@/components/qa/QuestionQABugButton";
import QuestionImage from "@/components/exam/QuestionImage";
import { useQuestionDiagramPreloader } from "@/hooks/exam/useQuestionDiagramPreloader";
import PaperShareModal from "@/components/papers-bank/PaperShareModal";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { examDurationFromQuestions } from "@/lib/paper/exam-duration";
import { cn } from "@/lib/utils";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import RefreshSVG from "@/public/svgs/RefreshSVG";

interface QuestionResult {
  correct: boolean;
  correctAnswer: string | null;
  selectedAnswer: string | null;
}

interface ExamResult {
  attemptId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  pointsAwarded: number;
  questionResults: Record<string, QuestionResult>;
}

export default function StudentPaperBankAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: paperId } = use(params);
  const router = useRouter();

  const [paper, setPaper] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Preload next 5 question diagrams silently in the background
  useQuestionDiagramPreloader(paper?.questions, currentIndex, 5);

  // Load paper details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiGet<any>(`/papers-bank/${paperId}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setPaper(res.data);
          const qs = res.data.questions || [];
          const duration = examDurationFromQuestions(qs, {
            paperType: String(res.data.paperType) as "1" | "2",
          });
          setTimeLeft(duration);
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

  // Countdown timer
  useEffect(() => {
    if (result || timeLeft <= 0 || loading || !paper) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleSubmitAttempt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result, timeLeft, loading, paper]);

  const handleSubmitAttempt = async () => {
    if (submitting || !paper) return;

    setSubmitting(true);
    const toastId = toast.loading("Scoring your answers...");

    try {
      const res = await apiPost<any>("/student/generate-paper/submit", {
        generatedPaperId: paper.id,
        paperType: paper.paperType,
        subject: paper.subject,
        answers,
        timeTaken: examDurationFromQuestions(paper.questions || [], {
          paperType: String(paper.paperType) as "1" | "2",
        }) - timeLeft,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to submit attempt");
      }

      setResult(res.data);
      setShowSubmitModal(false);
      toast.success(
        `Exam finished! Scored ${res.data.score}/${res.data.totalMarks} · +${res.data.pointsAwarded} Points! 🎉`,
        { id: toastId }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit paper";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
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
          This paper may have been set to private or removed from the Papers Bank.
        </p>
        <AppButton
          onClick={() => router.push("/student/papers-bank")}
          className="rounded-xl text-xs font-bold"
        >
          Back to Papers Bank
        </AppButton>
      </PageContainer>
    );
  }

  const questions: any[] = paper.questions || [];
  const currentQuestion = questions[currentIndex] || null;

  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === questions.length - 1;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins}:${remainderSecs.toString().padStart(2, "0")}`;
  };

  // ── RESULT SCREEN ──────────────────────────────────────────────────────────
  if (result) {
    const pct = Math.round(result.percentage);

    return (
      <PageContainer className="w-full max-w-4xl space-y-6 pb-24 sm:pb-32 animate-in fade-in duration-200">
        {/* Result Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                <Award className="size-3.5" /> Exam Complete
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {pct >= 80 ? "Outstanding Performance! 🏆" : pct >= 50 ? "Well Done! 👍" : "Keep Practicing! 💡"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {paper.title} · {paper.subject} (Class {paper.classLevel})
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center rounded-2xl border border-border/70 bg-background/60 p-3.5 min-w-[90px]">
                <p className="text-2xl sm:text-3xl font-black text-foreground">
                  {result.score}/{result.totalMarks}
                </p>
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  Score ({pct}%)
                </p>
              </div>

              <div className="text-center rounded-2xl border border-primary/20 bg-primary/10 p-3.5 min-w-[90px]">
                <p className="text-2xl sm:text-3xl font-black text-primary">
                  +{result.pointsAwarded}
                </p>
                <p className="text-[10px] font-black uppercase text-primary">
                  Points
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
            <AppButton
              onClick={() => {
                setResult(null);
                setAnswers({});
                setCurrentIndex(0);
                setTimeLeft(
                  examDurationFromQuestions(questions, {
                    paperType: String(paper.paperType) as "1" | "2",
                  })
                );
              }}
              className="h-10 rounded-xl px-5 text-xs font-black uppercase tracking-wider gap-2 shadow-sm"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry Paper</span>
            </AppButton>

            <AppButton
              variant="outline"
              onClick={() => setIsShareModalOpen(true)}
              className="h-10 rounded-xl px-4 text-xs font-bold gap-1.5"
            >
              <Share2 className="size-3.5" />
              <span>Challenge Friend</span>
            </AppButton>

            <AppButton
              variant="outline"
              onClick={() => router.push("/student/papers-bank")}
              className="h-10 rounded-xl px-4 text-xs font-bold"
            >
              Back to Papers Bank
            </AppButton>
          </div>
        </div>

        {/* Question-by-Question Review */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
            Detailed Solution &amp; Answer Review
          </h3>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const res = result.questionResults[q.id];
              const isCorrect = res?.correct;
              const selectedOpt = res?.selectedAnswer;
              const correctOpt = res?.correctAnswer;

              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-2xl border p-4 sm:p-5 transition-all",
                    isCorrect
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-background text-xs font-black text-foreground shadow-2xs border border-border">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {q.chapterName || paper.subject}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase",
                        isCorrect
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {isCorrect ? (
                        <>
                          <Check className="size-3" /> Correct
                        </>
                      ) : (
                        <>
                          <X className="size-3" /> Incorrect
                        </>
                      )}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div
                    className={cn(
                      "mt-3 text-sm font-semibold text-foreground leading-relaxed",
                      isUrduText(q.questionText) && "text-right font-serif text-base"
                    )}
                    dangerouslySetInnerHTML={{
                      __html: convertMathToHTML(q.questionText),
                    }}
                  />

                  {q.imageUrl && (
                    <div className="mt-3">
                      <QuestionImage
                        src={q.imageUrl}
                        alt={`Question ${idx + 1}`}
                        className="max-h-48 rounded-xl object-contain"
                      />
                    </div>
                  )}

                  {/* Options Review */}
                  {Array.isArray(q.mcqOptions) && q.mcqOptions.length > 0 && (
                    <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.mcqOptions.map((opt: any, optIdx: number) => {
                        const optId = opt.id || String.fromCharCode(65 + optIdx);
                        const isSelectedThis = selectedOpt === optId;
                        const isCorrectThis = correctOpt === optId;

                        return (
                          <div
                            key={optId}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs font-medium",
                              isCorrectThis
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold"
                                : isSelectedThis
                                ? "border-destructive bg-destructive/15 text-destructive font-bold"
                                : "border-border/60 bg-background text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-black text-foreground">
                                {optId}
                              </span>
                              <span
                                className="truncate"
                                dangerouslySetInnerHTML={{
                                  __html: convertMathToHTML(opt.text || ""),
                                }}
                              />
                            </div>

                            {isCorrectThis && (
                              <span className="text-[10px] font-extrabold text-emerald-600">
                                Correct Answer
                              </span>
                            )}
                            {isSelectedThis && !isCorrectThis && (
                              <span className="text-[10px] font-extrabold text-destructive">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
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

  // ── ACTIVE EXAM ATTEMPT SCREEN ──────────────────────────────────────────────
  return (
    <ExamAntiCheatShell
      enabled={true}
      strictMode={false}
      onLeaveExam={() => {}}
    >
      <PageContainer className="w-full max-w-4xl space-y-6 pb-24 sm:pb-32">
        {/* Top Header Bar with Timer & Progress */}
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title="Exit exam"
            >
              <ArrowLeftSVG className="size-4" />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                Papers Bank Exam
              </span>
              <h2 className="text-xs sm:text-sm font-black text-foreground truncate">
                {paper.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Pill */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-black text-foreground">
              <Clock className="size-3.5 text-primary" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <AppButton
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="h-9 rounded-xl px-4 text-xs font-black uppercase tracking-wider shadow-xs"
            >
              Finish ({answeredCount}/{questions.length})
            </AppButton>
          </div>
        </div>

        {/* Question Navigation Bubbles */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border/70 bg-card p-3 shadow-2xs">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(answers[q.id]);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl text-xs font-black transition-all cursor-pointer",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                    : isAnswered
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted border border-border/60"
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Main Question Card */}
        {currentQuestion && (
          <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                {currentQuestion.chapterName ? (
                  <span className="inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold shadow-xs">
                    {currentQuestion.chapterName}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {paper.subject}
                  </span>
                )}
                <QuestionQABugButton
                  questionId={currentQuestion.id}
                  questionNumber={currentIndex + 1}
                  pastPaperId={paper.id}
                  subject={paper.subject}
                  classNameStr={paper.class}
                  year={paper.year}
                  board={paper.board}
                  currentChapter={currentQuestion.chapterName || undefined}
                  questionText={currentQuestion.questionText}
                  imageUrl={currentQuestion.imageUrl}
                />
              </div>

              <span className="text-xs font-bold text-muted-foreground">
                {currentQuestion.marks || 1} Mark{(currentQuestion.marks || 1) > 1 ? "s" : ""}
              </span>
            </div>

            {/* Question Text */}
            <div
              className={cn(
                "text-base sm:text-lg font-bold text-foreground leading-relaxed",
                isUrduText(currentQuestion.questionText) && "text-right font-serif text-xl"
              )}
              dangerouslySetInnerHTML={{
                __html: convertMathToHTML(currentQuestion.questionText),
              }}
            />

            {currentQuestion.imageUrl && (
              <div className="pt-2">
                <QuestionImage
                  src={currentQuestion.imageUrl}
                  alt={`Question ${currentIndex + 1}`}
                  className="max-h-64 rounded-2xl border border-border/60 object-contain shadow-2xs"
                />
              </div>
            )}

            {/* MCQ Options */}
            {Array.isArray(currentQuestion.mcqOptions) && (
              <div className="grid grid-cols-1 gap-2.5 pt-3">
                {currentQuestion.mcqOptions.map((opt: any, optIdx: number) => {
                  const optId = opt.id || String.fromCharCode(65 + optIdx);
                  const isSelected = answers[currentQuestion.id] === optId;

                  return (
                    <button
                      key={optId}
                      type="button"
                      onClick={() => {
                        setAnswers((prev) => ({
                          ...prev,
                          [currentQuestion.id]: optId,
                        }));
                      }}
                      className={cn(
                        "group flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 sm:p-4 text-left transition-all select-none cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                          : "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                          )}
                        >
                          {optId}
                        </span>
                        <span
                          className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: convertMathToHTML(opt.text || ""),
                          }}
                        />
                      </div>

                      {isSelected && (
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bottom Nav inside card */}
            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <AppButton
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-xl px-4 text-xs font-bold gap-1.5"
              >
                <ChevronLeft className="size-4" /> Previous
              </AppButton>

              {isLastQuestion ? (
                <AppButton
                  onClick={() => setShowSubmitModal(true)}
                  disabled={submitting}
                  className="rounded-xl px-6 text-xs font-black uppercase tracking-wider shadow-md gap-1.5"
                >
                  <Send className="size-3.5" /> Submit Exam
                </AppButton>
              ) : (
                <AppButton
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="rounded-xl px-5 text-xs font-bold gap-1.5"
                >
                  Next <ChevronRight className="size-4" />
                </AppButton>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={handleSubmitAttempt}
          title="Submit Examination Paper?"
          message={`You have answered ${answeredCount} out of ${questions.length} questions. Are you ready to submit and calculate your score?`}
          confirmLabel={submitting ? "Scoring..." : "Yes, Submit Exam"}
          variant="primary"
          isLoading={submitting}
        />
      </PageContainer>
    </ExamAntiCheatShell>
  );
}
