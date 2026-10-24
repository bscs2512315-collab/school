"use client";

import { useEffect } from "react";
import { globalPreloadedImageUrls, preloadQuestionImages } from "@/components/exam/QuestionImage";

export interface DiagramQuestionItem {
  imageUrl?: string | null;
  subQuestions?: Array<{ imageUrl?: string | null }> | null;
}

/**
 * Preloads diagrams for the current question and the upcoming `windowSize` (default: 5) questions.
 * Also lazily schedules preloading for all other question diagrams in the paper during idle time.
 * This guarantees zero loaders and instant diagram presentation for students.
 */
export function useQuestionDiagramPreloader<T extends DiagramQuestionItem>(
  questions: T[] | undefined | null,
  currentIndex: number,
  windowSize = 5
) {
  useEffect(() => {
    if (!questions || questions.length === 0 || typeof window === "undefined") return;

    // 1. Sliding window: Priority preloading for current + next `windowSize` questions
    const start = Math.max(0, currentIndex);
    const end = Math.min(questions.length, currentIndex + windowSize + 1);

    const priorityUrls: string[] = [];
    for (let i = start; i < end; i++) {
      const q = questions[i];
      if (!q) continue;
      if (q.imageUrl && !globalPreloadedImageUrls.has(q.imageUrl)) {
        priorityUrls.push(q.imageUrl);
      }
      if (Array.isArray(q.subQuestions)) {
        for (const sub of q.subQuestions) {
          if (sub?.imageUrl && !globalPreloadedImageUrls.has(sub.imageUrl)) {
            priorityUrls.push(sub.imageUrl);
          }
        }
      }
    }

    if (priorityUrls.length > 0) {
      preloadQuestionImages(priorityUrls);
    }

    // 2. Idle background loader: Preload the rest of the paper's diagrams without impacting UI performance
    const scheduleIdle =
      "requestIdleCallback" in window
        ? (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 1200);

    const handle = scheduleIdle(() => {
      const remainingUrls: string[] = [];
      for (let i = 0; i < questions.length; i++) {
        // Skip already scanned sliding window
        if (i >= start && i < end) continue;
        const q = questions[i];
        if (!q) continue;
        if (q.imageUrl && !globalPreloadedImageUrls.has(q.imageUrl)) {
          remainingUrls.push(q.imageUrl);
        }
        if (Array.isArray(q.subQuestions)) {
          for (const sub of q.subQuestions) {
            if (sub?.imageUrl && !globalPreloadedImageUrls.has(sub.imageUrl)) {
              remainingUrls.push(sub.imageUrl);
            }
          }
        }
      }

      if (remainingUrls.length > 0) {
        preloadQuestionImages(remainingUrls);
      }
    });

    return () => {
      if ("cancelIdleCallback" in window && typeof handle === "number") {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
      }
    };
  }, [questions, currentIndex, windowSize]);
}
