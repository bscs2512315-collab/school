"use client";

import { ChevronLeft, Sparkles } from "lucide-react";
import {
  GenerateSectionDivider,
  GenerateStepFooter,
  GenerateStepShell,
} from "@/components/generate/GeneratePaperUI";
import UploadPastPaperMetaSummary from "@/components/admin/upload-past-paper/UploadPastPaperMetaSummary";

interface UploadPastPaperManualStepProps {
  paperNumber: number;
  classValue: string;
  board: string;
  subject: string;
  year: string;
  manualText: string;
  onManualTextChange: (value: string) => void;
  onBack: () => void;
  onParse: () => void;
}

export default function UploadPastPaperManualStep({
  paperNumber,
  classValue,
  board,
  subject,
  year,
  manualText,
  onManualTextChange,
  onBack,
  onParse,
}: UploadPastPaperManualStepProps) {
  const placeholder =
    paperNumber === 1
      ? "Question 1: If the volume of the given cuboid is 0.03 m(superscript=3) then the value of x will be:\nA. 0.1 m\nB. 0.2 m\nC. 0.3 m\nD. 0.5 m\nCorrect Answer C"
      : "Question 1: 'Physics helps in development of our society.'\nQuestion Type: CRQ\nBetter Response: ...\nWeaker Response: ...";

  return (
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

      <GenerateSectionDivider label="Paste Text" />

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="mb-4 text-sm text-muted-foreground">
          {paperNumber === 1
            ? "Use MCQ format: question, options A–D, and correct answer."
            : "Use CRQ/ERQ format: question, type, better response, and weaker response."}
        </p>

        <textarea
          value={manualText}
          onChange={(e) => onManualTextChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-96 w-full resize-none rounded-2xl border border-border bg-background p-5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Use <code className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">(superscript=3)</code> for exponents and{" "}
            <code className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">(subscript=2)</code> for subscripts.
          </p>
        </div>
      </div>

      <GenerateStepFooter
        nextHint="Review extracted questions"
        onContinue={onParse}
        onBack={onBack}
        disabled={!manualText.trim()}
        continueLabel="Parse"
      />
    </GenerateStepShell>
  );
}
