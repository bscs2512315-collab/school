"use client";

import { Calendar, ChevronRight, Clock, Swords, Target } from "lucide-react";
import PracticalJournalSVG from "@/public/svgs/PracticalJournalSVG";
import { Typography } from "@/components/ui/Typography";
import SubjectWatermarkCluster from "@/components/generate/SubjectWatermarkCluster";
import { cn } from "@/lib/utils";
import type { StudentHistoryItem } from "@/types/student";
import { GradingStatus } from "@/types/enums";

interface HistoryAttemptCardProps {
  attempt: StudentHistoryItem;
  onClick: () => void;
}

function GradientCardBackground({ variant }: { variant: "default" | "challenge" }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={cn("absolute inset-0", {
          "bg-linear-to-br from-primary via-primary/95 to-emerald-900/90": variant === "default",
          "bg-linear-to-br from-amber-600 via-amber-500 to-amber-900/90": variant === "challenge",
        })}
      />
      <div className="absolute top-[-20%] right-[-10%] size-[80%] rounded-full bg-background/10 blur-[80px] transition-colors duration-700 group-hover:bg-background/15" />
      <div
        className={cn("absolute bottom-[-10%] left-[-10%] size-[60%] rounded-full blur-[60px] transition-colors duration-700", {
          "bg-emerald-400/20 group-hover:bg-emerald-400/30": variant === "default",
          "bg-amber-300/20 group-hover:bg-amber-300/30": variant === "challenge",
        })}
      />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute inset-0 skew-x-12 -translate-x-full transform-gpu bg-linear-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-700 group-hover:animate-[shimmer_1.5s_ease-out_forwards] group-hover:opacity-100" />
    </div>
  );
}

function ChallengeWatermark() {
  const positions = [
    "top-2 left-2 sm:top-3 sm:left-3",
    "top-2 right-10 sm:top-3 sm:right-11",
    "bottom-2 left-2 sm:bottom-3 sm:left-3",
    "bottom-2 right-2 sm:bottom-3 sm:right-3",
  ];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden rounded-[inherit]"
    >
      {positions.map((position, index) => (
        <Swords
          key={index}
          className={cn("absolute size-6 rotate-12 text-background/12 sm:size-7", {
            "-rotate-6": index % 2 === 1,
            [position]: true,
          })}
          strokeWidth={1.25}
        />
      ))}
    </div>
  );
}

