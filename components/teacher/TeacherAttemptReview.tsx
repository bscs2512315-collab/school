"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Archive, Loader2, PenLine, X } from "lucide-react";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppTextarea from "@/components/AppTextarea";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import ImageAnnotationModal from "@/components/teacher/ImageAnnotationModal";
import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { convertMathToHTML, formatMathToUnicode, isUrduText } from "@/lib/utils/math-notation";
import { GradingStatus } from "@/types/enums";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import CalendarSVG from "@/public/svgs/CalendarSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import ImageSVG from "@/public/svgs/ImageSVG";
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import NovaSVG from "@/public/svgs/NovaSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";

interface QuestionRow {
  id: string;
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: string;
  chapterName?: string | null;
  marks: number;
  imageUrl: string | null;
  imageUrls?: string[];
  annotatedImageUrl?: string | null;
  annotatedImageUrls?: string[];
  imagesArchived?: boolean;
  score: number | null;
  maxMarks: number;
  feedback: string;
  gradedBy: string | null;
  correct?: boolean | null;
  selectedAnswer?: string | null;
  correctAnswer?: string | null;
  mcqOptions?: Array<{ id: string; text: string }> | null;
  paperIIData?: {
    betterResponse?: string;
    weakerResponse?: string;
    markingNotes?: string;
  } | null;
}

interface AttemptDetail {
  id: string;
  studentName: string;
  studentImage: string | null;
  paperTitle: string;
  paperType: string;
  subject: string;
  classLevel: string;
  score: number;
  totalMarks: number;
  percentage: number;
  gradingStatus: string;
  feedback: string;
  submittedAt: string;
  attemptNumber: number;
  imagesArchivedAt?: string | null;
}

