"use client";

import React from "react";
import { X } from "lucide-react";
import type { AdminVideo } from "@/types/video";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AppButton from "@/components/AppButton";

interface VideoDeleteModalProps {
  video: AdminVideo | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (videoId: string) => void;
}

export function VideoDeleteModal({
  video,
  isOpen,
  onClose,
  onConfirmDelete,
}: VideoDeleteModalProps) {
  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-xs">
              <DeleteSVG className="size-6 text-current" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">Delete Video?</h3>
              <p className="text-xs text-muted-foreground font-medium">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Video Card Preview */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-20 aspect-video rounded-xl object-cover border border-border/60 shadow-2xs"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate">{video.title}</h4>
            <p className="text-[11px] text-muted-foreground truncate">
              {video.subject} · {video.formattedDuration}
            </p>
          </div>
        </div>

        {/* Warning text */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Deleting this video will remove it from the student portal and all linked curriculum
          playlists immediately.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <AppButton
            variant="destructive"
            onClick={() => {
              onConfirmDelete(video.id);
              onClose();
            }}
            className="rounded-xl px-5 py-2.5 text-xs font-black shadow-md shadow-rose-600/30 cursor-pointer"
          >
            <DeleteSVG className="size-4 mr-1.5 text-white" />
            <span>Delete Permanently</span>
          </AppButton>
        </div>
      </div>
    </div>
  );
}
