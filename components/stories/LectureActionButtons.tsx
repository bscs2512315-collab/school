"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Bookmark,
  BookmarkCheck,
  Check,
  FileQuestion,
} from "lucide-react";
import { StarDuotoneIcon } from "./StarDuotoneIcon";
import { cn } from "@/lib/utils";

interface LectureActionButtonsProps {
  episodeId: string;
  episodeTitle: string;
  onOpenExamQuestions?: () => void;
}

export function LectureActionButtons({
  episodeId,
  episodeTitle,
  onOpenExamQuestions,
}: LectureActionButtonsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load persistent user interaction for this episode
  useEffect(() => {
    try {
      const likedState = localStorage.getItem(`exboard_lecture_liked_${episodeId}`);
      if (likedState === "true") {
        setIsLiked(true);
        setLikesCount(1);
      } else {
        setIsLiked(false);
        setLikesCount(0);
      }

      const savedState = localStorage.getItem(`exboard_lecture_saved_${episodeId}`);
      setIsSaved(savedState === "true");
    } catch {
      // Ignore localStorage read errors
    }
  }, [episodeId]);

  const handleToggleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount(nextState ? 1 : 0);
    try {
      localStorage.setItem(`exboard_lecture_liked_${episodeId}`, String(nextState));
    } catch {
      // Ignore storage write errors
    }
  };

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined" && navigator.share) {
        await navigator.share({
          title: episodeTitle,
          text: `Watch this animated Pakistan Studies lecture on ExBoard AI!`,
          url: window.location.href,
        });
      } else if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // User cancelled share
    }
  };

  const handleToggleSave = () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      localStorage.setItem(`exboard_lecture_saved_${episodeId}`, String(nextState));
    } catch {
      // Ignore storage write errors
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
      {/* Clean Like Button with Duotone Star */}
      <button
        type="button"
        onClick={handleToggleLike}
        className={cn(
          "group flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-200 active:scale-95",
          isLiked
            ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
            : "border-border bg-card text-foreground hover:border-amber-500/30 hover:bg-muted/60"
        )}
      >
        <StarDuotoneIcon
          size={16}
          isFilled={isLiked}
          className={cn(
            "transition-transform",
            isLiked ? "scale-110 text-amber-500" : "group-hover:text-amber-500"
          )}
        />
        <span>{isLiked ? "Liked" : "Like"}</span>
        {likesCount > 0 && (
          <span className="font-mono text-[11px] text-amber-500 font-bold">
            ({likesCount})
          </span>
        )}
      </button>

      {/* Share Button */}
      <button
        type="button"
        onClick={handleShare}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition-all duration-200 hover:bg-muted/60 hover:border-primary/40 active:scale-95",
          copied && "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
        )}
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-bold">Link Copied</span>
          </>
        ) : (
          <>
            <Share2 className="size-3.5 text-muted-foreground" />
            <span>Share</span>
          </>
        )}
      </button>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleToggleSave}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-200 active:scale-95",
          isSaved
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-card text-foreground hover:bg-muted/60 hover:border-primary/40"
        )}
      >
        {isSaved ? (
          <>
            <BookmarkCheck className="size-3.5 text-primary" />
            <span className="font-bold text-primary">Saved</span>
          </>
        ) : (
          <>
            <Bookmark className="size-3.5 text-muted-foreground" />
            <span>Save</span>
          </>
        )}
      </button>

      {/* Exam Questions Button */}
      {onOpenExamQuestions && (
        <button
          type="button"
          onClick={onOpenExamQuestions}
          className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary transition-all duration-200 hover:bg-primary/15 active:scale-95"
        >
          <FileQuestion className="size-3.5" />
          <span>Exam Questions</span>
        </button>
      )}
    </div>
  );
}
