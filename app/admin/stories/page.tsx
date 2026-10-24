"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { X, List, LayoutGrid } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import AppSelect from "@/components/AppSelect";
import PlaySVG from "@/public/svgs/PlaySVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import AddSVG from "@/public/svgs/AddSVG";
import SearchSVG from "@/public/svgs/SearchSVG";
import RefreshSVG from "@/public/svgs/RefreshSVG";
import { cn } from "@/lib/utils";

import type { AdminVideo } from "@/types/video";
import {
  getStoredVideos,
  saveStoredVideos,
  INITIAL_CURATED_VIDEOS,
} from "@/types/video";
import { VideoStudioStats } from "@/components/admin/video/VideoStudioStats";
import { VideoContentTable } from "@/components/admin/video/VideoContentTable";
import { VideoGridCards } from "@/components/admin/video/VideoGridCards";
import { YouTubeVideoUploaderModal } from "@/components/admin/video/YouTubeVideoUploaderModal";
import { VideoEditModal } from "@/components/admin/video/VideoEditModal";
import { VideoPlayerModal } from "@/components/admin/video/VideoPlayerModal";
import { VideoDeleteModal } from "@/components/admin/video/VideoDeleteModal";

// AI generator components for secondary tab
import type { StoryEpisode } from "@/types/story";
import {
  SAMPLE_EPISODE_LAHORE_RESOLUTION,
  ALL_SAMPLE_EPISODES,
} from "@/lib/ai/storyboard-generator";
import { AnimatedStoryPlayer } from "@/components/stories/AnimatedStoryPlayer";
import { StoryboardPromptInspector } from "@/components/stories/StoryboardPromptInspector";

const SUBJECT_FILTER_OPTIONS = [
  { value: "All Subjects", label: "All Subjects" },
  { value: "Pakistan Studies", label: "Pakistan Studies" },
  { value: "Physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Biology", label: "Biology" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "Computer Science", label: "Computer Science" },
];

const VISIBILITY_FILTER_OPTIONS = [
  { value: "all", label: "All Visibility" },
  { value: "public", label: "Public Only" },
  { value: "unlisted", label: "Unlisted Only" },
  { value: "draft", label: "Draft Only" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "views", label: "Most Views" },
  { value: "duration", label: "Longest Duration" },
  { value: "title", label: "Title (A-Z)" },
];

const GRADE_SELECT_OPTIONS = [
  { value: "Grade 9 & 10", label: "Grade 9 & 10 (Matric & O-Level)" },
  { value: "Grade 11 & 12", label: "Grade 11 & 12 (Inter & A-Level)" },
  { value: "Middle School", label: "Grade 6, 7 & 8" },
];

