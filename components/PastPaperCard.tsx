"use client";

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import EditSVG from "@/public/svgs/EditSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import { cn } from "@/lib/utils";

interface PastPaper {
  id: string;
  subject: string;
  year: number;
  session: string | null;
  board: string;
  class: string;
  paperNumber: number;
  questionCount: number;
}

type TierTone = "alpha" | "beta" | "gamma";

interface PastPaperCardProps {
  paper: PastPaper;
  variant: "student" | "admin";
  /** Defaults to "Past Paper". Also used to detect an Alpha/Beta/Gamma tier. */
  badgeLabel?: string;
  /** Defaults to "Start Exam" */
  attemptLabel?: string;
  /** Difficulty tier, controls the card color (Alpha/Beta/Gamma). */
  tone?: TierTone;
  /** Optional line shown under the title (e.g. the chapter name for tiered cards). */
  subtitle?: string;
  /** Student's latest teacher-approved score. Only rendered when set. */
  score?: number | null;
  /** Total marks of that approved attempt. */
  maxScore?: number | null;
  /** Show a red "unattempted" dot on the top-right. */
  unattempted?: boolean;
  onAttempt?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Tier colors used across the classroom performance views:
// Alpha = emerald, Beta = blue, Gamma = purple.
const TIER_TONES: Record<TierTone, { gradient: string; pillText: string }> = {
  alpha: { gradient: "from-[#008503] via-[#005f02] to-[#004a02]", pillText: "text-[#005f02]" },
  beta: { gradient: "from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]", pillText: "text-[#2563eb]" },
  gamma: { gradient: "from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]", pillText: "text-[#7c3aed]" },
};

export default function PastPaperCard({
  paper,
  variant,
  badgeLabel = "Past Paper",
  attemptLabel = "Start Exam",
  tone,
  subtitle,
  score,
  maxScore,
  unattempted,
  onAttempt,
  onView,
  onEdit,
  onDelete,
}: PastPaperCardProps) {
  const [actionLoading, setActionLoading] = useState<"attempt" | "view" | "edit" | "delete" | null>(null);

  const handleAttempt = () => {
    setActionLoading("attempt");
    onAttempt?.(paper.id);
  };

  const handleView = () => {
    setActionLoading("view");
    onView?.(paper.id);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onEdit?.(paper.id);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete?.(paper.id);
  };

  const isAdmin = variant === "admin";

  const tierMatch = (tone ?? badgeLabel).match(/\b(alpha|beta|gamma)\b/i);
  const resolvedTone = (tierMatch?.[1]?.toLowerCase() ?? null) as TierTone | null;
  const toneStyle = resolvedTone ? TIER_TONES[resolvedTone] : null;
  const gradientClass = toneStyle?.gradient ?? "from-primary via-primary to-primary-dark";
  const isTiered = Boolean(resolvedTone);

  const pillButtonClass = cn(
    "inline-flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-full bg-primary-foreground px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest shadow-md transition-transform duration-300 group-hover:scale-105 max-w-full",
    toneStyle?.pillText ?? "text-primary",
  );
  const iconButtonClass =
    "flex size-7 sm:size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-primary-foreground backdrop-blur-sm transition-all duration-200 disabled:opacity-70 cursor-pointer";

  return (
    <div
      className={cn(
        "group relative flex h-full min-h-56 sm:min-h-68 flex-col overflow-hidden rounded-3xl bg-primary p-3.5 sm:p-5 md:p-6 text-primary-foreground shadow-lg transition-all duration-500 text-center",
        "hover:-translate-y-1.5 hover:shadow-xl",
      )}
    >
      {/* Ambient Lighting & Watermarks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className={cn("absolute inset-0 bg-linear-to-br", gradientClass)} />
        <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
        <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-2 top-0 select-none font-black tracking-tighter text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6",
            isTiered ? "text-4xl sm:text-5xl" : "text-6xl sm:text-7xl",
          )}
        >
          {isTiered
            ? `${paper.questionCount} Qs`
            : paper.paperNumber === 2
              ? "P2"
              : "P1"}
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-1 -left-1 select-none text-5xl font-black tracking-tighter text-primary-foreground/10 sm:text-6xl"
        >
          {paper.class}
        </span>
      </div>

      {/* Top Bar: Action Buttons (Admin or Teacher Edit) */}
      <div className="relative z-20 flex items-start justify-between w-full gap-2">
        <span />

        {isAdmin || onEdit || onDelete ? (
          <div className="flex items-center gap-1.5">
            {onEdit ? (
              <button
                type="button"
                aria-label="Edit paper / extend deadline"
                title="Edit test / extend deadline"
                disabled={!!actionLoading}
                onClick={handleEdit}
                className={cn(iconButtonClass, "hover:bg-white/20")}
              >
                {actionLoading === "edit" ? <Loader2 className="size-4 animate-spin" /> : <EditSVG className="size-4" />}
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                aria-label="Delete paper"
                title="Delete"
                disabled={!!actionLoading}
                onClick={handleDelete}
                className={cn(iconButtonClass, "hover:bg-destructive hover:border-destructive")}
              >
                <DeleteSVG className="size-4" />
              </button>
            ) : null}
          </div>
        ) : unattempted ? (
          <span
            title="Not attempted yet"
            className="relative -mt-1 flex size-4 shrink-0 items-center justify-center"
          >
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-red-500 ring-2 ring-white/50" />
          </span>
        ) : null}
      </div>

      {/* Centered Hero Body */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center mt-0">
        {score != null && maxScore != null && maxScore > 0 ? (
          (() => {
            const pct = Math.round((score / maxScore) * 100);
            const letter = pct >= 96 ? "A++" : pct >= 91 ? "A+" : pct >= 86 ? "A" : pct >= 81 ? "B++" : pct >= 76 ? "B+" : pct >= 71 ? "B" : pct >= 61 ? "C+" : pct >= 51 ? "C" : pct >= 40 ? "D" : "U";
            const pillBg =
              pct >= 96
                ? "bg-emerald-600"
                : pct >= 91
                  ? "bg-emerald-700"
                  : pct >= 86
                    ? "bg-green-700"
                    : pct >= 81
                      ? "bg-teal-700"
                      : pct >= 76
                        ? "bg-sky-700"
                        : pct >= 71
                          ? "bg-sky-800"
                          : pct >= 61
                            ? "bg-amber-600"
                            : pct >= 51
                              ? "bg-orange-500"
                              : pct >= 40
                                ? "bg-orange-600"
                                : "bg-red-600";
            return (
              <span
                className={cn(
                  "mb-3 inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-black tracking-wide text-white shadow-md",
                  pillBg,
                )}
              >
                {score} / {maxScore} Marks · {letter} · {pct}%
              </span>
            );
          })()
        ) : score != null ? (
          <span className="mb-3 inline-flex items-center whitespace-nowrap rounded-full bg-primary-foreground/15 px-3 py-1.5 text-[11px] font-black tracking-wide text-primary-foreground ring-1 ring-primary-foreground/25 backdrop-blur-sm">
            {score} Marks
          </span>
        ) : null}

        <div className="mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105">
          {isTiered ? (
            <span className="text-xl font-black tracking-tight text-primary-foreground sm:text-2xl">
              {paper.paperNumber === 2 ? "P2" : "P1"}
            </span>
          ) : (
            <BookOpenSVG className="size-7 sm:size-8 text-primary-foreground" />
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-primary-foreground line-clamp-2">
          {paper.subject}
        </h3>

        {subtitle ? (
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
            {subtitle}
          </p>
        ) : !isTiered ? (
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
            {paper.board} · {paper.year}
          </p>
        ) : null}
      </div>

      {/* Centered Pill Action Button */}
      <div className="relative z-10 mt-4 flex items-center justify-center">
        {variant === "student" ? (
          onAttempt ? (
            <button
              type="button"
              disabled={!!actionLoading}
              onClick={handleAttempt}
              className={cn(pillButtonClass, "disabled:opacity-70 cursor-pointer")}
            >
              {actionLoading === "attempt" ? (
                <>
                  <Loader2 className="size-3 sm:size-3.5 shrink-0 animate-spin" />
                  <span>{attemptLabel.includes("Resume") ? "Resuming..." : "Starting..."}</span>
                </>
              ) : (
                <>
                  <ArrowRight className="size-3 sm:size-3.5 shrink-0" />
                  <span>{attemptLabel}</span>
                </>
              )}
            </button>
          ) : onView ? (
            <button
              type="button"
              disabled={!!actionLoading}
              onClick={handleView}
              className={cn(pillButtonClass, "disabled:opacity-70 cursor-pointer")}
            >
              {actionLoading === "view" ? (
                <>
                  <Loader2 className="size-3 sm:size-3.5 shrink-0 animate-spin" />
                  <span>Opening...</span>
                </>
              ) : (
                <>
                  <EyeSVG className="size-3 sm:size-3.5 shrink-0" />
                  <span>View</span>
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-widest text-primary-foreground backdrop-blur-sm">
              Published
            </span>
          )
        ) : (
          <button
            type="button"
            disabled={!!actionLoading}
            onClick={handleView}
            className={cn(pillButtonClass, "disabled:opacity-70 cursor-pointer")}
          >
            {actionLoading === "view" ? (
              <>
                <Loader2 className="size-3 sm:size-3.5 shrink-0 animate-spin" />
                <span>Opening...</span>
              </>
            ) : (
              <>
                <EyeSVG className="size-3 sm:size-3.5 shrink-0" />
                <span>View</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
