"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionBankBreadcrumbProps {
  items: string[];
  onBack?: () => void;
  className?: string;
}

export default function QuestionBankBreadcrumb({
  items,
  onBack,
  className,
}: QuestionBankBreadcrumbProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-center gap-3", className)}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Back
        </button>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span className="text-muted-foreground/50">/</span> : null}
            <span
              className={cn("text-sm font-bold", {
                "text-foreground": index === items.length - 1,
                "text-muted-foreground": index !== items.length - 1,
              })}
            >
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
