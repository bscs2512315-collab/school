"use client";

import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import ImageSVG from "@/public/svgs/ImageSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import EditSVG from "@/public/svgs/EditSVG";
import { cn } from "@/lib/utils";
import AppButton from "@/components/AppButton";
import { apiPost } from "@/lib/api/api-client";
import { API_ENDPOINTS } from "@/constants/endpoints";
import ManualQuestionBuilder, {
  type ManualQuestionItem,
  createEmptyManualQuestion,
} from "@/components/custom-quiz/ManualQuestionBuilder";

import EquationToolbox from "@/components/editor/EquationToolbox";
import { convertMathToHTML } from "@/lib/utils/math-notation";

export interface CustomUploadedImage {
  id: string;
  fileUrl: string;
  fileName: string;
}

export type CustomCreationType = "ai" | "manual";

interface GenerateCustomInputsProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  images: CustomUploadedImage[];
  onImagesChange: (images: CustomUploadedImage[]) => void;
  creationType?: CustomCreationType;
  onCreationTypeChange?: (type: CustomCreationType) => void;
  manualQuestions?: ManualQuestionItem[];
  onManualQuestionsChange?: (questions: ManualQuestionItem[]) => void;
  disabled?: boolean;
}

const PROMPT_SUGGESTIONS = [
  "⭐ Focus on high-frequency conceptual MCQs",
  "📐 Numerical calculation & derivation heavy",
  "🔥 Challenging / Olympiad difficulty tier",
  "📊 Graph, table & diagram interpretation",
  " Key formulas, definitions and applications",
];

