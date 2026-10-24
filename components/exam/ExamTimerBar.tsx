"use client";

import ClockSVG from "@/public/svgs/ClockSVG";
import { cn } from "@/lib/utils";

interface ExamTimerBarProps {
  timeLeft?: number;
  formatTime?: (seconds: number) => string;
  leadingLabel?: string;
  leadingValue?: string;
  progressLabel: string;
  progressValue: number;
  progressTotal: number;
  isLowTime?: boolean;
}

export default function ExamTimerBar({
  timeLeft,
  formatTime,
  leadingLabel,
  leadingValue,
  progressLabel,
  progressValue,
  progressTotal,
  isLowTime = false,
}: ExamTimerBarProps) {
  const showTimer = typeof timeLeft === "number" && typeof formatTime === "function";

  return (
    <div className="shrink-0 py-3 lg:py-4">
      <div className="flex items-center justify-between gap-6 lg:gap-12">
        {showTimer ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Time Remaining
            </p>
            <div
              className={cn(
                "mt-0.5 flex items-center gap-2 font-mono text-lg font-bold sm:text-2xl",
                {
                  "text-destructive": isLowTime,
                },
              )}
            >
              <ClockSVG className="size-6 sm:size-7 shrink-0" />
              {formatTime(timeLeft)}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {leadingLabel}
            </p>
            <p className="mt-0.5 text-lg font-bold text-foreground sm:text-2xl">{leadingValue}</p>
          </div>
        )}
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {progressLabel}
          </p>
          <p className="mt-0.5 text-sm font-bold text-primary sm:text-base">
            {progressValue}
            <span className="font-medium text-muted-foreground"> / {progressTotal}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
