"use client";

import { AlertCircle } from "lucide-react";
import AppLoader from "@/components/AppLoader";
import AppState from "@/components/AppState";
import {
  ChapterOption,
  GenerateSectionDivider,
  GenerateSelectionBar,
  GenerateStepFooter,
  GenerateStepShell,
  GenerateStepTopNav,
} from "@/components/generate/GeneratePaperUI";

interface Chapter {
  id: string;
  chapterNumber: number;
  chapterName: string;
  questionCount: number;
}

interface StepChaptersProps {
  loadingChapters: boolean;
  chapters: Chapter[];
  selectedChapterIds: string[];
  onToggleChapter: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
  continueLabel?: string;
  nextHint?: string;
}

export default function StepChapters({
  loadingChapters,
  chapters,
  selectedChapterIds,
  onToggleChapter,
  onSelectAll,
  onClear,
  onBack,
  onNext,
  continueLabel = "Next: Invite Friends",
  nextHint = "Invite classmates and friends to your challenge arena",
}: StepChaptersProps) {
  return (
    <GenerateStepShell>
      {/* Top Back Navigation */}
      <GenerateStepTopNav
        onBack={onBack}
        stepBadge="Step 3 of 4"
        title="Select Challenge Units"
        subtitle="Choose units to include in the challenge round"
      />

      {loadingChapters ? (
        <div className="flex min-h-[calc(100dvh-10rem)] flex-col rounded-2xl border border-border bg-card lg:min-h-[calc(100dvh-18rem)]">
          <AppLoader className="min-h-0 flex-1" />
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8">
          <AppState
            isEmpty={true}
            title="No chapters found"
            description="No chapters were found for the selected subject."
            icon={AlertCircle}
            action={{ label: "Back to config", onClick: onBack }}
            fullScreen={false}
          />
        </div>
      ) : (
        <>
          <GenerateSelectionBar
            selectedCount={selectedChapterIds.length}
            totalCount={chapters.length}
            onSelectAll={onSelectAll}
            onClear={onClear}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {chapters.map((chapter) => (
              <ChapterOption
                key={chapter.id}
                chapterNumber={chapter.chapterNumber}
                chapterName={chapter.chapterName}
                questionCount={chapter.questionCount}
                showQuestionCount={false}
                selected={selectedChapterIds.includes(chapter.id)}
                onToggle={() => onToggleChapter(chapter.id)}
              />
            ))}
          </div>

          <GenerateStepFooter
            nextHint={nextHint}
            continueLabel={continueLabel}
            onContinue={onNext}
            onBack={onBack}
            disabled={selectedChapterIds.length === 0}
          />
        </>
      )}
    </GenerateStepShell>
  );
}
