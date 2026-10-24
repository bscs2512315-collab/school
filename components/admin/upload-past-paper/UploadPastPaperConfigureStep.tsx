"use client";

import AppDropdown from "@/components/AppDropdown";
import AppLabel from "@/components/AppLabel";
import {
  GenerateSectionDivider,
  GenerateStepFooter,
  GenerateStepShell,
  PaperTypeOption,
  SubjectOption,
  SubjectOptionGrid,
} from "@/components/generate/GeneratePaperUI";
import { getSubjectIcon } from "@/lib/generate/subject-icons";
import { Board, Class, Subject } from "@/types/enums";
import { useSubjectNames } from "@/hooks/subjects/useSubjects";
import { isMetadataComplete } from "@/components/admin/upload-past-paper/UploadPastPaperMetadataCard";

interface UploadPastPaperConfigureStepProps {
  paperNumber: number;
  classValue: string;
  board: string;
  subject: string;
  year: string;
  years: number[];
  strictMode?: boolean;
  allowResume?: boolean;
  onPaperNumberChange: (paperNumber: number) => void;
  onClassChange: (value: string) => void;
  onBoardChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onStrictModeChange?: (value: boolean) => void;
  onAllowResumeChange?: (value: boolean) => void;
  onContinue: () => void;
}

export default function UploadPastPaperConfigureStep({
  paperNumber,
  classValue,
  board,
  subject,
  year,
  years,
  strictMode = true,
  allowResume = false,
  onPaperNumberChange,
  onClassChange,
  onBoardChange,
  onSubjectChange,
  onYearChange,
  onStrictModeChange,
  onAllowResumeChange,
  onContinue,
}: UploadPastPaperConfigureStepProps) {
  const subjectNames = useSubjectNames();
  const subjects = subjectNames.length > 0 ? subjectNames : Object.values(Subject);
  const metadataReady = isMetadataComplete(classValue, board, subject, year);

  return (
    <GenerateStepShell>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <PaperTypeOption
          label="Foundational"
          title="Paper I"
          description="Multiple Choice · MCQ questions"
          badge="MCQ"
          watermark="I"
          selected={paperNumber === 1}
          onSelect={() => onPaperNumberChange(1)}
        />
        <PaperTypeOption
          label="Analytical"
          title="Paper II"
          description="Structured · CRQ & ERQ responses"
          badge="CRQ & ERQ"
          watermark="II"
          selected={paperNumber === 2}
          onSelect={() => onPaperNumberChange(2)}
        />
      </div>

      <GenerateSectionDivider label="Knowledge Domain" />

      <SubjectOptionGrid>
        {subjects.map((subjectValue) => (
          <SubjectOption
            key={subjectValue}
            subject={subjectValue}
            chaptersCount={0}
            icon={getSubjectIcon(subjectValue)}
            selected={subject === subjectValue}
            onSelect={() => onSubjectChange(subjectValue)}
            showChapterCount={false}
          />
        ))}
      </SubjectOptionGrid>

      <GenerateSectionDivider label="Paper Details" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <AppLabel>Class</AppLabel>
          <AppDropdown
            value={classValue}
            onChange={(e) => onClassChange(e.target.value)}
            options={Object.values(Class).map((value) => ({ label: value, value }))}
            placeholder="Select class"
          />
        </div>

        <div className="space-y-2">
          <AppLabel>Board</AppLabel>
          <AppDropdown
            value={board}
            onChange={(e) => onBoardChange(e.target.value)}
            options={Object.values(Board).map((value) => ({ label: value, value }))}
            placeholder="Select board"
          />
        </div>

        <div className="space-y-2">
          <AppLabel>Year</AppLabel>
          <AppDropdown
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            options={years.map((value) => ({
              label: String(value),
              value: String(value),
            }))}
            placeholder="Select year"
          />
        </div>
      </div>

      <GenerateSectionDivider label="Exam Integrity & Anti-Cheat" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all">
          <input
            type="checkbox"
            checked={strictMode}
            onChange={(e) => onStrictModeChange?.(e.target.checked)}
            className="size-4.5 accent-primary rounded cursor-pointer"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground">Strict Anti-Cheat Mode</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Tab-switch auto-submit, window blur lock & keyboard shortcut protection
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all">
          <input
            type="checkbox"
            checked={allowResume}
            onChange={(e) => onAllowResumeChange?.(e.target.checked)}
            className="size-4.5 accent-primary rounded cursor-pointer"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground">Allow Resume</p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Permit students to save progress and resume later instead of failing attempt
            </p>
          </div>
        </label>
      </div>

      <GenerateStepFooter
        nextHint="Choose how to import questions"
        onContinue={onContinue}
        disabled={!metadataReady}
        continueLabel="Continue"
      />
    </GenerateStepShell>
  );
}
