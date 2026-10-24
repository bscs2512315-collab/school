"use client";

import { MessageCircle } from "lucide-react";
import HeartSVG from "@/public/svgs/HeartSVG";
import {
  NOVA_DEFAULT_QUESTIONS,
  NOVA_TEACHER_DEFAULT_QUESTIONS,
} from "@/lib/nova/default-questions";
import { cn } from "@/lib/utils";

interface NovaStartPanelProps {
  studentName: string;
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
  isTeacher?: boolean;
}

export default function NovaStartPanel({
  studentName,
  onSelectQuestion,
  disabled = false,
  isTeacher = false,
}: NovaStartPanelProps) {
  const questions = isTeacher
    ? NOVA_TEACHER_DEFAULT_QUESTIONS
    : NOVA_DEFAULT_QUESTIONS;

  return (
    <div className="relative z-10 flex w-full flex-col pt-0 pb-1 max-w-[calc(100%-6.5rem)] min-[400px]:max-w-[calc(100%-7.5rem)] sm:min-h-full sm:max-w-none sm:py-2 lg:max-w-[58%] lg:py-8">
      <span className="mb-1.5 inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary dark:bg-muted dark:text-white sm:mb-2 sm:px-3 sm:py-1 sm:text-xs">
        {isTeacher ? "Teaching Assistant" : "AI Tutor"}
      </span>
      <h2 className="text-base font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
        Hi {studentName}, I&apos;m Nova
      </h2>
      {isTeacher ? (
        <>
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground sm:mt-3 sm:text-sm sm:leading-relaxed md:text-base">
            Your board-aligned teaching companion. Ask me to draft practice
            papers, explain syllabus topics, or generate classroom-ready
            questions in seconds.
          </p>
          <p className="mt-2 text-xs leading-snug text-muted-foreground sm:mt-6 sm:text-sm sm:leading-relaxed">
            I&apos;m Nova — trained on board curriculum and past papers, and
            built with{" "}
            <HeartSVG
               className="mx-0.5 inline size-3.5 text-[#ef4444]"
              aria-hidden="true"
            />{" "}
            by{" "}
            <span className="font-semibold text-foreground">
              Muhammad Taha Talib
            </span>{" "}
            for teachers.
          </p>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground sm:mt-3 sm:text-sm sm:leading-relaxed md:text-base">
            Your board-aligned study companion. Ask about syllabus and past
            papers, or attach a photo of any question for step-by-step help.
          </p>
          <p className="mt-2 text-xs leading-snug text-muted-foreground sm:mt-6 sm:text-sm sm:leading-relaxed">
            I&apos;m Nova — trained on your board curriculum and past papers,
            and built with{" "}
            <HeartSVG
               className="mx-0.5 inline size-3.5 text-[#ef4444]"
              aria-hidden="true"
            />{" "}
            by{" "}
            <span className="font-semibold text-foreground">
              Muhammad Taha Talib
            </span>{" "}
            for students.
          </p>
        </>
      )}

      <div className="mt-6 hidden flex-1 flex-col justify-end pb-2 sm:mt-8 sm:flex sm:pb-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Try asking
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          {questions.slice(0, 2).map((question) => (
            <button
              key={question}
              type="button"
              disabled={disabled}
              onClick={() => onSelectQuestion(question)}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left text-sm font-medium leading-snug text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 sm:px-4 sm:py-3.5",
                { "cursor-not-allowed opacity-50": disabled },
              )}
            >
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary dark:text-foreground" />
              <span>{question}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
