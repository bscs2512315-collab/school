"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileQuestion, X } from "lucide-react";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import PlaySVG from "@/public/svgs/PlaySVG";
import toast from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppQueryState from "@/components/AppQueryState";
import ConfirmationModal from "@/components/ConfirmationModal";
import ExamTimerBar from "@/components/exam/ExamTimerBar";
import ExamNavigation from "@/components/exam/ExamNavigation";
import ExamAntiCheatShell from "@/components/exam/ExamAntiCheatShell";
import McqOptionButton from "@/components/exam/McqOptionButton";
import { apiGet, apiPost } from "@/lib/api/api-client";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "@/hooks/api/useApiMutation";
import { queryKeys } from "@/lib/api/query-keys";
import { API_ENDPOINTS, FRONTEND_ROUTES } from "@/constants/endpoints";
import { isShortMcqOption } from "@/lib/exam/mcq-options";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import type { CustomQuiz, CustomQuizAttemptResult } from "@/types/custom-quiz";
import QuestionQABugButton from "@/components/qa/QuestionQABugButton";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

type SolveStep = "intro" | "attempt" | "result";

function resultMessage(percentage: number): string {
  if (percentage === 100) return "Perfect score! Outstanding work! 🎉";
  if (percentage >= 80) return "Excellent! You really know this material.";
  if (percentage >= 60) return "Good job! A little more practice and you'll master it.";
  if (percentage >= 40) return "Keep going — review the answers below and try again.";
  return "Don't give up! Review the explanations and give it another shot.";
}

