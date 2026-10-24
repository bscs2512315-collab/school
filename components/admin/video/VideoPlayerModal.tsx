"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react";
import toast from "react-hot-toast";
import type { AdminVideo } from "@/types/video";
import { formatSecondsToTime } from "@/types/video";
import { cn } from "@/lib/utils";
import PlaySVG from "@/public/svgs/PlaySVG";
import EditSVG from "@/public/svgs/EditSVG";
import ShareSVG from "@/public/svgs/ShareSVG";
import GlobeSVG from "@/public/svgs/GlobeSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import LockSVG from "@/public/svgs/LockSVG";
import LikeSVG from "@/public/svgs/LikeSVG";
import QuestionBankSVG from "@/public/svgs/QuestionBankSVG";

interface VideoPlayerModalProps {
  video: AdminVideo | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (video: AdminVideo) => void;
}

export function VideoPlayerModal({
  video,
  isOpen,
  onClose,
  onEdit,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeTab, setActiveTab] = useState<"chapters" | "slos" | "captions">("chapters");
  const [showCaptions, setShowCaptions] = useState(true);
  const [selectedCaptionLang, setSelectedCaptionLang] = useState<"English" | "Urdu">("English");

  useEffect(() => {
    if (isOpen && video) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen, video]);

  if (!isOpen || !video) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || video.durationSeconds);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSeekToMoment = (timeSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeSeconds;
      setCurrentTime(timeSeconds);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(video.videoUrl);
    toast.success("Lecture share link copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-card/90 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <PlaySVG className="size-4.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-foreground truncate">
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate font-medium">
                {video.subject} · {video.grade} · Chapter {video.chapterNumber}: {video.chapterName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(video);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
            >
              <EditSVG className="size-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Copy share link"
            >
              <ShareSVG className="size-4 text-current" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 2 Column Layout */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* LEFT 8 COLUMNS: Video Player & Controls & Details */}
          <div className="space-y-4 p-4 sm:p-6 lg:col-span-8 border-b lg:border-b-0 lg:border-r border-border/60">
            {/* Custom 16:9 Video Player Theater */}
            <div className="relative group aspect-video overflow-hidden rounded-2xl bg-black shadow-lg">
              <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                className="h-full w-full object-contain cursor-pointer"
              />

              {/* Center Big Play Button (when paused) */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/35 cursor-pointer backdrop-blur-2xs"
                >
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110">
                    <PlaySVG className="size-8 text-white ml-1" />
                  </div>
                </div>
              )}

              {/* Subtitle / Caption Overlay */}
              {showCaptions && (
                <div className="pointer-events-none absolute bottom-14 inset-x-4 flex justify-center">
                  <span className="rounded-xl bg-black/85 backdrop-blur-sm px-3.5 py-1.5 text-center font-bold text-white text-xs sm:text-sm max-w-lg shadow-md border border-white/10">
                    {selectedCaptionLang === "Urdu" && video.urduTitle
                      ? video.urduTitle
                      : `[${video.subject}] Chapter ${video.chapterNumber}: ${video.title}`}
                  </span>
                </div>
              )}

              {/* Player Bottom Control Bar */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 space-y-2 opacity-95">
                {/* Seekbar */}
                <input
                  type="range"
                  min={0}
                  max={duration || video.durationSeconds || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-primary h-1.5 cursor-pointer bg-white/30 rounded-lg"
                />

                <div className="flex items-center justify-between text-white text-xs font-bold">
                  {/* Left Controls: Play, Vol, Time */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="size-5 fill-white" />
                      ) : (
                        <PlaySVG className="size-5 text-white" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="hover:text-primary transition-colors cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 accent-white h-1 bg-white/30 rounded cursor-pointer hidden sm:inline"
                      />
                    </div>

                    <span className="font-mono text-[11px] text-white/90">
                      {formatSecondsToTime(Math.floor(currentTime))} /{" "}
                      {formatSecondsToTime(Math.floor(duration || video.durationSeconds))}
                    </span>
                  </div>

                  {/* Right Controls: Speed, CC, Fullscreen */}
                  <div className="flex items-center gap-2.5">
                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 text-[11px]">
                      {[1, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => handleSpeedChange(speed)}
                          className={cn(
                            "rounded-lg px-2 py-0.5 font-mono font-bold transition-colors cursor-pointer",
                            playbackRate === speed
                              ? "bg-primary text-white"
                              : "text-white/70 hover:text-white"
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    {/* CC Subtitles Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowCaptions(!showCaptions)}
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-black border transition-colors cursor-pointer",
                        showCaptions
                          ? "border-primary bg-primary text-white"
                          : "border-white/30 text-white/70 hover:text-white"
                      )}
                    >
                      CC
                    </button>

                    {/* Fullscreen */}
                    <button
                      type="button"
                      onClick={handleFullscreen}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      <Maximize className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info Details */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
                <div className="space-y-1">
                  <h1 className="text-base sm:text-lg font-black text-foreground">
                    {video.title}
                  </h1>
                  {video.urduTitle && (
                    <p className="text-sm font-serif text-primary font-bold">
                      {video.urduTitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {video.visibility === "public" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      <GlobeSVG className="size-3.5 text-primary" />
                      <span>Public</span>
                    </span>
                  ) : video.visibility === "unlisted" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <EyeSVG className="size-3.5 text-amber-500" />
                      <span>Unlisted</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/25 bg-slate-500/10 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <LockSVG className="size-3.5 text-slate-500" />
                      <span>Draft</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics & Engagement Bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5 text-foreground font-bold">
                  <EyeSVG className="size-3.5 text-muted-foreground" />
                  {video.views.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1.5 text-foreground font-bold">
                  <LikeSVG className="size-3.5 text-primary" />
                  {video.likes.toLocaleString()} likes
                </span>
                <span className="flex items-center gap-1.5 text-foreground font-bold">
                  <QuestionBankSVG className="size-3.5 text-muted-foreground" />
                  {video.commentsCount} student questions
                </span>
                <span>•</span>
                <span>Published {new Date(video.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Description Box */}
              <div className="rounded-3xl border border-border/70 bg-muted/30 p-4 text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                {video.description}
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: Chapters, SLOs & Captions */}
          <div className="space-y-4 p-4 sm:p-6 lg:col-span-4 bg-muted/10">
            {/* Tab Bar */}
            <div className="flex rounded-2xl border border-border/70 bg-muted/60 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("chapters")}
                className={cn(
                  "flex-1 rounded-xl py-1.5 transition-all text-center cursor-pointer",
                  activeTab === "chapters"
                    ? "bg-primary text-white shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Chapters ({video.keyMoments?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("slos")}
                className={cn(
                  "flex-1 rounded-xl py-1.5 transition-all text-center cursor-pointer",
                  activeTab === "slos"
                    ? "bg-primary text-white shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                SLOs ({video.sloTags?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("captions")}
                className={cn(
                  "flex-1 rounded-xl py-1.5 transition-all text-center cursor-pointer",
                  activeTab === "captions"
                    ? "bg-primary text-white shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Subtitles
              </button>
            </div>

            {/* TAB 1: Key Chapters / Timestamps */}
            {activeTab === "chapters" && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Click any timestamp to jump directly:
                </p>
                <div className="space-y-2">
                  {video.keyMoments && video.keyMoments.length > 0 ? (
                    video.keyMoments.map((moment, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSeekToMoment(moment.timeSeconds)}
                        className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3 cursor-pointer transition-all hover:border-primary/40 hover:bg-primary/5 shadow-2xs"
                      >
                        <span className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          {moment.formattedTime}
                        </span>
                        <span className="text-xs font-bold text-foreground leading-snug">
                          {moment.title}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-6 text-center text-xs text-muted-foreground">
                      No chapter timestamps recorded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SLOs */}
            {activeTab === "slos" && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Associated curriculum learning outcomes:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {video.sloTags && video.sloTags.length > 0 ? (
                    video.sloTags.map((slo, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-xl border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
                      >
                        <span>{slo}</span>
                      </span>
                    ))
                  ) : (
                    <div className="w-full rounded-2xl border border-dashed border-border/70 bg-card/40 p-6 text-center text-xs text-muted-foreground">
                      No SLO tags linked.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Captions / Subtitles */}
            {activeTab === "captions" && (
              <div className="space-y-3">
                <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedCaptionLang("English")}
                    className={cn(
                      "flex-1 rounded-lg py-1 transition-all text-center cursor-pointer",
                      selectedCaptionLang === "English"
                        ? "bg-card text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground"
                    )}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCaptionLang("Urdu")}
                    className={cn(
                      "flex-1 rounded-lg py-1 transition-all text-center cursor-pointer",
                      selectedCaptionLang === "Urdu"
                        ? "bg-card text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground"
                    )}
                  >
                    اردو (Urdu)
                  </button>
                </div>

                <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-border/70 bg-card p-3 text-xs leading-relaxed text-foreground font-medium">
                  {selectedCaptionLang === "English" ? (
                    video.captions?.find((c) => c.language === "English")?.text || (
                      <p className="text-muted-foreground italic">
                        [Auto-Generated Subtitles] Welcome to {video.subject} chapter {video.chapterNumber}. In this lecture, we explore {video.title}.
                      </p>
                    )
                  ) : (
                    <p className="font-serif text-right text-xs leading-loose">
                      {video.captions?.find((c) => c.language === "Urdu")?.text ||
                        video.urduTitle ||
                        "اردو سب ٹائٹلز دستیاب ہیں۔"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
