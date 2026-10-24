"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppButton from "@/components/AppButton";
import { cn } from "@/lib/utils";

interface UploadPastPaperAutoExtractOptionProps {
  paperNumber: number;
  classValue: string;
  board: string;
  subject: string;
  year: string;
  isExtracting: boolean;
  onExtract: (paperFile: File, syllabusFile: File | null) => Promise<void>;
}

export default function UploadPastPaperAutoExtractOption({
  paperNumber,
  classValue,
  board,
  subject,
  year,
  isExtracting,
  onExtract,
}: UploadPastPaperAutoExtractOptionProps) {
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [showCustomSyllabus, setShowCustomSyllabus] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const paperInputRef = useRef<HTMLInputElement>(null);
  const syllabusInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setPaperFile(file);
      }
    }
  };

  const handleStartExtraction = async () => {
    if (!paperFile) return;
    await onExtract(paperFile, syllabusFile);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 transition-all p-6 sm:p-8",
        isDragOver
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-primary/40 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-md",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Sparkles className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                Auto-Extract from PDF
              </h3>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                100% Free · Automated
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically strips watermarks, crops diagrams, reasons answers & matches syllabus SLOs.
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="text-left sm:text-right">
          <span className="text-xs font-semibold text-muted-foreground">Target Exam</span>
          <p className="text-xs font-bold text-foreground">
            Class {classValue} · {subject} · {year} (P{paperNumber})
          </p>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div className="mt-6">
        <input
          ref={paperInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setPaperFile(e.target.files[0]);
            }
          }}
        />

        {!paperFile ? (
          <button
            type="button"
            disabled={isExtracting}
            onClick={() => paperInputRef.current?.click()}
            className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-all hover:border-primary/60 hover:bg-primary/[0.02]"
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <UploadCloud className="size-7" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              Click to browse or drag & drop Past Paper PDF
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Official board PDF (up to 20MB)
            </p>
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {paperFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(paperFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for AI extraction
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isExtracting}
                onClick={() => paperInputRef.current?.click()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change PDF
              </button>
              <button
                type="button"
                disabled={isExtracting}
                onClick={() => setPaperFile(null)}
                className="text-xs font-semibold text-muted-foreground hover:text-destructive ml-2"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Optional Custom Syllabus Accordion */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowCustomSyllabus(!showCustomSyllabus)}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCustomSyllabus ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          <span>Upload Custom Syllabus SLOs PDF (Optional)</span>
        </button>

        {showCustomSyllabus && (
          <div className="mt-3 rounded-2xl border border-border bg-muted/10 p-4">
            <input
              ref={syllabusInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSyllabusFile(e.target.files[0]);
                }
              }}
            />
            <p className="text-xs text-muted-foreground mb-3">
              By default, we match against all curriculum chapters in your ExBoardAI database. If you have a specific SLO document for this year, attach it here:
            </p>
            {!syllabusFile ? (
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => syllabusInputRef.current?.click()}
                className="rounded-xl text-xs"
              >
                <FileText className="mr-1.5 size-3.5" />
                Select Syllabus / SLOs PDF
              </AppButton>
            ) : (
              <div className="flex items-center justify-between gap-3 text-xs bg-card p-2.5 rounded-xl border border-border">
                <span className="truncate font-medium text-foreground">{syllabusFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSyllabusFile(null)}
                  className="text-destructive hover:underline font-semibold"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Extraction Process & Call To Action */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/60">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary shrink-0" />
          <span>Watermarks removed, diagrams cropped & questions mapped automatically.</span>
        </div>

        <AppButton
          type="button"
          disabled={!paperFile || isExtracting}
          onClick={handleStartExtraction}
          className="w-full sm:w-auto px-6 h-11 rounded-xl shadow-md shadow-primary/20"
        >
          {isExtracting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing Paper & Diagrams...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" />
              Auto-Extract Past Paper
            </>
          )}
        </AppButton>
      </div>

      {/* Live Pipeline Step Indicator */}
      {isExtracting && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-pulse">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Automated Pipeline Running
          </p>
          <div className="mt-2 space-y-1.5 text-xs text-foreground">
            <p className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-ping" />
              1. Stripping vector & image watermarks cleanly across all pages...
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <span>🖼️</span> 2. Auto-cropping high-resolution diagrams & uploading...
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <span>🤖</span> 3. Reasoning correct answers & filtering out-of-syllabus questions...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
