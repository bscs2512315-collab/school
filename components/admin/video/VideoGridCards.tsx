"use client";

import React from "react";
import toast from "react-hot-toast";
import type { AdminVideo } from "@/types/video";
import { cn } from "@/lib/utils";
import PlaySVG from "@/public/svgs/PlaySVG";
import EditSVG from "@/public/svgs/EditSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import ShareSVG from "@/public/svgs/ShareSVG";
import GlobeSVG from "@/public/svgs/GlobeSVG";
import LockSVG from "@/public/svgs/LockSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import LikeSVG from "@/public/svgs/LikeSVG";
import AddSVG from "@/public/svgs/AddSVG";
import AppButton from "@/components/AppButton";

interface VideoGridCardsProps {
  videos: AdminVideo[];
  onPlay: (video: AdminVideo) => void;
  onEdit: (video: AdminVideo) => void;
  onDelete: (video: AdminVideo) => void;
  onUploadClick: () => void;
}

export function VideoGridCards({
  videos,
  onPlay,
  onEdit,
  onDelete,
  onUploadClick,
}: VideoGridCardsProps) {
  const handleCopyLink = (video: AdminVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(video.videoUrl);
    toast.success("Video URL copied to clipboard!");
  };

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/60 p-12 text-center space-y-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <PlaySVG className="size-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-foreground">No Video Lectures Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            No video lectures match your current filters.
          </p>
        </div>
        <AppButton
          onClick={onUploadClick}
          className="rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-primary/20 cursor-pointer"
        >
          <AddSVG className="mr-1.5 size-4" />
          <span>Upload First Video</span>
        </AppButton>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <div
          key={video.id}
          className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl dark:bg-card/90"
        >
          {/* 16:9 Thumbnail Header */}
          <div
            onClick={() => onPlay(video)}
            className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer"
          >
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-2xs">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform group-hover:scale-110">
                <PlaySVG className="size-6 text-white ml-0.5" />
              </div>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 rounded-lg bg-black/85 backdrop-blur-xs px-2 py-0.5 font-mono text-[10px] font-bold text-white border border-white/10">
              {video.formattedDuration}
            </div>

            {/* Visibility Badge */}
            <div className="absolute top-2.5 left-2.5">
              {video.visibility === "public" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                  <GlobeSVG className="size-2.5 text-white" />
                  <span>Public</span>
                </span>
              ) : video.visibility === "unlisted" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                  <EyeSVG className="size-2.5 text-white" />
                  <span>Unlisted</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                  <LockSVG className="size-2.5 text-white" />
                  <span>Draft</span>
                </span>
              )}
            </div>

            {/* Subject Pill */}
            <div className="absolute top-2.5 right-2.5">
              <span className="rounded-lg bg-black/75 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/15">
                {video.subject}
              </span>
            </div>
          </div>

          {/* Card Content Details */}
          <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 space-y-3">
            <div className="space-y-1.5">
              <h4
                onClick={() => onPlay(video)}
                className="text-sm font-extrabold text-foreground hover:text-primary cursor-pointer line-clamp-2 leading-snug transition-colors"
              >
                {video.title}
              </h4>

              {video.urduTitle && (
                <p className="font-serif text-xs font-semibold text-primary truncate">
                  {video.urduTitle}
                </p>
              )}

              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {video.description}
              </p>

              {/* SLO chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {video.sloTags?.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Meta & Action Bar */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <EyeSVG className="size-3 text-muted-foreground" />
                  {video.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <LikeSVG className="size-3 text-primary" />
                  {video.likes}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(video)}
                  title="Edit video"
                  className="flex size-7.5 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:bg-primary/15 hover:text-primary active:scale-95 cursor-pointer shadow-2xs"
                >
                  <EditSVG className="size-3.5 text-current" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(video, e)}
                  title="Copy share link"
                  className="flex size-7.5 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:bg-primary/15 hover:text-primary active:scale-95 cursor-pointer shadow-2xs"
                >
                  <ShareSVG className="size-3.5 text-current" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(video)}
                  title="Delete video"
                  className="flex size-7.5 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-600 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <DeleteSVG className="size-3.5 text-current" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
