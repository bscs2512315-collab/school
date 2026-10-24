"use client";

import AddSVG from "@/public/svgs/AddSVG";

import { memo } from "react";
import { X } from "lucide-react";
import AppButton from "@/components/AppButton";
import ScientificTextEditor from "@/components/editor/ScientificTextEditor";
import { cn } from "@/lib/utils";

interface MCQOption {
  id: string;
  text: string;
}

interface MCQOptionsEditorProps {
  options: MCQOption[];
  correctAnswer: string | null;
  onOptionsChange: (options: MCQOption[]) => void;
  onCorrectAnswerChange: (answerId: string) => void;
  onRemoveOption: (optionId: string) => void;
  onAddOption: () => void;
  minOptions?: number;
  name?: string;
}

function MCQOptionsEditorComponent({
  options,
  correctAnswer,
  onOptionsChange,
  onCorrectAnswerChange,
  onRemoveOption,
  onAddOption,
  minOptions = 2,
  name = "correctAnswer",
}: MCQOptionsEditorProps) {
  const updateOption = (optionId: string, text: string) => {
    onOptionsChange(
      options.map((option) => (option.id === optionId ? { ...option, text } : option)),
    );
  };

  return (
    <div className="space-y-6">
      {options.map((option, index) => (
        <div
          key={option.id}
          className={cn(
            "rounded-2xl border border-border bg-card p-4",
            { "border-primary/30": correctAnswer === option.id },
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              Option {String.fromCharCode(65 + index)}
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="radio"
                  name={name}
                  checked={correctAnswer === option.id}
                  onChange={() => onCorrectAnswerChange(option.id)}
                  className="size-4 text-primary"
                />
                Correct
              </label>
              {options.length > minOptions ? (
                <button
                  type="button"
                  onClick={() => onRemoveOption(option.id)}
                  className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
          <ScientificTextEditor
            value={option.text}
            onChange={(text) => updateOption(option.id, text)}
            placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
            minRows={3}
            showPreview
            showHint={false}
          />
        </div>
      ))}
      <AppButton type="button" variant="secondary" size="sm" onClick={onAddOption}>
        <AddSVG className="mr-2 size-4" />
        Add Option
      </AppButton>
    </div>
  );
}

const MCQOptionsEditor = memo(MCQOptionsEditorComponent);
export default MCQOptionsEditor;
