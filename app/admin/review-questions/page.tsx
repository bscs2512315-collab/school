"use client";

import { Typography } from "@/components/ui/Typography";
import { useRouter, useSearchParams } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import AppButton from "@/components/AppButton";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { useState, useEffect, Suspense } from "react";
import toast from "react-hot-toast";
import AppState from "@/components/AppState";
import AppQueryState from "@/components/AppQueryState";
import AppLoader from "@/components/AppLoader";
import { Save, CheckCircle2, ListOrdered, AlertCircle, Loader2 } from "lucide-react";
import type { Question, Chapter } from "@/types/admin";
import { convertMathToHTML } from "@/lib/utils/math-notation";
import {
  useAdminPastPaperQuestions,
  useSaveAdminPastPaperQuestions,
} from "@/hooks/admin/useAdminPastPaperDetail";

function ReviewQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pastPaperId = searchParams.get("id");

  const questionsQuery = useAdminPastPaperQuestions(pastPaperId ?? undefined);
  const saveMutation = useSaveAdminPastPaperQuestions(pastPaperId ?? "");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!pastPaperId) {
      toast.error("Past paper ID is required");
      router.push(FRONTEND_ROUTES.ADMIN_DASHBOARD);
    }
  }, [pastPaperId, router]);

  useEffect(() => {
    if (questionsQuery.data) {
      setQuestions(questionsQuery.data.questions);
      setChapters(questionsQuery.data.chapters);
    }
  }, [questionsQuery.data]);

  const handleChapterChange = (questionIndex: number, chapterId: string) => {
    const updatedQuestions = [...questions];
    const selectedChapter = chapters.find((ch) => ch.id === chapterId);
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      chapterId: chapterId || null,
      chapterName: selectedChapter?.chapterName || null,
    };
    setQuestions(updatedQuestions);
  };

  const handleSave = async () => {
    if (!pastPaperId) {
      return;
    }

    const questionsToSave = questions.map((q) => ({
      questionNumber: q.questionNumber,
      questionPart: q.questionPart || null,
      questionText: q.questionText,
      questionType: q.questionType || undefined,
      chapterId: q.chapterId || null,
      chapterName: q.chapterName || null,
    }));

    try {
      await saveMutation.mutateAsync({ questions: questionsToSave });
      setSaveSuccess(true);
      toast.success("Questions saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save questions");
    }
  };

  if (!pastPaperId) {
    return null;
  }

  return (
    <AppQueryState
      query={questionsQuery}
      errorMessage="Failed to load questions"
      onRetry={() => questionsQuery.refetch()}
    >
      {() => (
        <PageContainer>
          <PageHeader
            title="Review Questions"
            actions={
              <AppButton
                variant="default"
                onClick={handleSave}
                disabled={saveMutation.isPending || saveSuccess}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Questions
                  </>
                )}
              </AppButton>
            }
          />

          {saveSuccess ? (
            <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 fade-in">
              <div className="mx-4 w-full max-w-md animate-in rounded-3xl border border-border bg-card p-8 shadow-2xl duration-300 zoom-in-95 sm:p-10">
                <div className="flex flex-col items-center space-y-6 text-center">
                  <div className="rounded-full bg-green-500/10 p-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <Typography variant="h2" className="text-2xl font-bold">
                      Saved Successfully!
                    </Typography>
                    <Typography variant="muted">
                      All questions have been securely saved to the digital question bank.
                    </Typography>
                  </div>
                  <AppButton
                    variant="default"
                    onClick={() => setSaveSuccess(false)}
                    className="h-12 w-full rounded-xl"
                  >
                    Done
                  </AppButton>
                </div>
              </div>
            </div>
          ) : null}

          <AppState
            isLoading={false}
            isEmpty={questions.length === 0}
            emptyMessage="No questions were extracted from this paper yet."
            title="No Questions Extracted"
            icon={AlertCircle}
            fullScreen={false}
          >
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={question.id || index}
                  className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md sm:p-8"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-xl bg-primary px-5 py-2 text-lg font-bold text-primary-foreground shadow-sm">
                        Q{question.questionNumber}
                        {question.questionPart ? question.questionPart.toLowerCase() : ""}
                      </div>
                      {question.questionType ? (
                        <span className="rounded-xl border border-border bg-muted px-3 py-1.5 text-sm font-bold text-foreground">
                          {question.questionType.toUpperCase()}
                        </span>
                      ) : null}
                      {question.aiConfidence ? (
                        <span className="rounded-xl border border-blue-500/10 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-500">
                          AI Confidence: {(question.aiConfidence * 100).toFixed(0)}%
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-muted/20 p-6 sm:p-8">
                    <div className="prose prose-invert max-w-none">
                      <p
                        className="backgroundspace-pre-wrap text-lg font-medium leading-relaxed text-foreground"
                        dangerouslySetInnerHTML={{
                          __html: convertMathToHTML(question.questionText),
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-primary" />
                      <Typography
                        variant="muted"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        Map to Chapter
                      </Typography>
                    </div>
                    <select
                      value={question.chapterId || ""}
                      onChange={(e) => handleChapterChange(index, e.target.value)}
                      className="flex h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-5 py-2 text-base text-foreground transition-all hover:border-primary/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
                    >
                      <option value="">Select a chapter from the curriculum</option>
                      {chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.chapterName}
                        </option>
                      ))}
                    </select>
                    {question.chapterName ? (
                      <div className="flex items-center gap-2 px-1 font-medium text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <Typography variant="small" className="text-xs">
                          Mapped to: {question.chapterName}
                        </Typography>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </AppState>
        </PageContainer>
      )}
    </AppQueryState>
  );
}

export default function ReviewQuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20">
          <AppLoader className="min-h-0" />
        </div>
      }
    >
      <ReviewQuestionsContent />
    </Suspense>
  );
}
