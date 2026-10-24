"use client";

import { memo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AppButton from "@/components/AppButton";
import AppDropdown from "@/components/AppDropdown";
import AppInput from "@/components/AppInput";
import AppLabel from "@/components/AppLabel";
import MCQOptionsEditor from "@/components/MCQOptionsEditor";
import QuestionFormatter from "@/components/QuestionFormatter";
import ScientificTextEditor from "@/components/editor/ScientificTextEditor";
import { getFileFromDrop, getFileFromPaste } from "@/lib/image-upload-utils";
import { cn } from "@/lib/utils";

interface MCQOption {
  id: string;
  text: string;
}

interface PaperIIData {
  betterResponse?: string;
  weakerResponse?: string;
  type?: string;
}

export interface UploadPastPaperQuestion {
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: "MCQ" | "CRQ" | "ERQ";
  chapterId: string | null;
  chapterName: string | null;
  confidence?: number;
  marks: number;
  isSaved?: boolean;
  mcqOptions?: MCQOption[];
  correctAnswer?: string | null;
  imageUrl?: string | null;
  paperIIData?: PaperIIData;
}

interface Chapter {
  id: string;
  chapterName: string;
}

interface UploadPastPaperQuestionEditorProps {
  question: UploadPastPaperQuestion;
  index: number;
  chapters: Chapter[];
  isExpanded: boolean;
  isUploadingImage: boolean;
  onToggleExpanded: (index: number) => void;
  onUpdate: (index: number, updates: Partial<UploadPastPaperQuestion>) => void;
  onRemove: (index: number) => void;
  onSave: (index: number) => void;
  onUploadImage: (index: number, file: File) => void;
}

function UploadPastPaperQuestionEditorComponent({
  question,
  index,
  chapters,
  isExpanded,
  isUploadingImage,
  onToggleExpanded,
  onUpdate,
  onRemove,
  onSave,
  onUploadImage,
}: UploadPastPaperQuestionEditorProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card transition-all",
        { "border-primary/30 bg-primary/5": question.isSaved },
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted"
        onClick={() => onToggleExpanded(index)}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          {question.questionType}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground">
            Q{question.questionNumber}
            {question.questionPart ? ` (${question.questionPart})` : ""}
          </span>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <span className="truncate text-xs text-muted-foreground">
            {question.questionText.substring(0, 80)}
            {question.questionText.length > 80 ? "..." : ""}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {question.isSaved ? (
            <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary">
              <CheckCircle2 className="size-2.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Saved</span>
            </div>
          ) : null}
          {question.confidence !== undefined ? (
            <span
              className={cn("rounded-full px-2 py-0.5 text-xs", {
                "bg-primary/10 text-primary": question.confidence >= 0.8,
                "bg-muted text-muted-foreground":
                  question.confidence >= 0.5 && question.confidence < 0.8,
                "bg-destructive/10 text-destructive": question.confidence < 0.5,
              })}
            >
              {Math.round(question.confidence * 100)}% match
            </span>
          ) : null}
          <span className="text-xs font-medium text-muted-foreground">
            {question.marks} mark{question.marks !== 1 ? "s" : ""}
          </span>
          {isExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded ? (
        <div className="space-y-10 border-t border-border p-6 sm:p-8">
          <section className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Question Image
            </p>
            <div className="grid items-start gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label
                  className={cn(
                    "group/image flex h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/30 hover:bg-muted/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary",
                    { "cursor-wait opacity-50": isUploadingImage },
                  )}
                  onPaste={async (event) => {
                    const pastedFile = getFileFromPaste(event);
                    if (pastedFile) {
                      await onUploadImage(index, pastedFile);
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onDrop={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const droppedFile = getFileFromDrop(event);
                    if (droppedFile) {
                      await onUploadImage(index, droppedFile);
                    }
                  }}
                  tabIndex={0}
                >
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover/image:scale-105">
                        <ImageIcon className="size-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Attach illustration
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        onUploadImage(index, file);
                      }
                    }}
                    disabled={isUploadingImage}
                  />
                </label>
                <p className="px-1 text-[10px] text-muted-foreground">
                  JPEG, PNG or SVG. Max 5MB.
                </p>
              </div>
              {question.imageUrl ? (
                <div className="group/preview relative aspect-video overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                  <img
                    src={question.imageUrl}
                    alt="Question illustration"
                    className="size-full object-contain p-4"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 transition-opacity group-hover/preview:opacity-100">
                    <button
                      type="button"
                      onClick={() => onUpdate(index, { imageUrl: null })}
                      className="rounded-xl bg-destructive px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive-foreground"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <ScientificTextEditor
              label="Question Text"
              value={question.questionText}
              onChange={(value) => onUpdate(index, { questionText: value })}
              minRows={6}
            />
            {question.imageUrl ? (
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  With illustration
                </p>
                <QuestionFormatter text={question.questionText} className="text-base font-semibold" />
                <img
                  src={question.imageUrl}
                  alt="Question preview"
                  className="mt-4 h-24 object-contain opacity-80"
                />
              </div>
            ) : null}
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <AppLabel>Question Type</AppLabel>
              <AppDropdown
                value={question.questionType}
                onChange={(event) =>
                  onUpdate(index, {
                    questionType: event.target.value as "MCQ" | "CRQ" | "ERQ",
                  })
                }
                options={[
                  { label: "Paper I: MCQ", value: "MCQ" },
                  { label: "Paper II: CRQ", value: "CRQ" },
                  { label: "Paper II: ERQ", value: "ERQ" },
                ]}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <AppLabel>Chapter</AppLabel>
              <AppDropdown
                value={question.chapterId || ""}
                onChange={(event) => {
                  const chapterId = event.target.value;
                  const selectedChapter = chapters.find((chapter) => chapter.id === chapterId);
                  onUpdate(index, {
                    chapterId: chapterId || null,
                    chapterName: selectedChapter?.chapterName || null,
                  });
                }}
                options={[
                  { label: "Unmapped", value: "" },
                  ...chapters.map((chapter) => ({
                    label: chapter.chapterName,
                    value: chapter.id,
                  })),
                ]}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <AppLabel>Marks</AppLabel>
              <AppInput
                type="number"
                value={String(question.marks)}
                onChange={(event) =>
                  onUpdate(index, {
                    marks: Math.max(1, parseInt(event.target.value, 10) || 1),
                  })
                }
                min={1}
                className="h-12 rounded-xl"
              />
            </div>
          </section>

          {question.questionType === "MCQ" ? (
            <section className="space-y-4 border-t border-border pt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                MCQ Options
              </p>
              <MCQOptionsEditor
                name={`correctAnswer-${index}`}
                options={question.mcqOptions || []}
                correctAnswer={question.correctAnswer || null}
                onOptionsChange={(options) => onUpdate(index, { mcqOptions: options })}
                onCorrectAnswerChange={(answerId) =>
                  onUpdate(index, { correctAnswer: answerId })
                }
                onRemoveOption={(optionId) =>
                  onUpdate(index, {
                    mcqOptions: (question.mcqOptions || []).filter(
                      (option) => option.id !== optionId,
                    ),
                  })
                }
                onAddOption={() =>
                  onUpdate(index, {
                    mcqOptions: [
                      ...(question.mcqOptions || []),
                      {
                        id: String.fromCharCode(65 + (question.mcqOptions?.length || 0)),
                        text: "",
                      },
                    ],
                  })
                }
              />
            </section>
          ) : null}

          {question.questionType !== "MCQ" ? (
            <section className="space-y-6 border-t border-border pt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Model Answers
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <AppLabel className="text-primary">Ideal response</AppLabel>
                    <CheckCircle2 className="size-4 text-primary" />
                  </div>
                  <ScientificTextEditor
                    value={question.paperIIData?.betterResponse || ""}
                    onChange={(value) =>
                      onUpdate(index, {
                        paperIIData: {
                          weakerResponse: question.paperIIData?.weakerResponse || "",
                          betterResponse: value,
                          type: question.questionType,
                        },
                      })
                    }
                    minRows={5}
                    showPreview
                    placeholder="Paste the ideal student response..."
                  />
                </div>
                <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center justify-between">
                    <AppLabel className="text-destructive">Weaker response</AppLabel>
                    <AlertCircle className="size-4 text-destructive" />
                  </div>
                  <ScientificTextEditor
                    value={question.paperIIData?.weakerResponse || ""}
                    onChange={(value) =>
                      onUpdate(index, {
                        paperIIData: {
                          betterResponse: question.paperIIData?.betterResponse || "",
                          weakerResponse: value,
                          type: question.questionType,
                        },
                      })
                    }
                    minRows={5}
                    showPreview
                    placeholder="Paste a common weaker or incorrect response..."
                  />
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
            <AppButton onClick={() => onSave(index)} className="h-11 px-6">
              <CheckCircle2 className="mr-2 size-4" />
              Save Question
            </AppButton>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="flex h-11 items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-5 text-xs font-bold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <DeleteSVG className="size-4" />
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const UploadPastPaperQuestionEditor = memo(UploadPastPaperQuestionEditorComponent);
export default UploadPastPaperQuestionEditor;
