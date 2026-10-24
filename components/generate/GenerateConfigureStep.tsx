"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import AppState from "@/components/AppState";
import AppInput from "@/components/AppInput";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import ScrollSVG from "@/public/svgs/ScrollSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import EditSVG from "@/public/svgs/EditSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import {
  GenerateSectionDivider,
  GenerateStepFooter,
  GenerateStepShell,
  GenerateStepTopNav,
  PaperTypeOption,
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
import type { GenerateCurriculum, GenerateMode, PaperType } from "@/types/generate";

interface GenerateConfigureStepProps {
  mode: GenerateMode;
  paperType: PaperType;
  onPaperTypeChange: (type: PaperType) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  availableSubjects: GenerateCurriculum[];
  customTitle: string;
  onCustomTitleChange: (title: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  customImages: CustomUploadedImage[];
  onCustomImagesChange: (images: CustomUploadedImage[]) => void;
  creationType?: CustomCreationType;
  onCreationTypeChange?: (type: CustomCreationType) => void;
  manualQuestions?: ManualQuestionItem[];
  onManualQuestionsChange?: (questions: ManualQuestionItem[]) => void;
  loadingPaper?: boolean;
  onBack: () => void;
  onContinue: () => void;
  onGenerateCustom: () => void;
}

export default function GenerateConfigureStep({
  mode,
  paperType,
  onPaperTypeChange,
  subject,
  onSubjectChange,
  availableSubjects,
  customTitle,
  onCustomTitleChange,
  customPrompt,
  onCustomPromptChange,
  customImages,
  onCustomImagesChange,
  creationType = "ai",
  onCreationTypeChange,
  manualQuestions,
  onManualQuestionsChange,
  loadingPaper = false,
  onBack,
  onContinue,
  onGenerateCustom,
}: GenerateConfigureStepProps) {
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
        title={isCustom ? "Configure Custom Exam" : "Select Format & Subject"}
        subtitle={
          isCustom
            ? "Set exam title, format, and custom syllabus materials"
            : "Choose your target paper format and curriculum subject"
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
                  <GenerateSVG className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Custom Paper Builder Form
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    All exam parameters unified in a single clean workspace
                  </p>
                </div>
              </div>

              {onCreationTypeChange && (
                <div className="inline-flex rounded-xl border border-border/80 bg-background/80 p-1 self-start sm:self-auto">
                  <button
                    type="button"
                    disabled={loadingPaper}
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
                    disabled={loadingPaper}
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
              {/* Row 1: Exam Title */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
                  <BookOpenSVG className="size-4 text-primary dark:text-foreground" />
                  Exam Title / Subject Name
                </label>
                <AppInput
                  value={customTitle}
                  onChange={(e) => onCustomTitleChange(e.target.value)}
                  placeholder="e.g., Biology Mid-Term Mock 2026, Physics Chapter 3 & 4..."
                  className="h-12 rounded-xl bg-background/90 text-sm font-medium"
                  disabled={loadingPaper}
                />
                <p className="text-[11px] text-muted-foreground">
                  Give your custom paper a clear title for performance tracking and exam history.
                </p>
              </div>

              {/* Row 2: Paper Format Selection */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
                  <ScrollSVG className="size-4 text-primary dark:text-foreground" />
                  Paper Format
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <PaperTypeOption
                    label="Foundational"
                    title="Paper I"
                    description="Multiple Choice · 25 Questions"
                    badge="MCQ"
                    watermark="I"
                    selected={paperType === "1"}
                    onSelect={() => onPaperTypeChange("1")}
                  />
                  <PaperTypeOption
                    label="Analytical"
                    title="Paper II"
                    description="Structured · 25 Questions"
                    badge="CRQ & ERQ"
                    watermark="II"
                    selected={paperType === "2"}
                    onSelect={() => onPaperTypeChange("2")}
                  />
                </div>
              </div>

              {/* Row 3: Custom Materials / Questions Builder */}
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
                  disabled={loadingPaper}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <GenerateStepFooter
            onBack={onBack}
            nextHint={
              creationType === "manual"
                ? "Create and attempt your manual quiz"
                : "AI generates 25 questions from your input"
            }
            continueLabel={
              creationType === "manual"
                ? `Start Manual Quiz (${manualQuestions?.length ?? 1} Qs)`
                : "Generate 25 Questions"
            }
            loading={loadingPaper}
            onContinue={onGenerateCustom}
            disabled={!customTitle.trim() || !customHasInput || loadingPaper}
          />
        </div>
      ) : (
        /* ==================== PAST PAPERS & SLO'S STEP 2 ==================== */
        <>
          {/* 1. Paper Format */}
          <GenerateSectionDivider label="1. Paper Format" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <PaperTypeOption
              label="Foundational"
              title="Paper I"
              description={
                mode === "past_papers"
                  ? "Multiple Choice · Official bank"
                  : "Multiple Choice · 25 Questions"
              }
              badge="MCQ"
              watermark="I"
              selected={paperType === "1"}
              onSelect={() => onPaperTypeChange("1")}
            />
            <PaperTypeOption
              label="Analytical"
              title="Paper II"
              description={
                mode === "past_papers"
                  ? "Structured · CRQ & ERQ bank"
                  : "Structured · 25 Questions"
              }
              badge="CRQ & ERQ"
              watermark="II"
              selected={paperType === "2"}
              onSelect={() => onPaperTypeChange("2")}
            />
          </div>

          {/* 2. Knowledge Domain / Subject Grid */}
          <GenerateSectionDivider label="2. Knowledge Domain / Subject" />
          {availableSubjects.length === 0 ? (
            <AppState
              isEmpty={true}
              title="No subjects found"
              description="We could not load your curriculum subjects. Please try again later."
              icon={AlertCircle}
              fullScreen={false}
            />
          ) : (
            <SubjectOptionGrid>
              {availableSubjects.map((curriculum) => (
                <SubjectOption
                  key={curriculum.id}
                  subject={curriculum.subject}
                  chaptersCount={curriculum.chaptersCount}
                  icon={getSubjectIcon(curriculum.subject)}
                  selected={subject === curriculum.subject}
                  onSelect={() => onSubjectChange(curriculum.subject)}
                />
              ))}
            </SubjectOptionGrid>
          )}

          {/* 3. Footer */}
          <GenerateStepFooter
            onBack={onBack}
            nextHint={
              mode === "slos"
                ? "Select chapters for 25 SLO questions"
                : "Select your chapters"
            }
            continueLabel="Next: Select Chapters"
            onContinue={onContinue}
            disabled={!subject || loadingPaper}
          />
        </>
      )}
    </GenerateStepShell>
  );
}
