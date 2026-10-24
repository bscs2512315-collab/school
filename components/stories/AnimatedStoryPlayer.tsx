"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Languages,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Radio,
  Quote,
} from "lucide-react";
import PlaySVG from "@/public/svgs/PlaySVG";
import type { StoryEpisode, StoryScene } from "@/types/story";
import { cn } from "@/lib/utils";

interface AnimatedStoryPlayerProps {
  episode: StoryEpisode;
  activeSceneIndex?: number;
  onSceneChange?: (sceneIndex: number) => void;
}

const SCENE_AUDIO_MAP: Record<string, string> = {
  "scene-1": "/audio/lectures/lahore_resolution/scene_1.m4a",
  "scene-2": "/audio/lectures/lahore_resolution/scene_2.m4a",
  "scene-3": "/audio/lectures/lahore_resolution/scene_3.m4a",
  "scene-4": "/audio/lectures/lahore_resolution/scene_4.m4a",
};

// Full-Frame Visuals per scene for cinematic documentary presentation
const SCENE_HERO_VISUALS: Record<
  string,
  {
    heroImage: string;
    locationTag: string;
    keyQuote?: string;
    speakerBadge: { name: string; title: string; role: string; avatar: string };
  }
> = {
  "scene-1": {
    heroImage: "/stories/bg_minto_park_1940.jpg",
    locationTag: "MINTO PARK, LAHORE • MARCH 23, 1940",
    keyQuote: "Over 100,000 delegates gathered for the 27th All India Muslim League Annual Session",
    speakerBadge: {
      name: "Zain",
      title: "History Explorer & Student Narrator",
      role: "Narrating live from Minto Park, 1940",
      avatar: "/stories/zain_teen.jpg",
    },
  },
  "scene-2": {
    heroImage: "/stories/fazlul_huq.jpg",
    locationTag: "HISTORIC ROSTRUM • MINTO PARK",
    keyQuote: "“No constitutional plan will be workable without sovereign Muslim states.”",
    speakerBadge: {
      name: "Maulvi A.K. Fazlul Huq (Sher-e-Bangla)",
      title: "Premier of Bengal",
      role: "Official Mover of the Lahore Resolution (1940)",
      avatar: "/stories/fazlul_huq.jpg",
    },
  },
  "scene-3": {
    heroImage: "/stories/quaid_jinnah.jpg",
    locationTag: "PRESIDENTIAL ADDRESS • 27TH SESSION",
    keyQuote: "“Hindus and Muslims belong to two distinct civilizations.”",
    speakerBadge: {
      name: "Quaid-e-Azam Muhammad Ali Jinnah",
      title: "President, All India Muslim League",
      role: "Articulating the Two-Nation Theory",
      avatar: "/stories/quaid_jinnah.jpg",
    },
  },
  "scene-4": {
    heroImage: "/stories/ayla_teen.jpg",
    locationTag: "HISTORICAL MILESTONE • MARCH 24, 1940 → 14 AUGUST 1947",
    keyQuote: "“Passed unanimously — leading directly to the birth of Pakistan in 7 years.”",
    speakerBadge: {
      name: "Ayla",
      title: "History & Board Exam Strategist",
      role: "Curriculum & Historical Milestone Review",
      avatar: "/stories/ayla_teen.jpg",
    },
  },
};

