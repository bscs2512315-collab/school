"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import GenerateSVG from "@/public/svgs/GenerateSVG";
import EditSVG from "@/public/svgs/EditSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import {
  GenerateSectionDivider,
  GenerateStepShell,
} from "@/components/generate/GeneratePaperUI";
import GenerateCustomInputs, {
  type CustomUploadedImage,
} from "@/components/generate/GenerateCustomInputs";
import ManualQuestionBuilder, {
  type ManualQuestionItem,
  createEmptyManualQuestion,
} from "@/components/custom-quiz/ManualQuestionBuilder";
import { apiPost } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";

interface StepLightningSettingsProps {
  subject: string;
  selectedChapterIds: string[];
  chaptersCount?: number;
  userClass?: string;
  userBoard?: string;
  userId?: string;
  onBack: () => void;
}

export default function StepLightningSettings({
  subject,
  selectedChapterIds,
  userClass = "IX",
  userBoard = "AKUEB",
  userId,
  onBack,
}: StepLightningSettingsProps) {
  const router = useRouter();
  const [lightningSource, setLightningSource] = useState<
    "past_papers" | "slos" | "custom_ai" | "manual"
  >("past_papers");
  const [lightningTimer, setLightningTimer] = useState<number>(20);
  const [isCustomTimer, setIsCustomTimer] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customImages, setCustomImages] = useState<CustomUploadedImage[]>([]);
  const [manualQuestions, setManualQuestions] = useState<ManualQuestionItem[]>([
    createEmptyManualQuestion(1),
  ]);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    if (lightningSource === "manual") {
      const invalid = manualQuestions.some(
        (q) => !q.questionText.trim() || q.options.some((o) => !o.text.trim()),
      );
      if (invalid) {
        toast.error("Please fill in all manual questions and options");
        return;
      }
    } else if (lightningSource === "custom_ai") {
      if (customImages.length === 0 && !customPrompt.trim()) {
        toast.error("Provide an AI prompt or reference image for question generation");
        return;
      }
    } else {
      if (selectedChapterIds.length === 0) {
        toast.error("Please select at least one chapter");
        return;
      }
    }

    setIsLaunching(true);
    const toastId = toast.loading("Launching live Lightning Round lobby...");

    try {
      const res = await apiPost<{
        sessionId: string;
        pinCode: string;
      }>("/lightning/create", {
        userId,
        title: `${subject} Lightning Round`,
        subject,
        classLevel: userClass,
        board: userBoard,
        sourceMode: lightningSource,
        perQuestionSeconds: lightningTimer,
        chapterIds: selectedChapterIds,
        prompt: customPrompt,
        imageUrls: customImages.map((img) => img.fileUrl),
        manualQuestions: lightningSource === "manual" ? manualQuestions : undefined,
        questionCount: lightningSource === "manual" ? manualQuestions.length : questionCount,
      });

      if (!res.success || !res.data?.sessionId) {
        throw new Error(res.message || "Failed to create Lightning Round");
      }

      toast.success("Lightning Round lobby created!", { id: toastId });
      router.push(`/student/lightning/${res.data.sessionId}`);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj?.message || "Failed to launch Lightning Round", { id: toastId });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <GenerateStepShell>
      {/* 1. Round Recap */}
      <GenerateSectionDivider label="1. Selected Subject &amp; Chapters" />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Zap className="size-5 fill-current" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-foreground">
              {subject}
            </span>
            <p className="text-[11px] text-muted-foreground">
              {selectedChapterIds.length > 0
                ? `${selectedChapterIds.length} Chapter${selectedChapterIds.length > 1 ? "s" : ""} selected for competition`
                : "No chapters selected"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          Change Chapters
        </button>
      </div>

      {/* 2. Question Generation Source */}
      <GenerateSectionDivider label="2. Question Generation Source" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            id: "past_papers" as const,
            title: "Past Papers",
            desc: "Official Exam Bank",
            icon: BookOpenSVG,
          },
          {
            id: "slos" as const,
            title: "SLO's AI",
            desc: "Syllabus Aligned",
            icon: BookOpenSVG,
          },
          {
            id: "custom_ai" as const,
            title: "Custom AI",
            desc: "Prompt / Notes",
            icon: GenerateSVG,
          },
          {
            id: "manual" as const,
            title: "Manual Quiz",
            desc: "Type Questions",
            icon: EditSVG,
          },
        ].map((src) => {
          const isSel = lightningSource === src.id;
          const Icon = src.icon;
          return (
            <button
              key={src.id}
              type="button"
              onClick={() => setLightningSource(src.id)}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border-2 p-3.5 sm:p-4 text-left transition-all",
                isSel
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30 dark:border-emerald-500 dark:ring-emerald-500/25"
                  : "border-border/70 bg-card/60 hover:border-border hover:bg-card/90 dark:border-border dark:bg-card/40 dark:hover:border-emerald-500/40",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl transition-all",
                    isSel
                      ? "bg-primary text-primary-foreground dark:bg-emerald-600 dark:text-white"
                      : "bg-primary/10 text-primary dark:bg-muted dark:text-foreground group-hover:bg-primary/15 dark:group-hover:bg-muted/80",
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
                {isSel ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs">
                    <svg
                      className="size-3 stroke-[3]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="size-4.5 rounded-full border-2 border-slate-300 dark:border-zinc-600 group-hover:border-primary/60 dark:group-hover:border-emerald-400/60 transition-colors" />
                )}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-black text-foreground sm:text-sm">
                  {src.title}
                </span>
                <p className="text-[10px] text-muted-foreground">{src.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Timer & Question Count */}
      <GenerateSectionDivider label="3. Round Timer &amp; Speed Settings" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Countdown Timer */}
        <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground">
              <ClockSVG className="size-4 text-primary" /> Time Per Question
            </label>
            <span className="text-xs font-black text-primary">{lightningTimer}s</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[10, 20, 30].map((sec) => {
              const isSelected = lightningTimer === sec && !isCustomTimer;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setIsCustomTimer(false);
                    setLightningTimer(sec);
                  }}
                  className={cn(
                    "rounded-xl border py-2 text-xs font-black transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {sec}s
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setIsCustomTimer(true);
                if ([10, 20, 30].includes(lightningTimer)) {
                  setLightningTimer(45);
                }
              }}
              className={cn(
                "rounded-xl border py-2 text-xs font-black transition-all",
                isCustomTimer
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
              )}
            >
              Custom
            </button>
          </div>

          {/* Custom Time Stepper & Input Drawer */}
          {isCustomTimer && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/25 bg-card p-2 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={lightningTimer <= 5}
                  onClick={() => setLightningTimer(Math.max(5, lightningTimer - 5))}
                  className="flex size-7.5 items-center justify-center rounded-lg border border-border bg-background text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-foreground active:scale-95 disabled:opacity-40"
                  title="Decrease 5 seconds"
                >
                  -5s
                </button>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={lightningTimer}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setLightningTimer(Math.min(300, Math.max(1, val)));
                      }
                    }}
                    className="h-7.5 w-16 rounded-lg border border-border/80 bg-background px-2 text-center text-xs font-black text-foreground focus:border-primary focus:outline-hidden"
                  />
                  <span className="ml-1 text-xs font-bold text-muted-foreground">sec</span>
                </div>
                <button
                  type="button"
                  disabled={lightningTimer >= 300}
                  onClick={() => setLightningTimer(Math.min(300, lightningTimer + 5))}
                  className="flex size-7.5 items-center justify-center rounded-lg border border-border bg-background text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-foreground active:scale-95 disabled:opacity-40"
                  title="Increase 5 seconds"
                >
                  +5s
                </button>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground pr-1">
                Range: 5s – 300s
              </span>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Faster correct answers award higher bonus points.
          </p>
        </div>

        {/* Question Count (for non-manual) */}
        {lightningSource !== "manual" ? (
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground">
                <Zap className="size-3.5 text-primary" /> Total Questions
              </label>
              <span className="text-xs font-black text-primary">{questionCount} Qs</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={cn(
                    "rounded-xl border py-2 text-xs font-black transition-all",
                    questionCount === num
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {num} Qs
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Fast-paced round with live ranking after each question.
            </p>
          </div>
        ) : null}
      </div>

      {/* 4. Conditional Content (Manual Question Builder or Custom AI Inputs) */}
      {lightningSource === "manual" ? (
        <div className="space-y-3">
          <GenerateSectionDivider label="4. Build Your Questions" />
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-xs">
            <ManualQuestionBuilder
              questions={manualQuestions}
              onChange={setManualQuestions}
              disabled={isLaunching}
            />
          </div>
        </div>
      ) : lightningSource === "custom_ai" ? (
        <div className="space-y-3">
          <GenerateSectionDivider label="4. Custom AI Prompt &amp; Notes" />
          <GenerateCustomInputs
            prompt={customPrompt}
            onPromptChange={setCustomPrompt}
            images={customImages}
            onImagesChange={setCustomImages}
            disabled={isLaunching}
          />
        </div>
      ) : null}

      {/* 5. Navigation Footer with sleek Launch Button */}
      <div className="mt-8 flex w-full flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <button
          type="button"
          onClick={onBack}
          disabled={isLaunching}
          className="flex h-11 items-center justify-center rounded-xl border border-border/80 bg-background px-4 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground">
            Lobby PIN will be generated for friends to join
          </span>

          <AppButton
            type="button"
            disabled={
              isLaunching ||
              (lightningSource !== "manual" && lightningSource !== "custom_ai" && selectedChapterIds.length === 0)
            }
            onClick={handleLaunch}
            className="h-11 gap-2 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-101 active:scale-98"
          >
            {isLaunching ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Launching Lobby...</span>
              </>
            ) : (
              <>
                <Zap className="size-4 fill-current" />
                <span>Launch Lightning Round Lobby</span>
              </>
            )}
          </AppButton>
        </div>
      </div>
    </GenerateStepShell>
  );
}
