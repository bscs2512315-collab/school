"use client";

import { ElectionStatus } from "@/types/enums";
import { cn } from "@/lib/utils";

const LABELS: Record<ElectionStatus, string> = {
  [ElectionStatus.UPCOMING]: "Upcoming",
  [ElectionStatus.LIVE]: "Live",
  [ElectionStatus.ENDED]: "Ended",
};

export default function ElectionStatusBadge({
  status,
}: {
  status: ElectionStatus;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
        {
          "bg-primary/10 text-primary": status === ElectionStatus.LIVE,
          "bg-muted text-muted-foreground": status === ElectionStatus.UPCOMING,
          "bg-destructive/10 text-destructive": status === ElectionStatus.ENDED,
        },
      )}
    >
      {LABELS[status]}
    </span>
  );
}
