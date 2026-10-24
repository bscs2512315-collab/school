"use client";

import React, { useEffect } from "react";
import LogoutSVG from "@/public/svgs/LogoutSVG";
import ExamTimerBar from "@/components/exam/ExamTimerBar";
import ExamNavigation from "@/components/exam/ExamNavigation";
import McqOptionButton from "@/components/exam/McqOptionButton";
import ExamUploadZone from "@/components/exam/ExamUploadZone";
import ExamAntiCheatShell from "@/components/exam/ExamAntiCheatShell";
import QuestionImage from "@/components/exam/QuestionImage";
import { useQuestionDiagramPreloader } from "@/hooks/exam/useQuestionDiagramPreloader";
import { usePageTitle } from "@/components/layout/PageTitleContext";
import { isShortMcqOption } from "@/lib/exam/mcq-options";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import { emptyUploadState, toUploadItemList } from "@/lib/exam/multi-upload";
import type { GeneratedPaper, PaperType, UploadState } from "@/types/generate";

interface GenerateAttemptStepProps {
  paperType: PaperType;
  generatedPaper: GeneratedPaper;
  currentQuestionIndex: number;
  mcqAnswers: Record<string, string>;
  uploads: Record<string, UploadState>;
  timeLeft: number;
  isSubmitting: boolean;
  pendingUploadCount: number;
  uploadedCount: number;
  formatTime: (seconds: number) => string;
  strictMode?: boolean;
  allowResume?: boolean;
  onSaveAndQuit?: () => void;
  onSaveProgress?: () => void;
  onSelectMcqAnswer: (questionId: string, optionId: string) => void;
  onAddFiles: (questionId: string, files: File[]) => void;
  onRetryUpload: (questionId: string, uploadId: string) => void;
  onRemoveUpload: (questionId: string, uploadId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onQuestionIndexChange: (index: number) => void;
}

export default function GenerateAttemptStep({
  paperType,
  generatedPaper,
  currentQuestionIndex,
  mcqAnswers,
  uploads,
  timeLeft,
  isSubmitting,
  pendingUploadCount,
  uploadedCount,
  formatTime,
  strictMode = true,
  allowResume = false,
  onSaveAndQuit,
  onSaveProgress,
  onSelectMcqAnswer,
  onAddFiles,
  onRetryUpload,
  onRemoveUpload,
  onPrevious,
  onNext,
  onSubmit,
  onQuestionIndexChange,
}: GenerateAttemptStepProps) {
  const pageTitleContext = usePageTitle();
  const questions = generatedPaper.questions;
  const currentQ = questions[currentQuestionIndex];

  // Preload next 5 question diagrams silently in the background
  useQuestionDiagramPreloader(questions, currentQuestionIndex, 5);

  const isLowTime = timeLeft < 300;
  const options = currentQ.mcqOptions ?? [];
  const useCompactOptions =
    options.length > 0 && options.every((option) => isShortMcqOption(option.text));
  const progressValue = paperType === "1" ? Object.keys(mcqAnswers).length : uploadedCount;
  const currentUpload = uploads[currentQ.id] || emptyUploadState();
  const questionStatuses = questions.map((question) => {
    if (paperType === "1") {
      return mcqAnswers[question.id] ? ("answered" as const) : ("default" as const);
    }

    const uploadItems = toUploadItemList(uploads[question.id]);
    if (uploadItems.some((item) => item.status === "uploaded")) return "answered" as const;
    if (uploadItems.some((item) => item.status === "uploading")) return "uploading" as const;
    if (uploadItems.some((item) => item.status === "failed")) return "failed" as const;
    return "default" as const;
  });

  const setPageTitle = pageTitleContext?.setPageTitle;
  const setHideBottomNav = pageTitleContext?.setHideBottomNav;

  useEffect(() => {
    setPageTitle?.("Practice Paper");
    setHideBottomNav?.(true);
    return () => {
      setPageTitle?.(null);
      setHideBottomNav?.(false);
    };
  }, [setPageTitle, setHideBottomNav]);

  return (
    <ExamAntiCheatShell
      enabled={!isSubmitting}
      strictMode={strictMode}
      allowResume={allowResume}
      onSaveProgress={onSaveProgress}
      onLeaveExam={() => {
        if (allowResume) {
          onSaveProgress?.();
          return;
        }
        if (!isSubmitting) onSubmit();
      }}
      className="h-full min-h-0 bg-background"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <ExamTimerBar
              timeLeft={timeLeft}
              formatTime={formatTime}
              progressLabel="Progress"
              progressValue={progressValue}
              progressTotal={questions.length}
              isLowTime={isLowTime}
            />
          </div>
          {allowResume && onSaveAndQuit ? (
            <button
              type="button"
              onClick={onSaveAndQuit}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-xs transition-all hover:border-primary/50 hover:bg-muted hover:text-foreground active:scale-95"
              title="Save your progress and exit to classroom"
            >
              <LogoutSVG className="size-3.5 text-muted-foreground" />
              <span>Save & Exit</span>
            </button>
          ) : null}
        </div>

        <div
          key={currentQuestionIndex}
          className="exam-question-scroll mt-1 min-h-0 flex-1 overflow-y-auto p-1 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:mt-3 lg:mt-6"
        >
          {/* Chapter Name in separate line at top of Question no. on small screens */}
          {currentQ.chapterName ? (
            <div className="mb-1.5 flex items-center sm:hidden">
              <span className="inline-flex items-center gap-1 rounded-lg bg-black text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-xs font-bold shadow-xs">
                <span>{currentQ.chapterName}</span>
              </span>
            </div>
          ) : null}

          <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground lg:px-4 lg:py-1.5 lg:text-sm">
                Question {currentQuestionIndex + 1}
              </span>
              {currentQ.chapterName ? (
                <span className="hidden sm:inline-flex items-center rounded-lg bg-muted px-3 py-1 text-xs font-bold text-foreground">
                  {currentQ.chapterName}
                </span>
              ) : null}
            </div>
            <span className="rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground lg:text-sm">
              {currentQ.marks} Mark{currentQ.marks !== 1 ? "s" : ""}
            </span>
          </div>

          {(() => {
            const isUrdu = isUrduText(currentQ.questionText);
            return (
              <div
                dir={isUrdu ? "rtl" : "ltr"}
                className={cn(
                  "mb-4 text-sm text-foreground whitespace-pre-line lg:mb-6 lg:text-lg",
                  isUrdu ? "font-urdu text-right leading-[2.2]" : "leading-relaxed text-left"
                )}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: convertMathToHTML(currentQ.questionText),
                  }}
                />
              </div>
            );
          })()}

