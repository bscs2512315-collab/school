"use client";

import type { ReactNode } from "react";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";
import { cn } from "@/lib/utils";
import {
  useExamAntiCheat,
  type ExamIntegrityReason,
} from "@/hooks/exam/useExamAntiCheat";
import ExamCanaryWatermark from "@/components/exam/ExamCanaryWatermark";

interface ExamAntiCheatShellProps {
  enabled: boolean;
  /** When false, tab switching or window blur does NOT auto-submit exam. Defaults to true. */
  strictMode?: boolean;
  /** When true, leaving or closing saves progress and allows recontinuing. */
  allowResume?: boolean;
  onLeaveExam: (reason: ExamIntegrityReason) => void;
  onSaveProgress?: () => void;
  children: ReactNode;
  className?: string;
  /** Hide the top secure-exam banner */
  hideBanner?: boolean;
  /** Optional student name or roll number for forensic watermarking */
  watermarkIdentifier?: string;
  /** Set to true to disable the background canary watermark */
  hideWatermark?: boolean;
}

/** Wraps an active exam attempt with leave-tab auto-quit and adversarial AI canary watermarking. */
export default function ExamAntiCheatShell({
  enabled,
  strictMode = true,
  allowResume = false,
  onLeaveExam,
  onSaveProgress,
  children,
  className,
  watermarkIdentifier,
  hideWatermark = false,
}: ExamAntiCheatShellProps) {
  useExamAntiCheat({
    enabled,
    strictMode,
    allowResume,
    onLeaveExam,
    onSaveProgress,
  });

  return (
    <div
      className={cn(
        "exam-secure relative flex h-full min-h-0 flex-1 flex-col select-text overflow-hidden",
        className,
      )}
    >
      {enabled && !hideWatermark && (
        <ExamCanaryWatermark studentIdentifier={watermarkIdentifier} />
      )}
      <div className="relative z-[2] flex h-full min-h-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}

