"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export type ExamIntegrityReason =
  | "tab_hidden"
  | "window_blur"
  | "page_unload"
  | "copy_blocked";

interface UseExamAntiCheatOptions {
  /** When false, listeners are inactive (e.g. result / pending screens). */
  enabled: boolean;
  /**
   * When false, leaving tab or switching windows does NOT end the exam.
   * Defaults to true.
   */
  strictMode?: boolean;
  /**
   * When true, closing tab or leaving does NOT end/fail the attempt;
   * instead progress is saved so student can recontinue.
   */
  allowResume?: boolean;
  /**
   * Called once when the student leaves the exam (tab/app switch or close).
   * Wire this to submit / quit so the attempt ends.
   */
  onLeaveExam: (reason: ExamIntegrityReason) => void;
  /**
   * Called to persist progress when student navigates away or tab blurs/unloads.
   */
  onSaveProgress?: () => void;
  /** Show a toast when the exam is force-ended. Default true. */
  showToast?: boolean;
}

function isFilePickerActive(): boolean {
  if (typeof document === "undefined") return false;
  if (typeof window !== "undefined" && (window as any).__examFilePickerActive) {
    return true;
  }
  const el = document.activeElement;
  return el instanceof HTMLInputElement && el.type === "file";
}

/** Clears styles from an older body-wide anti-cheat implementation. */
function clearLeakedBodyAntiCheatStyles() {
  if (typeof document === "undefined") return;
  document.body.classList.remove("exam-anti-cheat-active");
  document.body.style.userSelect = "";
  (
    document.body.style as CSSStyleDeclaration & { webkitUserSelect?: string }
  ).webkitUserSelect = "";
  (
    document.body.style as CSSStyleDeclaration & { webkitTouchCallout?: string }
  ).webkitTouchCallout = "";
}

/**
 * Soft anti-cheat for timed exams:
 * - Keyboard shortcut blocking while the attempt is active
 * - Ends the exam when the tab is hidden or the window is closed (if strictMode is true)
 * - If allowResume is true, saves progress rather than auto-submitting on close
 *
 * Copy / context-menu / selection are blocked on ExamAntiCheatShell only
 * (not on document.body), so other routes stay unaffected.
 */
export function useExamAntiCheat({
  enabled,
  strictMode = true,
  allowResume = false,
  onLeaveExam,
  onSaveProgress,
  showToast = true,
}: UseExamAntiCheatOptions) {
  const leftRef = useRef(false);
  const onLeaveRef = useRef(onLeaveExam);
  onLeaveRef.current = onLeaveExam;
  const onSaveProgressRef = useRef(onSaveProgress);
  onSaveProgressRef.current = onSaveProgress;

  useEffect(() => {
    clearLeakedBodyAntiCheatStyles();

    if (!enabled) {
      leftRef.current = false;
      return;
    }

    leftRef.current = false;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const triggerLeave = (reason: ExamIntegrityReason) => {
      if (leftRef.current) return;
      leftRef.current = true;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      if (showToast && reason !== "copy_blocked") {
        toast.error(
          reason === "page_unload"
            ? "Exam ended — window was closed."
            : "Exam ended — you left the exam tab.",
          { duration: 5000 },
        );
      }
      onLeaveRef.current(reason);
    };

    const blockKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;

      if (meta && (key === "s" || key === "p" || key === "u")) {
        event.preventDefault();
        return;
      }

      if (
        key === "f12" ||
        key === "printscreen" ||
        (meta && event.shiftKey && (key === "i" || key === "j"))
      ) {
        event.preventDefault();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        onSaveProgressRef.current?.();
      }

      if (!strictMode) {
        // Teacher disabled strictness: tab switching / window blurring does not force submit
        return;
      }
      if (document.visibilityState !== "hidden") {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        return;
      }
      if (isFilePickerActive()) return;

      hideTimer = setTimeout(() => {
        if (document.visibilityState === "hidden" && !isFilePickerActive()) {
          triggerLeave("tab_hidden");
        }
      }, 400);
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      onSaveProgressRef.current?.();

      if (allowResume) {
        // Exam allows resuming: do not force-submit or fail attempt
        return;
      }

      if (strictMode) {
        event.preventDefault();
        event.returnValue = "";
        triggerLeave("page_unload");
      }
    };

    const onFocus = () => {
      if (typeof window !== "undefined" && (window as any).__examFilePickerActive) {
        setTimeout(() => {
          (window as any).__examFilePickerActive = false;
        }, 1500);
      }
    };

    document.addEventListener("keydown", blockKeys, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("focus", onFocus);

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      document.removeEventListener("keydown", blockKeys, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, strictMode, allowResume, showToast]);
}