          {currentQ.imageUrl ? (
            <QuestionImage
              src={currentQ.imageUrl}
              alt="Question diagram"
              className="max-h-72 sm:max-h-96 rounded-lg"
              skeletonHeightClass="h-72 sm:h-96"
              containerClassName="mb-4 sm:mb-5"
            />
          ) : null}

          {options.length > 0 ? (
            <div
              dir={isUrduText(currentQ.questionText) ? "rtl" : "ltr"}
              className="grid grid-cols-1 gap-2 pb-2 lg:gap-4"
              >
                {options.map((option, index) => (
                  <McqOptionButton
                    key={option.id}
                    option={option}
                    index={index}
                    isSelected={mcqAnswers[currentQ.id] === option.id}
                    compact={useCompactOptions}
                    isUrdu={isUrduText(currentQ.questionText) || options.some((o) => isUrduText(o.text))}
                    onSelect={() => onSelectMcqAnswer(currentQ.id, option.id)}
                  />
                ))}
              </div>
            ) : null}
          {paperType === "2" ? (
            <ExamUploadZone
              upload={currentUpload}
              onAddFiles={(files) => onAddFiles(currentQ.id, files)}
              onRetry={(uploadId) => onRetryUpload(currentQ.id, uploadId)}
              onRemove={(uploadId) => onRemoveUpload(currentQ.id, uploadId)}
            />
          ) : null}
        </div>
      </div>

      <ExamNavigation
        currentIndex={currentQuestionIndex}
        total={questions.length}
        isSubmitting={isSubmitting}
        finishDisabled={pendingUploadCount > 0}
        onPrevious={onPrevious}
        onNext={onNext}
        onFinish={onSubmit}
        onQuestionSelect={onQuestionIndexChange}
        questionStatuses={questionStatuses}
      />
    </ExamAntiCheatShell>
  );
}
