"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AddSVG from "@/public/svgs/AddSVG";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppLabel from "@/components/AppLabel";
import ScientificTextEditor from "@/components/editor/ScientificTextEditor";
import ScientificTextPreview from "@/components/editor/ScientificTextPreview";
import { cn } from "@/lib/utils";
import type { CustomQuiz, CustomQuizPayload, CustomQuizQuestion } from "@/types/custom-quiz";

const MAX_QUESTIONS = 50;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeEmptyQuestion(): CustomQuizQuestion {
  const options = [
    { id: makeId("opt"), text: "" },
    { id: makeId("opt"), text: "" },
    { id: makeId("opt"), text: "" },
    { id: makeId("opt"), text: "" },
  ];
  return {
    id: makeId("q"),
    text: "",
    options,
    correctOptionId: options[0].id,
    explanation: "",
  };
}

interface CustomQuizBuilderProps {
  initialQuiz?: CustomQuiz;
  /** Pre-seed questions (e.g. from the paste-text flow). */
  initialQuestions?: CustomQuizQuestion[];
  initialTitle?: string;
  initialSubject?: string;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (payload: CustomQuizPayload) => void;
  onCancel: () => void;
}

export default function CustomQuizBuilder({
  initialQuiz,
  initialQuestions,
  initialTitle,
  initialSubject,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: CustomQuizBuilderProps) {
  const [title, setTitle] = useState(initialQuiz?.title ?? initialTitle ?? "");
  const [description, setDescription] = useState(initialQuiz?.description ?? "");
  const [subject, setSubject] = useState(initialQuiz?.subject ?? initialSubject ?? "");
  const [questions, setQuestions] = useState<CustomQuizQuestion[]>(() => {
    const seed = initialQuiz?.questions ?? initialQuestions;
    return seed?.length
      ? seed.map((question) => ({ ...question, explanation: question.explanation ?? "" }))
      : [makeEmptyQuestion()];
  });

  const updateQuestion = (id: string, patch: Partial<CustomQuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    );
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      toast.error(`A quiz can have at most ${MAX_QUESTIONS} questions`);
      return;
    }
    setQuestions((prev) => [...prev, makeEmptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, text } : option,
              ),
            }
          : question,
      ),
    );
  };

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId || question.options.length >= MAX_OPTIONS) {
          return question;
        }
        return { ...question, options: [...question.options, { id: makeId("opt"), text: "" }] };
      }),
    );
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId || question.options.length <= MIN_OPTIONS) {
          return question;
        }
        const options = question.options.filter((option) => option.id !== optionId);
        return {
          ...question,
          options,
          correctOptionId:
            question.correctOptionId === optionId ? options[0].id : question.correctOptionId,
        };
      }),
    );
  };

  const validate = (): CustomQuizPayload | null => {
    if (!title.trim()) {
      toast.error("Give your quiz a title");
      return null;
    }
    if (questions.length === 0) {
      toast.error("Add at least one question");
      return null;
    }
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (!question.text.trim()) {
        toast.error(`Question ${index + 1}: write the question text`);
        return null;
      }
      const emptyOption = question.options.findIndex((option) => !option.text.trim());
      if (emptyOption !== -1) {
        toast.error(`Question ${index + 1}: fill in option ${OPTION_LETTERS[emptyOption]}`);
        return null;
      }
      if (!question.options.some((option) => option.id === question.correctOptionId)) {
        toast.error(`Question ${index + 1}: mark the correct answer`);
        return null;
      }
    }
    return {
      title: title.trim(),
      description: description.trim() || undefined,
      subject: subject.trim() || undefined,
      questions: questions.map((question) => ({
        id: question.id,
        text: question.text.trim(),
        options: question.options.map((option) => ({ id: option.id, text: option.text.trim() })),
        correctOptionId: question.correctOptionId,
        explanation: question.explanation?.trim() || undefined,
      })),
    };
  };

  const handleSubmit = () => {
    const payload = validate();
    if (payload) onSubmit(payload);
  };

  return (
    <div className="w-full space-y-6">
      {/* Quiz details */}
      <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <h2 className="mb-1 text-lg font-bold text-foreground">Quiz Details</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Name your quiz and add an optional description so you remember what it covers.
        </p>
        <div className="space-y-5">
          <div>
            <AppLabel htmlFor="quiz-title" required>
              Title
            </AppLabel>
            <AppInput
              id="quiz-title"
              value={title}
              maxLength={150}
              placeholder="e.g. Chapter 4 – Chemical Bonding revision"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <AppLabel htmlFor="quiz-description">Description (optional)</AppLabel>
            <AppInput
              id="quiz-description"
              value={description}
              maxLength={500}
              placeholder="What is this quiz about?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <AppLabel htmlFor="quiz-subject">Subject (optional)</AppLabel>
            <AppInput
              id="quiz-subject"
              value={subject}
              maxLength={60}
              placeholder="e.g. Chemistry"
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      {questions.map((question, index) => (
        <div
          key={question.id}
          className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                {index + 1}
              </span>
              <h3 className="text-base font-bold text-foreground">Question {index + 1}</h3>
            </div>
            {questions.length > 1 ? (
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <DeleteSVG className="size-3.5" />
                Remove
              </button>
            ) : null}
          </div>

          <div className="space-y-6">
            <ScientificTextEditor
              label="Question"
              value={question.text}
              onChange={(value) => updateQuestion(question.id, { text: value })}
              placeholder="Type your question. Use the toolbar for sub/superscripts, math & chemistry symbols…"
              minRows={3}
            />

            <div>
              <AppLabel className="mb-3">
                Options{" "}
                <span className="ml-1 font-normal text-muted-foreground">
                  (tap the letter to mark the correct answer)
                </span>
              </AppLabel>
              <div className="space-y-4">
                {question.options.map((option, optionIndex) => {
                  const isCorrect = question.correctOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "rounded-2xl border p-3 transition-colors sm:p-4",
                        isCorrect ? "border-primary/60 bg-primary/5" : "border-border",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          title={isCorrect ? "Correct answer" : "Mark as correct answer"}
                          onClick={() =>
                            updateQuestion(question.id, { correctOptionId: option.id })
                          }
                          className={cn(
                            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition-all",
                            isCorrect
                              ? "border-primary bg-primary text-background shadow-md shadow-primary/25"
                              : "border-input text-muted-foreground hover:border-primary/50 hover:text-primary",
                          )}
                        >
                          {isCorrect ? (
                            <Check className="size-4" />
                          ) : (
                            OPTION_LETTERS[optionIndex]
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <ScientificTextEditor
                            value={option.text}
                            onChange={(value) => updateOptionText(question.id, option.id, value)}
                            placeholder={`Option ${OPTION_LETTERS[optionIndex]}`}
                            minRows={1}
                            showPreview={false}
                            showHint={false}
                          />
                          {option.text.trim() ? (
                            <div className="mt-2 rounded-lg bg-muted/40 px-3 py-1.5">
                              <ScientificTextPreview text={option.text} className="text-sm" />
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(question.id, option.id)}
                          disabled={question.options.length <= MIN_OPTIONS}
                          aria-label="Remove option"
                          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {question.options.length < MAX_OPTIONS ? (
                <button
                  type="button"
                  onClick={() => addOption(question.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-75"
                >
                  <AddSVG className="size-3.5" />
                  Add option
                </button>
              ) : null}
            </div>

            <div>
              <AppLabel htmlFor={`explanation-${question.id}`}>Explanation (optional)</AppLabel>
              <AppInput
                id={`explanation-${question.id}`}
                value={question.explanation ?? ""}
                maxLength={1000}
                placeholder="Shown after solving to explain the correct answer"
                onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add question */}
      <button
        type="button"
        onClick={addQuestion}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary/30 py-5 text-sm font-bold text-primary transition-all hover:border-primary/60 hover:bg-primary/5"
      >
        <AddSVG className="size-4" />
        Add Question
      </button>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <AppButton variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </AppButton>
        <AppButton onClick={handleSubmit} disabled={isSubmitting} className="sm:min-w-44">
          {isSubmitting ? "Saving…" : submitLabel}
        </AppButton>
      </div>
    </div>
  );
}
