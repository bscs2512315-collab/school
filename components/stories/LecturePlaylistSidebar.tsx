"use client";

import React from "react";
import {
  ListVideo,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import PlaySVG from "@/public/svgs/PlaySVG";
import type { StoryEpisode, StoryScene } from "@/types/story";
import { cn } from "@/lib/utils";

interface LecturePlaylistSidebarProps {
  episode: StoryEpisode;
  activeSceneIndex: number;
  onSelectScene: (sceneIndex: number) => void;
  className?: string;
}

export function LecturePlaylistSidebar({
  episode,
  activeSceneIndex,
  onSelectScene,
  className,
}: LecturePlaylistSidebarProps) {
  const scenes = episode.scenes || [];

  // Calculate cumulative timestamps
  const sceneTimestamps: { start: number; end: number; duration: number }[] = [];
  let currentSec = 0;
  for (const s of scenes) {
    sceneTimestamps.push({
      start: currentSec,
      end: currentSec + s.durationSeconds,
      duration: s.durationSeconds,
    });
    currentSec += s.durationSeconds;
  }

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4", className)}>
      {/* Sidebar Header */}
      <div className="space-y-1.5 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ListVideo className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Lecture Timeline & Scenes</h3>
            <p className="text-[11px] text-muted-foreground">
              {scenes.length} Scenes · {Math.floor(episode.totalDurationSeconds / 60)}m {episode.totalDurationSeconds % 60}s Total Duration
            </p>
          </div>
        </div>
      </div>

      {/* Scene Items List */}
      <div className="space-y-2">
        {scenes.map((scene, idx) => {
          const isActive = activeSceneIndex === idx;
          const ts = sceneTimestamps[idx] || { start: 0, end: 12, duration: 12 };
          const bgThumb = scene.backgroundImageUrl || "/stories/bg_minto_park_1940.jpg";
          const charAvatar = scene.character.avatarUrl || "/stories/zain_teen.jpg";

          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSelectScene(idx)}
              className={cn(
                "group relative flex w-full gap-3 rounded-2xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5",
                isActive
                  ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/25"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-card"
              )}
            >
              {/* Thumbnail Container */}
              <div className="relative h-18 w-28 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                <img
                  src={bgThumb}
                  alt={scene.title}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Character Inset Bubble */}
                <div className="absolute top-1 left-1 size-7 overflow-hidden rounded-full border border-white/80 shadow-md">
                  <img
                    src={charAvatar}
                    alt={scene.character.name}
                    className="size-full object-cover"
                  />
                </div>

                {/* Animated Equalizer / Playing Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  {isActive ? (
                    <div className="flex items-end gap-0.5 h-4">
                      <span className="w-1 bg-primary rounded-full animate-[bounce_0.8s_infinite_100ms] h-full" />
                      <span className="w-1 bg-primary rounded-full animate-[bounce_0.8s_infinite_200ms] h-3/4" />
                      <span className="w-1 bg-primary rounded-full animate-[bounce_0.8s_infinite_300ms] h-full" />
                    </div>
                  ) : (
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <PlaySVG className="size-3.5" />
                    </div>
                  )}
                </div>

                {/* Timestamp Range Badge */}
                <span className="absolute bottom-1 right-1 rounded-md bg-black/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white">
                  {formatSec(ts.start)}
                </span>
              </div>

              {/* Scene Metadata */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[10px] font-black text-primary">
                    Scene {scene.sceneNumber} · {scene.character.name.split(" ")[0]}
                  </span>
                  <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
                    {ts.duration}s
                  </span>
                </div>

                <h4
                  className={cn(
                    "line-clamp-2 text-xs font-bold leading-snug transition-colors",
                    isActive ? "text-primary font-black" : "text-foreground group-hover:text-primary"
                  )}
                >
                  {scene.title}
                </h4>

                <p className="truncate text-[10px] text-muted-foreground">
                  {scene.character.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Curriculum Context Pill */}
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>Curriculum Alignment</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Federal & Punjab Board Class IX/X Pakistan Studies • Chapter 4: Movement for Pakistan (1940-1947).
        </p>
      </div>
    </div>
  );
}
