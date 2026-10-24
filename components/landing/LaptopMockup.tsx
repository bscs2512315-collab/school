"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LaptopMockupProps {
  children: React.ReactNode;
  className?: string;
  float?: boolean;
}

export function LaptopMockup({
  children,
  className,
  float = false,
}: LaptopMockupProps) {
  return (
    <div className={cn("relative w-full select-none", className, { "landing-float": float })}>
      {/* MacBook Pro Space Black Hardware Mockup */}
      <div className="relative">
        {/* Display Lid / Screen Frame */}
        <div className="relative rounded-t-[1.8rem] sm:rounded-t-[2.4rem] md:rounded-t-[2.8rem] border-[6px] sm:border-[9px] md:border-[11px] border-b-0 border-[#0a0d12] bg-[#0a0d12] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/15">
          {/* MacBook Camera Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 h-3 sm:h-4 md:h-4.5 w-16 sm:w-22 md:w-28 rounded-b-lg bg-[#0a0d12] flex items-center justify-center gap-1.5 border-b border-white/5">
            <span className="size-1 sm:size-1.5 rounded-full bg-[#161a22] ring-1 ring-white/20" />
            <span className="size-0.5 sm:size-1 rounded-full bg-emerald-400/90 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
          </div>

          {/* Screen Content */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[1rem] sm:rounded-t-[1.4rem] md:rounded-t-[1.7rem] bg-[#0d1117]">
            {children}
            {/* Subtle Screen Glare Reflection */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent z-20" />
          </div>
        </div>

        {/* Hinge */}
        <div className="relative -mt-px h-1 sm:h-1.5 w-full bg-[#050709] border-t border-white/10" />

        {/* MacBook Base / Bottom Chassis */}
        <div className="relative -mx-[2%] sm:-mx-[3.5%] md:-mx-[4%] h-4 sm:h-5.5 md:h-6.5 rounded-b-xl sm:rounded-b-2xl bg-gradient-to-b from-[#1e232d] via-[#12161f] to-[#080a0e] border-t border-white/25 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
          {/* Thumb indent / opening notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1.5 sm:h-2 w-16 sm:w-24 md:w-32 rounded-b-lg bg-[#080a0e] border-b border-white/10 shadow-inner" />
        </div>

        {/* Desk Contact Shadow */}
        <div className="mx-auto h-3 sm:h-5 w-[92%] rounded-full bg-black/80 blur-xl sm:blur-2xl pointer-events-none" />
      </div>
    </div>
  );
}

interface MobileMockupProps {
  children: React.ReactNode;
  className?: string;
  float?: boolean;
  time?: string;
  statusBarColor?: string;
}

export function MobileMockup({
  children,
  className,
  float = true,
  time = "16:31",
  statusBarColor = "bg-[#005f02]",
}: MobileMockupProps) {
  return (
    <div
      className={cn(
        "relative z-20 w-[120px] xs:w-[145px] sm:w-[170px] md:w-[200px] select-none transition-transform duration-300 hover:scale-105",
        float && "landing-float",
        className
      )}
      style={float ? { animationDelay: "-2.5s" } : undefined}
    >
      {/* iPhone 13 Pro Hardware Chassis */}
      <div className="relative rounded-[1.35rem] sm:rounded-[1.85rem] md:rounded-[2.25rem] border-[3.5px] sm:border-[4.5px] md:border-[5.5px] border-[#0a0d12] bg-[#0a0d12] p-0.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.88)] ring-1 ring-white/20">
        {/* Subtle Antenna bands on chassis sides */}
        <div className="pointer-events-none absolute -left-[3.5px] sm:-left-[4.5px] md:-left-[5.5px] top-10 sm:top-14 h-1.5 w-[2px] rounded-r-xs bg-slate-500/30" />
        <div className="pointer-events-none absolute -right-[3.5px] sm:-right-[4.5px] md:-right-[5.5px] top-10 sm:top-14 h-1.5 w-[2px] rounded-l-xs bg-slate-500/30" />

        {/* Screen Display Container */}
        <div className="relative w-full overflow-hidden rounded-[1.05rem] sm:rounded-[1.45rem] md:rounded-[1.8rem] bg-[#005f02] flex flex-col shadow-inner">
          {/* iOS Status Bar Row (At top edge, 0 gap with notch) */}
          <div
            className={cn(
              "relative z-30 flex h-[16px] xs:h-[19px] sm:h-[22px] md:h-[25px] w-full shrink-0 items-center justify-between px-2 xs:px-2.5 sm:px-3 text-white select-none",
              statusBarColor
            )}
          >
            {/* Left: Time */}
            <div className="flex items-center min-w-0 z-40">
              <span className="font-black text-[7.5px] xs:text-[8.5px] sm:text-[10px] md:text-[11.5px] tracking-tight leading-none text-white drop-shadow-xs">
                {time}
              </span>
            </div>

            {/* Middle: iPhone 13 Notch (Attached flush to top edge with 0 gap) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 h-[72%] w-[46%] max-w-[80px] xs:max-w-[95px] sm:max-w-[115px] md:max-w-[130px] rounded-b-[7px] xs:rounded-b-[9px] sm:rounded-b-[11px] md:rounded-b-[13px] bg-black flex items-center justify-center shadow-xs">
              {/* Top Earpiece Speaker Slit */}
              <div className="absolute top-[1px] sm:top-[1.5px] left-1/2 -translate-x-1/2 h-[1px] sm:h-[1.5px] w-4 xs:w-5 sm:w-7 md:w-8 rounded-full bg-[#1e232d] ring-[0.5px] ring-white/10" />

              {/* Front Camera Lens */}
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 size-1 xs:size-1.5 sm:size-2 rounded-full bg-[#0d131f] ring-[0.5px] ring-white/15 flex items-center justify-center">
                <div className="size-0.5 rounded-full bg-blue-400/50" />
              </div>
            </div>

            {/* Right: Status Icon (Battery) */}
            <div className="flex items-center text-white z-40 shrink-0">
              <svg
                className="h-1.5 xs:h-2 sm:h-2.5 md:h-3 w-auto"
                viewBox="0 0 26 12"
                fill="none"
              >
                <rect
                  x="0.75"
                  y="0.75"
                  width="21.5"
                  height="10.5"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <rect
                  x="2.5"
                  y="2.5"
                  width="15"
                  height="7"
                  rx="1.5"
                  fill="currentColor"
                />
                <path
                  d="M23.5 4.2C24.4 4.5 25 5.2 25 6s-.6 1.5-1.5 1.8v-3.6Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          {/* Screen Content Area (Strictly BELOW Status Bar & Notch with exact 390/844 ratio) */}
          <div className="relative aspect-[390/844] w-full overflow-hidden bg-background">
            {children}
            {/* Subtle Screen Glare Glass Reflection */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent z-20" />
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="pointer-events-none absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 sm:h-1 w-8 sm:w-12 rounded-full bg-slate-500/40 dark:bg-white/40 z-30" />
        </div>
      </div>
    </div>
  );
}
