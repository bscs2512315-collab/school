"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { GenerateOptionCardDecoration } from "@/components/generate/GeneratePaperUI";
import { cn } from "@/lib/utils";

interface UploadPastPaperImportMethodOptionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  badge?: string;
  watermark?: string;
  disabled?: boolean;
  onAction: () => void;
}

export default function UploadPastPaperImportMethodOption({
  title,
  description,
  icon: Icon,
  actionLabel,
  badge,
  watermark,
  disabled = false,
  onAction,
}: UploadPastPaperImportMethodOptionProps) {
  return (
    <button
      type="button"
      onClick={onAction}
      disabled={disabled}
      className={cn(
        "group relative flex min-h-72 flex-col overflow-hidden rounded-2xl border-2 p-5 text-left text-white transition-all sm:min-h-80 sm:rounded-2xl sm:p-6",
        {
          "border-white/20 hover:-translate-y-1 hover:border-white/50 hover:shadow-lg": !disabled,
          "cursor-not-allowed opacity-60": disabled,
        },
      )}
    >
      <GenerateOptionCardDecoration selected={false} />

      {badge ? (
        <span className="absolute top-3 right-3 z-10 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white sm:text-[10px]">
          {badge}
        </span>
      ) : null}

      {watermark ? (
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 bottom-3 z-0 text-4xl font-black tracking-tighter text-white/10 sm:text-5xl"
        >
          {watermark}
        </span>
      ) : null}

      <span className="relative z-10 mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white sm:size-14">
        <Icon className="size-6 sm:size-7" />
      </span>

      <span className="relative z-10 text-lg font-bold leading-tight text-white sm:text-xl">{title}</span>
      <span className="relative z-10 mt-2 flex-1 text-sm leading-relaxed text-white/90">
        {description}
      </span>

      <span className="relative z-10 mt-5 flex w-full min-h-12 items-center justify-between gap-3 rounded-full border border-white/30 bg-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all group-hover:bg-white group-hover:text-primary group-hover:shadow-lg sm:min-h-14 sm:px-6 sm:text-sm">
        <span>{actionLabel}</span>
        <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