export default function AdminVideoStudioPage() {
  // Studio Active Mode: "videos" (Video Studio) vs "ai-generator" (AI Screenplay Studio)
  const [activeTab, setActiveTab] = useState<"videos" | "ai-generator">("videos");

  // Video List & Storage
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AdminVideo | null>(null);
  const [playingVideo, setPlayingVideo] = useState<AdminVideo | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<AdminVideo | null>(null);

  // AI Screenplay Generator State (for secondary tab)
  const [activeEpisode, setActiveEpisode] = useState<StoryEpisode>(SAMPLE_EPISODE_LAHORE_RESOLUTION);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [topicInput, setTopicInput] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Grade 9 & 10");
  const [selectedSceneCount, setSelectedSceneCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const loaded = getStoredVideos();
    setVideos(loaded);
    setIsHydrated(true);
  }, []);

  // Filter & Sort Logic
  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = v.title?.toLowerCase().includes(q);
          const matchUrdu = v.urduTitle?.toLowerCase().includes(q);
          const matchDesc = v.description?.toLowerCase().includes(q);
          const matchChapter = v.chapterName?.toLowerCase().includes(q);
          const matchSlo = v.sloTags?.some((tag) => tag.toLowerCase().includes(q));
          if (!matchTitle && !matchUrdu && !matchDesc && !matchChapter && !matchSlo) {
            return false;
          }
        }

        // Subject filter
        if (selectedSubject !== "All Subjects") {
          if (v.subject !== selectedSubject) return false;
        }

        // Visibility filter
        if (selectedVisibility !== "all") {
          if (v.visibility !== selectedVisibility) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "views") {
          return (b.views || 0) - (a.views || 0);
        }
        if (sortBy === "duration") {
          return (b.durationSeconds || 0) - (a.durationSeconds || 0);
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [videos, searchQuery, selectedSubject, selectedVisibility, sortBy]);

  // Handle Upload Success
  const handleUploadSuccess = (newVideo: AdminVideo) => {
    const updated = [newVideo, ...videos];
    setVideos(updated);
    saveStoredVideos(updated);
  };

  // Handle Save Edit
  const handleSaveEdit = (updatedVideo: AdminVideo) => {
    const updated = videos.map((v) => (v.id === updatedVideo.id ? updatedVideo : v));
    setVideos(updated);
    saveStoredVideos(updated);
  };

  // Handle Delete Video
  const handleDeleteVideo = (videoId: string) => {
    const updated = videos.filter((v) => v.id !== videoId);
    setVideos(updated);
    saveStoredVideos(updated);
    toast.success("Video deleted from library");
  };

  // Restore Initial Demo Seeds
  const handleResetSeeds = () => {
    setVideos(INITIAL_CURATED_VIDEOS);
    saveStoredVideos(INITIAL_CURATED_VIDEOS);
    toast.success("Restored sample curriculum video lectures!");
  };

  // AI Script Generation Handler
  const handleGenerateScript = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicOrSlo: topicInput,
          chapterName: "Pakistan Studies",
          grade: selectedGrade,
          sceneCount: selectedSceneCount,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.data) {
        throw new Error(data?.error || "Could not generate screenplay");
      }
      setActiveEpisode(data.data);
      setActiveSceneIndex(0);
      toast.success("AI Screenplay generated successfully!");
    } catch (err) {
      console.error("Admin generation error:", err);
      toast.error(err instanceof Error ? err.message : "Could not generate screenplay");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Lectures Studio"
        description="Centralized studio for uploading, managing, and publishing curriculum video lectures with dual subtitles, SLO checkpoints, and chapter timestamps."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tab Switcher */}
            <div className="flex rounded-xl sm:rounded-2xl border border-border/60 bg-muted/60 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg sm:rounded-xl px-3 sm:px-3.5 py-1.5 transition-all cursor-pointer",
                  activeTab === "videos"
                    ? "bg-primary text-white shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <PlaySVG className="size-3.5 text-current" />
                <span>Video Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai-generator")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg sm:rounded-xl px-3 sm:px-3.5 py-1.5 transition-all cursor-pointer",
                  activeTab === "ai-generator"
                    ? "bg-primary text-white shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <SparklesSVG className="size-3.5 text-current" />
                <span>AI Script Studio</span>
              </button>
            </div>

            {/* Primary Action Button: Upload Video */}
            <AppButton
              onClick={() => setIsUploadModalOpen(true)}
              className="rounded-xl h-11 sm:h-12 px-6 font-bold shadow-lg shadow-primary/20 cursor-pointer"
            >
              <AddSVG className="mr-2 size-5" />
              Upload Video
            </AppButton>
          </div>
        }
      />

      {/* TAB 1: VIDEO STUDIO & CONTENT MANAGER */}
      {activeTab === "videos" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Analytics Stats Overview */}
          <VideoStudioStats videos={videos} />

          {/* CONTROL TOOLBAR: Search, Reusable Dropdown Filters, Sort, Grid/Table Toggle */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 rounded-2xl sm:rounded-3xl border border-border/70 bg-card p-4 shadow-xs">
            {/* Search Bar with duotone SearchSVG */}
            <div className="relative flex-1 min-w-[240px]">
              <SearchSVG className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title, description, chapter, or SLO code..."
                className="h-11 w-full rounded-xl border border-border/60 bg-background pl-10 pr-9 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Reusable AppSelect Dropdowns & Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Subject Filter (Reusable AppSelect) */}
              <div className="w-44 sm:w-48">
                <AppSelect
                  value={selectedSubject}
                  options={SUBJECT_FILTER_OPTIONS}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  placeholder="All Subjects"
                  className="h-11 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Visibility Filter (Reusable AppSelect) */}
              <div className="w-36 sm:w-40">
                <AppSelect
                  value={selectedVisibility}
                  options={VISIBILITY_FILTER_OPTIONS}
                  onChange={(e) => setSelectedVisibility(e.target.value)}
                  placeholder="All Visibility"
                  className="h-11 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Sort By (Reusable AppSelect) */}
              <div className="w-36 sm:w-40">
                <AppSelect
                  value={sortBy}
                  options={SORT_OPTIONS}
                  onChange={(e) => setSortBy(e.target.value)}
                  placeholder="Sort By"
                  className="h-11 rounded-xl text-xs font-bold"
                />
              </div>

              {/* View Mode Toggle (Table / Grid) */}
              <div className="flex rounded-xl border border-border/70 bg-muted/60 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "rounded-lg p-2 transition-all cursor-pointer",
                    viewMode === "table"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Table List View"
                >
                  <List className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg p-2 transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>

              {/* Reset Seeds */}
              <button
                type="button"
                onClick={handleResetSeeds}
                title="Reset to default sample curriculum videos"
                className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer shadow-2xs"
              >
                <RefreshSVG className="size-4 text-current" />
              </button>
            </div>
          </div>

          {/* CONTENT VIEW: Table or Grid */}
          {viewMode === "table" ? (
            <VideoContentTable
              videos={filteredVideos}
              onPlay={(video) => setPlayingVideo(video)}
              onEdit={(video) => setEditingVideo(video)}
              onDelete={(video) => setDeletingVideo(video)}
              onUploadClick={() => setIsUploadModalOpen(true)}
            />
          ) : (
            <VideoGridCards
              videos={filteredVideos}
              onPlay={(video) => setPlayingVideo(video)}
              onEdit={(video) => setEditingVideo(video)}
              onDelete={(video) => setDeletingVideo(video)}
              onUploadClick={() => setIsUploadModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* TAB 2: AI SCREENPLAY & STORYBOARD GENERATOR */}
      {activeTab === "ai-generator" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Generation Controls */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <SparklesSVG className="size-4.5" />
                  </div>
                  <h3 className="text-sm font-black text-foreground">AI Screenplay Generator</h3>
                </div>

                {/* Topic / SLO Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Target Syllabus SLO or Topic
                  </label>
                  <textarea
                    rows={3}
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="E.g., SLO 4.2 - Key clauses and presentation of Lahore Resolution 1940, or 1973 Constitution Islamic provisions..."
                    className="w-full rounded-xl border border-border/70 bg-background/80 p-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Target Grade (Reusable AppSelect) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Target Grade</label>
                  <AppSelect
                    value={selectedGrade}
                    options={GRADE_SELECT_OPTIONS}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="h-11 rounded-xl text-xs font-bold"
                  />
                </div>

                {/* Scene Count */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-foreground">Scene Count</span>
                    <span className="text-primary font-mono">{selectedSceneCount} Scenes</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={6}
                    value={selectedSceneCount}
                    onChange={(e) => setSelectedSceneCount(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                {/* Trigger Button */}
                <AppButton
                  type="button"
                  onClick={handleGenerateScript}
                  disabled={isGenerating || !topicInput.trim()}
                  className="w-full h-11 rounded-xl font-black text-xs shadow-md shadow-primary/20 gap-2 cursor-pointer"
                >
                  <SparklesSVG className="size-4 text-white" />
                  <span>
                    {isGenerating ? "Synthesizing Screenplay..." : "Generate AI Lecture Script"}
                  </span>
                </AppButton>
              </div>

              {/* Quick Sample Selector */}
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Curated Presets:
                </span>
                <div className="space-y-1.5">
                  {ALL_SAMPLE_EPISODES.map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        setActiveEpisode(ep);
                        setActiveSceneIndex(0);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs font-bold transition-all cursor-pointer",
                        activeEpisode.id === ep.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{ep.title}</span>
                      <span className="text-[10px] font-mono opacity-80">{ep.sloIds[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 2 Columns: Live Preview & Storyboard Inspector */}
            <div className="space-y-4 lg:col-span-2">
              <AnimatedStoryPlayer
                episode={activeEpisode}
                onSceneChange={(idx) => setActiveSceneIndex(idx)}
              />
              <StoryboardPromptInspector
                episode={activeEpisode}
                activeSceneIndex={activeSceneIndex}
                onSelectScene={(idx) => setActiveSceneIndex(idx)}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. YouTube Multi-Step Video Uploader Modal */}
      <YouTubeVideoUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* 2. Edit Video Modal */}
      <VideoEditModal
        video={editingVideo}
        isOpen={!!editingVideo}
        onClose={() => setEditingVideo(null)}
        onSave={handleSaveEdit}
      />

      {/* 3. Theater Video Player Preview Modal */}
      <VideoPlayerModal
        video={playingVideo}
        isOpen={!!playingVideo}
        onClose={() => setPlayingVideo(null)}
        onEdit={(v) => {
          setPlayingVideo(null);
          setEditingVideo(v);
        }}
      />

      {/* 4. Delete Video Confirmation Modal */}
      <VideoDeleteModal
        video={deletingVideo}
        isOpen={!!deletingVideo}
        onClose={() => setDeletingVideo(null)}
        onConfirmDelete={handleDeleteVideo}
      />
    </PageContainer>
  );
}
