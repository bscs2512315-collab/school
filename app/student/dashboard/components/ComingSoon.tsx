"use client";

import { Typography } from "@/components/ui/Typography";
import SparklesSVG from "@/public/svgs/SparklesSVG";

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
          <SparklesSVG className="size-5" />
        </div>
        <div>
          <Typography className="text-sm font-bold">More on the way</Typography>
          <Typography variant="muted" className="text-xs">
            Lab courses and new study tools are coming soon.
          </Typography>
        </div>
      </div>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary dark:bg-muted dark:text-foreground">
        In progress
      </span>
    </div>
  );
}
