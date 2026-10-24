"use client";

import { GenerateMetaChip } from "@/components/generate/GeneratePaperUI";

interface UploadPastPaperMetaSummaryProps {
  paperNumber: number;
  classValue: string;
  board: string;
  subject: string;
  year: string;
}

export default function UploadPastPaperMetaSummary({
  paperNumber,
  classValue,
  board,
  subject,
  year,
}: UploadPastPaperMetaSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <GenerateMetaChip
        label="Paper"
        value={paperNumber === 1 ? "Paper I · MCQ" : "Paper II · CRQ/ERQ"}
      />
      <GenerateMetaChip label="Subject" value={subject || "—"} />
      <GenerateMetaChip label="Class" value={classValue ? `Class ${classValue}` : "—"} />
      <GenerateMetaChip label="Board" value={board || "—"} />
      <GenerateMetaChip label="Year" value={year || "—"} />
    </div>
  );
}
