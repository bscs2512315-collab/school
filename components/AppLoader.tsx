"use client";

import { cn } from "@/lib/utils";

interface AppLoaderProps {
  fullScreen?: boolean;
  inline?: boolean;
  className?: string;
  /** Multiplier for loader size. Default 1 → 48px. */
  size?: number;
}

export default function AppLoader({
  fullScreen = false,
  inline = false,
  className,
  size = 1,
}: AppLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        {
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm": fullScreen,
          "w-auto min-h-0 shrink-0": !fullScreen && inline,
          "w-full min-h-[50vh] flex-1": !fullScreen && !inline,
        },
        className,
      )}
      role={inline ? undefined : "status"}
      aria-hidden={inline || undefined}
      aria-label={inline ? undefined : "Loading"}
    >
      <span
        className="app-loader"
        style={{ ["--loader-scale" as string]: String(size) }}
        aria-hidden
      />
      {!inline && <span className="sr-only">Loading…</span>}
    </div>
  );
}
