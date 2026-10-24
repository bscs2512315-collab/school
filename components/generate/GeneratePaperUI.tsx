"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";
import { Loader2 } from "lucide-react";
import P1SVG from "@/public/svgs/P1SVG";
import P2SVG from "@/public/svgs/P2SCG";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import SendSVG from "@/public/svgs/SendSVG";
import { cn } from "@/lib/utils";
import AppButton from "@/components/AppButton";
import SubjectWatermarkCluster from "./SubjectWatermarkCluster";

export function GenerateDotBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-15"
      style={{
        backgroundImage:
          "radial-gradient(circle, color-mix(in srgb, var(--color-border) 90%, transparent) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}

export function GenerateSectionWatermark({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
    >
      <span className="text-[clamp(3rem,14vw,7rem)] font-black uppercase tracking-tighter text-primary opacity-[0.04] dark:opacity-[0.03]">
        {label}
      </span>
    </div>
  );
}

export function GenerateOptionCardDecoration({ selected }: { selected?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark" />
      <div className="absolute -top-10 -right-8 size-40 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-500" />
      <div className="absolute -bottom-10 -left-8 size-36 rounded-full bg-primary-foreground/5 blur-2xl" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
    </div>
  );
}

export function GenerateMetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/80 px-3 py-2 text-xs shadow-xs">
      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="font-bold text-foreground">{value}</p>
    </div>
  );
}

interface GenerateSectionDividerProps {
  label: string;
  className?: string;
}

export function GenerateSectionDivider({ label, className }: GenerateSectionDividerProps) {
  return (
    <div className={cn("flex items-center gap-3 py-1.5", className)}>
      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/80">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

interface GenerateStepTopNavProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  stepBadge?: string;
  className?: string;
  rightSlot?: ReactNode;
}

export function GenerateStepTopNav({
  onBack,
  title,
  subtitle,
  stepBadge,
  className,
  rightSlot,
}: GenerateStepTopNavProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 pb-2",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="group flex h-9.5 items-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-xs backdrop-blur-md transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-foreground active:scale-95"
            aria-label="Go back to previous step"
          >
            <ArrowLeftSVG className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary dark:group-hover:text-foreground" />
            <span className="font-bold">Back</span>
          </button>
        ) : null}

        {(title || stepBadge) && (
          <div className="min-w-0">
            {stepBadge && (
              <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary dark:border-border dark:bg-muted dark:text-foreground">
                {stepBadge}
              </span>
            )}
            {title && (
              <h3 className="truncate text-sm sm:text-base font-bold text-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}

interface GenerateAttemptFooterProps {
  currentIndex: number;
  total: number;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  pendingUploads?: number;
}

export function GenerateAttemptFooter({
  currentIndex,
  total,
  isLast,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  pendingUploads = 0,
}: GenerateAttemptFooterProps) {
  const nextHint = isLast ? "Submit your practice paper" : `Question ${currentIndex + 2} of ${total}`;
  const isDisabled = isSubmitting || (isLast && pendingUploads > 0);

  return (
    <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentIndex === 0 || isSubmitting}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card/80 px-4 py-3 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-40 sm:justify-start"
      >
        <ArrowLeftSVG className="size-4" />
        Previous
      </button>

      <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-3 shadow-md backdrop-blur-md sm:flex-1 sm:p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Progress
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              {nextHint}
            </p>
          </div>

          <AppButton
            type="button"
            onClick={isLast ? onSubmit : onNext}
            disabled={isDisabled}
            className="h-11 gap-2 rounded-xl bg-primary px-5 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : isLast ? (
              <>
                Submit Exam
                <SendSVG className="size-4" />
              </>
            ) : (
              <>
                Next Question
                <ArrowRightSVG className="size-4" />
              </>
            )}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

interface GenerateStepFooterProps {
  nextHint: string;
  onContinue: () => void;
  disabled?: boolean;
  loading?: boolean;
  continueLabel?: string;
  onBack?: () => void;
}

export function GenerateStepFooter({
  nextHint,
  onContinue,
  disabled = false,
  loading = false,
  continueLabel = "Continue",
  onBack,
}: GenerateStepFooterProps) {
  return (
    <div className="mt-6 w-full rounded-2xl border border-border/80 bg-card/90 p-3 shadow-md backdrop-blur-md sm:mt-8 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              aria-label="Go back"
            >
              <ArrowLeftSVG className="size-5" />
            </button>
          ) : null}
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Next Step
            </p>
            <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
              {nextHint}
            </p>
          </div>
        </div>

        <AppButton
          type="button"
          onClick={onContinue}
          disabled={disabled || loading}
          className="h-11 shrink-0 gap-2 rounded-xl bg-primary px-5 sm:px-6 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-102"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {continueLabel}
              <ArrowRightSVG className="size-4" />
            </>
          )}
        </AppButton>
      </div>
    </div>
  );
}

