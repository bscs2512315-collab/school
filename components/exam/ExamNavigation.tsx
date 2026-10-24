"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, XCircle } from "lucide-react";
import AppButton from "@/components/AppButton";
import { cn } from "@/lib/utils";

export type ExamQuestionPillStatus = "default" | "answered" | "uploading" | "failed";

interface ExamNavigationProps {
  currentIndex: number;
  total: number;
  isSubmitting?: boolean;
  finishDisabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  onQuestionSelect?: (index: number) => void;
  questionStatuses?: ExamQuestionPillStatus[];
  finishLabel?: string;
  className?: string;
}

export default function ExamNavigation({
  currentIndex,
  total,
  isSubmitting = false,
  finishDisabled = false,
  onPrevious,
  onNext,
  onFinish,
  onQuestionSelect,
  questionStatuses,
  finishLabel = "Finish",
  className,
}: ExamNavigationProps) {
  const isLast = currentIndex >= total - 1;
  const isFinishDisabled = isSubmitting || finishDisabled;
  const showPills = total > 0 && onQuestionSelect;

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border/60 bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-6 xl:px-8",
        className,
      )}
    >
      <div className="w-full">
        {showPills ? (
          <div className="mb-3 hidden gap-1.5 overflow-x-auto lg:flex">
            {Array.from({ length: total }, (_, index) => {
              const status = questionStatuses?.[index] ?? "default";
              const isActive = index === currentIndex;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onQuestionSelect(index)}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold transition-all",
                    {
                      "border-primary bg-primary text-primary-foreground": isActive,
                      "border-primary/30 bg-primary/10 text-primary":
                        status === "answered" && !isActive,
                      "border-border bg-muted text-muted-foreground":
                        status === "default" && !isActive,
                      "border-destructive/40 bg-destructive/10 text-destructive":
                        status === "failed" && !isActive,
                      "border-primary/30 bg-primary/5 text-primary":
                        status === "uploading" && !isActive,
                    },
                  )}
                >
                  {status === "answered" && !isActive ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : status === "uploading" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : status === "failed" ? (
                    <XCircle className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-sm font-semibold text-muted-foreground lg:block">
            Question {currentIndex + 1} of {total}
          </p>

          <div className="grid w-full grid-cols-2 gap-2 lg:ml-auto lg:w-auto lg:min-w-96">
            <AppButton
              variant="ghost"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="h-11 w-full rounded-xl border-0 bg-primary/10 font-semibold text-primary shadow-none hover:bg-primary/15 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:text-white lg:h-12"
            >
              <ChevronLeft className="mr-1 size-4" />
              Prev
            </AppButton>

            {isLast ? (
              <AppButton
                onClick={onFinish}
                disabled={isFinishDisabled}
                className="h-11 w-full rounded-xl font-semibold shadow-md lg:h-12"
              >
                {isSubmitting ? "Submitting" : finishLabel}
                <CheckCircle2 className="ml-1 size-4" />
              </AppButton>
            ) : (
              <AppButton
                onClick={onNext}
                className="h-11 w-full rounded-xl font-semibold lg:h-12"
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
