"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";
import { Typography } from "@/components/ui/Typography";
import AppButton from "@/components/AppButton";
import AppTextarea from "@/components/AppTextarea";
import { CheckCircle2, AlertCircle, Archive, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import AppQueryState from "@/components/AppQueryState";
import { convertMathToHTML } from "@/lib/utils/math-notation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { formatCapitalizeWords, formatEmail } from "@/lib/utils";
import {
  useAdminReviewExamDetail,
  useGradeAdminReviewExam,
} from "@/hooks/admin/useAdminPastPaperDetail";
import type { ReviewExamQuestion } from "@/types/past-paper";

interface AnswerData {
  imageUrl?: string;
  score?: number;
  feedback?: string;
}

export default function GradeExamPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const examQuery = useAdminReviewExamDetail(attemptId);
  const gradeMutation = useGradeAdminReviewExam(attemptId);

  const [answersData, setAnswersData] = useState<Record<string, AnswerData>>({});
  const [grades, setGrades] = useState<Record<string, { score: number; feedback: string }>>({});

  useEffect(() => {
    if (!examQuery.data) {
      return;
    }

    const { attempt, questions } = examQuery.data;

    let parsedAnswers: Record<string, AnswerData> = {};
    try {
      parsedAnswers =
        typeof attempt.answers_data === "string"
          ? JSON.parse(attempt.answers_data)
          : ((attempt.answers_data as Record<string, AnswerData>) ?? {});
    } catch {
      parsedAnswers = {};
    }
    setAnswersData(parsedAnswers);

    const initGrades: Record<string, { score: number; feedback: string }> = {};
    if (attempt.grading_status === "graded") {
      for (const q of questions) {
        const existingGrade = parsedAnswers[q.id];
        if (existingGrade && typeof existingGrade.score !== "undefined") {
          initGrades[q.id] = {
            score: existingGrade.score,
            feedback: existingGrade.feedback || "",
          };
        } else {
          initGrades[q.id] = { score: 0, feedback: "" };
        }
      }
    } else {
      for (const q of questions) {
        initGrades[q.id] = { score: 0, feedback: "" };
      }
    }
    setGrades(initGrades);
  }, [examQuery.data]);

  const handleGradeChange = (qId: string, field: "score" | "feedback", value: number | string) => {
    setGrades((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value,
      },
    }));
  };

  const handleSubmitGrades = async (questions: ReviewExamQuestion[]) => {
    const gradingResults: Record<
      string,
      { score: number; maxMarks: number; feedback: string; imageUrl: string | null }
    > = {};

    for (const q of questions) {
      const ans = answersData[q.id] || {};
      gradingResults[q.id] = {
        score: Number(grades[q.id]?.score) || 0,
        maxMarks: q.marks || 5,
        feedback: grades[q.id]?.feedback || "Graded by Admin.",
        imageUrl: ans.imageUrl || null,
      };
    }

    try {
      await gradeMutation.mutateAsync({ gradingResults });
      toast.success("Exam graded successfully!");
      router.push(FRONTEND_ROUTES.ADMIN_REVIEW_EXAMS);
    } catch (error) {
      console.error("Submit Grades Error:", error);
      toast.error(error instanceof Error ? error.message : "Error submitting grades");
    }
  };

  return (
    <AppQueryState
      query={examQuery}
      errorMessage="Failed to load exam details"
      onRetry={() => examQuery.refetch()}
    >
      {(data) => {
        const { attempt, questions } = data;
        const isAlreadyGraded = attempt.grading_status === "graded";

        let totalEarned = 0;
        let totalMax = 0;
        if (isAlreadyGraded) {
          for (const qId in grades) {
            totalEarned += grades[qId]?.score || 0;
            const max = questions.find((q) => q.id === qId)?.marks || 5;
            totalMax += max;
          }
        }

        return (
          <PageContainer>
            <div className="mb-6 flex items-center gap-4">
              <div>
                <Typography className="m-0 p-0 text-xl font-black leading-none text-foreground">
                  Grade Paper II: {attempt.subject}
                </Typography>
                <span className="text-sm font-bold text-muted-foreground">
                  Student: {formatCapitalizeWords(attempt.student_name)} {attempt.student_email ? `(${formatEmail(attempt.student_email)})` : ""}
                </span>
              </div>
            </div>

            {isAlreadyGraded ? (
              <div className="mb-8 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <Typography className="text-sm font-black text-primary">
                    This exam has already been graded.
                  </Typography>
                  <span className="text-xs font-bold text-primary/80">
                    Total Score: {attempt.score || totalEarned} / {attempt.total_marks || totalMax}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="space-y-8">
              {questions.map((q) => {
                const ans = answersData[q.id];
                const gradeVal = grades[q.id] || { score: 0, feedback: "" };
                const hasImage = Boolean(ans?.imageUrl);

                return (
                  <div
                    key={q.id}
                    className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-xl bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                        Q{q.question_number}
                        {q.question_part || ""} · {q.question_type}
                      </span>
                      <span className="rounded-xl border border-border/40 bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                        {q.marks} Mark{q.marks !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="text-base font-medium text-foreground">
                      <span
                        dangerouslySetInnerHTML={{ __html: convertMathToHTML(q.question_text) }}
                      />
                    </div>

                    <hr className="border-border/40" />

                    <div className="flex flex-col gap-8 lg:flex-row">
                      <div className="relative flex min-h-[250px] flex-1 shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-muted/20 p-4">
                        {hasImage ? (
                          <a
                            href={ans.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group block max-w-full"
                          >
                            <img
                              src={ans.imageUrl}
                              alt="Student answer"
                              className="max-h-[400px] rounded-xl object-contain shadow-sm transition-transform group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="rounded-full bg-black/40 px-3 py-1.5 text-sm font-black text-background backdrop-blur-sm">
                                View Original
                              </span>
                            </div>
                          </a>
                        ) : (ans as Record<string, unknown>)?.imagesArchived ? (
                          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                            <Archive className="mb-2 size-8 text-blue-500" />
                            <span className="text-xs font-bold text-foreground">Answer Image Archived</span>
                            <span className="mt-0.5 text-[11px] text-muted-foreground">
                              Handwritten photo cleared after the 48-hour review window.
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <AlertCircle className="mb-2 h-8 w-8 opacity-50" />
                            <span className="text-sm font-bold">No answer provided</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Award Marks
                          </label>
                          <span className="text-xs font-bold text-muted-foreground/60">
                            Max: {q.marks}
                          </span>
                        </div>

                        <input
                          type="number"
                          min="0"
                          max={q.marks}
                          value={gradeVal.score}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (v >= 0 && v <= q.marks) {
                              handleGradeChange(q.id, "score", v);
                            }
                          }}
                          disabled={isAlreadyGraded || !hasImage}
                          className="h-12 w-full rounded-xl border border-border/60 bg-background px-4 font-black text-foreground shadow-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                        />

                        <div className="mt-2">
                          <label className="mb-2 block text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Feedback (Optional)
                          </label>
                          <AppTextarea
                            value={gradeVal.feedback}
                            onChange={(e) => handleGradeChange(q.id, "feedback", e.target.value)}
                            disabled={isAlreadyGraded || !hasImage}
                            placeholder="Reason for grade..."
                            className="min-h-24 w-full rounded-xl border-border/60 bg-background p-4 text-sm font-medium text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!isAlreadyGraded ? (
                <div className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-border/50 bg-background/80 p-4 pb-12 pt-4 shadow-xl backdrop-blur-md">
                  <AppButton
                    onClick={() => handleSubmitGrades(questions)}
                    disabled={gradeMutation.isPending}
                    className="h-14 min-w-[200px] rounded-2xl px-8 text-lg font-black"
                  >
                    {gradeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Submit Grades
                      </>
                    )}
                  </AppButton>
                </div>
              ) : null}
            </div>
          </PageContainer>
        );
      }}
    </AppQueryState>
  );
}