export const GenerateStickyFooter = GenerateStepFooter;

interface PaperTypeOptionProps {
  label: string;
  title: string;
  description: string;
  badge: string;
  watermark?: string;
  selected: boolean;
  onSelect: () => void;
}

export function PaperTypeOption({
  label,
  title,
  description,
  badge,
  watermark,
  selected,
  onSelect,
}: PaperTypeOptionProps) {
  const watermarkText = watermark ?? label.replace(/^Paper\s+/i, "");
  const PaperIcon = watermarkText === "1" || label.includes("1") || label.includes("I") ? P1SVG : P2SVG;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex min-h-[140px] sm:min-h-[155px] flex-col justify-between overflow-hidden rounded-3xl border-2 p-4 sm:p-5.5 text-left text-white transition-all duration-300",
        selected
          ? "border-amber-400 shadow-xl shadow-amber-500/20 ring-4 ring-amber-400/40 scale-[1.01]"
          : "border-white/20 hover:border-white/50 hover:-translate-y-0.5 hover:shadow-lg",
      )}
    >
      <GenerateOptionCardDecoration selected={selected} />

      <PaperIcon
        aria-hidden
        className="pointer-events-none absolute right-2 -bottom-2 size-28 sm:size-32 text-white/10 select-none transition-transform duration-500 group-hover:scale-105"
      />

      <div className="relative z-10 flex w-full items-start justify-between gap-2">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 backdrop-blur-md">
            <span className="size-1.5 animate-pulse rounded-full bg-white" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
              {label}
            </span>
          </div>
          <h4 className="mt-1 text-lg sm:text-2xl font-black tracking-tight text-white">
            {title}
          </h4>
        </div>

        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all",
            selected
              ? "border-amber-300 bg-amber-400 text-amber-950 shadow-sm"
              : "border-white/40 bg-white/20 text-transparent",
          )}
        >
          <CheckCircleSVG className="size-4 text-amber-950" />
        </div>
      </div>

      <div className="relative z-10 mt-3 space-y-2">
        <p className="text-xs sm:text-sm leading-relaxed text-white/90">
          {description}
        </p>
        <div>
          <span className="inline-flex items-center rounded-xl border border-white/25 bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {badge}
          </span>
        </div>
      </div>
    </button>
  );
}

interface SubjectOptionProps {
  subject: string;
  chaptersCount: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  selected: boolean;
  onSelect: () => void;
  showChapterCount?: boolean;
  subtitle?: string;
}

export function SubjectOption({
  subject,
  chaptersCount,
  icon: Icon,
  selected,
  onSelect,
  showChapterCount = true,
  subtitle,
}: SubjectOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex min-h-[125px] sm:min-h-[145px] flex-col items-center justify-center overflow-hidden rounded-3xl border-2 p-3.5 sm:p-4 text-center text-white transition-all duration-300",
        selected
          ? "border-amber-400 shadow-xl shadow-amber-500/20 ring-4 ring-amber-400/40 scale-[1.01]"
          : "border-white/20 hover:border-white/50 hover:-translate-y-0.5 hover:shadow-lg",
      )}
    >
      <GenerateOptionCardDecoration selected={selected} />
      <SubjectWatermarkCluster subject={subject} />

      <div
        className={cn(
          "absolute right-2.5 top-2.5 z-10 flex size-5.5 items-center justify-center rounded-full border transition-all",
          selected
            ? "border-amber-300 bg-amber-400 text-amber-950 shadow-sm"
            : "border-white/40 bg-white/20 text-transparent",
        )}
      >
        <CheckCircleSVG className="size-4 text-amber-950" />
      </div>

      <div
        className={cn(
          "relative z-10 mb-2 flex size-10 sm:size-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105",
          selected
            ? "bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300/80"
            : "border border-white/25 bg-white/20 text-white backdrop-blur-md",
        )}
      >
        <Icon className="size-5 sm:size-6" />
      </div>

      <span className="relative z-10 line-clamp-1 text-xs sm:text-sm font-black tracking-tight text-white">
        {subject}
      </span>

      {subtitle ? (
        <span className="relative z-10 mt-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
          {subtitle}
        </span>
      ) : showChapterCount ? (
        <span className="relative z-10 mt-1.5 inline-flex items-center rounded-xl border border-white/25 bg-white/20 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
          {chaptersCount} Units
        </span>
      ) : null}
    </button>
  );
}

