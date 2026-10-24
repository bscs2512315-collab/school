"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import { cn } from "@/lib/utils";
import { getSubjectIcon } from "@/lib/generate/subject-icons";
import { normalizeClassLevel } from "@/lib/teacher/class-level";

interface ClassroomCardProps {
  id: string;
  name?: string | null;
  teacherName: string;
  teacherImage: string | null;
  subject: string;
  classLevel: string;
  board?: string;
  pinCode?: string | null;
  pin?: string | null;
  schoolName?: string | null;
  /** @deprecated use paperCount */
  contentCount?: number;
  paperCount?: number;
  href: string;
  /** Hide teacher block (e.g. on teacher portal — they already know it's theirs) */
  showTeacher?: boolean;
  visibility?: "school" | "private";
  /** Shows a delete button overlay when provided (e.g. teacher portal) */
  onDelete?: () => void;
  colorByClass?: boolean;
}

const CLASS_THEMES: Record<string, { gradient: string }> = {
  IX: { gradient: "bg-linear-to-br from-[#008503] via-[#005f02] to-[#004a02]" },
  X: { gradient: "bg-linear-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]" },
  XI: { gradient: "bg-linear-to-br from-[#a855f7] via-[#9333ea] to-[#7e22ce]" },
  XII: { gradient: "bg-linear-to-br from-[#e11d48] via-[#be123c] to-[#9f1239]" },
};

const DEFAULT_CLASS_THEME = { gradient: "bg-linear-to-br from-primary via-primary to-primary-dark" };

export default function ClassroomCard({
  name,
  teacherName,
  teacherImage,
  subject,
  classLevel,
  board,
  pinCode,
  pin,
  contentCount,
  paperCount,
  href,
  showTeacher = true,
  onDelete,
  colorByClass = false,
}: ClassroomCardProps) {
  const activePin = pinCode || pin;
  const tests = paperCount ?? contentCount ?? 0;
  const testsLabel = `${tests} practice test${tests === 1 ? "" : "s"}`;
  const SubjectIcon = getSubjectIcon(subject || name || "");
  const [copiedPin, setCopiedPin] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const escClassLevel = (classLevel || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const displayTitle = (name && !name.includes("__") ? name : subject)
    .replace(/\s*\(Private\)\s*/gi, "")
    .trim();
  const cleanTitle = escClassLevel
    ? displayTitle
      .replace(new RegExp(`[\\s\\-–—·/]+(?:class\\s+)?${escClassLevel}\\s*$`, "i"), "")
      .trim() || displayTitle
    : displayTitle;
  const boardMeta = [board, colorByClass ? null : `Class ${classLevel}`].filter(Boolean).join(" · ");
  const normalizedClass = normalizeClassLevel(classLevel);
  const classLabel = normalizedClass || classLevel || "CLASS";
  const classTheme = colorByClass ? CLASS_THEMES[normalizedClass] ?? DEFAULT_CLASS_THEME : DEFAULT_CLASS_THEME;

  const handleCopyPin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(activePin || "");
      setCopiedPin(true);
      toast.success(`PIN code ${activePin} copied!`);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {
      toast.error("Could not copy PIN");
    }
  };

  return (
    <div className="group relative h-full">
      <Link href={href} onClick={() => setIsOpening(true)} className="block h-full">
        <article
          className={cn(
            "group relative flex h-full min-h-60 sm:min-h-68 flex-col overflow-hidden rounded-3xl bg-primary p-5 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 text-center",
            "cursor-pointer hover:-translate-y-1.5 hover:shadow-xl",
          )}
        >
          {/* Ambient Lighting & Glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className={cn("absolute inset-0", classTheme.gradient)} />
            <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
            <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

            {/* Dual Watermark Icons */}
            <SubjectIcon
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-2 size-36 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 sm:size-40"
            />
            <SubjectIcon
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -left-4 size-24 text-primary-foreground/10 sm:size-28"
            />
          </div>

          {/* Top Bar Badges */}
          <div className="relative z-20 flex items-start justify-between w-full">
            <div className="flex items-center gap-1.5">
              {onDelete ? (
                <button
                  type="button"
                  aria-label="Delete classroom"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-primary-foreground backdrop-blur-sm transition-all duration-200 hover:bg-destructive hover:border-destructive"
                >
                  <DeleteSVG className="size-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Centered Hero Body */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center mt-2">
            <div className="mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105">
              {colorByClass ? (
                <span className="px-1 text-center text-lg font-black uppercase tracking-wide text-primary-foreground sm:text-2xl">
                  {classLabel}
                </span>
              ) : (
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-primary-foreground">
                  {tests}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-primary-foreground">
              {cleanTitle}
            </h3>

            {activePin ? (
              <button
                type="button"
                title="Click to copy Class PIN"
                onClick={handleCopyPin}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-linear-to-br from-amber-400 to-yellow-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-950 shadow-md ring-1 ring-amber-200/60 backdrop-blur-md transition-all duration-200 hover:from-amber-300 hover:to-yellow-500 hover:scale-105 active:scale-95 cursor-pointer"
              >
                {copiedPin ? <Check className="size-3 text-amber-900" /> : <Copy className="size-3" />}
                PIN: {activePin}
              </button>
            ) : null}

            {boardMeta ? (
              <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
                {boardMeta}
              </p>
            ) : null}

            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
              {testsLabel}
            </p>

            {showTeacher ? (
              <div className="mt-2.5 flex items-center justify-center gap-2 max-w-xs text-center">
                {teacherImage ? (
                  <img
                    src={teacherImage}
                    alt={teacherName}
                    className="size-5 rounded-full object-cover ring-1 ring-white/30 shadow-xs"
                  />
                ) : null}
                <p className="truncate text-xs font-semibold text-primary-foreground/60">
                  by {teacherName}
                </p>
              </div>
            ) : null}
          </div>

          {/* Centered Pill Action Button */}
          <div className="relative z-10 mt-4 flex items-center justify-center">
            <span aria-busy={isOpening} className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
              {isOpening ? <LoaderCircle className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
              {isOpening ? "Opening..." : "Open"}
            </span>
          </div>
        </article>
      </Link>
    </div>
  );
}