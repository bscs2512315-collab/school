"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ClipboardPaste, Sparkles, Wand2, X } from "lucide-react";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import { Typography } from "@/components/ui/Typography";
import { Textarea } from "@/components/ui/textarea";
import { parseQuizText, PASTE_QUIZ_EXAMPLE } from "@/lib/custom-quiz-parser";
import type { CustomQuizQuestion } from "@/types/custom-quiz";

interface PasteQuizModalProps {
  open: boolean;
  onClose: () => void;
  onParsed: (questions: CustomQuizQuestion[]) => void;
}

export default function PasteQuizModal({ open, onClose, onParsed }: PasteQuizModalProps) {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // Reset state whenever the modal is re-opened.
  useEffect(() => {
    if (open) {
      setText("");
      setErrors([]);
    }
  }, [open]);

  if (!open) return null;

  const handleGenerate = () => {
    const { questions, errors: parseErrors } = parseQuizText(text);

    if (questions.length === 0) {
      setErrors(
        parseErrors.length > 0
          ? parseErrors
          : ["No questions found. Check the format and try again."],
      );
      return;
    }

    // Surface non-fatal errors (e.g. one bad block) but still import the rest.
    onParsed(questions);
    toast.success(
      `Added ${questions.length} question${questions.length === 1 ? "" : "s"}`,
    );
    if (parseErrors.length > 0) {
      toast(`${parseErrors.length} block${parseErrors.length === 1 ? "" : "s"} skipped`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-4xl border-0 bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 transition-colors hover:bg-muted"
        >
          <X className="size-5 text-muted-foreground" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <Wand2 className="size-6 text-primary" />
          </div>
          <div className="min-w-0">
            <Typography variant="h2" className="text-lg font-black text-foreground sm:text-xl">
              Paste &amp; Generate
            </Typography>
            <p className="text-sm text-muted-foreground">
              Turn pasted text into ready-made questions.
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Your questions
            </p>
            <button
              type="button"
              onClick={() => {
                setText(PASTE_QUIZ_EXAMPLE);
                setErrors([]);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-primary/80"
            >
              <Sparkles className="size-3.5" />
              Load example
            </button>
          </div>

          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (errors.length > 0) setErrors([]);
            }}
            placeholder={PASTE_QUIZ_EXAMPLE}
            className="min-h-52 flex-1 rounded-2xl font-mono text-sm leading-relaxed"
          />

          <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-bold text-foreground">Format tips</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Start each question with a number or plain text.</li>
              <li>
                Options begin with <code className="font-mono">A-</code>,{" "}
                <code className="font-mono">B)</code>, <code className="font-mono">C.</code> …
              </li>
              <li>
                Mark the answer with a line like{" "}
                <code className="font-mono">Correct Option: D</code>.
              </li>
              <li>
                Add an optional <code className="font-mono">Explanation:</code> line.
              </li>
            </ul>
          </div>

          {errors.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-destructive">
                <AlertCircle className="size-3.5" />
                Couldn&apos;t generate questions
              </div>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-destructive/90">
                {errors.slice(0, 6).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 6 ? <li>…and {errors.length - 6} more</li> : null}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex gap-3">
          <AppButton
            variant="outline"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl font-bold"
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="h-12 flex-1 rounded-2xl font-bold"
          >
            <ClipboardPaste className="size-4" />
            Generate
          </AppButton>
        </div>
      </div>
    </div>
  );
}
