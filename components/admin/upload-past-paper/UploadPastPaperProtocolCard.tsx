"use client";

import type { LucideIcon } from "lucide-react";
import AppButton from "@/components/AppButton";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface UploadPastPaperProtocolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  badge?: string;
  disabled?: boolean;
  onAction: () => void;
}

export default function UploadPastPaperProtocolCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  badge,
  disabled = false,
  onAction,
}: UploadPastPaperProtocolCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-80 flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all sm:p-7",
        {
          "opacity-60": disabled,
        },
      )}
    >
      <div className="relative flex-1">
        {badge ? (
          <span className="absolute top-0 right-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            {badge}
          </span>
        ) : null}

        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" />
        </div>

        <Typography variant="h4" className="mb-3 font-bold">
          {title}
        </Typography>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <AppButton
        onClick={onAction}
        disabled={disabled}
        className="mt-6 h-12 w-full rounded-2xl font-semibold"
      >
        {actionLabel}
      </AppButton>
    </div>
  );
}
