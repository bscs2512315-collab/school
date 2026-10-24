"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppQueryState from "@/components/AppQueryState";
import GenerateResultScreen from "@/components/generate/GenerateResultScreen";
import { Archive, Download, FileBadge, Loader2 } from "lucide-react";
import LikeSVG from "@/public/svgs/LikeSVG";
import DislikeSVG from "@/public/svgs/DislikeSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import HistorySVG from "@/public/svgs/HistorySVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import ReviewExamsSVG from "@/public/svgs/ReviewExamsSVG";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import AppCard from "@/components/AppCard";
import { convertMathToHTML as convertMath, isUrduText } from "@/lib/utils/math-notation";
import { downloadAchievementCertificate } from "@/lib/certificate/generate-achievement-certificate";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { useStudentHistoryDetail } from "@/hooks/student/useStudentHistoryDetail";
import type { StudentHistoryDetail } from "@/types/student";
import type {
  GeneratedPaper,
  GeneratePaperSubmitResult,
} from "@/types/generate";
import { GradingStatus } from "@/types/enums";
import toast from "react-hot-toast";

export default function AttemptDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const detailsQuery = useStudentHistoryDetail(id);
  const [generating, setGenerating] = useState(false);

  const downloadCertificate = async (details: StudentHistoryDetail) => {
    setGenerating(true);
    try {
      const storedUser = localStorage.getItem("exboard_user");
      const userData = storedUser ? (JSON.parse(storedUser) as {
        name?: string;
        schoolName?: string;
      }) : null;

      const paperNumber = details.paperDetails?.paper_number;
      const paperLabel =
        details.paper_type === "challenge"
          ? "Challenge"
          : paperNumber
            ? `Paper ${paperNumber}`
            : null;

      await downloadAchievementCertificate({
        subject: details.subject,
        score: details.score ?? 0,
        totalMarks: details.total_marks,
        createdAt: details.created_at,
        studentName: userData?.name,
        schoolName: userData?.schoolName,
        board: details.paperDetails?.board ?? null,
        paperLabel,
      });
      toast.success("Certificate downloaded");
    } catch (error) {
      console.error("PDF Generation error:", error);
      toast.error("Could not generate certificate. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageContainer>
      <AppQueryState
        query={detailsQuery}
        loadingMessage="Loading attempt details..."
        errorMessage="Attempt not found."
        onRetry={() => detailsQuery.refetch()}
        fullScreen={false}
      >
        {(details) => {
          const score = details.score ?? 0;
          const percentage =
            details.total_marks > 0
              ? Math.round((score / details.total_marks) * 100)
              : 0;
          const passed = percentage >= 50;
          const answersData =
            typeof details.answers_data === "string"
              ? JSON.parse(details.answers_data)
              : details.answers_data;
          const isPaper2 = details.paperDetails?.paper_number === 2;
          const items = Object.entries(answersData || {});
          const attemptDate = new Date(details.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const paperLabel = details.paperDetails?.paper_number
            ? `Paper ${details.paperDetails.paper_number}`
            : details.paper_type === "challenge"
              ? "Challenge"
              : "Practice";
          const isTeacherReviewPending =
            Boolean(details.teacher_paper_id) &&
            details.grading_status !== GradingStatus.GRADED;

          if (isTeacherReviewPending) {
            const awaitingTeacher =
              details.grading_status === GradingStatus.AWAITING_APPROVAL;

            return (
              <>
                <PageHeader
                  title="Attempt Status"
                  onBack={() => router.push(FRONTEND_ROUTES.STUDENT_HISTORY)}
                  hideBackOnMobile
                />
                <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:rounded-3xl">
                  <div className="bg-primary px-5 py-8 text-center text-primary-foreground sm:px-8 sm:py-10">
                    <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary-foreground/15">
                      {awaitingTeacher ? (
                        <ReviewExamsSVG className="size-8" />
                      ) : (
                        <ClockSVG className="size-8" />
                      )}
                    </div>
                    <Typography className="text-2xl font-bold">
                      {awaitingTeacher
                        ? "Awaiting Teacher Approval"
                        : "Nova Is Grading Your Paper"}
                    </Typography>
                    <Typography className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-primary-foreground/80">
                      {awaitingTeacher
                        ? "AI grading is complete. Your teacher is reviewing the marks and feedback before releasing your final result."
                        : "Your submission is safely recorded. Nova is reviewing each answer before sending a draft grade to your teacher."}
                    </Typography>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
                    <div className="p-5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Paper
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {details.title || details.subject}
                      </p>
                    </div>
                    <div className="p-5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Submitted
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {attemptDate}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mx-auto mt-6 max-w-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <Typography className="text-sm font-semibold">
                      Submitted answers
                    </Typography>
                    <Typography className="text-xs text-muted-foreground">
                      {items.length} {items.length === 1 ? "question" : "questions"}
                    </Typography>
                  </div>
                  {items.map(([itemId, resultValue], index) => {
                    const result = (resultValue ?? {}) as Record<string, unknown>;
                    const answerImages =
                      Array.isArray(result.imageUrls) &&
                      result.imageUrls.length > 0
                        ? result.imageUrls.filter(
                            (url): url is string => typeof url === "string",
                          )
                        : typeof result.imageUrl === "string"
                          ? [result.imageUrl]
                          : [];
                    return (
                      <article
                        key={itemId}
                        className="rounded-2xl border border-border bg-card p-4 sm:p-5"
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                          Question {String(result.questionNumber || index + 1)}
                          {String(result.questionPart || "")}
                        </p>
                        <div
                          className="mt-2 text-sm leading-relaxed text-foreground"
                          dangerouslySetInnerHTML={{
                            __html: convertMath(
                              String(result.questionText || "Question submitted"),
                            ),
                          }}
                        />
                        {answerImages.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {answerImages.map((url) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex text-xs font-semibold text-primary hover:underline"
                              >
                                View uploaded answer
                              </a>
                            ))}
                          </div>
                        ) : (result.imagesArchived || Boolean(details.images_archived_at)) ? (
                          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs dark:border-blue-500/15 dark:bg-blue-500/[0.05]">
                            <Archive className="size-4 shrink-0 text-blue-500 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground text-xs">
                                Answer Image Archived
                              </p>
                              <p className="text-[11px] leading-relaxed text-muted-foreground">
                                Uploaded answer photo was cleared following the 48-hour post-approval window.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">
                            No answer image was uploaded.
                          </p>
                        )}
                      </article>
                    );
                  })}
                </section>
              </>
            );
          }

          if (!isPaper2) {
            const orderedItems = [...items].sort((a, b) => {
              const ra = (a[1] ?? {}) as Record<string, unknown>;
              const rb = (b[1] ?? {}) as Record<string, unknown>;
              const na = Number(ra.questionNumber) || 0;
              const nb = Number(rb.questionNumber) || 0;
              if (na !== nb) return na - nb;
              return String(ra.questionPart ?? "").localeCompare(
                String(rb.questionPart ?? ""),
              );
            });

            const resultPaper: GeneratedPaper = {
              generatedPaperId: details.id,
              paperType: details.paperDetails?.paper_number ?? 1,
              subject: details.subject,
              classLevel: String(details.paperDetails?.class_level ?? ""),
              board: details.paperDetails?.board ?? "",
              totalMarks: details.total_marks,
              totalQuestions: orderedItems.length,
              questions: orderedItems.map(([itemId, resultValue], index) => {
                const result = (resultValue ?? {}) as Record<string, unknown>;
                return {
                  id: itemId,
                  questionNumber: Number(result.questionNumber) || index + 1,
                  questionPart: result.questionPart
                    ? String(result.questionPart)
                    : null,
                  questionText: String(
                    result.questionText || "Question text not available.",
                  ),
                  questionType: "MCQ",
                  marks: Number(result.maxMarks) || Number(result.marks) || 1,
                  chapterName: null,
                  imageUrl:
                    typeof result.imageUrl === "string"
                      ? result.imageUrl
                      : null,
                  mcqOptions: Array.isArray(result.options)
                    ? (result.options as Array<{ id: string; text: string }>)
                    : [],
                };
              }),
            };

            const submitResult: GeneratePaperSubmitResult = {
              score,
              totalMarks: details.total_marks,
              percentage,
              pointsAwarded:
                percentage > 0 ? 10 + Math.floor(percentage / 10) * 5 : 0,
              questionResults: Object.fromEntries(
                items.map(([itemId, resultValue]) => {
                  const result = (resultValue ?? {}) as Record<string, unknown>;
                  return [
                    itemId,
                    {
                      correct: Boolean(result.correct),
                      correctAnswer:
                        result.correctAnswer != null
                          ? String(result.correctAnswer)
                          : null,
                      selectedAnswer:
                        result.selectedAnswer != null
                          ? String(result.selectedAnswer)
                          : null,
                    },
                  ];
                }),
              ),
            };

            const retryHref = details.teacher_paper_id
              ? FRONTEND_ROUTES.STUDENT_TEACHER_PAPER_ATTEMPT(
                  details.teacher_paper_id,
                )
              : details.paper_id
                ? FRONTEND_ROUTES.STUDENT_PAST_PAPER_ATTEMPT(details.paper_id)
                : null;

            return (
              <>
                {percentage >= 50 ? (
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void downloadCertificate(details)}
                      disabled={generating}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:px-5 sm:text-sm"
                    >
                      {generating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                      <span>Download Certificate</span>
                    </button>
                  </div>
                ) : null}
                <GenerateResultScreen
                  paper={resultPaper}
                  result={submitResult}
                  retryLabel="Re Attempt"
                  onRetry={() => {
                    if (retryHref) router.push(retryHref);
                  }}
                  onBack={() => router.push(FRONTEND_ROUTES.STUDENT_HISTORY)}
                />
              </>
            );
          }

          return (
            <>
              <PageHeader
                title="Attempts"
                onBack={() => router.push(FRONTEND_ROUTES.STUDENT_HISTORY)}
                hideBackOnMobile
                actions={
                  percentage >= 50 ? (
                    <button
                      type="button"
                      onClick={() => void downloadCertificate(details)}
                      disabled={generating}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm"
                    >
                      {generating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                      <span>Download Certificate</span>
                    </button>
                  ) : null
                }
              />

              <section className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card sm:mb-10 sm:rounded-3xl">
                <div className="bg-primary px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <Typography className="text-lg font-bold tracking-tight text-primary-foreground sm:text-xl">
                        {details.subject}
                      </Typography>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-primary-foreground/75">
                        <span className="inline-flex items-center gap-1.5">
                          <SyllabusSVG className="size-3.5 shrink-0" />
                          {paperLabel}
                          {details.paperDetails?.board &&
                          details.paperDetails.board !== "N/A"
                            ? ` · ${details.paperDetails.board}`
                            : null}
                          {details.paperDetails?.class_level
                            ? ` · ${
                                String(details.paperDetails.class_level)
                                  .toLowerCase()
                                  .startsWith("class")
                                  ? details.paperDetails.class_level
                                  : `Class ${details.paperDetails.class_level}`
                              }`
                            : null}
                          {details.paperDetails?.year &&
                          details.paperDetails.year !== "N/A"
                            ? ` · ${details.paperDetails.year}`
                            : null}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <HistorySVG className="size-3.5 shrink-0" />
                          {attemptDate}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                        {
                          "bg-primary-foreground/20 text-primary-foreground": passed,
                          "bg-background text-destructive": !passed,
                        },
                      )}
                    >
                      {passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-border/50">
                  <div className="px-3 py-5 text-center sm:px-6 sm:py-7">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                      Score
                    </p>
                    <p className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                      {score}
                      <span className="text-sm font-medium text-muted-foreground sm:text-lg">
                        /{details.total_marks}
                      </span>
                    </p>
                  </div>
                  <div className="px-3 py-5 text-center sm:px-6 sm:py-7">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                      Percentage
                    </p>
                    <p className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                      {percentage}%
                    </p>
                    <div className="mx-auto mt-2.5 h-1.5 w-full max-w-20 overflow-hidden rounded-full bg-muted sm:mt-3 sm:max-w-28">
                      <div
                        className={cn("h-full rounded-full transition-all", {
                          "bg-primary": passed,
                          "bg-destructive": !passed,
                        })}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="px-3 py-5 text-center sm:px-6 sm:py-7">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                      Result
                    </p>
                    <p
                      className={cn("text-xl font-bold tracking-tight sm:text-3xl", {
                        "text-primary": passed,
                        "text-destructive": !passed,
                      })}
                    >
                      {passed ? "Pass" : "Fail"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <Typography className="text-sm font-semibold text-foreground">
                    Question breakdown
                  </Typography>
                  <Typography className="text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? "question" : "questions"}
                  </Typography>
                </div>

                {(() => {
                  const hasArchivedImages =
                    Boolean(details.images_archived_at) ||
                    items.some(([, r]) =>
                      Boolean((r as Record<string, unknown>)?.imagesArchived),
                    );

                  if (!hasArchivedImages) return null;

                  return (
                    <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 dark:border-blue-500/15 dark:bg-blue-500/10">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Archive className="size-4.5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground sm:text-sm">
                          Handwritten Answer Images Archived
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          In accordance with our data storage policy, handwritten answer photos are automatically archived 48 hours after grading approval. Your awarded marks, score percentage, detailed evaluations, and tutor remarks remain permanently saved.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  {items.length > 0 ? (
                    items.map((entry, index) => {
                      const [itemId, resultValue] = entry;
                      const result = (resultValue ?? {}) as Record<string, unknown>;
                      const isCorrect = Boolean(result.correct);

                      return (
                        <article
                          key={itemId}
                          className={cn(
                            "rounded-2xl border border-border/60 bg-card p-4 sm:p-5",
                            {
                              "border-l-4 border-l-primary": !isPaper2 && isCorrect,
                              "border-l-4 border-l-destructive": !isPaper2 && !isCorrect,
                              "border-l-4 border-l-primary/60": isPaper2,
                            },
                          )}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                                Q{String(result.questionNumber || index + 1)}
                                {String(result.questionPart || "")}
                              </span>
                              {result.chapterName ? (
                                <span className="inline-flex items-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-2.5 py-1 text-xs font-bold shadow-xs shrink-0">
                                  {String(result.chapterName)}
                                </span>
                              ) : null}
                              {!isPaper2 ? (
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                                    {
                                      "bg-primary/10 text-primary": isCorrect,
                                      "bg-destructive/10 text-destructive": !isCorrect,
                                    },
                                  )}
                                >
                                  {isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  {String(result.score ?? 0)}/{String(result.maxMarks ?? 5)} marks
                                </span>
                              )}
                            </div>
                            <div
                              className={cn("shrink-0 rounded-full p-1.5", {
                                "bg-primary/10 text-primary": !isPaper2 && isCorrect,
                                "bg-destructive/10 text-destructive": !isPaper2 && !isCorrect,
                                "bg-muted text-muted-foreground": isPaper2,
                              })}
                            >
                              {!isPaper2 ? (
                                isCorrect ? (
                                  <LikeSVG className="size-4" />
                                ) : (
                                  <DislikeSVG className="size-4" />
                                )
                              ) : (
                                <FileBadge className="size-4" />
                              )}
                            </div>
                          </div>

                          <div
                            dir={isUrduText(String(result.questionText || "")) ? "rtl" : "ltr"}
                            className={cn(
                              "mb-3 text-sm text-foreground",
                              isUrduText(String(result.questionText || "")) ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                            )}
                            dangerouslySetInnerHTML={{
                              __html: convertMath(
                                String(result.questionText || "Question text not available."),
                              ),
                            }}
                          />

                          {result.imageUrl && !isPaper2 ? (
                            <div className="mb-3">
                              <img
                                src={String(result.imageUrl)}
                                alt="Question diagram"
                                className="max-h-36 rounded-xl border border-border/50 bg-muted/20 object-contain"
                              />
                            </div>
                          ) : null}

                          {!isPaper2 ? (
                            <div className="space-y-2 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                              {(() => {
                                const options = (result.options as Array<{ id: string; text: string }>) || [];
                                const selectedOpt = options.find(
                                  (o) => o.id?.toUpperCase() === String(result.selectedAnswer || "").toUpperCase()
                                );
                                const correctOpt = options.find(
                                  (o) => o.id?.toUpperCase() === String(result.correctAnswer || "").toUpperCase()
                                );

                                const formatOptText = (opt?: { id: string; text: string }, fallback?: string) => {
                                  if (!opt) return fallback || "—";
                                  const clean = (opt.text || "").trim().replace(/^[\(\[\{]/, "").replace(/[\)\]\}\.:\-–]$/, "").trim();
                                  const isJustLetter = clean.toUpperCase() === opt.id.toUpperCase() || clean.toLowerCase() === `option ${opt.id.toLowerCase()}`;
                                  if (isJustLetter) return opt.id;
                                  return `${opt.id}. ${opt.text}`;
                                };

                                const isUrdu = isUrduText(String(result.questionText || "")) || isUrduText(selectedOpt?.text) || isUrduText(correctOpt?.text);

                                const selectedDisplayText = selectedOpt
                                  ? formatOptText(selectedOpt)
                                  : (result.selectedAnswer ? `Option ${result.selectedAnswer}` : (isUrdu ? "حل نہیں کیا گیا" : "Not attempted"));

                                const correctDisplayText = correctOpt
                                  ? formatOptText(correctOpt)
                                  : (result.correctAnswer ? `Option ${result.correctAnswer}` : "—");
                                return (
                                  <div dir={isUrdu ? "rtl" : "ltr"} className={cn("space-y-1", isUrdu && "font-urdu text-right")}>
                                    <p className="break-words">
                                      <span className="font-bold">{isUrdu ? "آپ کا جواب: " : "Your answer: "}</span>
                                      <span
                                        className="font-semibold text-foreground"
                                        dangerouslySetInnerHTML={{
                                          __html: convertMath(selectedDisplayText),
                                        }}
                                      />
                                    </p>
                                    <p className="break-words">
                                      <span className="font-bold">{isUrdu ? "صحیح جواب: " : "Correct: "}</span>
                                      <span
                                        className="font-semibold text-foreground"
                                        dangerouslySetInnerHTML={{
                                          __html: convertMath(correctDisplayText),
                                        }}
                                      />
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="space-y-2 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                              <p>
                                Feedback:{" "}
                                <span
                                  className="font-medium text-foreground"
                                  dangerouslySetInnerHTML={{
                                    __html: convertMath(
                                      String(
                                        result.feedback || "No feedback provided.",
                                      ),
                                    ),
                                  }}
                                />
                              </p>
                              {(() => {
                                const annotatedImages =
                                  Array.isArray(result.annotatedImageUrls) &&
                                  result.annotatedImageUrls.length > 0
                                    ? result.annotatedImageUrls.filter(
                                        (url): url is string =>
                                          typeof url === "string",
                                      )
                                    : typeof result.annotatedImageUrl === "string"
                                      ? [result.annotatedImageUrl]
                                      : [];

                                const originalImages =
                                  Array.isArray(result.imageUrls) &&
                                  result.imageUrls.length > 0
                                    ? result.imageUrls.filter(
                                        (url): url is string =>
                                          typeof url === "string",
                                      )
                                    : typeof result.imageUrl === "string"
                                      ? [result.imageUrl]
                                      : [];

                                const hasMarked = annotatedImages.length > 0;
                                const displayImages = hasMarked
                                  ? annotatedImages
                                  : originalImages;

                                return displayImages.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-3 pt-1">
                                    {displayImages.map((url, imgIndex) => (
                                      <a
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                                          hasMarked
                                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                                            : "font-medium text-primary hover:underline",
                                        )}
                                      >
                                        {hasMarked
                                          ? "🔴 Teacher Marked Answer"
                                          : "View uploaded answer"}
                                        {displayImages.length > 1
                                          ? ` (${imgIndex + 1})`
                                          : ""}
                                      </a>
                                    ))}
                                    {hasMarked && originalImages.length > 0 && (
                                      <a
                                        href={originalImages[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                                      >
                                        View original un-marked
                                      </a>
                                    )}
                                  </div>
                                ) : (result.imagesArchived || (isPaper2 && Boolean(details.images_archived_at))) ? (
                                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs dark:border-blue-500/15 dark:bg-blue-500/[0.05]">
                                    <Archive className="size-4 shrink-0 text-blue-500 mt-0.5" />
                                    <div className="space-y-0.5">
                                      <p className="font-semibold text-foreground text-xs">
                                        Answer Image Archived
                                      </p>
                                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        Original answer photo was cleared after the 48-hour post-approval window. Your marks and evaluator feedback are permanently saved.
                                      </p>
                                    </div>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </article>
                      );
                    })
                  ) : (
                    <AppCard className="p-10 text-center sm:p-12">
                      <Typography variant="muted">
                        No breakdown data available for this session.
                      </Typography>
                    </AppCard>
                  )}
                </div>
              </section>
              <div className="pb-6 sm:pb-10" />
            </>
          );
        }}
      </AppQueryState>
    </PageContainer>
  );
}
