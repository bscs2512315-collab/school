"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import EquationToolbox from "@/components/editor/EquationToolbox";
import { convertMathToHTML } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";

export interface ManualOption {
  id: string;
  text: string;
}

export interface ManualQuestionItem {
  id: string;
  questionText: string;
  options: ManualOption[];
  correctOptionId: string; // "A" | "B" | "C" | "D" or option id
  explanation?: string;
  marks?: number;
}

interface ManualQuestionBuilderProps {
  questions: ManualQuestionItem[];
  onChange: (questions: ManualQuestionItem[]) => void;
  disabled?: boolean;
  minQuestions?: number;
  maxQuestions?: number;
}

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export function createEmptyManualQuestion(index = 1): ManualQuestionItem {
  const options = OPTION_LABELS.map((label) => ({
    id: label,
    text: "",
  }));
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    questionText: "",
    options,
    correctOptionId: "A",
    explanation: "",
    marks: 1,
  };
}

interface FocusTarget {
  qIdx: number;
  field: "questionText" | "option" | "explanation";
  optIdx?: number;
  selectionStart: number;
  selectionEnd: number;
  element: HTMLTextAreaElement | HTMLInputElement | null;
}

function applyInsertionToField(
  currentValue: string,
  selectionStart: number,
  selectionEnd: number,
  insertText: string,
  wrapMode?: "superscript" | "subscript" | "fraction" | "sqrt" | "parens",
): { text: string; newCursor: number } {
  const before = currentValue.slice(0, selectionStart);
  const selected = currentValue.slice(selectionStart, selectionEnd);
  const after = currentValue.slice(selectionEnd);

  if (wrapMode === "superscript") {
    const inner = selected || "2";
    const wrapped = `(superscript=${inner})`;
    return { text: `${before}${wrapped}${after}`, newCursor: before.length + wrapped.length };
  }
  if (wrapMode === "subscript") {
    const inner = selected || "2";
    const wrapped = `(subscript=${inner})`;
    return { text: `${before}${wrapped}${after}`, newCursor: before.length + wrapped.length };
  }
  if (wrapMode === "fraction") {
    const num = selected || "a";
    const wrapped = `(${num})/(b)`;
    return { text: `${before}${wrapped}${after}`, newCursor: before.length + wrapped.length };
  }
  if (wrapMode === "sqrt") {
    const inner = selected ? `(${selected})` : "";
    const wrapped = `√${inner}`;
    return { text: `${before}${wrapped}${after}`, newCursor: before.length + wrapped.length };
  }
  if (wrapMode === "parens") {
    const inner = selected || "";
    const wrapped = `(${inner})`;
    return { text: `${before}${wrapped}${after}`, newCursor: before.length + wrapped.length };
  }

  const text = `${before}${insertText}${after}`;
  const newCursor = selectionStart + insertText.length;
  return { text, newCursor };
}

