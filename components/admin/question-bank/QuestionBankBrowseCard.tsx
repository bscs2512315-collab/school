"use client";

import type { ComponentType, SVGProps } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import BiologySVG from "@/public/svgs/BiologySVG";
import PhysicsSVG from "@/public/svgs/PhysicsSVG";
import ChemistrySVG from "@/public/svgs/ChemistrySVG";
import CalculatorSVG from "@/public/svgs/CalculatorSVG";
import ComputerSVG from "@/public/svgs/ComputerSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import CalendarSVG from "@/public/svgs/CalendarSVG";
import LockSVG from "@/public/svgs/LockSVG";
import { cn } from "@/lib/utils";

interface QuestionBankBrowseCardProps {
  title: string;
  subtitle: string;
  board?: string;
  classLevel?: string;
  watermark?: string;
  subject?: string;
  buttonLabel?: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  /** Render with the solid dark gradient (matches the deeper past-paper cards). */
  dark?: boolean;
  /** When true, marks the card as locked / coming soon */
  isLocked?: boolean;
  /** Optional badge on top-left (e.g., cognitive level like [U] or [A]) */
  badge?: string | null;
}

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

function resolveBrowseIcon(title: string, subject?: string): SvgIcon {
  const key = (subject || title).trim().toLowerCase();
  if (key.includes("math") || key.includes("algebra") || key.includes("calc")) return CalculatorSVG;
  if (key.includes("physic")) return PhysicsSVG;
  if (key.includes("chem")) return ChemistrySVG;
  if (key.includes("bio") || key.includes("botan") || key.includes("zool") || key.includes("plant") || key.includes("life")) return BiologySVG;
  if (key.includes("computer") || /\b(cs|it|ict)\b/.test(key) || key.includes("program") || key.includes("software")) return ComputerSVG;
  if (key.includes("pak") || key.includes("islam") || key.includes("isl") || key.includes("eng") || key.includes("urdu") || key.includes("lit") || key.includes("read") || key.includes("ethic")) return BookOpenSVG;
  if (/^\d{4}$/.test(key)) return CalendarSVG;
  return BookOpenSVG;
}

function formatClassBadge(raw?: string): string {
  if (!raw) return "";
  return raw.trim().replace(/^(class|grade)\s+/i, "");
}

export default function QuestionBankBrowseCard({
  title,
  subtitle,
  board,
  classLevel,
  watermark,
  subject,
  buttonLabel = "Explore",
  onClick,
  disabled = false,
  isLoading = false,
  isLocked = false,
  badge = null,
}: QuestionBankBrowseCardProps) {
  const Icon = resolveBrowseIcon(title, subject);
  const isYear = /^\d{4}$/.test(title.trim());
  const classBadge = formatClassBadge(classLevel);
  const cleanBadge = badge ? badge.replace(/[\[\]]/g, "").trim() : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(
        "group relative flex h-full min-h-60 sm:min-h-68 w-full flex-col overflow-hidden rounded-3xl bg-primary p-5 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 text-center",
        {
          "cursor-not-allowed opacity-40": disabled,
          "hover:-translate-y-1.5 hover:shadow-xl cursor-pointer": !disabled && !isLocked,
          "hover:-translate-y-1 hover:shadow-md cursor-pointer opacity-90": isLocked,
        },
      )}
    >
      {/* Ambient Lighting & Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-linear-to-br from-primary via-primary to-primary-dark",
            isLocked && "from-slate-800 via-slate-900 to-primary-dark/80"
          )}
        />
        <div className="absolute -right-8 -top-10 size-44 rounded-full bg-primary-foreground/10 blur-3xl transition-colors duration-700 group-hover:bg-primary-foreground/15" />
        <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-primary-foreground/5 blur-2xl" />

        {/* Dual Watermark Icons or Text Watermark */}
        {watermark ? (
          <span
            aria-hidden
            className="absolute -right-2 -top-2 text-7xl font-black tracking-tighter text-primary-foreground/[0.08] select-none transition-transform duration-700 group-hover:scale-105 sm:text-8xl"
          >
            {watermark}
          </span>
        ) : !isYear ? (
          <>
            <Icon className="absolute -right-4 -top-2 size-36 text-primary-foreground/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 sm:size-40" />
            <Icon className="absolute -bottom-6 -left-4 size-24 text-primary-foreground/10 sm:size-28" />
          </>
        ) : (
          <span
            aria-hidden
            className="absolute -right-2 -top-2 text-7xl font-black tracking-tighter text-primary-foreground/[0.08] select-none transition-transform duration-700 group-hover:scale-105 sm:text-8xl"
          >
            {title.slice(-2)}
          </span>
        )}
      </div>

      {/* Top Badges (Cognitive Level / Category Pill) */}
      <div className="relative z-20 flex items-center justify-between w-full min-h-6">
        {cleanBadge ? (
          <div className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-white text-primary text-xs sm:text-sm font-black shadow-md shrink-0 select-none">
            <span>{cleanBadge}</span>
          </div>
        ) : (
          <span />
        )}
      </div>

      {/* Centered Body */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <div
          className={cn(
            "mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-1 ring-primary-foreground/25 backdrop-blur-sm shadow-md transition-transform duration-500 group-hover:scale-105",
            isLocked && "bg-white/10 ring-amber-400/30"
          )}
        >
          {isLocked ? (
            <LockSVG className="size-6 sm:size-7 text-amber-300" />
          ) : classBadge ? (
            <span
              className={cn(
                "font-black text-primary-foreground select-none leading-none tracking-tight",
                classBadge.length <= 1
                  ? "text-2xl sm:text-3xl"
                  : classBadge.length === 2
                    ? "text-xl sm:text-2xl"
                    : "text-lg sm:text-xl",
              )}
            >
              {classBadge}
            </span>
          ) : (
            <Icon className="size-7 sm:size-8 text-primary-foreground" />
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-primary-foreground line-clamp-2">
          {title}
        </h3>

        <div className="mt-1.5 space-y-0.5">
          {board && (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75 truncate">
              {board}
            </p>
          )}
          {subtitle && (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/75 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Action Pill Button */}
      <div className="relative z-10 mt-4 flex items-center justify-center">
        {isLocked ? (
          <span className="inline-flex items-center justify-center rounded-full bg-white/15 px-3 py-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-200 backdrop-blur-sm ring-1 ring-white/20 shadow-md transition-transform duration-300 group-hover:scale-105 whitespace-nowrap">
            Coming Soon
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-transform duration-300 group-hover:scale-105">
            {isLoading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
            {isLoading ? "Opening…" : buttonLabel}
          </span>
        )}
      </div>
    </button>
  );
}
