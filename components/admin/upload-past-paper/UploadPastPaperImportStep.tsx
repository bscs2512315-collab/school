"use client";

import { ChevronLeft, ClipboardList, PenLine } from "lucide-react";
import { GenerateSectionDivider, GenerateStepShell } from "@/components/generate/GeneratePaperUI";
import UploadPastPaperImportMethodOption from "@/components/admin/upload-past-paper/UploadPastPaperImportMethodOption";
import UploadPastPaperMetaSummary from "@/components/admin/upload-past-paper/UploadPastPaperMetaSummary";
import UploadPastPaperAutoExtractOption from "@/components/admin/upload-past-paper/UploadPastPaperAutoExtractOption";

interface UploadPastPaperImportStepProps {
  paperNumber: number;
  classValue: string;
  board: string;
  subject: string;
  year: string;
  isExtracting?: boolean;
  onBack: () => void;
  onPasteText: () => void;
  onManualEntry: () => void;
  onAutoExtract?: (paperFile: File, syllabusFile: File | null) => Promise<void>;
}

export default function UploadPastPaperImportStep({
  paperNumber,
  classValue,
  board,
  subject,
  year,
  isExtracting = false,
  onBack,
  onPasteText,
  onManualEntry,
  onAutoExtract,
}: UploadPastPaperImportStepProps) {
  return (
    <GenerateStepShell>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        Back to configure
      </button>

      <UploadPastPaperMetaSummary
        paperNumber={paperNumber}
        classValue={classValue}
        board={board}
        subject={subject}
        year={year}
      />

      <GenerateSectionDivider label="Recommended: Instant Auto-Extraction" />

      {onAutoExtract ? (
        <UploadPastPaperAutoExtractOption
          paperNumber={paperNumber}
          classValue={classValue}
          board={board}
          subject={subject}
          year={year}
          isExtracting={isExtracting}
          onExtract={onAutoExtract}
        />
      ) : null}

      <GenerateSectionDivider label="Or Other Import Methods" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UploadPastPaperImportMethodOption
          title="Paste Text"
          description={`Paste raw examination text for Paper ${paperNumber}. The parser will extract structured questions automatically.`}
          icon={PenLine}
          actionLabel="Paste & Parse"
          watermark="TXT"
          onAction={onPasteText}
        />
        <UploadPastPaperImportMethodOption
          title="Manual Entry"
          description="Add questions one at a time using a guided form when you only need a few items."
          icon={ClipboardList}
          actionLabel="Add Manually"
          watermark="+"
          onAction={onManualEntry}
        />
      </div>
    </GenerateStepShell>
  );
}
