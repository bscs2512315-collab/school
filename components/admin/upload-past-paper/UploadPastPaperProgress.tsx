"use client";

import { CheckCircle2, Database, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadPastPaperStep = "mode" | "upload" | "manual" | "review";

interface UploadPastPaperProgressProps {
  step: UploadPastPaperStep;
  paperNumber: number;
}

const STEPS = [
  { id: "mode", label: "Setup", icon: Database },
  { id: "input", label: "Import", icon: Sparkles },
  { id: "review", label: "Review", icon: CheckCircle2 },
] as const;

function isStepComplete(
  stepId: (typeof STEPS)[number]["id"],
  currentStep: UploadPastPaperStep,
): boolean {
  if (stepId === "mode") return currentStep !== "mode";
  if (stepId === "input") return currentStep === "review";
  return false;
}

function isStepActive(
  stepId: (typeof STEPS)[number]["id"],
  currentStep: UploadPastPaperStep,
): boolean {
  if (stepId === "mode") return currentStep === "mode";
  if (stepId === "input") return currentStep === "upload" || currentStep === "manual";
  return currentStep === "review";
}

export default function UploadPastPaperProgress({
  step,
  paperNumber,
}: UploadPastPaperProgressProps) {
  return (
    <div className="mx-auto mb-10 max-w-3xl">
      <div className="flex items-center justify-between">
        {STEPS.map((item, index) => {
          const complete = isStepComplete(item.id, step);
          const active = isStepActive(item.id, step);
          const Icon = item.id === "input" && paperNumber === 2 ? FileText : item.icon;

          return (
            <div key={item.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl transition-all",
                    {
                      "bg-primary text-primary-foreground shadow-lg shadow-primary/20": active,
                      "bg-primary/10 text-primary": complete && !active,
                      "bg-muted text-muted-foreground": !active && !complete,
                    },
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span
                  className={cn("text-[10px] font-bold uppercase tracking-widest", {
                    "text-primary": active || complete,
                    "text-muted-foreground": !active && !complete,
                  })}
                >
                  {item.label}
                </span>
              </div>

              {index < STEPS.length - 1 ? (
                <div className="mx-3 h-0.5 flex-1 rounded-full bg-border">
                  <div
                    className={cn("h-full rounded-full bg-primary transition-all", {
                      "w-full": complete,
                      "w-0": !complete,
                    })}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
