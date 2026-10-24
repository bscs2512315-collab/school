"use client";

import React from "react";
import { Database, UserRound } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import EditSVG from "@/public/svgs/EditSVG";
import ShareSVG from "@/public/svgs/ShareSVG";
import TrophySVG from "@/public/svgs/TrophySVG";
import PlaySVG from "@/public/svgs/PlaySVG";
import { Typography } from "@/components/ui/Typography";
import type { CustomQuizSummary, SharedCustomQuiz } from "@/types/custom-quiz";

interface CustomQuizCardProps {
  quiz: CustomQuizSummary | SharedCustomQuiz;
  variant: "owned" | "shared";
  onSolve?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (quiz: CustomQuizSummary) => void;
  onShare?: (quiz: CustomQuizSummary) => void;
}

function isShared(quiz: CustomQuizSummary | SharedCustomQuiz): quiz is SharedCustomQuiz {
  return "ownerName" in quiz;
}

export default function CustomQuizCard({
  quiz,
  variant,
  onSolve,
  onEdit,
  onDelete,
  onShare,
}: CustomQuizCardProps) {
  const shared = isShared(quiz);

  return (
    <div className="group relative flex h-full min-h-88 flex-col overflow-hidden rounded-[2.5rem] bg-primary transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(22,163,74,0.15)]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/95 to-emerald-900/90" />
        <div className="absolute right-[-10%] top-[-20%] h-[80%] w-[80%] rounded-full bg-background/10 blur-[80px] transition-colors duration-700 group-hover:bg-background/15" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-emerald-400/20 blur-[60px] transition-colors duration-700 group-hover:bg-emerald-400/30" />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10 flex h-full flex-1 flex-col p-6 sm:p-8">
        {/* Question-count watermark */}
        <div className="pointer-events-none absolute right-4 top-4 z-0 select-none overflow-hidden transition-transform duration-700 group-hover:-translate-y-1 group-hover:scale-105 sm:right-6 sm:top-6">
          <span className="text-6xl font-black tracking-tighter text-white/[0.07] drop-shadow-md sm:text-7xl">
            {quiz.questionCount}
          </span>
        </div>

        {/* Header */}
        <div className="relative z-10 mb-6 flex items-start justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 shadow-sm backdrop-blur-md">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                {variant === "shared" ? "Shared Quiz" : "My Quiz"}
              </span>
            </div>
            <Typography className="mb-4 line-clamp-2 text-2xl font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl">
              {quiz.title}
            </Typography>
            <div className="mt-4 flex flex-wrap gap-2">
              {quiz.subject ? (
                <span className="rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/25 sm:text-xs">
                  {quiz.subject}
                </span>
              ) : null}
              <span className="rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/25 sm:text-xs">
                {quiz.questionCount} Question{quiz.questionCount === 1 ? "" : "s"}
              </span>
              {shared ? (
                <span className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md sm:text-xs">
                  <UserRound className="h-3 w-3" />
                  {quiz.ownerName}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 mb-auto grid grid-cols-2 gap-4">
          <div className="group/item relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-4 shadow-[0_8px_16px_rgba(0,0,0,0.1)] backdrop-blur-md transition-colors hover:bg-white/15 sm:p-5">
            <div className="absolute -right-2 -top-2 opacity-10 transition-transform duration-500 group-hover/item:-rotate-12 group-hover/item:scale-125">
              <Database className="h-14 w-14 text-white" />
            </div>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
              Questions
            </span>
            <span className="text-lg font-black text-white">{quiz.questionCount} Items</span>
          </div>
          <div className="group/item relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-4 shadow-[0_8px_16px_rgba(0,0,0,0.1)] backdrop-blur-md transition-colors hover:bg-white/15 sm:p-5">
            <div className="absolute -right-2 -top-2 opacity-10 transition-transform duration-500 group-hover/item:rotate-12 group-hover/item:scale-125">
              <TrophySVG className="h-14 w-14 text-white" />
            </div>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
              Best Score
            </span>
            <span className="text-lg font-black text-white">
              {quiz.bestScore !== null ? `${Math.round(quiz.bestScore)}%` : "—"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 mt-6 flex items-center gap-3 border-t border-white/10 pt-6">
          <button
            onClick={() => onSolve?.(quiz.id)}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-primary shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)]"
          >
            <PlaySVG className="h-5 w-5" />
          </button>

          {variant === "owned" ? (
            <>
              <button
                onClick={() => onShare?.(quiz as CustomQuizSummary)}
                title="Challenge friends"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:rotate-3 hover:bg-white/25"
              >
                <ShareSVG className="size-5" />
              </button>
              <button
                onClick={() => onEdit?.(quiz.id)}
                title="Edit quiz"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:rotate-3 hover:bg-white/25"
              >
                <EditSVG className="size-5" />
              </button>
              <button
                onClick={() => onDelete?.(quiz as CustomQuizSummary)}
                title="Delete quiz"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/50 bg-red-500/80 text-background shadow-[0_4px_20px_rgba(239,68,68,0.3)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:-rotate-3 hover:bg-red-500"
              >
                <DeleteSVG className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