function formatSubmittedAt(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StudentAvatar({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={name}
      className="size-12 shrink-0 rounded-full object-cover sm:size-14"
    />
  ) : (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-base font-bold sm:size-14 sm:text-lg">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function TeacherAttemptReview() {
  const params = useParams();
  const router = useRouter();
  const classroomId = decodeURIComponent(params.classroomId as string);
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [grades, setGrades] = useState<
    Record<string, { score: string; feedback: string }>
  >({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<{
    urls: string[];
    index: number;
    questionId?: string;
    questionNumber?: number;
    rawUrls?: string[];
  } | null>(null);
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({});
  const [annotatedImages, setAnnotatedImages] = useState<
    Record<string, Record<number, string>>
  >({});
  const [annotatingState, setAnnotatingState] = useState<{
    questionId: string;
    questionNumber: number;
    imageIndex: number;
    imageUrl: string;
    annotatedUrl?: string | null;
  } | null>(null);

  const isPaper1 = String(attempt?.paperType || "").includes("1");
  const isApproved = attempt?.gradingStatus === GradingStatus.GRADED;
  // Paper 2 is always editable — including after approval — so the teacher
  // can correct marks any time (subject to the classroom's allowPostApprovalEdit).
  const canApprove = !isPaper1 && attempt != null;

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<{
          attempt: AttemptDetail;
          questions: QuestionRow[];
        }>(API_ENDPOINTS.TEACHER.CLASSROOM_ATTEMPT(classroomId, attemptId));

        if (!res.success) {
          toast.error(res.message || "Failed to load attempt");
          return;
        }

        setAttempt(res.data.attempt);
        setQuestions(res.data.questions);
        setOverallFeedback(formatMathToUnicode(res.data.attempt.feedback || ""));

        const initial: Record<string, { score: string; feedback: string }> = {};
        const initialAnnotated: Record<string, Record<number, string>> = {};
        for (const q of res.data.questions) {
          initial[q.id] = {
            score: q.score != null ? String(q.score) : "",
            feedback: formatMathToUnicode(q.feedback || ""),
          };
          initialAnnotated[q.id] = {};
          if (q.annotatedImageUrls && q.annotatedImageUrls.length > 0) {
            q.annotatedImageUrls.forEach((url, idx) => {
              if (url) initialAnnotated[q.id][idx] = url;
            });
          } else if (q.annotatedImageUrl) {
            initialAnnotated[q.id][0] = q.annotatedImageUrl;
          }
        }
        setGrades(initial);
        setAnnotatedImages(initialAnnotated);
      } catch {
        toast.error("Failed to load attempt");
      } finally {
        setLoading(false);
      }
    })();
  }, [classroomId, attemptId]);

  const handleApprove = async () => {
    const unfinished = questions.some((q) => grades[q.id]?.score === "");
    if (unfinished) {
      toast.error("Enter marks for every question");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        overallFeedback,
        grades: Object.fromEntries(
          questions.map((q) => {
            const qAnnotated = annotatedImages[q.id] || {};
            const baseImages = q.imageUrls ?? (q.imageUrl ? [q.imageUrl] : []);
            const annotatedUrls = baseImages.map(
              (orig, idx) =>
                qAnnotated[idx] || (q.annotatedImageUrls?.[idx] ?? orig),
            );
            const hasAnyAnnotations =
              Object.keys(qAnnotated).length > 0 ||
              Boolean(q.annotatedImageUrl) ||
              Boolean(q.annotatedImageUrls?.length);

            return [
              q.id,
              {
                score: Number(grades[q.id].score),
                feedback: grades[q.id].feedback,
                annotatedImageUrl: hasAnyAnnotations
                  ? annotatedUrls[0] || null
                  : q.annotatedImageUrl || null,
                annotatedImageUrls: hasAnyAnnotations
                  ? annotatedUrls
                  : q.annotatedImageUrls || [],
              },
            ];
          }),
        ),
      };

      const res = await apiPost(
        API_ENDPOINTS.TEACHER.CLASSROOM_ATTEMPT_APPROVE(classroomId, attemptId),
        payload,
      );

      if (!res.success) {
        toast.error(res.message || "Could not approve");
        return;
      }

      toast.success(
        isApproved
          ? "Result updated — student notified"
          : "Result approved — student notified",
      );
      router.push(FRONTEND_ROUTES.TEACHER_CLASSROOM_RESULTS(classroomId));
    } catch {
      toast.error("Failed to approve result");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLoader />;

  if (!attempt) {
    return (
      <PageContainer>
        <AppState
          variant="error"
          title="Attempt not available"
          description="We could not load this submission. It may have been removed, or it belongs to another classroom."
          action={{
            label: "Back to classroom",
            onClick: () =>
              router.push(FRONTEND_ROUTES.TEACHER_CLASSROOM_ATTEMPTS(classroomId)),
          }}
          fullScreen={false}
        />
      </PageContainer>
    );
  }

  const awarded = Object.values(grades).reduce(
    (sum, g) => sum + (Number(g.score) || 0),
    0,
  );
  const maxTotal = questions.reduce((sum, q) => sum + (q.maxMarks || q.marks), 0);
  const displayScore = canApprove ? awarded : attempt.score;
  const displayTotal = maxTotal || attempt.totalMarks;
  const displayPercentage =
    displayTotal > 0 ? Math.round((displayScore / displayTotal) * 100) : 0;
  const gradedCount = questions.filter(
    (q) => (grades[q.id]?.score ?? "") !== "",
  ).length;

  const statusLabel = isPaper1
    ? "Auto-graded from answer key"
    : isApproved
      ? "Approved and released"
      : "Awaiting your approval";

  const metaCells = [
    {
      label: isPaper1 ? "Paper 1" : "Paper 2",
      value: isPaper1 ? "MCQ" : "CRQ / ERQ",
      icon: SyllabusSVG,
    },
    {
      label: "Questions",
      value: `${questions.length} question${questions.length === 1 ? "" : "s"}`,
      icon: QuestionBankSVG,
    },
    {
      label: "Submitted",
      value: formatSubmittedAt(attempt.submittedAt),
      icon: CalendarSVG,
    },
    {
      label: "Graded by",
      value: isPaper1 ? "Answer key" : "Nova AI",
      icon: isPaper1 ? CheckCircleSVG : NovaSVG,
    },
  ];

  const timeline = [
    {
      label: "Submitted",
      description: "Answer images received",
      icon: ClockSVG,
      complete: true,
    },
    {
      label: "AI graded",
      description: "Draft marks and feedback",
      icon: NovaSVG,
      complete:
        attempt.gradingStatus === GradingStatus.AWAITING_APPROVAL ||
        attempt.gradingStatus === GradingStatus.GRADED,
    },
    {
      label: "Approved",
      description: "Released to student",
      icon: ReviewExamsSVG,
      complete: isApproved,
    },
  ];

  return (
    <PageContainer className="space-y-5 pb-10">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="bg-primary p-5 text-primary-foreground sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <StudentAvatar
                  name={attempt.studentName}
                  image={attempt.studentImage}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                    {attempt.subject} · Class {attempt.classLevel}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-bold sm:text-base">
                    {attempt.studentName}
                  </p>
                </div>
              </div>

              <p className="break-words text-xs text-primary-foreground/80 sm:text-sm">
                {attempt.paperTitle} · Attempt {attempt.attemptNumber}
              </p>

              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold">
                {isApproved || isPaper1 ? (
                  <CheckCircleSVG className="size-4" />
                ) : (
                  <ClockSVG className="size-4" />
                )}
                {statusLabel}
              </span>
            </div>

            <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-6 py-4 text-center lg:min-w-56">
              <p className="text-4xl font-bold leading-none">
                {displayScore}
                <span className="text-xl font-semibold text-primary-foreground/70">
                  /{displayTotal}
                </span>
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                {displayPercentage}% ·{" "}
                {isPaper1 ? "Final" : isApproved ? "Approved" : "AI draft"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
          {metaCells.map((cell) => (
            <div key={cell.label} className="flex items-start gap-3 p-4 sm:p-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                <cell.icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {cell.label}
                </p>
                <p className="mt-0.5 break-words text-sm font-bold text-foreground">
                  {cell.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!isPaper1 ? (
        <section className="grid gap-3 sm:grid-cols-3">
          {timeline.map((step) => (
            <div
              key={step.label}
              className={cn("rounded-2xl border p-4 sm:p-5", {
                "border-primary/30 bg-primary/5": step.complete,
                "border-border bg-card": !step.complete,
              })}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  {
                    "bg-primary/10 text-primary dark:bg-muted dark:text-foreground": step.complete,
                    "bg-muted text-muted-foreground": !step.complete,
                  },
                )}
              >
                <step.icon className="size-5" />
              </div>
              <p className="mt-3 break-words text-sm font-bold text-foreground">
                {step.label}
              </p>
              <p className="mt-0.5 break-words text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      {canApprove ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <p className="break-words text-sm text-muted-foreground">
            {isApproved ? (
              <>
                <span className="font-bold text-foreground">
                  This result is already released.
                </span>{" "}
                Adjust any score or feedback below, then save to release the
                updated marks and notify {attempt.studentName} again.
              </>
            ) : (
              <>
                <span className="font-bold text-foreground">
                  Nova drafted these marks.
                </span>{" "}
                Adjust any score or feedback below, then approve to release the
                result and notify {attempt.studentName}.
              </>
            )}
          </p>
        </div>
      ) : null}

      <section className="space-y-4">
        {(attempt?.imagesArchivedAt || questions.some((q) => q.imagesArchived)) && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 dark:border-blue-500/15 dark:bg-blue-500/10">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Archive className="size-4.5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                Answer Images Archived (48-Hour Review Completed)
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Student handwritten uploads were automatically removed 48 hours after grading approval to protect student privacy and optimize storage. All awarded marks, totals, rubrics, and feedback remain fully preserved.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Typography className="text-lg font-bold">
            Answers and marking
          </Typography>
          {!isPaper1 ? (
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
              {gradedCount}/{questions.length} marked
            </span>
          ) : null}
        </div>

        {questions.map((q, index) => (
          <article
            key={q.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary dark:bg-muted dark:text-foreground">
                  Question {q.questionNumber || index + 1}
                  {q.questionPart ? ` · ${q.questionPart}` : ""}
                </span>
                {q.chapterName ? (
                  <span className="inline-flex items-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold shadow-xs">
                    {q.chapterName}
                  </span>
                ) : null}
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground">
                  {q.questionType}
                </span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {isPaper1 && q.correct != null
                  ? `${q.correct ? q.marks : 0}/${q.marks} marks`
                  : `${q.maxMarks || q.marks} marks`}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <p
                dir={isUrduText(q.questionText) ? "rtl" : "ltr"}
                className={cn(
                  "break-words text-sm text-foreground whitespace-pre-line",
                  isUrduText(q.questionText) ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                )}
                dangerouslySetInnerHTML={{
                  __html: convertMathToHTML(q.questionText),
                }}
              />

              {isPaper1 ? (
                q.mcqOptions && q.mcqOptions.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {q.mcqOptions.map((opt) => {
                      const normalize = (value?: string | null) =>
                        String(value ?? "").trim().toUpperCase();
                      const optId = normalize(opt.id);
                      const optText = String(opt.text ?? "").trim();
                      const isCorrect =
                        q.correctAnswer != null &&
                        (normalize(q.correctAnswer) === optId ||
                          normalize(q.correctAnswer) === normalize(optText));
                      const isSelected =
                        q.selectedAnswer != null &&
                        (normalize(q.selectedAnswer) === optId ||
                          normalize(q.selectedAnswer) === normalize(optText));
                      const isUrduOpt = isUrduText(optText);
                      const AnswerIcon = q.correct ? CheckCircleSVG : CloseCircleSVG;
                      return (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                            isCorrect
                              ? "border-primary/40 bg-primary/5"
                              : isSelected
                                ? "border-destructive/40 bg-destructive/5"
                                : "border-border bg-card",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                              isCorrect
                                ? "bg-primary text-primary-foreground"
                                : isSelected
                                  ? "bg-destructive text-destructive-foreground"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {opt.id}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              dir={isUrduOpt ? "rtl" : "ltr"}
                              className={cn(
                                "break-words text-sm font-medium text-foreground",
                                isUrduOpt
                                  ? "font-urdu text-right leading-[2.2]"
                                  : "text-left leading-relaxed",
                              )}
                              dangerouslySetInnerHTML={{
                                __html: convertMathToHTML(opt.text),
                              }}
                            />
                            {isCorrect || isSelected ? (
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                {isCorrect ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                    <CheckCircleSVG className="size-3" />
                                    Correct answer
                                  </span>
                                ) : null}
                                {isSelected ? (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                      q.correct
                                        ? "bg-primary/10 text-primary"
                                        : "bg-destructive/10 text-destructive",
                                    )}
                                  >
                                    <AnswerIcon className="size-3" />
                                    Student&apos;s answer
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Student answer
                      </p>
                      <p className="mt-1 flex items-center gap-2 break-words text-sm font-bold text-foreground">
                        {q.correct != null ? (
                          q.correct ? (
                            <CheckCircleSVG className="size-4 shrink-0 text-primary" />
                          ) : (
                            <CloseCircleSVG className="size-4 shrink-0 text-destructive" />
                          )
                        ) : null}
                        {q.selectedAnswer || "Not answered"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Correct answer
                      </p>
                      <p className="mt-1 break-words text-sm font-bold text-foreground">
                        {q.correctAnswer || "—"}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <>
                  {q.paperIIData && (
                    <div className="mt-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGuides((prev) => ({
                            ...prev,
                            [q.id]: !prev[q.id],
                          }))
                        }
                        className="flex w-full items-center justify-between text-left text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        <span>
                          {expandedGuides[q.id]
                            ? "▼ Hide Reference Solution & Marking Rubric"
                            : "► View Reference Solution & Marking Rubric"}
                        </span>
                        {q.correctAnswer && (
                          <span
                            className="font-semibold text-muted-foreground truncate max-w-xs"
                            dangerouslySetInnerHTML={{
                              __html: `Ans: ${convertMathToHTML(q.correctAnswer)}`,
                            }}
                          />
                        )}
                      </button>

                      {expandedGuides[q.id] && (
                        <div className="mt-3 space-y-3 pt-3 border-t border-border/50 text-xs">
                          {q.paperIIData.betterResponse && (
                            <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 space-y-1">
                              <p className="font-bold uppercase tracking-wider text-primary">
                                Model Solution / Benchmark (Full Marks):
                              </p>
                              <div
                                className="whitespace-pre-line text-foreground/90 leading-relaxed font-mono text-[11px] sm:text-xs"
                                dangerouslySetInnerHTML={{
                                  __html: convertMathToHTML(q.paperIIData.betterResponse),
                                }}
                              />
                            </div>
                          )}

                          {q.paperIIData.markingNotes && (
                            <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 p-3 space-y-1">
                              <p className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Step-wise Marking Rubric:
                              </p>
                              <div
                                className="whitespace-pre-line text-muted-foreground leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: convertMathToHTML(q.paperIIData.markingNotes),
                                }}
                              />
                            </div>
                          )}

                          {q.paperIIData.weakerResponse && (
                            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 space-y-1">
                              <p className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Common Errors / Weaker Benchmark (Partial Marks):
                              </p>
                              <div
                                className="text-muted-foreground leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: convertMathToHTML(q.paperIIData.weakerResponse),
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {(q.imageUrls ?? (q.imageUrl ? [q.imageUrl] : []))?.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {(q.imageUrls ?? (q.imageUrl ? [q.imageUrl] : []))?.map(
                          (url, imgIndex) => {
                            const markedUrl =
                              annotatedImages[q.id]?.[imgIndex] ||
                              q.annotatedImageUrls?.[imgIndex] ||
                              (imgIndex === 0 ? q.annotatedImageUrl : null);
                            const displayUrl = markedUrl || url;
                            const isMarked = Boolean(markedUrl);

                            return (
                              <div
                                key={url}
                                className="group relative block w-full overflow-hidden rounded-xl border border-border bg-muted/20 shadow-xs"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={displayUrl}
                                  alt={`Answer page ${imgIndex + 1} for question ${q.questionNumber}`}
                                  className="h-32 w-full bg-muted/30 object-contain sm:h-44"
                                />

                                {/* Top Status Badges */}
                                <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                                  {isMarked && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/95 px-2 py-0.5 text-[10px] font-bold text-destructive-foreground shadow-sm backdrop-blur-xs">
                                      <span className="size-1.5 rounded-full bg-white animate-pulse" />
                                      Marked
                                    </span>
                                  )}
                                  {imgIndex === 0 &&
                                    (q.imageUrls ?? [q.imageUrl!]).length > 1 && (
                                      <span className="inline-flex items-center rounded-full bg-primary/95 px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                                        {(q.imageUrls ?? [q.imageUrl!]).length} pages
                                      </span>
                                    )}
                                </div>

                                {/* Bottom Action Buttons */}
                                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                                  {canApprove && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAnnotatingState({
                                          questionId: q.id,
                                          questionNumber: q.questionNumber,
                                          imageIndex: imgIndex,
                                          imageUrl: url,
                                          annotatedUrl: markedUrl,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-white shadow-md hover:bg-destructive/90 active:scale-95 transition-all"
                                      title="Mark errors with red pen"
                                    >
                                      <PenLine className="size-3.5" />
                                      {isMarked ? "Edit Marks" : "Red Pen"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLightbox({
                                        urls: (q.imageUrls ?? [q.imageUrl!]).map(
                                          (u, i) =>
                                            annotatedImages[q.id]?.[i] ||
                                            q.annotatedImageUrls?.[i] ||
                                            u,
                                        ),
                                        rawUrls: q.imageUrls ?? [q.imageUrl!],
                                        index: imgIndex,
                                        questionId: q.id,
                                        questionNumber: q.questionNumber,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm hover:bg-background active:scale-95 transition-all"
                                  >
                                    <EyeSVG className="size-3.5" />
                                    Enlarge
                                  </button>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ) : (q.imagesArchived || Boolean(attempt?.imagesArchivedAt)) ? (
                    <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/[0.03] p-6 text-center">
                      <div className="flex size-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Archive className="size-4.5" />
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        Answer Image Archived
                      </p>
                      <p className="max-w-xs text-[11px] text-muted-foreground">
                        Upload cleared 48 hours after approval. Assigned marks and comments are saved.
                      </p>
                    </div>
                  ) : (
                    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                      <ImageSVG className="size-7 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        No image uploaded
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Marks awarded
                      </p>
                      <div className="flex items-center gap-2">
                        <AppInput
                          type="number"
                          min={0}
                          max={q.maxMarks || q.marks}
                          disabled={!canApprove}
                          value={grades[q.id]?.score ?? ""}
                          className="w-24"
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [q.id]: {
                                ...prev[q.id],
                                score: e.target.value,
                                feedback: prev[q.id]?.feedback ?? "",
                              },
                            }))
                          }
                        />
                        <span className="text-sm font-bold text-muted-foreground">
                          out of {q.maxMarks || q.marks}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Feedback
                        </p>
                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => {
                              const current = grades[q.id]?.feedback ?? "";
                              const formatted = formatMathToUnicode(current);
                              setGrades((prev) => ({
                                ...prev,
                                [q.id]: {
                                  ...prev[q.id],
                                  score: prev[q.id]?.score ?? "",
                                  feedback: formatted,
                                },
                              }));
                            }}
                            className="text-[10px] font-semibold text-primary hover:underline"
                          >
                            Format Math Notation
                          </button>
                        )}
                      </div>
                      {canApprove ? (
                        <AppTextarea
                          value={grades[q.id]?.feedback ?? ""}
                          rows={3}
                          className="min-h-24 resize-none font-sans"
                          placeholder="Explain what earned or lost marks"
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [q.id]: {
                                ...prev[q.id],
                                score: prev[q.id]?.score ?? "",
                                feedback: e.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        <div
                          className="min-h-20 rounded-xl border border-border bg-muted/20 p-3 text-xs leading-relaxed text-foreground"
                          dangerouslySetInnerHTML={{
                            __html: convertMathToHTML(
                              grades[q.id]?.feedback || "No feedback provided.",
                            ),
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>
          </article>
        ))}
      </section>

      {!isPaper1 ? (
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <Typography className="text-sm font-bold">Overall feedback</Typography>
          <p className="text-xs text-muted-foreground">
            Shared with the student along with the approved result.
          </p>
          <AppTextarea
            disabled={!canApprove}
            value={overallFeedback}
            rows={3}
            className="resize-none font-sans"
            placeholder="Summarise strengths and what to improve next"
            onChange={(e) => setOverallFeedback(e.target.value)}
          />
        </section>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-bold text-foreground">
            {displayScore}/{displayTotal} · {displayPercentage}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {canApprove
              ? isApproved
                ? "Saving updates reloads the mark and notifies the student again."
                : "Approving releases this result and notifies the student."
              : isPaper1
                ? "Paper 1 is scored automatically — no approval needed."
                : ""}
          </p>
        </div>

        <div className="flex flex-row items-center gap-3">
          <AppButton
            type="button"
            variant="outline"
            className="h-12 rounded-2xl font-bold"
            onClick={() =>
              router.push(
                isPaper1
                  ? FRONTEND_ROUTES.TEACHER_CLASSROOM_RESULTS(classroomId)
                  : isApproved
                    ? FRONTEND_ROUTES.TEACHER_CLASSROOM_RESULTS(classroomId)
                    : FRONTEND_ROUTES.TEACHER_CLASSROOM_ATTEMPTS(classroomId),
              )
            }
          >
            <ArrowLeftSVG className="size-4" />
            Back
          </AppButton>
          {canApprove ? (
            <AppButton
              type="button"
              className="h-12 flex-1 rounded-2xl font-bold sm:flex-none"
              disabled={saving}
              onClick={() => void handleApprove()}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircleSVG className="size-4" />
              )}
              {isApproved ? "Update & notify" : "Approve & notify"}
            </AppButton>
          ) : (
            <span className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary/10 px-5 text-sm font-bold text-primary sm:flex-none">
              <CheckCircleSVG className="size-4" />
              {isPaper1 ? "Auto-graded" : ""}
            </span>
          )}
        </div>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-md transition-all animate-in fade-in"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged student answer"
          tabIndex={0}
        >
          {/* Close button in top-right */}
          <button
            type="button"
            aria-label="Close image preview"
            className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-card/90 text-foreground shadow-lg border border-border transition-all hover:bg-muted hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary sm:top-6 sm:right-6"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
          >
            <X className="size-6" />
          </button>

          {lightbox.urls.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-lg border border-border transition-all hover:bg-muted hover:scale-105 active:scale-95 sm:left-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((current) =>
                    current
                      ? { ...current, index: (current.index + current.urls.length - 1) % current.urls.length }
                      : current,
                  );
                }}
              >
                <ArrowLeftSVG className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-lg border border-border transition-all hover:bg-muted hover:scale-105 active:scale-95 sm:right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((current) =>
                    current
                      ? { ...current, index: (current.index + 1) % current.urls.length }
                      : current,
                  );
                }}
              >
                <ArrowLeftSVG className="size-5 rotate-180" />
              </button>
            </>
          ) : null}

          <div
            className="relative max-h-[90vh] max-w-full overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.urls[lightbox.index]}
              alt="Student answer"
              className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-xl"
            />

            {/* Lightbox bottom controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {canApprove && lightbox.questionId && (
                <button
                  type="button"
                  onClick={() => {
                    const rawUrl =
                      lightbox.rawUrls?.[lightbox.index] ||
                      lightbox.urls[lightbox.index];
                    const currentMarked =
                      annotatedImages[lightbox.questionId!]?.[lightbox.index];
                    setAnnotatingState({
                      questionId: lightbox.questionId!,
                      questionNumber: lightbox.questionNumber || 1,
                      imageIndex: lightbox.index,
                      imageUrl: rawUrl,
                      annotatedUrl: currentMarked,
                    });
                    setLightbox(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3.5 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-destructive/90 active:scale-95 transition-all"
                >
                  <PenLine className="size-3.5" />
                  Mark with Red Pen
                </button>
              )}
              {lightbox.urls.length > 1 ? (
                <span className="rounded-full bg-background/90 px-3 py-1.5 text-xs font-bold text-foreground shadow">
                  {lightbox.index + 1} / {lightbox.urls.length}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Teacher Red Pen Image Annotation Studio Modal */}
      {annotatingState && (
        <ImageAnnotationModal
          isOpen={Boolean(annotatingState)}
          onClose={() => setAnnotatingState(null)}
          imageUrl={annotatingState.imageUrl}
          initialAnnotatedUrl={annotatingState.annotatedUrl}
          title={`Mark Question ${annotatingState.questionNumber} (Page ${annotatingState.imageIndex + 1})`}
          onSave={(dataUrl) => {
            const { questionId, imageIndex } = annotatingState;
            setAnnotatedImages((prev) => ({
              ...prev,
              [questionId]: {
                ...(prev[questionId] || {}),
                [imageIndex]: dataUrl,
              },
            }));
            toast.success("Answer marked! Click Save/Approve to publish.");
          }}
        />
      )}
    </PageContainer>
  );
}
