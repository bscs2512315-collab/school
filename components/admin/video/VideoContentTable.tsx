"use client";

import React, { useState } from "react";
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
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";
import AddSVG from "@/public/svgs/AddSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import AppButton from "@/components/AppButton";

interface VideoContentTableProps {
  videos: AdminVideo[];
  onPlay: (video: AdminVideo) => void;
  onEdit: (video: AdminVideo) => void;
  onDelete: (video: AdminVideo) => void;
  onUploadClick: () => void;
}

export function VideoContentTable({
  videos,
  onPlay,
  onEdit,
  onDelete,
  onUploadClick,
}: VideoContentTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(videos.map((v) => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

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
            No video lectures match your current search and filter criteria. Upload a new video to get started.
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
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header */}
          <thead className="border-b border-border/70 bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === videos.length && videos.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded accent-primary size-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3.5 min-w-[340px]">Video Content</th>
              <th className="px-4 py-3.5">Visibility</th>
              <th className="px-4 py-3.5">Subject & Class</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Views</th>
              <th className="px-4 py-3.5">Likes</th>
              <th className="px-4 py-3.5">Questions</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border/60">
            {videos.map((video) => {
              const isSelected = selectedIds.includes(video.id);

              return (
                <tr
                  key={video.id}
                  className={cn(
                    "group transition-colors hover:bg-muted/40",
                    isSelected && "bg-primary/5"
                  )}
                >
                  {/* Selection Checkbox */}
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(video.id)}
                      className="rounded accent-primary size-4 cursor-pointer"
                    />
                  </td>

                  {/* Video Thumbnail & Info */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-3.5">
                      {/* Thumbnail with duration badge and play hover */}
                      <div
                        onClick={() => onPlay(video)}
                        className="group/thumb relative w-36 aspect-video shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border/80 bg-black shadow-2xs"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                        />
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity backdrop-blur-2xs">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform group-hover/thumb:scale-110">
                            <PlaySVG className="size-4.5 text-white ml-0.5" />
                          </div>
                        </div>
                        {/* Duration pill */}
                        <div className="absolute bottom-1 right-1 rounded-md bg-black/85 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                          {video.formattedDuration}
                        </div>
                      </div>

                      {/* Title & Info */}
                      <div className="space-y-1 min-w-0 max-w-md">
                        <h4
                          onClick={() => onPlay(video)}
                          className="font-extrabold text-foreground hover:text-primary cursor-pointer line-clamp-2 leading-snug transition-colors text-xs sm:text-[13px]"
                        >
                          {video.title}
                        </h4>

                        {video.urduTitle && (
                          <p className="font-serif text-[11px] font-semibold text-primary truncate">
                            {video.urduTitle}
                          </p>
                        )}

                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {video.description}
                        </p>

                        {/* SLO chips */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {video.sloTags?.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                          {video.sloTags && video.sloTags.length > 3 && (
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              +{video.sloTags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Visibility */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {video.visibility === "public" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <GlobeSVG className="size-3 shrink-0 text-primary" />
                        <span>Public</span>
                      </span>
                    ) : video.visibility === "unlisted" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        <EyeSVG className="size-3 shrink-0 text-amber-500" />
                        <span>Unlisted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/25 bg-slate-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        <LockSVG className="size-3 shrink-0 text-slate-500" />
                        <span>Draft</span>
                      </span>
                    )}
                  </td>

                  {/* Subject & Class */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-foreground block">{video.subject}</span>
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        {video.grade}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground font-semibold text-[11px]">
                    {new Date(video.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>

                  {/* Views */}
                  <td className="px-4 py-3.5 whitespace-nowrap font-black text-foreground">
                    <span className="inline-flex items-center gap-1">
                      <EyeSVG className="size-3 text-muted-foreground" />
                      {video.views.toLocaleString()}
                    </span>
                  </td>

                  {/* Likes */}
                  <td className="px-4 py-3.5 whitespace-nowrap font-black text-foreground">
                    <span className="inline-flex items-center gap-1">
                      <LikeSVG className="size-3 text-primary" />
                      {video.likes.toLocaleString()}
                    </span>
                  </td>

                  {/* Questions */}
                  <td className="px-4 py-3.5 whitespace-nowrap font-black text-foreground">
                    <span className="inline-flex items-center gap-1">
                      <QuestionBankSVG className="size-3 text-muted-foreground" />
                      {video.commentsCount}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Play Preview */}
                      <button
                        type="button"
                        onClick={() => onPlay(video)}
                        title="Watch video preview"
                        className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:bg-primary/15 hover:text-primary active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <PlaySVG className="size-3.5 text-current" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(video)}
                        title="Edit video details"
                        className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:bg-primary/15 hover:text-primary active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <EditSVG className="size-3.5 text-current" />
                      </button>

                      {/* Share Link */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(video, e)}
                        title="Copy share link"
                        className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:bg-primary/15 hover:text-primary active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <ShareSVG className="size-3.5 text-current" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDelete(video)}
                        title="Delete video"
                        className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-600 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <DeleteSVG className="size-3.5 text-current" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
