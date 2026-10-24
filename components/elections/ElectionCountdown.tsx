"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining } from "@/lib/elections/format";
import { ElectionStatus } from "@/types/enums";
import { cn } from "@/lib/utils";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function ElectionCountdown({
  startsAt,
  endsAt,
  status,
  tone = "default",
}: {
  startsAt: string;
  endsAt: string;
  status: ElectionStatus;
  tone?: "default" | "onPrimary";
}) {
  const target =
    status === ElectionStatus.UPCOMING ? startsAt : endsAt;
  const [remaining, setRemaining] = useState(() => getTimeRemaining(target));

  useEffect(() => {
    const tick = () => setRemaining(getTimeRemaining(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  let label = "Time remaining";
  if (status === ElectionStatus.ENDED) {
    label = "Voting closed";
  } else if (status === ElectionStatus.UPCOMING) {
    label = "Starts in";
  }

  const units = [
    { key: "days", value: remaining.days, suffix: "Days" },
    { key: "hours", value: remaining.hours, suffix: "Hours" },
    { key: "mins", value: remaining.minutes, suffix: "Mins" },
    { key: "secs", value: remaining.seconds, suffix: "Secs" },
  ];

  const onPrimary = tone === "onPrimary";

  return (
    <div
      className={cn("mx-auto w-full max-w-xl rounded-2xl p-4 shadow-sm", {
        "border border-border/60 bg-card/80 backdrop-blur-md": !onPrimary,
        "border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-md":
          onPrimary,
      })}
    >
      <p
        className={cn(
          "mb-3 text-center text-[10px] font-black uppercase tracking-widest",
          {
            "text-muted-foreground": !onPrimary,
            "text-primary-foreground/70": onPrimary,
          },
        )}
      >
        {label}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {units.map((unit) => (
          <div
            key={unit.key}
            className={cn("rounded-xl px-2 py-3 text-center", {
              "bg-muted/60": !onPrimary,
              "bg-primary-foreground/15": onPrimary,
            })}
          >
            <p
              className={cn("text-xl font-black tabular-nums sm:text-2xl", {
                "text-muted-foreground":
                  !onPrimary && status === ElectionStatus.ENDED,
                "text-foreground":
                  !onPrimary && status !== ElectionStatus.ENDED,
                "text-primary-foreground/50":
                  onPrimary && status === ElectionStatus.ENDED,
                "text-primary-foreground":
                  onPrimary && status !== ElectionStatus.ENDED,
              })}
            >
              {pad(unit.value)}
            </p>
            <p
              className={cn(
                "mt-1 text-[10px] font-bold uppercase tracking-widest",
                {
                  "text-muted-foreground": !onPrimary,
                  "text-primary-foreground/65": onPrimary,
                },
              )}
            >
              {unit.suffix}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
