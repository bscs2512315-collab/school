"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import EditSVG from "@/public/svgs/EditSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInput from "@/components/AppInput";
import AppTextarea from "@/components/AppTextarea";
import MCQOptionsEditor from "@/components/MCQOptionsEditor";
import RegenerateQuestionModal from "@/components/teacher/RegenerateQuestionModal";
import TeacherPaperQABugButton from "@/components/qa/TeacherPaperQABugButton";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";

interface Props {
  paperType: "1" | "2";
  questions: GeneratedSloPaperQuestion[];
  onChange: (questions: GeneratedSloPaperQuestion[]) => void;
  subject?: string;
  classLevel?: string;
  board?: string;
}

function normalizeOptions(
  options: GeneratedSloPaperQuestion["mcqOptions"],
): Array<{ id: string; text: string }> {
  if (!Array.isArray(options) || options.length === 0) {
    return [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
    ];
  }
  return options.map((opt, index) => {
    if (opt && typeof opt === "object" && "id" in opt) {
      return { id: String(opt.id), text: String(opt.text ?? "") };
    }
    return {
      id: String.fromCharCode(65 + index),
      text: String(opt ?? ""),
    };
  });
}

export default function TeacherPaperPreviewEditor({
  paperType,
  questions,
  onChange,
  subject,
  classLevel,
  board,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regenerateTargetQuestion, setRegenerateTargetQuestion] = useState<GeneratedSloPaperQuestion | null>(null);

  const updateQuestion = (
    id: string,
    patch: Partial<GeneratedSloPaperQuestion>,
  ) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  };

  const removeQuestion = (id: string) => {
    onChange(
      questions
        .filter((q) => q.id !== id)
        .map((q, index) => ({ ...q, questionNumber: index + 1 })),
    );
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, index) => {
        const isEditing = editingId === q.id;
        const options = normalizeOptions(q.mcqOptions);
        const correct = q.correctAnswer || null;

        return (
          <AppCard
            key={q.id}
            className="space-y-4 rounded-2xl border-border/50 bg-card/40 p-3.5 sm:p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
                <span className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-xs sm:text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="break-words text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {q.questionType}
                    {q.chapterName ? ` · ${q.chapterName}` : ""}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground/50 select-none">·</span>
                  <span className="text-xs font-bold text-primary whitespace-nowrap">
                    {q.marks} mark{q.marks === 1 ? "" : "s"}
                  </span>
                  {q.sloNumber ? (
                    <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-bold text-primary whitespace-nowrap">
                      SLO {q.sloNumber}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto shrink-0">
                <TeacherPaperQABugButton
                  questionId={q.id}
                  questionNumber={index + 1}
                  subject={subject}
                  classLevel={classLevel}
                  board={board}
                  chapterName={q.chapterName}
                  questionText={q.questionText}
                />
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 rounded-xl text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-xs font-semibold px-2.5 sm:px-3"
                  onClick={() => setRegenerateTargetQuestion(q)}
                  title="Regenerate question with AI"
                >
                  <Sparkles className="size-3.5 mr-1 text-primary animate-pulse" />
                  <span className="hidden xs:inline">AI </span>Regenerate
                </AppButton>
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 rounded-xl text-xs px-2.5 sm:px-3"
                  onClick={() => setEditingId(isEditing ? null : q.id)}
                >
                  {isEditing ? (
                    <X className="size-3.5 sm:size-4 mr-1" />
                  ) : (
                    <EditSVG className="size-3.5 sm:size-4 mr-1" />
                  )}
                  {isEditing ? "Close" : "Edit"}
                </AppButton>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Remove question"
                  className="size-8 sm:size-9 p-0 rounded-xl text-destructive hover:bg-destructive/10"
                  onClick={() => removeQuestion(q.id)}
                >
                  <DeleteSVG className="size-4" />
                </AppButton>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Question text
                  </label>
                  <AppTextarea
                    value={q.questionText ?? ""}
                    onChange={(e) =>
                      updateQuestion(q.id, { questionText: e.target.value })
                    }
                    rows={3}
                    className="rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2 sm:max-w-40">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Marks
                  </label>
                  <AppInput
                    type="number"
                    min={1}
                    value={q.marks ?? ""}
                    onChange={(e) =>
                      updateQuestion(q.id, {
                        marks: e.target.value === "" ? 1 : Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2 sm:max-w-40">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    SLO number
                  </label>
                  <AppInput
                    value={q.sloNumber ?? ""}
                    onChange={(e) => updateQuestion(q.id, { sloNumber: e.target.value || null })}
                    placeholder="e.g. 1.2.3"
                    className="h-10 rounded-xl"
                  />
                </div>

                {paperType === "1" ? (
                  <MCQOptionsEditor
                    name={`correct-${q.id}`}
                    options={options}
                    correctAnswer={correct}
                    onOptionsChange={(next) =>
                      updateQuestion(q.id, { mcqOptions: next })
                    }
                    onCorrectAnswerChange={(answerId) =>
                      updateQuestion(q.id, { correctAnswer: answerId })
                    }
                    onRemoveOption={(optionId) =>
                      updateQuestion(q.id, {
                        mcqOptions: options.filter((o) => o.id !== optionId),
                        correctAnswer:
                          correct === optionId ? null : correct,
                      })
                    }
                    onAddOption={() => {
                      const nextId = String.fromCharCode(65 + options.length);
                      updateQuestion(q.id, {
                        mcqOptions: [...options, { id: nextId, text: "" }],
                      });
                    }}
                  />
                ) : (
                  <div className="space-y-3 rounded-2xl bg-muted/30 p-3 sm:p-4">
                    <Typography className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Marking guidance
                    </Typography>
                    {(
                      [
                        ["betterResponse", "Better response"],
                        ["weakerResponse", "Weaker response"],
                        ["markingNotes", "Marking notes"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">
                          {label}
                        </label>
                        <AppTextarea
                          value={q.paperIIData?.[key] ?? ""}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              paperIIData: {
                                ...(q.paperIIData ?? {}),
                                [key]: e.target.value,
                              },
                            })
                          }
                          rows={2}
                          className="min-h-16 rounded-xl bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Typography
                  className="break-words text-sm font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: convertMathToHTML(q.questionText),
                  }}
                />
                {paperType === "1" ? (
                  <div className="grid gap-2">
                    {options.map((opt) => {
                      const isCorrect = correct === opt.id;
                      const isUrduOpt = isUrduText(opt.text);
                      return (
                        <div
                          key={opt.id}
                          dir={isUrduOpt ? "rtl" : "ltr"}
                          className={cn(
                            "flex items-center gap-x-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                            {
                              "border-primary/40 bg-primary/10 text-foreground":
                                isCorrect,
                              "border-border/40 bg-muted/20 text-muted-foreground":
                                !isCorrect,
                            },
                          )}
                        >
                          <span className="font-bold text-primary shrink-0 self-center leading-none">
                            {opt.id}.
                          </span>
                          <span
                            className={cn(
                              "min-w-0 flex-1 break-words self-center",
                              isUrduOpt
                                ? "font-urdu text-right leading-[2.2]"
                                : "text-left leading-normal",
                            )}
                            dangerouslySetInnerHTML={{
                              __html: convertMathToHTML(opt.text),
                            }}
                          />
                          {isCorrect ? (
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary self-center leading-none">
                              <CheckCircleSVG className="size-4" />
                              Answer
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl bg-muted/30 p-3.5 text-xs text-muted-foreground border border-border/60">
                    {q.paperIIData?.betterResponse && (
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground block">✓ Benchmark / Better Response:</span>
                        <div
                          className="break-words pl-2 border-l-2 border-primary/40 leading-relaxed text-foreground/90"
                          dangerouslySetInnerHTML={{
                            __html: convertMathToHTML(q.paperIIData.betterResponse),
                          }}
                        />
                      </div>
                    )}
                    {q.paperIIData?.weakerResponse && (
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground block">⚠ Common Pitfall / Weaker Response:</span>
                        <div
                          className="break-words pl-2 border-l-2 border-amber-500/40 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: convertMathToHTML(q.paperIIData.weakerResponse),
                          }}
                        />
                      </div>
                    )}
                    {q.paperIIData?.markingNotes && (
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground block">📋 Marking Rubrics:</span>
                        <div
                          className="break-words pl-2 border-l-2 border-blue-500/40 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: convertMathToHTML(q.paperIIData.markingNotes),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </AppCard>
        );
      })}

      <RegenerateQuestionModal
        isOpen={Boolean(regenerateTargetQuestion)}
        onClose={() => setRegenerateTargetQuestion(null)}
        question={regenerateTargetQuestion}
        allQuestions={questions}
        paperType={paperType}
        subject={subject}
        classLevel={classLevel}
        board={board}
        onQuestionRegenerated={(newQuestion) => {
          onChange(
            questions.map((q) => (q.id === regenerateTargetQuestion?.id ? newQuestion : q)),
          );
        }}
      />
    </div>
  );
}
