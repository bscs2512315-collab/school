"use client";

import React from "react";
import type { AdminVideo } from "@/types/video";
import PlaySVG from "@/public/svgs/PlaySVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import GlobeSVG from "@/public/svgs/GlobeSVG";
import LockSVG from "@/public/svgs/LockSVG";
import ClockSVG from "@/public/svgs/ClockSVG";

interface VideoStudioStatsProps {
  videos: AdminVideo[];
}

export function VideoStudioStats({ videos }: VideoStudioStatsProps) {
  const totalVideos = videos.length;
  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
  const publishedCount = videos.filter((v) => v.visibility === "public").length;
  const draftOrUnlistedCount = videos.filter(
    (v) => v.visibility === "draft" || v.visibility === "unlisted"
  ).length;
  const totalSeconds = videos.reduce((acc, v) => acc + (v.durationSeconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Videos Card */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
          <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
          <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
            <PlaySVG className="size-20 sm:size-24 text-white" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
            <PlaySVG className="size-5 sm:size-6 text-white" />
          </div>
          <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
            Active
          </span>
        </div>

        <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
            {totalVideos}
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
            Total Videos
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
            Curriculum Lectures
          </p>
        </div>
      </div>

      {/* Total Views Card */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
          <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
          <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
            <EyeSVG className="size-20 sm:size-24 text-white" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
            <EyeSVG className="size-5 sm:size-6 text-white" />
          </div>
          <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
            Engagement
          </span>
        </div>

        <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
            {totalViews.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
            Total Views
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
            Student Impressions
          </p>
        </div>
      </div>

      {/* Published Live Card */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
          <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
          <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
            <GlobeSVG className="size-20 sm:size-24 text-white" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
            <GlobeSVG className="size-5 sm:size-6 text-white" />
          </div>
          <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
            Public
          </span>
        </div>

        <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
            {publishedCount} <span className="text-base sm:text-lg font-bold text-white/75">/ {totalVideos}</span>
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
            Public Live
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
            Live for Students
          </p>
        </div>
      </div>

      {/* Drafts & Unlisted Card */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
          <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
          <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
            <LockSVG className="size-20 sm:size-24 text-white" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
            <LockSVG className="size-5 sm:size-6 text-white" />
          </div>
          <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
            Private
          </span>
        </div>

        <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
            {draftOrUnlistedCount}
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
            Drafts & Unlisted
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
            Under Preparation
          </p>
        </div>
      </div>

      {/* Content Duration Card */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-linear-to-br from-sidebar-from via-primary to-sidebar-to">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -top-[35%] -right-[15%] size-[80%] rounded-full bg-white/20 blur-[30px]" />
          <div className="absolute -bottom-[35%] -left-[15%] size-[70%] rounded-full bg-black/25 blur-[25px]" />
          <div className="absolute -right-3 -top-3 opacity-15 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-25">
            <ClockSVG className="size-20 sm:size-24 text-white" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 ring-1 ring-white/30 text-white backdrop-blur-md shadow-xs transition-transform duration-300 group-hover:scale-105">
            <ClockSVG className="size-5 sm:size-6 text-white" />
          </div>
          <span className="rounded-full bg-white/20 border border-white/25 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
            1080p HD
          </span>
        </div>

        <div className="relative z-10 mt-3 sm:mt-4 min-w-0">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
            {totalHours} <span className="text-base sm:text-lg font-bold text-white/75">hrs</span>
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/95 truncate drop-shadow-xs">
            Content Duration
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-white/80 truncate">
            Total Lecture Hours
          </p>
        </div>
      </div>
    </div>
  );
}
