"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import AppState from "@/components/AppState";
import AppInput from "@/components/AppInput";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import EditSVG from "@/public/svgs/EditSVG";
import ChallengeSVG from "@/public/svgs/ChallengeSVG";
import {
  GenerateSectionDivider,
  GenerateStepFooter,
  GenerateStepShell,
  GenerateStepTopNav,
  SubjectOption,
  SubjectOptionGrid,
} from "@/components/generate/GeneratePaperUI";
import GenerateCustomInputs, {
  type CustomUploadedImage,
  type CustomCreationType,
} from "@/components/generate/GenerateCustomInputs";
import type { ManualQuestionItem } from "@/components/custom-quiz/ManualQuestionBuilder";
import { getSubjectIcon } from "@/lib/generate/subject-icons";
import { cn } from "@/lib/utils";
import type { GenerateMode } from "@/types/generate";

interface Curriculum {
  id: string;
  class: string;
  board: string;
  subject: string;
  chaptersCount: number;
}

interface StepConfigureProps {
  mode: GenerateMode;
  loadingSubjects: boolean;
  availableSubjects: Curriculum[];
  subject: string;
  setSubject: (subject: string) => void;
  customTitle: string;
  setCustomTitle: (title: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  customImages: CustomUploadedImage[];
  onCustomImagesChange: (images: CustomUploadedImage[]) => void;
  creationType?: CustomCreationType;
  onCreationTypeChange?: (type: CustomCreationType) => void;
  manualQuestions?: ManualQuestionItem[];
  onManualQuestionsChange?: (questions: ManualQuestionItem[]) => void;
  userClass?: string;
  userBoard?: string;
  userId?: string;
  onBack: () => void;
  onNext: () => void;
}

export default function StepConfigure({
  mode,
  loadingSubjects,
  availableSubjects,
  subject,
  setSubject,
  customTitle,
  setCustomTitle,
  customPrompt,
  onCustomPromptChange,
  customImages,
  onCustomImagesChange,
  creationType = "ai",
  onCreationTypeChange,
  manualQuestions,
  onManualQuestionsChange,
  onBack,
  onNext,
}: StepConfigureProps) {
  if (loadingSubjects && mode !== "custom") {
    return <AppState isLoading fullScreen={false} />;
  }

  const isCustom = mode === "custom";
  const customHasInput =
    creationType === "manual"
      ? (manualQuestions?.length ?? 0) > 0 &&
        manualQuestions!.every(
          (q) => q.questionText.trim() && q.options.every((o) => o.text.trim()),
        )
      : customImages.length > 0 || Boolean(customPrompt && customPrompt.trim());

  return (
    <GenerateStepShell>
      {/* Top Back Navigation */}
      <GenerateStepTopNav
        onBack={onBack}
        stepBadge={isCustom ? "Step 2 of 3" : "Step 2 of 4"}
        title={isCustom ? "Configure Custom Challenge" : "Select Challenge Subject"}
        subtitle={
          isCustom
            ? "Provide challenge title and synthesize custom questions for friends"
            : "Choose subject domain for your peer battle"
        }
      />

      {isCustom ? (
        /* ==================== CUSTOM MODE: ONE UNIFIED PROFESSIONAL FORM ==================== */
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/90 shadow-md backdrop-blur-md">
            {/* Form Header with Sub-mode Segmented Tabs */}
            <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/25 px-5 py-4.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground shadow-xs">
                  <ChallengeSVG className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Custom Challenge Arena Setup
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Define challenge title and your question synthesis method
                  </p>
                </div>
              </div>

              {onCreationTypeChange && (
                <div className="inline-flex rounded-xl border border-border/80 bg-background/80 p-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onCreationTypeChange("ai")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                      creationType === "ai"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <SparklesSVG className="size-3.5" />
                    <span>AI Generate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreationTypeChange("manual")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                      creationType === "manual"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <EditSVG className="size-3.5" />
                    <span>Manual Builder</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form Content */}
            <div className="space-y-6 p-5 sm:p-6 sm:space-y-7">
              {/* Row 1: Challenge Title */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
                  <BookOpenSVG className="size-4 text-primary" />
                  Challenge Title / Subject
                </label>
                <AppInput
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Biology Speed Quiz 2026, Physics Midterm..."
                  className="h-12 rounded-xl bg-background/90 text-sm font-medium"
                />
                <p className="text-[11px] text-muted-foreground">
                  Give your custom challenge a descriptive title for your invited classmates.
                </p>
              </div>

              {/* Row 2: Custom Materials / Questions Builder */}
              <div className="pt-3 border-t border-border/60 space-y-3">
                <GenerateCustomInputs
                  prompt={customPrompt}
                  onPromptChange={onCustomPromptChange}
                  images={customImages}
                  onImagesChange={onCustomImagesChange}
                  creationType={creationType}
                  onCreationTypeChange={onCreationTypeChange}
                  manualQuestions={manualQuestions}
                  onManualQuestionsChange={onManualQuestionsChange}
                />
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <GenerateStepFooter
            onBack={onBack}
            nextHint={
              creationType === "manual"
                ? "Invite friends to compete on your manual quiz"
                : "Invite friends to your custom AI challenge"
            }
            continueLabel="Next: Invite Friends"
            onContinue={onNext}
            disabled={!customTitle.trim() || !customHasInput}
          />
        </div>
      ) : (
        /* ==================== PAST PAPERS, SLO'S & LIGHTNING ROUND STEP 2 ==================== */
        <>
          <GenerateSectionDivider label="Subject Domain" />

          {availableSubjects.length === 0 ? (
            <AppState
              isEmpty={true}
              title="No subjects found"
              description="No subjects available for your current curriculum."
              icon={AlertCircle}
              fullScreen={false}
            />
          ) : (
            <SubjectOptionGrid>
              {availableSubjects.map((item) => (
                <SubjectOption
                  key={item.id}
                  subject={item.subject}
                  chaptersCount={item.chaptersCount}
                  icon={getSubjectIcon(item.subject)}
                  selected={subject === item.subject}
                  onSelect={() => setSubject(item.subject)}
                />
              ))}
            </SubjectOptionGrid>
          )}

          {/* Navigation Footer */}
          <GenerateStepFooter
            onBack={onBack}
            nextHint={
              mode === "lightning"
                ? "Select chapters for your live multiplayer competition"
                : mode === "slos"
                  ? "Select chapters with SLOs"
                  : "Select chapters from past paper bank"
            }
            continueLabel="Next: Select Chapters"
            onContinue={onNext}
            disabled={!subject}
          />
        </>
      )}
    </GenerateStepShell>
  );
}