export default function GenerateCustomInputs({
  prompt,
  onPromptChange,
  images,
  onImagesChange,
  creationType = "ai",
  onCreationTypeChange,
  manualQuestions = [createEmptyManualQuestion(1)],
  onManualQuestionsChange,
  disabled = false,
}: GenerateCustomInputsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  const handleInsertPromptEquation = (
    insertText: string,
    wrapMode?: "superscript" | "subscript" | "fraction" | "sqrt" | "parens",
  ) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? prompt.length;
    const end = el?.selectionEnd ?? prompt.length;
    const before = prompt.slice(0, start);
    const selected = prompt.slice(start, end);
    const after = prompt.slice(end);

    let nextText = "";
    let nextCursor = start;

    if (wrapMode === "superscript") {
      const inner = selected || "2";
      const wrapped = `(superscript=${inner})`;
      nextText = `${before}${wrapped}${after}`;
      nextCursor = before.length + wrapped.length;
    } else if (wrapMode === "subscript") {
      const inner = selected || "2";
      const wrapped = `(subscript=${inner})`;
      nextText = `${before}${wrapped}${after}`;
      nextCursor = before.length + wrapped.length;
    } else if (wrapMode === "fraction") {
      const num = selected || "a";
      const wrapped = `(${num})/(b)`;
      nextText = `${before}${wrapped}${after}`;
      nextCursor = before.length + wrapped.length;
    } else if (wrapMode === "sqrt") {
      const inner = selected ? `(${selected})` : "";
      const wrapped = `√${inner}`;
      nextText = `${before}${wrapped}${after}`;
      nextCursor = before.length + wrapped.length;
    } else if (wrapMode === "parens") {
      const inner = selected || "";
      const wrapped = `(${inner})`;
      nextText = `${before}${wrapped}${after}`;
      nextCursor = before.length + wrapped.length;
    } else {
      nextText = `${before}${insertText}${after}`;
      nextCursor = start + insertText.length;
    }

    onPromptChange(nextText.slice(0, 500));
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const availableSlots = 5 - images.length;
    if (availableSlots <= 0) {
      toast.error("You can upload up to 5 reference images");
      return;
    }

    const validFiles = fileList
      .slice(0, availableSlots)
      .filter((f) => {
        if (!f.type.startsWith("image/")) {
          toast.error(`${f.name} is not an image file`);
          return false;
        }
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`${f.name} exceeds 10MB limit`);
          return false;
        }
        return true;
      });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading reference image(s)...");

    try {
      const formData = new FormData();
      validFiles.forEach((file) => formData.append("files", file));

      const res = await apiPost<{
        results: Array<{ fileUrl: string; fileName: string }>;
      }>("/upload/reference-image", formData);

      if (!res.success || !res.data?.results) {
        throw new Error(res.message || "Failed to upload reference images");
      }

      const newUploaded: CustomUploadedImage[] = res.data.results.map((r, i) => ({
        id: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
        fileUrl: r.fileUrl,
        fileName: r.fileName,
      }));

      onImagesChange([...images, ...newUploaded]);
      toast.success(`Uploaded ${newUploaded.length} reference image(s)`, { id: toastId });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || "Failed to upload images", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    onImagesChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Sub-mode Selector: AI vs Manual */}
      {onCreationTypeChange && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/80 bg-muted/30 p-2 sm:p-2.5">
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Custom Mode:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:w-80">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onCreationTypeChange("ai")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all",
                creationType === "ai"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
              )}
            >
              <SparklesSVG className="size-4" />
              AI Generate
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onCreationTypeChange("manual")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all",
                creationType === "manual"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
              )}
            >
              <EditSVG className="size-4" />
              Create Manually
            </button>
          </div>
        </div>
      )}

      {creationType === "manual" ? (
        /* Manual Questions Builder */
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-xs">
          <ManualQuestionBuilder
            questions={manualQuestions}
            onChange={(qs) => onManualQuestionsChange?.(qs)}
            disabled={disabled}
          />
        </div>
      ) : (
        /* AI Generation Mode (Images & Prompt) */
        <>
          {/* 1. Reference Image Upload */}
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageSVG className="size-4 text-primary dark:text-foreground" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Reference Materials / Images (Optional)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {images.length}/5 uploaded
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload photos of textbook pages, handwritten notes, test worksheets, or diagrams. AI will synthesize questions aligned to them.
            </p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files);
              }}
              onClick={() => {
                if (!disabled && !isUploading) fileInputRef.current?.click();
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all duration-200",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border/80 bg-muted/20 hover:border-primary/60 hover:bg-muted/40",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) void handleFiles(e.target.files);
                }}
              />

              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground transition-transform group-hover:scale-110">
                {isUploading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ImageSVG className="size-6" />
                )}
              </div>

              <p className="mt-2.5 text-sm font-bold text-foreground">
                {isUploading ? "Uploading to Cloud..." : "Click or drag images to upload"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Supports JPEG, PNG, WebP up to 10MB each (max 5 images)
              </p>
            </div>

            {/* Uploaded Thumbnails */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 pt-2 sm:grid-cols-3 md:grid-cols-5">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/80 shadow-xs transition-all"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.fileUrl}
                        alt={img.fileName}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(img.id);
                        }}
                        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/75 text-white transition-transform hover:scale-110 hover:bg-destructive"
                        title="Remove image"
                      >
                        <DeleteSVG className="size-3.5" />
                      </button>
                    </div>
                    <div className="p-1.5">
                      <p className="truncate text-[10px] font-semibold text-muted-foreground">
                        {img.fileName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* 2. Custom Prompt Section */}
          <div className="space-y-3.5 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparklesSVG className="size-4 text-primary dark:text-foreground" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Custom AI Prompt &amp; Instructions
                </span>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {prompt.length}/500
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Tell AI specifically what topics, difficulty, or question patterns to emphasize. Use the toolbox to format math &amp; chemistry equations.
            </p>

            {/* Equation & Chemistry Toolbox */}
            <EquationToolbox
              onInsert={handleInsertPromptEquation}
              showPreviewToggle={Boolean(prompt.trim())}
              isPreviewOpen={showPromptPreview}
              onTogglePreview={() => setShowPromptPreview((p) => !p)}
              size="sm"
            />

            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value.slice(0, 500))}
                disabled={disabled}
                rows={5}
                className="w-full min-h-[140px] sm:min-h-[160px] rounded-xl border border-border/70 bg-background font-mono px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y leading-relaxed"
                placeholder="e.g., Focus on numerical problems from Chapter 2 &amp; 3, or emphasize photosynthesis 6CO₂ + 6H₂O -> C₆H₁₂O₆ + 6O₂ and quadratic formulas..."
              />

              {/* Prompt Live Preview if enabled */}
              {showPromptPreview && prompt.trim() && (
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                  <span className="block font-bold text-[10px] uppercase tracking-wider text-primary dark:text-foreground mb-1">
                    Live Formatted Prompt Preview:
                  </span>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: convertMathToHTML(prompt),
                    }}
                  />
                </div>
              )}

              {/* Quick Suggestion Chips (Horizontal Scroll Row) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Suggestions:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar -mx-0.5 px-0.5">
                  {PROMPT_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        const clean = sug.replace(/^[^\w\s]+\s*/, "");
                        const next = prompt ? `${prompt}, ${clean}` : clean;
                        onPromptChange(next.slice(0, 500));
                      }}
                      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

