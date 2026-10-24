"use client";

import React, { useState } from "react";
import { Award, ArrowRight, HelpCircle, Lightbulb } from "lucide-react";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import CloseCircleSVG from "@/public/svgs/CloseCircleSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import type { SLOCheckpoint } from "@/types/story";
import { cn } from "@/lib/utils";
import AppButton from "@/components/AppButton";

interface SLOCheckpointModalProps {
  checkpoint: SLOCheckpoint;
  isOpen: boolean;
  onComplete: (isCorrect: boolean) => void;
}

export function SLOCheckpointModal({
  checkpoint,
  isOpen,
  onComplete,
}: SLOCheckpointModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const isCorrect = selectedIndex === checkpoint.correctIndex;

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setIsSubmitted(true);
  };

  const handleContinue = () => {
    onComplete(isCorrect);
    setSelectedIndex(null);
    setIsSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-border/80 bg-card p-5 sm:p-7 shadow-2xl">
        {/* Glow Header Accent */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 size-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <SparklesSVG className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                Live SLO Checkpoint
              </span>
              <p className="text-xs font-bold text-muted-foreground">
                {checkpoint.sloId}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
            <Award className="size-3.5 text-primary" />
            <span>+{checkpoint.boardExamMarks * 10} XP · {checkpoint.boardExamMarks} Marks</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="relative z-10 mt-4 space-y-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <HelpCircle className="size-3.5 text-primary" />
              <span>Exam Comprehension Challenge</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
              {checkpoint.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="space-y-2 pt-1">
            {checkpoint.options.map((option, idx) => {
              const isOptionSelected = selectedIndex === idx;
              const isOptionCorrect = idx === checkpoint.correctIndex;

              let optionStyle = "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-card/90 text-foreground";
              if (isSubmitted) {
                if (isOptionCorrect) {
                  optionStyle = "border-primary bg-primary/15 text-foreground font-bold ring-2 ring-primary/30";
                } else if (isOptionSelected && !isOptionCorrect) {
                  optionStyle = "border-destructive bg-destructive/15 text-foreground font-bold";
                } else {
                  optionStyle = "opacity-50 border-border/40 text-muted-foreground";
                }
              } else if (isOptionSelected) {
                optionStyle = "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border-2 p-3 text-left text-xs sm:text-sm transition-all duration-150",
                    optionStyle
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black transition-colors",
                        isOptionSelected || (isSubmitted && isOptionCorrect)
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {isSubmitted && isOptionCorrect && (
                    <CheckCircleSVG className="size-5 shrink-0 text-primary" />
                  )}
                  {isSubmitted && isOptionSelected && !isOptionCorrect && (
                    <CloseCircleSVG className="size-5 shrink-0 text-destructive" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Board Exam Tip on submit */}
          {isSubmitted && (
            <div className="space-y-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start gap-2.5">
                {isCorrect ? (
                  <CheckCircleSVG className="size-4.5 shrink-0 text-primary mt-0.5" />
                ) : (
                  <CloseCircleSVG className="size-4.5 shrink-0 text-destructive mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-primary">
                    {isCorrect ? "Correct Answer" : "Explanation & Revision"}
                  </p>
                  <p className="text-xs leading-relaxed text-foreground">
                    {checkpoint.explanation}
                  </p>
                </div>
              </div>

              {checkpoint.boardExamTip && (
                <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                  <Lightbulb className="size-3.5 shrink-0 text-primary" />
                  <span>
                    <strong className="text-foreground">Board Exam Tip:</strong> {checkpoint.boardExamTip}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-1">
            {!isSubmitted ? (
              <AppButton
                type="button"
                onClick={handleSubmit}
                disabled={selectedIndex === null}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md shadow-primary/20"
              >
                Submit Answer
              </AppButton>
            ) : (
              <AppButton
                type="button"
                onClick={handleContinue}
                className="w-full h-11 gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md shadow-primary/20"
              >
                <span>Continue Episode</span>
                <ArrowRight className="size-4" />
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
