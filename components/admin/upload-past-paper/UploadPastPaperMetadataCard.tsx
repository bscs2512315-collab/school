"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import AppDropdown from "@/components/AppDropdown";
import AppLabel from "@/components/AppLabel";
import AppTabs from "@/components/AppTabs";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import { Board, Class, Subject } from "@/types/enums";
import { useAdminSubjectOptions } from "@/hooks/subjects/useSubjects";

interface UploadPastPaperMetadataCardProps {
  paperNumber: number;
  classValue: string;
  board: string;
  subject: string;
  year: string;
  years: number[];
  onPaperNumberChange: (paperNumber: number) => void;
  onClassChange: (value: string) => void;
  onBoardChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onYearChange: (value: string) => void;
  showPaperToggle?: boolean;
  compact?: boolean;
}

export function isMetadataComplete(
  classValue: string,
  board: string,
  subject: string,
  year: string,
): boolean {
  return Boolean(classValue && board && subject && year);
}

export default function UploadPastPaperMetadataCard({
  paperNumber,
  classValue,
  board,
  subject,
  year,
  years,
  onPaperNumberChange,
  onClassChange,
  onBoardChange,
  onSubjectChange,
  onYearChange,
  showPaperToggle = true,
  compact = false,
}: UploadPastPaperMetadataCardProps) {
  const subjectOptions = useAdminSubjectOptions(Object.values(Subject));
  const metadataComplete = isMetadataComplete(classValue, board, subject, year);

  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card shadow-sm",
        compact ? "p-5 sm:p-6" : "p-6 sm:p-8",
      )}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Step 1
          </p>
          <Typography variant="h4" className="mt-1 font-bold">
            Paper Details
          </Typography>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the class, board, subject, and year before importing questions.
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest",
            {
              "border-primary/20 bg-primary/10 text-primary": metadataComplete,
              "border-border bg-muted text-muted-foreground": !metadataComplete,
            },
          )}
        >
          {metadataComplete ? (
            <>
              <CheckCircle2 className="size-3.5" />
              Ready
            </>
          ) : (
            <>
              <AlertCircle className="size-3.5" />
              Incomplete
            </>
          )}
        </div>
      </div>

      {showPaperToggle ? (
        <div className="mb-6">
          <AppTabs
            tabs={[
              { label: "Paper I", value: "1", mobileLabel: "Paper I" },
              { label: "Paper II", value: "2", mobileLabel: "Paper II" },
            ]}
            activeTab={String(paperNumber)}
            onChange={(value) => onPaperNumberChange(Number(value))}
            className="w-full max-w-md"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {paperNumber === 1
              ? "Multiple choice questions (MCQ)"
              : "Constructed and extended response questions (CRQ / ERQ)"}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <AppLabel>Subject</AppLabel>
          <AppDropdown
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            options={subjectOptions}
            placeholder="Select subject"
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

      {!metadataComplete ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Complete all fields above to unlock import options.
          </p>
        </div>
      ) : null}
    </div>
  );
}
