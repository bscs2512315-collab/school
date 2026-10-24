"use client";

import React, { useState } from "react";
import { Copy, Video, Mic, Sparkles, Download, Layers } from "lucide-react";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import type { StoryEpisode, StoryScene } from "@/types/story";
import AppButton from "@/components/AppButton";

interface StoryboardPromptInspectorProps {
  episode: StoryEpisode;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
}

export function StoryboardPromptInspector({
  episode,
  activeSceneIndex,
  onSelectScene,
}: StoryboardPromptInspectorProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const activeScene: StoryScene = episode.scenes[activeSceneIndex] || episode.scenes[0];

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadFullJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(episode, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${episode.id}-storyboard.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-6 shadow-xs backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Layers className="size-4" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              AI Video Production Studio Inspector
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Export Midjourney/Flux scene prompts, ElevenLabs character voice profiles, and lip-sync configs.
          </p>
        </div>

        <AppButton
          type="button"
          size="sm"
          variant="outline"
          onClick={handleDownloadFullJson}
          className="h-9 gap-2 rounded-xl border border-border/80 bg-card hover:bg-muted font-bold text-xs"
        >
          <Download className="size-3.5 text-primary" />
          <span>Export Storyboard JSON</span>
        </AppButton>
      </div>

      {/* Scene Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {episode.scenes.map((scene, idx) => (
          <button
            key={scene.id}
            type="button"
            onClick={() => onSelectScene(idx)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeSceneIndex === idx
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "border border-border/70 bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>Scene {scene.sceneNumber}:</span>
            <span className="truncate max-w-[120px]">{scene.title}</span>
          </button>
        ))}
      </div>

      {/* Grid of Generation Parameters */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* 1. Visual & Image Prompt Card */}
        <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <Video className="size-4" />
              <span>1. Flux / Midjourney Scene Prompt</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(activeScene.productionPrompts.imagePrompt, "visual")}
              className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedSection === "visual" ? (
                <>
                  <CheckCircleSVG className="size-3 text-primary" />
                  <span className="text-primary font-black">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>

          {activeScene.backgroundImageUrl && (
            <div className="relative h-28 w-full overflow-hidden rounded-xl border border-border/60">
              <img
                src={activeScene.backgroundImageUrl}
                alt="Scene Preview"
                className="size-full object-cover"
              />
              <span className="absolute bottom-1.5 left-2 rounded-md bg-card/90 px-2 py-0.5 text-[9px] font-black text-foreground backdrop-blur-md border border-border/60">
                Scene Visual Background
              </span>
            </div>
          )}

          <div className="rounded-xl bg-muted/50 p-3 font-mono text-[11px] leading-relaxed text-foreground select-all">
            {activeScene.productionPrompts.imagePrompt}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">Camera Direction:</span>
            <span>{activeScene.productionPrompts.cameraMovement}</span>
          </div>
        </div>

        {/* 2. Voice & Audio Synthesis Card */}
        <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
              <Mic className="size-4" />
              <span>2. ElevenLabs Voice & Character</span>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  `[Urdu]: ${activeScene.dialogueUrdu}\n[English]: ${activeScene.dialogueEnglish}`,
                  "voice"
                )
              }
              className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedSection === "voice" ? (
                <>
                  <CheckCircleSVG className="size-3 text-primary" />
                  <span className="text-primary font-black">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy Dialogue</span>
                </>
              )}
            </button>
          </div>

          {/* Character Avatar & Dialogue Preview */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-2.5">
            {activeScene.character.avatarUrl ? (
              <img
                src={activeScene.character.avatarUrl}
                alt={activeScene.character.name}
                className="size-11 rounded-full object-cover object-top border-2 border-primary/40 shrink-0"
              />
            ) : null}
            <div>
              <p className="text-xs font-black text-foreground">{activeScene.character.name}</p>
              <p className="text-[10px] text-muted-foreground">{activeScene.character.title}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl bg-muted/50 p-2.5 text-xs">
              <span className="text-[10px] font-black uppercase text-muted-foreground">English:</span>
              <p className="mt-0.5 font-semibold text-foreground">{activeScene.dialogueEnglish}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2.5 text-xs text-right">
              <span className="text-[10px] font-black uppercase text-muted-foreground">اردو:</span>
              <p className="mt-0.5 font-medium text-foreground text-sm font-serif leading-relaxed">
                {activeScene.dialogueUrdu}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">
              Actor: {activeScene.productionPrompts.voicePrompt.actorName}
            </span>
            <span className="rounded-lg border border-border/70 bg-muted/60 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
              Emotion: {activeScene.productionPrompts.voicePrompt.emotion}
            </span>
          </div>
        </div>

        {/* 3. Lip-Sync & Face Motion Engine Card */}
        <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
            <Sparkles className="size-4" />
            <span>3. Lip-Sync Engine (Hedra / LivePortrait)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-muted/50 p-2 border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground">Engine</span>
              <p className="font-bold text-foreground mt-0.5 capitalize">
                {activeScene.productionPrompts.lipsyncParams.engine.replace("-", " ")}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2 border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground">Head Motion</span>
              <p className="font-bold text-foreground mt-0.5 capitalize">
                {activeScene.productionPrompts.lipsyncParams.headMovement}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2 border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground">Blink Rate</span>
              <p className="font-bold text-foreground mt-0.5 capitalize">
                {activeScene.productionPrompts.lipsyncParams.blinkRate}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Board Exam Connection Card */}
        <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4">
          <div className="text-xs font-black uppercase tracking-wider text-primary">
            4. Syllabus SLO & Board Exam Mapping
          </div>

          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-foreground">Key Exam Point:</p>
            <p className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-foreground leading-relaxed">
              {activeScene.examKeyPoint}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              <strong>Historical Context:</strong> {activeScene.historicalContextNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
