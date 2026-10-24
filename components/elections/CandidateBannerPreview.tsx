"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import CandidateBanner from "@/components/elections/CandidateBanner";
import type {
  CandidateBannerCandidate,
  CandidateBannerElection,
} from "@/components/elections/CandidateBanner";

const POSTER_WIDTH = 520;

export default function CandidateBannerPreview({
  election,
  candidate,
  onClose,
  fitToViewport = false,
}: {
  election: CandidateBannerElection;
  candidate: CandidateBannerCandidate;
  onClose?: () => void;
  fitToViewport?: boolean;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    if (!fitToViewport) return;
    const node = captureRef.current;
    if (!node) return;

    const update = () => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      if (!w || !h) return;
      const availW = (displayRef.current?.clientWidth ?? window.innerWidth) * 0.95;
      const availH = window.innerHeight;
      const s = Math.min(1, availW / w, availH / h);
      setMetrics({ scale: s, height: h * s });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    window.addEventListener("resize", update);
    const timer = window.setTimeout(update, 600);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.clearTimeout(timer);
    };
  }, [fitToViewport]);

  return (
    <div className="flex w-full flex-col items-center">
      {onClose ? (
        <div className="mb-2 flex w-full shrink-0 items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg backdrop-blur transition hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <div
        ref={displayRef}
        className="relative flex w-full justify-center overflow-hidden"
        style={fitToViewport && metrics.height ? { height: metrics.height } : undefined}
      >
        <div
          aria-hidden
          ref={captureRef}
          className="pointer-events-none absolute top-0 left-[-9999px]"
          style={{ width: POSTER_WIDTH }}
        >
          <CandidateBanner election={election} candidate={candidate} />
        </div>

        <div
          className={cn(
            fitToViewport ? "w-[520px] shrink-0" : "w-full max-w-[520px]",
          )}
          style={
            fitToViewport
              ? {
                  transform: `scale(${metrics.scale})`,
                  transformOrigin: "top center",
                  transition: "transform 200ms ease",
                }
              : undefined
          }
        >
          <CandidateBanner election={election} candidate={candidate} />
        </div>
      </div>
    </div>
  );
}