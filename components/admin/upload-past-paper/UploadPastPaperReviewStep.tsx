"use client";

import AddSVG from "@/public/svgs/AddSVG";

import type { ReactNode } from "react";
import { ChevronLeft, ClipboardList, Save, Sparkles, AlertTriangle } from "lucide-react";
import AppButton from "@/components/AppButton";
import AppState from "@/components/AppState";
import {
  GenerateSectionDivider,
  GenerateStepFooter,
  GenerateStepShell,
} from "@/components/generate/GeneratePaperUI";
import UploadPastPaperMetaSummary from "@/components/admin/upload-past-paper/UploadPastPaperMetaSummary";

export interface RemovedQuestionItem {
  questionNumber: number;
  questionText: string;
  reason: string;
}

interface UploadPastPaperReviewStepProps {
  paperNumber: number;
  classValue: string;
  board: string;
  subject: string;
  year: string;
  questionCount: number;
  isPublishing: boolean;
  removedQuestions?: RemovedQuestionItem[];
  onRestoreRemovedQuestion?: (q: RemovedQuestionItem) => void;
  onBack: () => void;
  onAddQuestion: () => void;
  onPublish: () => void;
  children: ReactNode;
}

export default function UploadPastPaperReviewStep({
  paperNumber,
  classValue,
  board,
  subject,
  year,
  questionCount,
  isPublishing,
  removedQuestions = [],
  onRestoreRemovedQuestion,
  onBack,
  onAddQuestion,
  onPublish,
  children,
}: UploadPastPaperReviewStepProps) {
  return (
    <>
      <GenerateStepShell>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back to import methods
        </button>

        <UploadPastPaperMetaSummary
          paperNumber={paperNumber}
          classValue={classValue}
          board={board}
          subject={subject}
          year={year}
        />

        {removedQuestions.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                {removedQuestions.length} Question{removedQuestions.length === 1 ? "" : "s"} Filtered Out (Not in Syllabus SLOs)
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              These questions appeared in the paper but do not match any chapter in the curriculum. They were excluded from the active quiz:
            </p>
            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {removedQuestions.map((rq) => (
                <div
                  key={rq.questionNumber}
                  className="flex items-center justify-between gap-2 rounded-lg bg-card/60 px-3 py-1.5 border border-border"
                >
                  <span className="truncate font-medium text-foreground">
                    Q{rq.questionNumber}: {rq.questionText.slice(0, 60)}... ({rq.reason})
                  </span>
                  {onRestoreRemovedQuestion && (
                    <button
                      type="button"
                      onClick={() => onRestoreRemovedQuestion(rq)}
                      className="shrink-0 text-[11px] font-bold text-primary hover:underline"
                    >
                      + Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <GenerateSectionDivider label="Review Questions" />

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                {questionCount === 0
                  ? "No questions yet"
                  : `${questionCount} question${questionCount === 1 ? "" : "s"} ready for review`}
              </p>
              <p className="text-sm text-muted-foreground">
                {questionCount === 0
                  ? "Add your first question below or go back to import."
                  : "Expand each item to edit content, chapter, and marks."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {questionCount > 0 ? (
              <AppButton
                onClick={onPublish}
                disabled={isPublishing}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Save className="mr-2 size-4" />
                Publish All
              </AppButton>
            ) : null}
            <AppButton onClick={onAddQuestion} size="sm" className="rounded-xl">
              <AddSVG className="mr-2 size-4" />
              Add Question
            </AppButton>
          </div>
        </div>

        {questionCount === 0 ? (
          <AppState
            isEmpty={true}
            title="No questions yet"
            description='Click "Add Question" to create your first item, or go back to import from text.'
            icon={ClipboardList}
            fullScreen={false}
          />
        ) : (
          <div className="space-y-3">{children}</div>
        )}
      </GenerateStepShell>

      <GenerateStepFooter
        nextHint={`Publish ${questionCount} question${questionCount === 1 ? "" : "s"}`}
        onContinue={onPublish}
        onBack={onBack}
        disabled={questionCount === 0}
        loading={isPublishing}
        continueLabel={isPublishing ? "Publishing" : "Publish"}
      />
    </>
  );
}
