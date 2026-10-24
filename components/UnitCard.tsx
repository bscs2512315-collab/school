"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import PracticalJournalSVG from "@/public/svgs/PracticalJournalSVG";
import { Typography } from "./ui/Typography";
import { cn } from "@/lib/utils";

interface UnitCardProps {
  chapterNumber: number;
  chapterName: string;
  onClick?: () => void;
  onViewSLOs?: () => void;
  className?: string;
}

export default function UnitCard({
  chapterNumber,
  chapterName,
  onClick,
  onViewSLOs,
  className,
}: UnitCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewSLOs = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    onViewSLOs?.();
  };
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 sm:rounded-3xl sm:p-5",
        className,
      )}
    >
      <SyllabusSVG
        aria-hidden
        className="pointer-events-none absolute right-0 top-2 size-20 text-primary/10 transition-transform duration-500 group-hover:scale-105 sm:size-24"
      />

      <div className="relative z-10 flex flex-1 gap-3 sm:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground sm:size-12 sm:rounded-2xl sm:text-base">
          {chapterNumber}
        </div>

        <div className="min-w-0 space-y-1">
          <Typography className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Unit {chapterNumber}
          </Typography>
          <Typography className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base">
            {chapterName}
          </Typography>
        </div>
      </div>

      {onViewSLOs ? (
        <div className="relative z-10 mt-4 border-t border-border/50 pt-3 sm:mt-5 sm:pt-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleViewSLOs}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary/8 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-80 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Opening...</span>
              </>
            ) : (
              <>
                <PracticalJournalSVG className="size-4" />
                <span>View SLOs</span>
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
