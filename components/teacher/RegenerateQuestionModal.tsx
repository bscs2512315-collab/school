"use client";

import { useState, useId } from "react";
import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Copy,
  Zap,
  Lightbulb,
  Calculator,
  Shuffle,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import AppTextarea from "@/components/AppTextarea";
import AppSelect from "@/components/AppSelect";
import { API_ENDPOINTS } from "@/constants/endpoints";
import { apiPost } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import type { GeneratedSloPaperQuestion } from "@/lib/paper/slo-paper-generator";

interface RegenerateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: GeneratedSloPaperQuestion | null;
  allQuestions: GeneratedSloPaperQuestion[];
  paperType: "1" | "2";
  subject?: string;
  classLevel?: string;
  board?: string;
  onQuestionRegenerated: (newQuestion: GeneratedSloPaperQuestion) => void;
}

const PRESET_CHIPS = [
  {
    label: "Make it harder",
    icon: Zap,
    prompt: "Make this question harder and more challenging with deep conceptual reasoning.",
  },
  {
    label: "Make it conceptual",
    icon: Lightbulb,
    prompt: "Make this question test underlying concepts rather than direct memory/recall.",
  },
  {
    label: "Numerical / Calculation",
    icon: Calculator,
    prompt: "Change into a numerical problem with realistic values and multi-step calculations.",
  },
  {
    label: "Different subtopic in chapter",
    icon: Shuffle,
    prompt: "Test a different subtopic or concept within the same chapter.",
  },
  {
    label: "Replace duplicate",
    icon: Copy,
    prompt: "Regenerate because this question is too similar to another question in the paper.",
  },
];

export default function RegenerateQuestionModal({
  isOpen,
  onClose,
  question,
  allQuestions,
  paperType,
  subject,
  classLevel,
  board,
  onQuestionRegenerated,
}: RegenerateQuestionModalProps) {
  const [instruction, setInstruction] = useState("");
  const [difficulty, setDifficulty] = useState<"Alpha" | "Beta" | "Gamma">("Beta");
  const [duplicateTargetId, setDuplicateTargetId] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const headingId = useId();

  if (!isOpen || !question) return null;

  const otherQuestions = allQuestions.filter((q) => q.id !== question.id);

  const handleSelectDuplicateQuestion = (targetId: string) => {
    setDuplicateTargetId(targetId);
    if (!targetId) return;

    const target = allQuestions.find((q) => q.id === targetId);
    if (!target) return;

    const snippet = target.questionText.length > 80
      ? `${target.questionText.slice(0, 80)}...`
      : target.questionText;

    const duplicatePrompt = `Regenerate it because it is similar to Q${target.questionNumber} ("${snippet}"). Please create a completely distinct question testing a different concept.`;

    setInstruction(duplicatePrompt);
  };

  const handleApplyPreset = (promptText: string) => {
    setInstruction((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return promptText;
      if (trimmed.includes(promptText)) return prev;
      return `${trimmed}\n${promptText}`;
    });
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const toastId = toast.loading(`Regenerating Question ${question.questionNumber} with AI...`);

    try {
      const excludeTexts = otherQuestions.map((q) => q.questionText);

      const res = await apiPost<{ question: GeneratedSloPaperQuestion }>(
        API_ENDPOINTS.TEACHER.PAPERS,
        {
          action: "regenerate_question",
          question,
          paperType,
          subject: subject || "General",
          classLevel: classLevel || "IX",
          board: board || "AKUEB",
          chapterName: question.chapterName || subject,
          instruction: instruction.trim(),
          difficulty,
          excludeQuestionTexts: excludeTexts,
        },
      );

      if (!res.success || !res.data?.question) {
        throw new Error(res.message || "Failed to regenerate question");
      }

      onQuestionRegenerated(res.data.question);
      toast.success(`Question ${question.questionNumber} regenerated successfully!`, {
        id: toastId,
      });
      onClose();
    } catch (err: unknown) {
      console.error("Question regeneration error:", err);
      const msg = err instanceof Error ? err.message : "Failed to regenerate question";
      toast.error(msg, { id: toastId });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div
        role="dialog"
        aria-labelledby={headingId}
        aria-modal="true"
        className="relative w-full max-w-xl max-h-[92vh] rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 bg-linear-to-r from-primary/10 via-primary/5 to-card shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
                <Sparkles className="size-3.5" />
                AI Question Assistant
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                Q{question.questionNumber} · {paperType === "2" ? "Paper II" : "Paper I"}
              </span>
            </div>
            <h2 id={headingId} className="text-lg sm:text-xl font-black text-foreground truncate">
              Regenerate Question {question.questionNumber}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ask AI to generate a fresh replacement question, tweak difficulty, or avoid duplicates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRegenerating}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* Target Question Preview Card */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>CURRENT STATEMENT:</span>
              <span className="text-primary">{question.marks} Mark{question.marks === 1 ? "" : "s"}</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed line-clamp-3">
              {question.questionText}
            </p>
            {question.chapterName && (
              <p className="text-[11px] text-muted-foreground">
                Topic: <span className="font-semibold text-foreground">{question.chapterName}</span>
                {question.sloNumber ? ` · SLO ${question.sloNumber}` : ""}
              </p>
            )}
          </div>

          {/* Quick Preset Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Quick Prompt Presets:</span>
              <span className="text-[10px] lowercase font-normal text-muted-foreground">Click to add to prompt</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleApplyPreset(chip.prompt)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer active:scale-95"
                  >
                    <Icon className="size-3 text-primary" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duplicate Question Selector (if teacher wants to specify another question) */}
          {otherQuestions.length > 0 && (
            <div className="space-y-1.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>Is this question similar to another question?</span>
              </div>
              <div className="pt-1">
                <AppSelect
                  value={duplicateTargetId}
                  onChange={(e) => handleSelectDuplicateQuestion(e.target.value)}
                  options={[
                    { value: "", label: "Select duplicate question to differentiate from (optional)..." },
                    ...otherQuestions.map((q) => ({
                      value: q.id,
                      label: `Q${q.questionNumber}: ${q.questionText.slice(0, 60)}...`,
                    })),
                  ]}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Custom Instruction Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Custom Instructions for AI:
              </label>
              {instruction && (
                <button
                  type="button"
                  onClick={() => setInstruction("")}
                  className="text-[11px] font-semibold text-destructive hover:underline cursor-pointer"
                >
                  Clear prompt
                </button>
              )}
            </div>
            <AppTextarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. 'Regenerate it because it is similar to Q14', 'Make it a numerical calculation', 'Change the context to real-life application', 'Make choices trickier'..."
              rows={3}
              className="rounded-2xl text-xs sm:text-sm resize-y"
            />
            <p className="text-[11px] text-muted-foreground">
              You can leave this blank for a fresh automatic replacement, or describe any exact changes you want.
            </p>
          </div>

          {/* Difficulty Tier */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Difficulty Rigor:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "Alpha" as const, title: "Alpha", desc: "Easy / Recall" },
                { id: "Beta" as const, title: "Beta", desc: "Balanced" },
                { id: "Gamma" as const, title: "Gamma", desc: "Hard / Rigor" },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setDifficulty(tier.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                    difficulty === tier.id
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span className="text-xs font-bold">{tier.title}</span>
                  <span className="text-[10px] text-muted-foreground">{tier.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 bg-card shrink-0">
          <AppButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isRegenerating}
            className="rounded-xl h-10 text-xs justify-center"
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="rounded-xl h-10 text-xs font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 justify-center"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 mr-1.5" />
                Regenerate Question
              </>
            )}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
