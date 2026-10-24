"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { toast } from "sonner";
import type { SolvedExercise } from "@/types/solved-notes";
import QuestionBankBrowseCard from "@/components/admin/question-bank/QuestionBankBrowseCard";

interface SolvedExerciseCardProps {
  exercise: SolvedExercise;
  subjectSlug?: string;
}

function getExerciseDisplayTitle(exerciseNumber?: string, title?: string, chapterName?: string): string {
  if (exerciseNumber && exerciseNumber.trim()) {
    const clean = exerciseNumber.trim();
    if (/^\d+(\.\d+)?$/.test(clean)) {
      return `Exercise ${clean}`;
    }
    return clean;
  }

  if (title && title.trim()) {
    const match = title.match(/((?:Review\s+)?Exercise\s+\d+(?:\.\d+)?)/i);
    if (match) {
      return match[1];
    }
    let clean = title.trim().replace(/\s*[-:–—]\s*Math(ematics)?(\s*Class)?\s*\d+th?/i, "").trim();
    if (chapterName) {
      const escaped = chapterName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      clean = clean.replace(new RegExp(`^${escaped}\\s*[-:–—]\\s*`, "i"), "").trim();
    }
    return clean || "Exercise";
  }

  return "Exercise";
}

function getExerciseWatermark(exerciseNumber: string): string {
  const match = exerciseNumber.match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? match[1] : exerciseNumber.slice(0, 2).toUpperCase();
}

export default function SolvedExerciseCard({ exercise, subjectSlug }: SolvedExerciseCardProps) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  const displayTitle = getExerciseDisplayTitle(
    exercise.exerciseNumber,
    exercise.title,
    exercise.chapterName ?? undefined,
  );
  const watermark = getExerciseWatermark(exercise.exerciseNumber);
  const subtitle = exercise.subject || "Mathematics";

  const handleClick = () => {
    if (exercise.isLocked) {
      toast.info(`${exercise.exerciseNumber || "SLO"} Note Coming Soon`, {
        description: `This note for Examination 2027 is currently in preparation by our academic team and will unlock soon!`,
      });
      return;
    }
    setIsOpening(true);
    router.push(
      FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(
        exercise.id,
        subjectSlug || exercise.subject
      )
    );
  };

  return (
    <QuestionBankBrowseCard
      title={displayTitle}
      board={exercise.board || "Sindh Board"}
      classLevel={exercise.class || "X"}
      subtitle={subtitle}
      watermark={watermark}
      subject={exercise.subject || "Mathematics"}
      buttonLabel={exercise.isLocked ? "Coming Soon" : "Open"}
      isLoading={isOpening}
      isLocked={exercise.isLocked}
      badge={exercise.cognitiveLevel || undefined}
      onClick={handleClick}
      dark
    />
  );
}