interface SubjectOptionGridProps {
  children: ReactNode;
}

export function SubjectOptionGrid({ children }: SubjectOptionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 sm:gap-3.5">
      {children}
    </div>
  );
}

interface ChapterOptionProps {
  chapterNumber: number;
  chapterName: string;
  questionCount?: number;
  selected: boolean;
  disabled?: boolean;
  showQuestionCount?: boolean;
  onToggle: () => void;
}

export function ChapterOption({
  chapterNumber,
  chapterName,
  questionCount,
  selected,
  disabled = false,
  showQuestionCount = true,
  onToggle,
}: ChapterOptionProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "group relative flex w-full items-center gap-3.5 sm:gap-4 overflow-hidden rounded-3xl border-2 p-4 sm:p-5 text-left text-white transition-all duration-300",
        selected
          ? "border-amber-400 shadow-xl shadow-amber-500/20 ring-4 ring-amber-400/40 scale-[1.01]"
          : "border-white/20 hover:border-white/50 hover:-translate-y-0.5 hover:shadow-lg",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <GenerateOptionCardDecoration selected={selected} />

      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 sm:right-5 -translate-y-1/2 z-0 select-none overflow-hidden"
      >
        <span className="text-4xl sm:text-6xl font-black tracking-tighter text-white/10">
          {chapterNumber}
        </span>
      </div>

      <div
        className={cn(
          "relative z-10 flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-2xl border font-black text-xs sm:text-sm transition-all",
          selected
            ? "border-amber-300 bg-amber-400 text-amber-950 shadow-md"
            : "border-white/30 bg-white/20 text-white backdrop-blur-md",
        )}
      >
        {selected ? (
          <CheckCircleSVG className="size-5 text-amber-950" />
        ) : (
          chapterNumber
        )}
      </div>

      <div className="relative z-10 min-w-0 flex-1">
        <h4 className="truncate text-sm sm:text-base font-bold text-white leading-tight">
          {chapterName}
        </h4>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center rounded-lg border border-white/25 bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Unit {chapterNumber}
          </span>
          {showQuestionCount && questionCount !== undefined && questionCount > 0 ? (
            <span className="text-[11px] font-semibold text-white/80">
              {questionCount} Question{questionCount !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

interface GenerateStepProgressProps {
  currentStep: number;
  steps?: string[];
}

export function GenerateStepProgress({
  currentStep,
  steps = ["Source Mode", "Details", "Chapters", "Complete"],
}: GenerateStepProgressProps) {
  return (
    <div className="mb-6 w-full sm:mb-8">
      <div className="flex items-center justify-center">
        <div className="flex w-full max-w-2xl items-center justify-between">
          {steps.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-8 sm:size-9 items-center justify-center rounded-full border-2 text-xs font-black transition-all",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-4 ring-primary/15"
                        : isCompleted
                          ? "border-primary bg-primary/15 text-primary dark:bg-muted dark:text-foreground dark:border-border"
                          : "border-border/80 bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {isCompleted ? (
                       <CheckCircleSVG className="size-4.5 text-primary dark:text-foreground" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 hidden text-center text-[10px] sm:block sm:text-[11px] font-bold tracking-tight whitespace-nowrap",
                      isCurrent
                        ? "text-primary dark:text-foreground font-black"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </div>

                {index < steps.length - 1 ? (
                  <div
                    className={cn(
                      "mx-2 sm:mx-4 h-0.5 flex-1 rounded-full transition-all",
                      index < currentStep ? "bg-primary" : "bg-border/80",
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function GenerateStepShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden pb-28 sm:pb-6">
      <GenerateDotBackground />
      <div className="relative z-10 space-y-6 sm:space-y-8">{children}</div>
    </div>
  );
}

interface GenerateSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClear: () => void;
}

export function GenerateSelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
}: GenerateSelectionBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-black text-primary dark:bg-muted dark:text-foreground">
          {selectedCount}
        </span>
        <p className="text-xs sm:text-sm font-bold text-foreground">
          of {totalCount} chapters selected
        </p>
      </div>

      <div className="flex items-center gap-2">
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={selectedCount === 0}
          className="h-8 rounded-lg px-3 text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        >
          Clear All
        </AppButton>
        <AppButton
          type="button"
          size="sm"
          onClick={onSelectAll}
          disabled={selectedCount === totalCount}
          className="h-8 rounded-lg bg-primary/15 text-primary border border-primary/25 hover:bg-primary/25 dark:bg-muted dark:text-foreground dark:border-border px-3 text-xs font-bold"
        >
          Select All
        </AppButton>
      </div>
    </div>
  );
}