export default function ManualQuestionBuilder({
  questions,
  onChange,
  disabled = false,
  minQuestions = 1,
  maxQuestions = 50,
}: ManualQuestionBuilderProps) {
  // Track active focus target across question cards
  const [activeTarget, setActiveTarget] = useState<FocusTarget | null>(null);
  // Track preview visibility per question
  const [previewOpenMap, setPreviewOpenMap] = useState<Record<number, boolean>>({});

  const handleAddQuestion = () => {
    if (questions.length >= maxQuestions) return;
    onChange([...questions, createEmptyManualQuestion(questions.length + 1)]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= minQuestions) return;
    const updated = questions.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const handleUpdateQuestionText = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], questionText: text };
    onChange(updated);
  };

  const handleUpdateOptionText = (qIdx: number, optIdx: number, text: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIdx].options];
    newOptions[optIdx] = { ...newOptions[optIdx], text };
    updated[qIdx] = { ...updated[qIdx], options: newOptions };
    onChange(updated);
  };

  const handleSelectCorrectOption = (qIdx: number, optId: string) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], correctOptionId: optId };
    onChange(updated);
  };

  const handleUpdateExplanation = (qIdx: number, explanation: string) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], explanation };
    onChange(updated);
  };

  const handleRecordFocus = (
    qIdx: number,
    field: "questionText" | "option" | "explanation",
    e: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>,
    optIdx?: number,
  ) => {
    const el = e.currentTarget;
    setActiveTarget({
      qIdx,
      field,
      optIdx,
      selectionStart: el.selectionStart ?? el.value.length,
      selectionEnd: el.selectionEnd ?? el.value.length,
      element: el,
    });
  };

  const handleInsertEquation = (
    insertText: string,
    wrapMode?: "superscript" | "subscript" | "fraction" | "sqrt" | "parens",
    qIdxForCard?: number,
  ) => {
    // If active target belongs to another question or is null, fallback to the card's questionText
    const target =
      activeTarget && (qIdxForCard === undefined || activeTarget.qIdx === qIdxForCard)
        ? activeTarget
        : {
            qIdx: qIdxForCard ?? 0,
            field: "questionText" as const,
            selectionStart: questions[qIdxForCard ?? 0]?.questionText.length ?? 0,
            selectionEnd: questions[qIdxForCard ?? 0]?.questionText.length ?? 0,
            element: null,
          };

    const targetQIdx = target.qIdx;
    if (!questions[targetQIdx]) return;

    if (target.field === "questionText") {
      const currentVal = questions[targetQIdx].questionText;
      const { text: newVal, newCursor } = applyInsertionToField(
        currentVal,
        target.selectionStart,
        target.selectionEnd,
        insertText,
        wrapMode,
      );
      handleUpdateQuestionText(targetQIdx, newVal);
      // Re-focus and set cursor position
      requestAnimationFrame(() => {
        if (target.element) {
          target.element.focus();
          target.element.setSelectionRange(newCursor, newCursor);
        }
      });
      setActiveTarget({
        ...target,
        selectionStart: newCursor,
        selectionEnd: newCursor,
      });
    } else if (target.field === "option" && target.optIdx !== undefined) {
      const currentVal = questions[targetQIdx].options[target.optIdx]?.text || "";
      const { text: newVal, newCursor } = applyInsertionToField(
        currentVal,
        target.selectionStart,
        target.selectionEnd,
        insertText,
        wrapMode,
      );
      handleUpdateOptionText(targetQIdx, target.optIdx, newVal);
      requestAnimationFrame(() => {
        if (target.element) {
          target.element.focus();
          target.element.setSelectionRange(newCursor, newCursor);
        }
      });
      setActiveTarget({
        ...target,
        selectionStart: newCursor,
        selectionEnd: newCursor,
      });
    } else if (target.field === "explanation") {
      const currentVal = questions[targetQIdx].explanation || "";
      const { text: newVal, newCursor } = applyInsertionToField(
        currentVal,
        target.selectionStart,
        target.selectionEnd,
        insertText,
        wrapMode,
      );
      handleUpdateExplanation(targetQIdx, newVal);
      requestAnimationFrame(() => {
        if (target.element) {
          target.element.focus();
          target.element.setSelectionRange(newCursor, newCursor);
        }
      });
      setActiveTarget({
        ...target,
        selectionStart: newCursor,
        selectionEnd: newCursor,
      });
    }
  };

  const togglePreview = (qIdx: number) => {
    setPreviewOpenMap((prev) => ({
      ...prev,
      [qIdx]: !prev[qIdx],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
            Manual Question Builder ({questions.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Type questions with formulas, math &amp; chemistry notation, set 4 options (A-D), and pick the correct answer.
          </p>
        </div>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddQuestion}
          disabled={disabled || questions.length >= maxQuestions}
          className="self-start gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Plus className="size-4" />
          Add Question
        </AppButton>
      </div>

      <div className="space-y-5">
        {questions.map((q, qIdx) => {
          const isComplete =
            q.questionText.trim().length > 0 &&
            q.options.every((opt) => opt.text.trim().length > 0) &&
            Boolean(q.correctOptionId);

          const isPreviewOpen = Boolean(previewOpenMap[qIdx]);

          const getTargetLabel = () => {
            if (!activeTarget || activeTarget.qIdx !== qIdx) return "Question Statement";
            if (activeTarget.field === "questionText") return "Question Statement";
            if (activeTarget.field === "explanation") return "Explanation";
            if (activeTarget.field === "option" && activeTarget.optIdx !== undefined) {
              return `Option ${OPTION_LABELS[activeTarget.optIdx] || "A"}`;
            }
            return "Question Statement";
          };

          return (
            <div
              key={q.id}
              className={cn(
                "group relative rounded-2xl border bg-card/60 p-4 transition-all sm:p-5 shadow-xs",
                isComplete
                  ? "border-border/80"
                  : "border-primary/40 bg-card/40",
              )}
            >
              {/* Question Header */}
              <div className="mb-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-xs">
                    {qIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    Question {qIdx + 1} of {questions.length}
                  </span>
                  {!isComplete && (
                    <span className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      <AlertCircle className="size-3 text-muted-foreground" /> Incomplete
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {questions.length > minQuestions && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      disabled={disabled}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Delete question"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Math & Chemistry Equation Formatting Toolbar */}
              <div className="mb-3">
                <EquationToolbox
                  onInsert={(text, wrapMode) => handleInsertEquation(text, wrapMode, qIdx)}
                  showPreviewToggle={true}
                  isPreviewOpen={isPreviewOpen}
                  onTogglePreview={() => togglePreview(qIdx)}
                  activeTargetName={getTargetLabel()}
                  size="sm"
                />
              </div>

              {/* Question Statement Textarea */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Question Statement
                </label>
                <textarea
                  rows={3}
                  disabled={disabled}
                  value={q.questionText}
                  onFocus={(e) => handleRecordFocus(qIdx, "questionText", e)}
                  onClick={(e) => handleRecordFocus(qIdx, "questionText", e)}
                  onKeyUp={(e) => handleRecordFocus(qIdx, "questionText", e)}
                  onChange={(e) => {
                    handleUpdateQuestionText(qIdx, e.target.value);
                    handleRecordFocus(qIdx, "questionText", e);
                  }}
                  placeholder="e.g. Which of the following compounds reacts with HCl to form H₂O and NaCl?"
                  className="w-full resize-y rounded-xl border border-input bg-background/80 p-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>

              {/* Options */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    Options (Select the correct option)
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Click radio circle to mark correct answer
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {q.options.map((opt, optIdx) => {
                    const label = OPTION_LABELS[optIdx] || String.fromCharCode(65 + optIdx);
                    const isSelectedCorrect =
                      q.correctOptionId === opt.id || q.correctOptionId === label;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => !disabled && handleSelectCorrectOption(qIdx, opt.id)}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-xl border p-2.5 transition-all cursor-pointer",
                          isSelectedCorrect
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border/60 bg-background/60 hover:border-border",
                        )}
                      >
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCorrectOption(qIdx, opt.id);
                          }}
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                            isSelectedCorrect
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {isSelectedCorrect ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <Circle className="size-4" />
                          )}
                        </button>

                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-black",
                            isSelectedCorrect
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {label}
                        </span>

                        <input
                          type="text"
                          disabled={disabled}
                          value={opt.text}
                          onFocus={(e) => handleRecordFocus(qIdx, "option", e, optIdx)}
                          onClick={(e) => handleRecordFocus(qIdx, "option", e, optIdx)}
                          onKeyUp={(e) => handleRecordFocus(qIdx, "option", e, optIdx)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleUpdateOptionText(qIdx, optIdx, e.target.value);
                            handleRecordFocus(qIdx, "option", e, optIdx);
                          }}
                          placeholder={`Option ${label}`}
                          className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Explanation */}
              <div className="mt-3.5 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Explanation / Rationale (Optional)
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={q.explanation || ""}
                  onFocus={(e) => handleRecordFocus(qIdx, "explanation", e)}
                  onClick={(e) => handleRecordFocus(qIdx, "explanation", e)}
                  onKeyUp={(e) => handleRecordFocus(qIdx, "explanation", e)}
                  onChange={(e) => {
                    handleUpdateExplanation(qIdx, e.target.value);
                    handleRecordFocus(qIdx, "explanation", e);
                  }}
                  placeholder="e.g. NaOH is a strong base that neutralizes HCl to produce water and table salt."
                  className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-hidden"
                />
              </div>

              {/* Live Formatted WYSIWYG Preview Panel */}
              {isPreviewOpen && (
                <div className="mt-4 rounded-xl border border-primary/25 bg-linear-to-br from-primary/5 via-background to-background p-3.5 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary">
                      <Sparkles className="size-3.5" />
                      Live Formatted Question Preview
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Rendering Mathematical &amp; Chemical Notation
                    </span>
                  </div>

                  {/* Question text formatted */}
                  <div className="text-sm font-semibold leading-relaxed text-foreground">
                    {q.questionText.trim() ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: convertMathToHTML(q.questionText),
                        }}
                      />
                    ) : (
                      <span className="italic text-muted-foreground">
                        Type a question statement to see live preview...
                      </span>
                    )}
                  </div>

                  {/* Options formatted */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const label = OPTION_LABELS[optIdx];
                      const isCorrect = q.correctOptionId === opt.id || q.correctOptionId === label;

                      return (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all",
                            isCorrect
                              ? "border-primary/40 bg-primary/10 text-primary font-bold"
                              : "border-border/60 bg-muted/30 text-foreground",
                          )}
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-black shadow-2xs">
                            {label}
                          </span>
                          <div
                            className="flex-1 truncate"
                            dangerouslySetInnerHTML={{
                              __html: opt.text.trim()
                                ? convertMathToHTML(opt.text)
                                : `<span class="italic opacity-50">Empty</span>`,
                            }}
                          />
                          {isCorrect && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-primary">
                              Correct 
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation formatted */}
                  {q.explanation && (
                    <div className="pt-1.5 border-t border-border/40 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">Rationale: </span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: convertMathToHTML(q.explanation),
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <AppButton
          type="button"
          variant="outline"
          onClick={handleAddQuestion}
          disabled={disabled || questions.length >= maxQuestions}
          className="w-full sm:w-auto gap-2 border-dashed border-primary/40 py-2.5 text-primary hover:bg-primary/5 shadow-xs"
        >
          <Plus className="size-4" />
          Add Another Question ({questions.length}/{maxQuestions})
        </AppButton>
      </div>
    </div>
  );
}

