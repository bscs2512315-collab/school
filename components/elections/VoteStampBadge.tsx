"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export default function VoteStampBadge({ className }: { className?: string }) {
  const filterId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 140 64"
      aria-hidden="true"
      className={cn(
        "pointer-events-none w-48 origin-center rotate-12 text-destructive drop-shadow-sm sm:w-56",
        className,
      )}
    >
      <defs>
        <filter id={filterId} x="-12%" y="-20%" width="124%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} fill="none" stroke="currentColor">
        <rect x="6" y="6" width="128" height="52" rx="8" strokeWidth="5" />
        <rect x="13" y="13" width="114" height="38" rx="5" strokeWidth="2.25" />
        <text
          x="70"
          y="40"
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontSize="22"
          fontWeight="900"
          letterSpacing="3"
          fontFamily="var(--font-poppins), ui-sans-serif, system-ui, sans-serif"
        >
          VOTE
        </text>
      </g>
    </svg>
  );
}