export default function HistoryAttemptCard({ attempt, onClick }: HistoryAttemptCardProps) {
  const isPending =
    attempt.grading_status === GradingStatus.PENDING_AI ||
    attempt.grading_status === GradingStatus.PENDING_MANUAL ||
    attempt.grading_status === GradingStatus.AWAITING_APPROVAL;
  const isAwaitingTeacher =
    attempt.grading_status === GradingStatus.AWAITING_APPROVAL;
  const isFailed = attempt.grading_status === GradingStatus.FAILED;
  const isPaper2 = attempt.paper_type === "paper2";
  const isChallenge = attempt.paper_type === "challenge";
  const isPaper1 = !isPaper2 && !isChallenge;

  const percentage =
    attempt.total_marks > 0
      ? Math.round(((attempt.score ?? 0) / attempt.total_marks) * 100)
      : 0;

  const date = new Date(attempt.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeTakenMin = Math.floor(attempt.time_taken / 60);

  const subjectLabel =
    attempt.title ||
    attempt.subject ||
    (isChallenge ? "Challenge Attempt" : "Examination Attempt");

  const scoreColorClass = cn({
    "text-emerald-300": percentage >= 80,
    "text-amber-200": percentage >= 60 && percentage < 80,
    "text-red-300": percentage < 60,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex h-full min-h-80 w-full flex-col overflow-hidden rounded-[2.5rem] text-left transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(22,163,74,0.15)]",
        { "hover:shadow-[0_20px_50px_rgba(217,119,6,0.2)]": isChallenge },
      )}
    >
      <GradientCardBackground variant={isChallenge ? "challenge" : "default"} />

      {isChallenge ? (
        <ChallengeWatermark />
      ) : (
        <SubjectWatermarkCluster subject={attempt.subject || "English"} />
      )}

      <div className="absolute top-4 right-4 z-0 pointer-events-none select-none overflow-hidden transition-transform duration-700 group-hover:scale-105 group-hover:-translate-y-1 sm:top-6 sm:right-6">
        <span className="text-5xl font-black tracking-tighter text-white/10 drop-shadow-md sm:text-6xl">
          {isPending ? "…" : isFailed ? "!" : `${percentage}%`}
        </span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-8">
        <div className="mb-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 shadow-sm backdrop-blur-md">
            <div className="size-1.5 animate-pulse rounded-full bg-white" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
              {isChallenge ? "Challenge" : "Exam Attempt"}
            </span>
          </div>

          <Typography className="mb-4 line-clamp-2 text-2xl font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl">
            {subjectLabel}
          </Typography>

          <div className="flex flex-wrap gap-2">
            {isPaper1 ? (
              <span className="rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md sm:text-xs">
                Paper I · MCQ
              </span>
            ) : null}
            {isPaper2 ? (
              <span className="rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md sm:text-xs">
                Paper II · CRQ/ERQ
              </span>
            ) : null}
            {isChallenge ? (
              <span className="rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md sm:text-xs">
                1v1 Challenge
              </span>
            ) : null}
            {isPending ? (
              <span className="rounded-xl border border-amber-200/30 bg-amber-400/20 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md sm:text-xs">
                {isAwaitingTeacher ? "Awaiting teacher" : "Grading"}
              </span>
            ) : null}
            {isFailed ? (
              <span className="rounded-xl border border-red-200/30 bg-red-400/20 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md sm:text-xs">
                Failed
              </span>
            ) : null}
          </div>
        </div>

        <div className="mb-auto grid grid-cols-2 gap-4">
          <div className="group/item relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-4 shadow-[0_8px_16px_rgba(0,0,0,0.1)] backdrop-blur-md transition-colors hover:bg-white/15 sm:p-5">
            <div className="absolute -right-2 -top-2 opacity-10 transition-transform duration-500 group-hover/item:scale-125 group-hover/item:-rotate-12">
              <Calendar className="size-14 text-white" />
            </div>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
              Attempted
            </span>
            <span className="text-sm font-black text-white sm:text-base">{date}</span>
          </div>

          <div className="group/item relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-4 shadow-[0_8px_16px_rgba(0,0,0,0.1)] backdrop-blur-md transition-colors hover:bg-white/15 sm:p-5">
            <div className="absolute -right-2 -top-2 opacity-10 transition-transform duration-500 group-hover/item:rotate-12 group-hover/item:scale-125">
              <Clock className="size-14 text-white" />
            </div>
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
              Duration
            </span>
            <span className="text-sm font-black text-white sm:text-base">{timeTakenMin} mins</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div>
            {isPending ? (
              <>
                <Typography className="text-2xl font-black text-amber-200">Pending</Typography>
                <Typography className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  {isAwaitingTeacher ? "Teacher Review" : "AI Grading"}
                </Typography>
              </>
            ) : isFailed ? (
              <>
                <Typography className="text-2xl font-black text-red-300">Failed</Typography>
                <Typography className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Grading Error
                </Typography>
              </>
            ) : (
              <>
                <Typography className={cn("text-2xl font-black", scoreColorClass)}>
                  {attempt.score ?? 0}/{attempt.total_marks}
                </Typography>
                <Typography className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Final Score · {percentage}%
                </Typography>
              </>
            )}
          </div>

          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all group-hover:bg-white group-hover:text-primary sm:size-14">
            {isChallenge ? <Swords className="size-5" /> : isPaper2 ? <Target className="size-5" /> : <PracticalJournalSVG className="size-5" />}
          </div>
        </div>
      </div>
    </button>
  );
}