export default function SolveCustomQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Clicking "Solve" should drop straight into the quiz — no intro landing.
  const [step, setStep] = useState<SolveStep>("attempt");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CustomQuizAttemptResult | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const quizQuery = useApiQuery<CustomQuiz>({
    queryKey: queryKeys.student.customQuiz(id),
    queryFn: () => apiGet<CustomQuiz>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZ_BY_ID(id)),
  });

  const attemptMutation = useApiMutation<CustomQuizAttemptResult, Record<string, string>>({
    mutationFn: (submittedAnswers) =>
      apiPost<CustomQuizAttemptResult>(API_ENDPOINTS.STUDENT.CUSTOM_QUIZ_ATTEMPT(id), {
        answers: submittedAnswers,
      }),
    invalidateKeys: [
      queryKeys.student.customQuizzes(),
      queryKeys.student.customQuiz(id),
    ],
    onSuccess: (data) => {
      setResult(data);
      setStep("result");
      setShowSubmitConfirm(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit your answers");
      setShowSubmitConfirm(false);
    },
  });

  const startAttempt = () => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setStep("attempt");
  };

  const goBackToList = () => router.push(FRONTEND_ROUTES.STUDENT_CUSTOM_QUIZZES);

  return (
      <AppQueryState
        query={quizQuery}
        loadingMessage="Loading quiz…"
        errorMessage="Failed to load this quiz."
        onRetry={() => quizQuery.refetch()}
      >
        {(quiz) => {
          const questions = quiz.questions;
          const answeredCount = questions.filter((question) => answers[question.id]).length;
          const unansweredCount = questions.length - answeredCount;

          const submitAttempt = () => {
            if (unansweredCount > 0) {
              setShowSubmitConfirm(true);
            } else {
              attemptMutation.mutate(answers);
            }
          };

          if (step === "intro") {
            return (
              <PageContainer maxWidth="4xl">
                <PageHeader title="Solve Quiz" onBack={goBackToList} />
              <div className="mx-auto max-w-xl">
                <div className="rounded-3xl border border-border bg-background p-8 text-center shadow-sm sm:p-10">
                  <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                    <FileQuestion className="size-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                    {quiz.title}
                  </h1>
                  {quiz.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {quiz.description}
                    </p>
                  ) : null}

                  <div className="mt-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1.5">
                      {questions.length} question{questions.length === 1 ? "" : "s"}
                    </span>
                    {quiz.subject ? (
                      <span className="rounded-full bg-muted px-3 py-1.5">{quiz.subject}</span>
                    ) : null}
                    {quiz.bestScore !== null ? (
                      <span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                        Best {quiz.bestScore}%
                      </span>
                    ) : null}
                  </div>

                  <AppButton className="mt-8 w-full sm:w-auto sm:min-w-52" onClick={startAttempt}>
                    <PlaySVG className="size-4" />
                    Start Quiz
                  </AppButton>
                </div>
              </div>
              </PageContainer>
            );
          }

          if (step === "result" && result) {
            const percentage = Math.round(result.percentage);
            const questionById = new Map(questions.map((question) => [question.id, question]));
            return (
              <PageContainer maxWidth="4xl">
                <PageHeader title="Quiz Result" onBack={goBackToList} />
              <div className="space-y-6">
                {/* Score summary */}
                <div className="rounded-3xl border border-border bg-background p-8 text-center shadow-sm">
                  <div
                    className="mx-auto flex size-32 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(var(--color-primary) ${percentage * 3.6}deg, color-mix(in srgb, var(--color-primary) 12%, transparent) 0deg)`,
                    }}
                  >
                    <div className="flex size-26 flex-col items-center justify-center rounded-full bg-background">
                      <span className="text-3xl font-black text-foreground">{percentage}%</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Score
                      </span>
                    </div>
                  </div>
                  <h2 className="mt-5 text-xl font-extrabold text-foreground">
                    {result.score} / {result.totalQuestions} correct
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resultMessage(result.percentage)}
                  </p>
                  <div className="mt-6 flex flex-row items-center justify-center gap-3">
                    <AppButton onClick={startAttempt} className="flex-1 sm:flex-none sm:min-w-48">
                      <RefreshSVG className="size-4" />
                      Re Attempt
                    </AppButton>
                  </div>
                </div>

                {/* Per-question review */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-foreground">Review Answers</h3>
                  {result.results.map((questionResult, index) => {
                    const question = questionById.get(questionResult.questionId);
                    if (!question) return null;
                    return (
                      <div
                        key={questionResult.questionId}
                        className="rounded-2xl border border-border bg-background p-5 shadow-sm"
                      >
                        <div className="min-w-0">
                            <p className="text-sm font-semibold leading-relaxed text-foreground">
                              <span className="mr-1.5 text-muted-foreground">Q{index + 1}.</span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: convertMathToHTML(question.text),
                                }}
                              />
                            </p>
                            <div className="mt-3 space-y-1.5">
                              {question.options.map((option, optionIndex) => {
                                const isCorrectOption =
                                  option.id === questionResult.correctOptionId;
                                const isSelected =
                                  option.id === questionResult.selectedOptionId;
                                return (
                                  <div
                                    key={option.id}
                                    className={cn(
                                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                                      isCorrectOption
                                        ? "border-primary/50 bg-primary/5 font-semibold text-foreground"
                                        : isSelected
                                          ? "border-destructive/50 bg-destructive/5 text-foreground"
                                          : "border-transparent text-muted-foreground",
                                    )}
                                  >
                                    <span className="w-4 shrink-0 text-xs font-black">
                                      {OPTION_LETTERS[optionIndex]}
                                    </span>
                                    <span
                                      className="min-w-0 flex-1"
                                      dangerouslySetInnerHTML={{
                                        __html: convertMathToHTML(option.text),
                                      }}
                                    />
                                    {isCorrectOption ? (
                                      <Check className="size-4 shrink-0 text-primary" />
                                    ) : isSelected ? (
                                      <X className="size-4 shrink-0 text-destructive" />
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                            {questionResult.selectedOptionId === null ? (
                              <p className="mt-2 text-xs font-semibold text-amber-600">
                                Not answered
                              </p>
                            ) : null}
                            {question.explanation ? (
                              <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                                <span className="font-bold text-foreground">Explanation: </span>
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: convertMathToHTML(question.explanation),
                                  }}
                                />
                              </p>
                            ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </PageContainer>
            );
          }

          const currentQuestion = questions[currentIndex];
          const options = currentQuestion.options;
          const useCompactOptions =
            options.length > 0 && options.every((option) => isShortMcqOption(option.text));

          return (
            <ExamAntiCheatShell
              enabled={!attemptMutation.isPending}
              onLeaveExam={() => {
                if (!attemptMutation.isPending) {
                  attemptMutation.mutate(answers);
                }
              }}
              className="h-full min-h-0 bg-background"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 lg:px-6 xl:px-8">
                <ExamTimerBar
                  leadingLabel="Question"
                  leadingValue={`${currentIndex + 1} of ${questions.length}`}
                  progressLabel="Progress"
                  progressValue={answeredCount}
                  progressTotal={questions.length}
                />

                {(() => {
                  const isUrdu =
                    isUrduText(currentQuestion.text) ||
                    options.some((opt) => isUrduText(opt.text));
                  return (
                    <div
                      key={currentIndex}
                      className="exam-question-scroll mt-2 min-h-0 flex-1 overflow-y-auto p-1 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:mt-3 lg:mt-6"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5">
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground lg:px-4 lg:py-1.5 lg:text-sm">
                            Question {currentIndex + 1}
                          </span>
                          <QuestionQABugButton
                            questionId={currentQuestion.id}
                            questionNumber={currentIndex + 1}
                            subject={quiz.subject}
                            questionText={currentQuestion.text}
                          />
                        </div>
                      </div>

                      <div
                        dir={isUrdu ? "rtl" : "ltr"}
                        className={cn(
                          "mb-4 text-sm text-foreground lg:mb-6 lg:text-lg",
                          isUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                        )}
                      >
                        <span
                          dangerouslySetInnerHTML={{
                            __html: convertMathToHTML(currentQuestion.text),
                          }}
                        />
                      </div>


                      {options.length > 0 ? (
                        <div
                          dir={isUrdu ? "rtl" : "ltr"}
                          className={cn("grid gap-2 pb-2 lg:gap-4", {
                            "grid-cols-2 lg:grid-cols-2 xl:grid-cols-4": useCompactOptions,
                            "grid-cols-1 lg:max-w-4xl": !useCompactOptions,
                          })}
                        >
                          {options.map((option, optionIndex) => (
                            <McqOptionButton
                              key={option.id}
                              option={option}
                              index={optionIndex}
                              isSelected={answers[currentQuestion.id] === option.id}
                              compact={useCompactOptions}
                              isUrdu={isUrdu}
                              onSelect={() =>
                                setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.id }))
                              }
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
              </div>

              <ExamNavigation
                currentIndex={currentIndex}
                total={questions.length}
                isSubmitting={attemptMutation.isPending}
                onPrevious={() => setCurrentIndex((index) => index - 1)}
                onNext={() => setCurrentIndex((index) => index + 1)}
                onFinish={submitAttempt}
                onQuestionSelect={setCurrentIndex}
                finishLabel="Submit Quiz"
                questionStatuses={questions.map((question) =>
                  answers[question.id] ? "answered" : "default",
                )}
              />

              <ConfirmationModal
                isOpen={showSubmitConfirm}
                onClose={() => setShowSubmitConfirm(false)}
                onConfirm={() => attemptMutation.mutate(answers)}
                title="Submit with unanswered questions?"
                message={`You have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}. Unanswered questions will be marked incorrect.`}
                confirmLabel="Submit Anyway"
                cancelLabel="Keep Solving"
                variant="primary"
                isLoading={attemptMutation.isPending}
              />
            </ExamAntiCheatShell>
          );
        }}
      </AppQueryState>
  );
}
