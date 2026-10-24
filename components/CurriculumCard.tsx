"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import { cn } from "@/lib/utils";
import { getSubjectIcon } from "@/lib/generate/subject-icons";

type CurriculumData = {
  id: string;
  class: string;
  board: string;
  subject: string;
  fileName: string;
  chaptersCount: number;
  createdAt: string;
  fileUrl?: string;
  updatedAt?: string;
};

interface CurriculumCardProps {
  curriculum: CurriculumData;
  onView?: (id: string) => void;
  onManageChapters?: (id: string) => void;
  onDelete?: (curriculum: CurriculumData) => void;
  isDeleting?: boolean;
  formatDate: (date: string) => string;
}

export default function CurriculumCard({
  curriculum,
  onView,
  onManageChapters,
  onDelete,
  isDeleting = false,
}: CurriculumCardProps) {
  const [isViewing, setIsViewing] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const SubjectIcon = getSubjectIcon(curriculum.subject);
  const unitsLabel = `${curriculum.chaptersCount} Unit${curriculum.chaptersCount !== 1 ? "s" : ""}`;
  const subtitleMeta = `Class ${curriculum.class} · ${curriculum.board}`;

  const handleView = () => {
    setIsViewing(true);
    onView?.(curriculum.id);
  };

  const handleManage = () => {
    setIsManaging(true);
    onManageChapters?.(curriculum.id);
  };

  return (
    <div
      className={cn(
        "group relative flex h-full min-h-60 sm:min-h-68 flex-col overflow-hidden rounded-3xl bg-primary p-5 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 text-center",
        "hover:-translate-y-1.5 hover:shadow-xl cursor-pointer",
      )}
      onClick={onView ? handleView : undefined}
    >
      {/* Ambient Lighting & Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
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

      {/* Top Bar Actions */}
      <div className="relative z-20 flex items-start justify-between w-full gap-2">
        <div className="flex items-center gap-1.5">
          {onDelete ? (
            <button
              type="button"
              aria-label="Delete curriculum"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(curriculum);
              }}
              disabled={isDeleting}
              className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-primary-foreground backdrop-blur-sm transition-all duration-200 hover:bg-destructive hover:border-destructive disabled:opacity-70 cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <DeleteSVG className="size-4" />
              )}
            </button>
          ) : null}

          {onManageChapters ? (
            <button
              type="button"
              aria-label="Configure Units"
              title="Configure Units"
              onClick={(e) => {
                e.stopPropagation();
                handleManage();
              }}
              disabled={isManaging}
              className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-primary-foreground backdrop-blur-sm transition-all duration-200 hover:bg-white/20 disabled:opacity-70 cursor-pointer"
            >
              {isManaging ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SyllabusSVG className="size-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Centered Hero Body */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center mt-2">
        <div className="mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105">
          <SubjectIcon className="size-7 sm:size-8 text-primary-foreground" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-primary-foreground line-clamp-2">
          {curriculum.subject}
        </h3>

        <div className="mt-1.5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
            {subtitleMeta}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75">
            {unitsLabel}
          </p>
        </div>
      </div>

      {/* Centered Pill Action Button */}
      <div className="relative z-10 mt-4 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
          {isViewing ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
          {isViewing ? "Opening..." : "Open"}
        </span>
      </div>
    </div>
  );
}