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
import type { GeneratePaperChapter, PaperType } from "@/types/generate";

interface GenerateChaptersStepProps {
  paperType: PaperType;
  subject: string;
  chapters: GeneratePaperChapter[];
  selectedChapterIds: string[];
  loadingChapters: boolean;
  loadingPaper: boolean;
  allowEmptyBank?: boolean;
  continueLabel?: string;
  nextHint?: string;
  onSelectAll: () => void;
  onClear: () => void;
  onToggleChapter: (id: string) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export default function GenerateChaptersStep({
  paperType,
  subject,
  chapters,
  selectedChapterIds,
  loadingChapters,
  loadingPaper,
  allowEmptyBank = false,
  continueLabel = "Generate",
  nextHint = "Generate your practice paper",
  onSelectAll,
  onClear,
  onToggleChapter,
  onBack,
  onGenerate,
}: GenerateChaptersStepProps) {
  const selectableChapters = allowEmptyBank
    ? chapters
    : chapters.filter((chapter) => chapter.questionCount > 0);
  const hasSyllabusChapters = chapters.length > 0;
  const paperLabel = paperType === "1" ? "Paper I (MCQ)" : "Paper II (CRQ/ERQ)";

  return (
    <GenerateStepShell>
      <GenerateStepTopNav
        onBack={onBack}
        stepBadge="Step 3 of 4"
        title={`Select Chapters · ${subject}`}
        subtitle="Choose units to include in your generated paper"
      />

      {loadingChapters ? (
        <div className="flex min-h-[calc(100dvh-10rem)] flex-col rounded-2xl border border-border bg-card lg:min-h-[calc(100dvh-18rem)]">
          <AppLoader className="min-h-0 flex-1" />
        </div>
      ) : !hasSyllabusChapters ? (
        <div className="rounded-2xl border border-border bg-card p-8">
          <AppState
            isEmpty={true}
            title="No chapters in syllabus"
            description={`No syllabus chapters were found for ${subject}.`}
            icon={AlertCircle}
            action={{ label: "Back to config", onClick: onBack }}
            fullScreen={false}
          />
        </div>
      ) : (
        <>
          {selectableChapters.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Syllabus chapters are listed below, but no {paperLabel} questions are in the question bank
              for them yet.
            </p>
          ) : null}

          {allowEmptyBank ? (
            <p className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Chapters are selected from the syllabus. Papers are generated from SLOs
              (question bank first, AI fill when needed).
            </p>
          ) : null}

          <GenerateSelectionBar
            selectedCount={selectedChapterIds.length}
            totalCount={selectableChapters.length}
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
                selected={selectedChapterIds.includes(chapter.id)}
                disabled={!allowEmptyBank && chapter.questionCount === 0}
                onToggle={() => onToggleChapter(chapter.id)}
              />
            ))}
          </div>

          <GenerateStepFooter
            nextHint={nextHint}
            continueLabel={continueLabel}
            onContinue={onGenerate}
            onBack={onBack}
            disabled={selectedChapterIds.length === 0}
            loading={loadingPaper}
          />
        </>
      )}
    </GenerateStepShell>
  );
}