export function AnimatedStoryPlayer({
  episode,
  activeSceneIndex: controlledSceneIndex,
  onSceneChange,
}: AnimatedStoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [sceneCurrentTime, setSceneCurrentTime] = useState(0);
  const [sceneDuration, setSceneDuration] = useState(12);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleLang, setSubtitleLang] = useState<"bilingual" | "urdu" | "english">("bilingual");
  const [speechAmplitude, setSpeechAmplitude] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const scenes = episode.scenes || [];
  const activeScene: StoryScene = scenes[currentSceneIdx] || scenes[0];
  const heroVisual =
    SCENE_HERO_VISUALS[activeScene.id] || SCENE_HERO_VISUALS["scene-1"];

  // Calculate cumulative timestamps for all scenes
  const sceneStartTimes: number[] = [];
  let cumulative = 0;
  for (const s of scenes) {
    sceneStartTimes.push(cumulative);
    cumulative += s.durationSeconds;
  }
  const totalEpisodeDuration = cumulative || episode.totalDurationSeconds || 52;

  const currentTotalTime = (sceneStartTimes[currentSceneIdx] || 0) + sceneCurrentTime;

  // Format MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Switch Scene handler
  const goToScene = useCallback(
    (idx: number, autoPlay: boolean = true) => {
      const clamped = Math.max(0, Math.min(scenes.length - 1, idx));
      setCurrentSceneIdx(clamped);
      setSceneCurrentTime(0);
      onSceneChange?.(clamped);

      if (audioRef.current) {
        const audioSrc =
          SCENE_AUDIO_MAP[scenes[clamped]?.id] ||
          `/audio/lectures/lahore_resolution/scene_${clamped + 1}.m4a`;
        audioRef.current.src = audioSrc;
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = playbackSpeed;

        if (autoPlay) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    },
    [scenes, onSceneChange, playbackSpeed]
  );

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const initialSrc =
      SCENE_AUDIO_MAP[scenes[0]?.id] || "/audio/lectures/lahore_resolution/scene_1.m4a";
    audio.src = initialSrc;

    const handleTimeUpdate = () => {
      setSceneCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setSceneDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setSceneDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      // Auto-advance to next scene if available
      setCurrentSceneIdx((prev) => {
        if (prev < scenes.length - 1) {
          const next = prev + 1;
          setTimeout(() => goToScene(next, true), 150);
          return prev;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [scenes, goToScene]);

  // Audio-reactive viseme speech simulation loop
  useEffect(() => {
    let phase = 0;
    const updateSpeech = () => {
      if (isPlaying) {
        phase += 0.25 * playbackSpeed;
        const speechWave = Math.max(0, Math.sin(phase) * Math.cos(phase * 1.7) * 1.2);
        setSpeechAmplitude(speechWave);
      } else {
        setSpeechAmplitude(0);
      }
      animFrameRef.current = requestAnimationFrame(updateSpeech);
    };

    animFrameRef.current = requestAnimationFrame(updateSpeech);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Sync with external scene selection if provided
  useEffect(() => {
    if (
      typeof controlledSceneIndex === "number" &&
      controlledSceneIndex >= 0 &&
      controlledSceneIndex < scenes.length &&
      controlledSceneIndex !== currentSceneIdx
    ) {
      goToScene(controlledSceneIndex, isPlaying);
    }
  }, [controlledSceneIndex, scenes.length, currentSceneIdx, goToScene, isPlaying]);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  // Seeking along the full timeline
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTotalTime = clickRatio * totalEpisodeDuration;

    let accumulated = 0;
    for (let i = 0; i < scenes.length; i++) {
      const dur = scenes[i].durationSeconds;
      if (targetTotalTime >= accumulated && targetTotalTime <= accumulated + dur) {
        const sceneOffset = targetTotalTime - accumulated;
        if (i !== currentSceneIdx) {
          goToScene(i, isPlaying);
          setTimeout(() => {
            if (audioRef.current) audioRef.current.currentTime = sceneOffset;
          }, 100);
        } else {
          if (audioRef.current) audioRef.current.currentTime = sceneOffset;
          setSceneCurrentTime(sceneOffset);
        }
        return;
      }
      accumulated += dur;
    }
  };

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.max(0, Math.min(sceneDuration, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setSceneCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    if (clamped === 0) {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.muted = true;
    } else {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) audioRef.current.muted = nextMuted;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "f") {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === "m") {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSkip(-5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSkip(5);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePlay]);

  const totalProgressPercent = (currentTotalTime / totalEpisodeDuration) * 100;
  const sceneProgressRatio = sceneDuration > 0 ? sceneCurrentTime / sceneDuration : 0;

  // Cinematic Pan & Zoom values per scene (60fps Ken Burns camera flow)
  const cameraZoom = 1.04 + sceneProgressRatio * 0.14;
  const cameraPanX =
    currentSceneIdx === 0
      ? -15 + sceneProgressRatio * 30
      : currentSceneIdx === 1
      ? 12 - sceneProgressRatio * 24
      : currentSceneIdx === 2
      ? -10 + sceneProgressRatio * 20
      : 8 - sceneProgressRatio * 16;

  const cameraPanY =
    currentSceneIdx === 1
      ? -5 + sceneProgressRatio * 10
      : currentSceneIdx === 2
      ? 5 - sceneProgressRatio * 10
      : 0;

  return (
    <div className="space-y-3 select-none">
      {/* 16:9 Video Theater Screen */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className={cn(
          "group relative aspect-video w-full overflow-hidden rounded-3xl border-2 border-border/80 bg-black shadow-2xl transition-all",
          isFullscreen && "rounded-none border-none size-full"
        )}
      >
        {/* Full-Frame Cinematic Scene Footage with 60fps Ken Burns Camera Flow */}
        <div
          className="absolute inset-0 size-full overflow-hidden transition-transform duration-700 ease-out"
          style={{
            transform: `scale(${cameraZoom}) translate3d(${cameraPanX}px, ${cameraPanY}px, 0px)`,
          }}
        >
          <img
            src={heroVisual.heroImage}
            alt={activeScene.title}
            className="size-full object-cover filter brightness-[0.88] contrast-[1.08] saturate-[1.05]"
          />
          {/* Film Grain & Cinematic Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/70 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none opacity-60" />
        </div>

        {/* Ambient Historical Lighting & Particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
          <div className="absolute top-1/4 left-1/4 size-3 rounded-full bg-emerald-400/30 blur-md animate-pulse" />
          <div className="absolute top-1/3 right-1/4 size-4 rounded-full bg-amber-400/25 blur-lg animate-ping duration-1000" />
        </div>

        {/* Top TV Documentary Header Overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          {/* Location & Scene Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-black/75 px-3 py-1 text-xs font-black text-emerald-400 backdrop-blur-md shadow-lg">
              <Radio className="size-3 animate-pulse text-emerald-400" />
              <span>{heroVisual.locationTag}</span>
            </div>
          </div>

          {/* Broadcast Status & Equalizer */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block font-mono text-[10px] font-bold text-white/70 uppercase tracking-widest bg-black/60 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-md">
              HD • 1080P
            </span>
            {isPlaying && (
              <div className="flex items-end gap-1 h-5 rounded-full bg-black/75 px-3 py-1 border border-primary/30 backdrop-blur-md">
                <span className="w-1 bg-primary rounded-full animate-[bounce_0.6s_infinite_100ms] h-full" />
                <span className="w-1 bg-primary rounded-full animate-[bounce_0.6s_infinite_300ms] h-3/5" />
                <span className="w-1 bg-primary rounded-full animate-[bounce_0.6s_infinite_200ms] h-4/5" />
                <span className="w-1 bg-primary rounded-full animate-[bounce_0.6s_infinite_400ms] h-full" />
              </div>
            )}
          </div>
        </div>

        {/* On-Screen Historical Key Quote / Fact Callout Card */}
        {heroVisual.keyQuote && (
          <div className="pointer-events-none absolute top-16 sm:top-20 left-4 sm:left-6 z-15 max-w-sm sm:max-w-md animate-in fade-in slide-in-from-left-3 duration-500">
            <div className="flex items-start gap-2.5 rounded-2xl border border-white/15 bg-black/70 p-3 sm:p-3.5 backdrop-blur-md shadow-2xl">
              <Quote className="size-4 shrink-0 text-primary mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold text-white/95 leading-snug drop-shadow-sm">
                {heroVisual.keyQuote}
              </p>
            </div>
          </div>
        )}

        {/* TV Documentary Lower-Third Speaker Banner (Bottom-Left) */}
        <div className="pointer-events-none absolute bottom-18 sm:bottom-22 left-4 sm:left-6 z-20 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/85 p-2.5 pr-4 shadow-2xl backdrop-blur-md">
            {/* Speaker Thumbnail */}
            <div className="relative size-11 sm:size-13 overflow-hidden rounded-xl border border-primary/50 bg-zinc-900 shrink-0">
              <img
                src={heroVisual.speakerBadge.avatar}
                alt={heroVisual.speakerBadge.name}
                className="size-full object-cover"
              />
            </div>

            {/* Speaker Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-xs sm:text-sm font-black text-white truncate drop-shadow-sm">
                  {heroVisual.speakerBadge.name}
                </h4>
              </div>
              <p className="text-[11px] font-bold text-primary truncate">
                {heroVisual.speakerBadge.title}
              </p>
              <p className="text-[10px] text-white/70 truncate">
                {heroVisual.speakerBadge.role}
              </p>
            </div>
          </div>
        </div>

        {/* Big Center Play/Pause Trigger */}
        {!isPlaying && (
          <div
            onClick={handleTogglePlay}
            className="absolute inset-0 z-25 flex items-center justify-center bg-black/45 cursor-pointer transition-opacity backdrop-blur-xs"
          >
            <div className="flex size-18 sm:size-22 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform hover:scale-110 active:scale-95 ring-8 ring-primary/20">
              <PlaySVG className="size-8 sm:size-10 ml-1" />
            </div>
          </div>
        )}

        {/* Synchronized Subtitles (Captions) Banner */}
        {showSubtitles && (
          <div className="pointer-events-none absolute inset-x-4 bottom-16 sm:bottom-20 z-20 flex justify-center">
            <div className="max-w-2xl rounded-2xl border border-white/15 bg-black/90 px-4 py-2.5 text-center shadow-2xl backdrop-blur-md space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {(subtitleLang === "urdu" || subtitleLang === "bilingual") && activeScene.dialogueUrdu && (
                <p
                  dir="rtl"
                  className="font-serif text-sm sm:text-base md:text-lg font-bold text-primary leading-relaxed drop-shadow-md"
                >
                  &ldquo;{activeScene.dialogueUrdu}&rdquo;
                </p>
              )}
              {(subtitleLang === "english" || subtitleLang === "bilingual") &&
                activeScene.dialogueEnglish && (
                  <p className="text-xs sm:text-sm font-medium text-white/95 leading-snug drop-shadow-sm">
                    {activeScene.dialogueEnglish}
                  </p>
                )}
            </div>
          </div>
        )}

        {/* Bottom YouTube-Style Controls Overlay */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-3 sm:p-4 pt-8 transition-opacity duration-300",
            showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Progress Timeline Scrubber with Scene Chapter Breaks */}
          <div
            onClick={handleSeek}
            className="group/scrubber relative mb-2.5 h-2 hover:h-3 w-full cursor-pointer rounded-full bg-white/20 transition-all"
          >
            {/* Playback Fill */}
            <div
              className="relative h-full rounded-full bg-primary transition-all duration-100"
              style={{ width: `${totalProgressPercent}%` }}
            >
              {/* Scrub Handle */}
              <div className="absolute right-0 top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white shadow-md ring-2 ring-primary opacity-0 group-hover/scrubber:opacity-100 transition-opacity" />
            </div>

            {/* Scene Chapter Break Dots */}
            {scenes.map((s, idx) => {
              const markerPercent = ((sceneStartTimes[idx] || 0) / totalEpisodeDuration) * 100;
              if (markerPercent <= 0) return null;
              return (
                <div
                  key={s.id}
                  className="absolute top-0 bottom-0 w-0.5 bg-black/70 z-10"
                  style={{ left: `${markerPercent}%` }}
                  title={`Scene ${s.sceneNumber}: ${s.title}`}
                />
              );
            })}
          </div>

          {/* Control Bar */}
          <div className="flex items-center justify-between gap-2 text-white">
            {/* Left Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Previous Scene */}
              <button
                type="button"
                onClick={() => goToScene(currentSceneIdx - 1, isPlaying)}
                disabled={currentSceneIdx === 0}
                className="flex size-8 items-center justify-center rounded-xl hover:bg-white/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                title="Previous Scene"
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex size-9 items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? (
                  <Pause className="size-5 fill-current" />
                ) : (
                  <PlaySVG className="size-5" />
                )}
              </button>

              {/* Next Scene */}
              <button
                type="button"
                onClick={() => goToScene(currentSceneIdx + 1, isPlaying)}
                disabled={currentSceneIdx === scenes.length - 1}
                className="flex size-8 items-center justify-center rounded-xl hover:bg-white/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                title="Next Scene"
              >
                <ChevronRight className="size-4" />
              </button>

              {/* 10s Rewind */}
              <button
                type="button"
                onClick={() => handleSkip(-10)}
                className="flex size-8 items-center justify-center rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                title="Rewind 10s (←)"
              >
                <RotateCcw className="size-4" />
              </button>

              {/* 10s Forward */}
              <button
                type="button"
                onClick={() => handleSkip(10)}
                className="flex size-8 items-center justify-center rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                title="Forward 10s (→)"
              >
                <RotateCw className="size-4" />
              </button>

              {/* Volume Button & Slider */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="flex size-8 items-center justify-center rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                  title={isMuted ? "Unmute (M)" : "Mute (M)"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-4 text-destructive" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="size-4" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="hidden sm:inline-block w-16 h-1 accent-primary cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  title="Volume"
                />
              </div>

              {/* Time Display */}
              <div className="font-mono text-xs text-white/80 pl-1">
                <span>{formatTime(currentTotalTime)}</span>
                <span className="text-white/40"> / </span>
                <span>{formatTime(totalEpisodeDuration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Subtitles (CC) Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!showSubtitles) {
                    setShowSubtitles(true);
                    setSubtitleLang("bilingual");
                  } else if (subtitleLang === "bilingual") {
                    setSubtitleLang("urdu");
                  } else if (subtitleLang === "urdu") {
                    setSubtitleLang("english");
                  } else {
                    setShowSubtitles(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-all",
                  showSubtitles
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-white/70 hover:bg-white/20"
                )}
                title="Toggle Captions"
              >
                <Languages className="size-3.5" />
                <span className="uppercase text-[10px]">
                  {showSubtitles ? subtitleLang : "CC OFF"}
                </span>
              </button>

              {/* Speed Switcher */}
              <button
                type="button"
                onClick={() => {
                  const nextSpeed =
                    playbackSpeed === 1
                      ? 1.25
                      : playbackSpeed === 1.25
                      ? 1.5
                      : playbackSpeed === 1.5
                      ? 2
                      : playbackSpeed === 2
                      ? 0.75
                      : 1;
                  handleSpeedChange(nextSpeed);
                }}
                className="flex items-center rounded-xl px-2.5 py-1 text-xs font-bold text-white/80 hover:bg-white/20 transition-all"
                title="Playback Speed"
              >
                <span>{playbackSpeed}x</span>
              </button>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="flex size-8 items-center justify-center rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
