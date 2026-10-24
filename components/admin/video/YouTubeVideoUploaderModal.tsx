"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import {
  X,
  Upload,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import type { AdminVideo, VideoKeyMoment, VideoVisibility } from "@/types/video";
import { formatSecondsToTime, parseTimeToSeconds } from "@/types/video";
import { cn } from "@/lib/utils";
import AppSelect from "@/components/AppSelect";
import AppButton from "@/components/AppButton";
import PlaySVG from "@/public/svgs/PlaySVG";
import AddSVG from "@/public/svgs/AddSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import GlobeSVG from "@/public/svgs/GlobeSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import LockSVG from "@/public/svgs/LockSVG";
import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";

interface YouTubeVideoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (video: AdminVideo) => void;
}

const PRESET_THUMBNAILS = [
  {
    name: "Pakistan Studies / History",
    url: "https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=1280&q=80",
  },
  {
    name: "Physics / Mechanics",
    url: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1280&q=80",
  },
  {
    name: "Biology / Cells & Genetics",
    url: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=1280&q=80",
  },
  {
    name: "Mathematics / Calculus & Algebra",
    url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1280&q=80",
  },
  {
    name: "Chemistry / Lab & Molecules",
    url: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1280&q=80",
  },
];

const SAMPLE_DEMO_VIDEOS = [
  {
    name: "Demo Video 1 (Standard 1080p)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: 596,
  },
  {
    name: "Demo Video 2 (Animation Sample)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: 653,
  },
  {
    name: "Demo Video 3 (Lab Clip)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: 15,
  },
];

const SUBJECT_OPTIONS = [
  { value: "Pakistan Studies", label: "Pakistan Studies" },
  { value: "Physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Biology", label: "Biology" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "Computer Science", label: "Computer Science" },
  { value: "English", label: "English" },
  { value: "Urdu", label: "Urdu" },
  { value: "Islamiat", label: "Islamiat" },
  { value: "General Science", label: "General Science" },
];

const GRADE_OPTIONS = [
  { value: "Class 9 & 10 (Matric & O-Level)", label: "Class 9 & 10 (Matric & O-Level)" },
  { value: "Class 11 & 12 (Inter & A-Level)", label: "Class 11 & 12 (Inter & A-Level)" },
  { value: "Class 9 (Matric)", label: "Class 9 (Matric)" },
  { value: "Class 10 (Matric)", label: "Class 10 (Matric)" },
  { value: "Class 11 / First Year (FSc)", label: "Class 11 / First Year (FSc)" },
  { value: "Class 12 / Second Year (FSc)", label: "Class 12 / Second Year (FSc)" },
  { value: "Middle School (Grades 6–8)", label: "Middle School (Grades 6–8)" },
];

export function YouTubeVideoUploaderModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: YouTubeVideoUploaderModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [videoSourceMode, setVideoSourceMode] = useState<"file" | "url">("file");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoFileName, setVideoFileName] = useState<string>("");
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number>(420);
  const [fileSizeStr, setFileSizeStr] = useState<string>("42.8 MB");

  // Thumbnail
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(PRESET_THUMBNAILS[0].url);
  const [customThumbnailName, setCustomThumbnailName] = useState<string>("");

  // Metadata
  const [title, setTitle] = useState<string>("");
  const [urduTitle, setUrduTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Curriculum & SLOs
  const [subject, setSubject] = useState<string>("Pakistan Studies");
  const [grade, setGrade] = useState<string>("Class 9 & 10 (Matric & O-Level)");
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [chapterName, setChapterName] = useState<string>("");
  const [sloTagInput, setSloTagInput] = useState<string>("");
  const [sloTags, setSloTags] = useState<string[]>(["SLO 1.1", "Board Exam Focus"]);

  // Captions & Subtitles
  const [englishCaptionText, setEnglishCaptionText] = useState<string>("");
  const [urduCaptionText, setUrduCaptionText] = useState<string>("");

  // Key Moments / Timestamps
  const [keyMoments, setKeyMoments] = useState<VideoKeyMoment[]>([
    { timeSeconds: 0, formattedTime: "00:00", title: "Introduction & Key Concepts" },
    { timeSeconds: 120, formattedTime: "02:00", title: "Core Topic Walkthrough" },
  ]);
  const [newMomentTime, setNewMomentTime] = useState<string>("");
  const [newMomentTitle, setNewMomentTitle] = useState<string>("");

  // Visibility & Publish
  const [visibility, setVisibility] = useState<VideoVisibility>("public");
  const [notifyStudents, setNotifyStudents] = useState<boolean>(true);

  // Upload Progress & Submitting
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Video File Selection
  const handleVideoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoFileName(file.name);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);

      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSizeStr(`${sizeMb} MB`);

      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  // Handle Custom Thumbnail
  const handleThumbnailFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomThumbnailName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setThumbnailUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add SLO tag
  const handleAddSloTag = () => {
    if (!sloTagInput.trim()) return;
    const tag = sloTagInput.trim();
    if (!sloTags.includes(tag)) {
      setSloTags([...sloTags, tag]);
    }
    setSloTagInput("");
  };

  const handleRemoveSloTag = (tag: string) => {
    setSloTags(sloTags.filter((t) => t !== tag));
  };

  // Add Chapter / Timestamp
  const handleAddKeyMoment = () => {
    if (!newMomentTime.trim() || !newMomentTitle.trim()) {
      toast.error("Please provide both time and chapter title");
      return;
    }
    const seconds = parseTimeToSeconds(newMomentTime);
    const newMoment: VideoKeyMoment = {
      timeSeconds: seconds,
      formattedTime: formatSecondsToTime(seconds),
      title: newMomentTitle.trim(),
    };
    const updated = [...keyMoments, newMoment].sort((a, b) => a.timeSeconds - b.timeSeconds);
    setKeyMoments(updated);
    setNewMomentTime("");
    setNewMomentTitle("");
  };

  const handleRemoveKeyMoment = (idx: number) => {
    setKeyMoments(keyMoments.filter((_, i) => i !== idx));
  };

  // Step 1 Validation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        toast.error("Please enter a video title");
        return;
      }
      if (!videoUrl && !videoFile) {
        toast.error("Please select a video file or enter a stream URL");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Publish / Upload Final Handler
  const handlePublish = async () => {
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const now = new Date().toISOString();
      const newVideo: AdminVideo = {
        id: `vid-${Date.now()}`,
        title: title.trim(),
        urduTitle: urduTitle.trim() || undefined,
        description: description.trim() || "Comprehensive curriculum topic lecture video.",
        videoUrl: videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        videoType: videoSourceMode === "file" ? "upload" : "url",
        fileSize: fileSizeStr,
        thumbnailUrl: thumbnailUrl || PRESET_THUMBNAILS[0].url,
        durationSeconds: videoDurationSeconds || 420,
        formattedDuration: formatSecondsToTime(videoDurationSeconds || 420),
        subject,
        grade,
        chapterNumber,
        chapterName: chapterName.trim() || undefined,
        sloTags,
        views: 0,
        likes: 0,
        commentsCount: 0,
        visibility,
        createdAt: now,
        updatedAt: now,
        keyMoments,
        captions: [
          ...(englishCaptionText ? [{ id: `cap-en-${Date.now()}`, language: "English" as const, label: "English", text: englishCaptionText }] : []),
          ...(urduCaptionText ? [{ id: `cap-ur-${Date.now()}`, language: "Urdu" as const, label: "اردو", text: urduCaptionText }] : []),
        ],
      };

      onUploadSuccess(newVideo);
      toast.success(
        visibility === "public"
          ? "Lecture published live to students!"
          : "Video saved to Studio library!"
      );
      setIsUploading(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* TOP HEADER */}
        <div className="flex items-center justify-between border-b border-border/70 bg-card/90 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <PlaySVG className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                Upload Curriculum Video Lecture
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Video Publisher · Step {currentStep} of 3
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex size-9 items-center justify-center rounded-xl border border-border/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* STEP PROGRESS TABS BAR */}
        <div className="grid grid-cols-3 border-b border-border/60 bg-muted/30 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={cn(
              "flex items-center justify-center gap-2 border-b-2 py-3 transition-colors cursor-pointer",
              currentStep === 1
                ? "border-primary bg-card font-black text-primary"
                : currentStep > 1
                ? "border-transparent text-foreground hover:bg-muted/50"
                : "border-transparent text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-black",
                currentStep === 1
                  ? "bg-primary text-white"
                  : currentStep > 1
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > 1 ? <CheckCircleSVG className="size-3.5" /> : "1"}
            </span>
            <span className="hidden sm:inline">1. Details & Media</span>
            <span className="sm:hidden">Details</span>
          </button>

          <button
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(2)}
            className={cn(
              "flex items-center justify-center gap-2 border-b-2 py-3 transition-colors cursor-pointer",
              currentStep === 2
                ? "border-primary bg-card font-black text-primary"
                : currentStep > 2
                ? "border-transparent text-foreground hover:bg-muted/50"
                : "border-transparent text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-black",
                currentStep === 2
                  ? "bg-primary text-white"
                  : currentStep > 2
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > 2 ? <CheckCircleSVG className="size-3.5" /> : "2"}
            </span>
            <span className="hidden sm:inline">2. Curriculum & Elements</span>
            <span className="sm:hidden">Curriculum</span>
          </button>

          <button
            type="button"
            onClick={() => currentStep === 3 && setCurrentStep(3)}
            className={cn(
              "flex items-center justify-center gap-2 border-b-2 py-3 transition-colors cursor-pointer",
              currentStep === 3
                ? "border-primary bg-card font-black text-primary"
                : "border-transparent text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-black",
                currentStep === 3
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              3
            </span>
            <span className="hidden sm:inline">3. Visibility & Publish</span>
            <span className="sm:hidden">Publish</span>
          </button>
        </div>

        {/* STEP BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* STEP 1: DETAILS & VIDEO FILE */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-in fade-in duration-200">
              {/* Left Column: Metadata */}
              <div className="space-y-4 lg:col-span-7">
                {/* Video Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Title (required)</span>
                    <span className="text-[10px] text-muted-foreground">
                      {title.length}/100 chars
                    </span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Periodic Trends: Atomic Radii, Ionization Energy & Electronegativity"
                    className="w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Urdu Bilingual Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Bilingual / Urdu Title (Optional)</span>
                    <span className="text-[10px] text-primary font-serif">اردو عنوان</span>
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={urduTitle}
                    onChange={(e) => setUrduTitle(e.target.value)}
                    placeholder="پیریوڈک جدول کے رجحانات اور ایٹمی خصوصیات"
                    className="w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-xs sm:text-sm font-serif text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Description & Lecture Synopsis
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell students what will be covered in this lecture, formula derivations, key exam question tips..."
                    className="w-full rounded-xl border border-border/70 bg-background p-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                  />
                </div>

                {/* Thumbnail Selector */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Thumbnail</label>
                    <span className="text-[10px] text-muted-foreground">16:9 widescreen</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PRESET_THUMBNAILS.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => setThumbnailUrl(t.url)}
                        className={cn(
                          "group relative aspect-video cursor-pointer overflow-hidden rounded-xl border transition-all",
                          thumbnailUrl === t.url
                            ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                            : "border-border/60 hover:border-primary/40 opacity-75 hover:opacity-100"
                        )}
                      >
                        <img
                          src={t.url}
                          alt={t.name}
                          className="h-full w-full object-cover"
                        />
                        {thumbnailUrl === t.url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <CheckCircleSVG className="size-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted/40 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <Upload className="size-3.5" />
                      <span>{customThumbnailName || "Upload Custom Image"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Video Source & Live Preview */}
              <div className="space-y-4 lg:col-span-5">
                <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                      Video Source
                    </h4>
                    {/* Toggle: File vs URL */}
                    <div className="flex rounded-xl bg-muted/60 p-0.5 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setVideoSourceMode("file")}
                        className={cn(
                          "rounded-lg px-2.5 py-1 transition-all cursor-pointer",
                          videoSourceMode === "file"
                            ? "bg-primary text-white shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoSourceMode("url")}
                        className={cn(
                          "rounded-lg px-2.5 py-1 transition-all cursor-pointer",
                          videoSourceMode === "url"
                            ? "bg-primary text-white shadow-2xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Video URL
                      </button>
                    </div>
                  </div>

                  {videoSourceMode === "file" ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        onChange={handleVideoFileChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 p-5 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary/5"
                      >
                        <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                          <Upload className="size-6" />
                        </div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary">
                          {videoFileName ? videoFileName : "Select or Drop Video File"}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          MP4, WebM, MOV up to 500 MB (1080p Full HD)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-foreground">
                        Direct Video / CDN / MP4 URL
                      </label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => {
                          setVideoUrl(e.target.value);
                          setVideoFileName("External Stream URL");
                        }}
                        placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
                        className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />

                      {/* Demo Quick Presets */}
                      <div className="pt-1">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Or quick-load sample lecture:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {SAMPLE_DEMO_VIDEOS.map((demo, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setVideoUrl(demo.url);
                                setVideoDurationSeconds(demo.duration);
                                setVideoFileName(demo.name);
                              }}
                              className="rounded-lg border border-border/70 bg-muted/50 px-2 py-1 text-[10px] font-bold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                            >
                              {demo.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Live Preview Box */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                      Live Player Preview
                    </span>
                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/80 bg-black shadow-inner">
                      {videoUrl ? (
                        <video
                          src={videoUrl}
                          poster={thumbnailUrl}
                          controls
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-muted/40 p-4 text-center">
                          <PlaySVG className="size-8 text-muted-foreground/40 mb-1" />
                          <span className="text-[11px] font-bold text-muted-foreground">
                            Upload a video to preview
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-[11px]">
                      <span className="text-muted-foreground font-medium truncate max-w-[180px]">
                        File: {videoFileName || "None"}
                      </span>
                      <span className="font-mono font-bold text-foreground shrink-0">
                        {formatSecondsToTime(videoDurationSeconds)} · {fileSizeStr}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CURRICULUM & VIDEO ELEMENTS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Subject Selection (Reusable AppSelect) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Subject / Course</label>
                  <AppSelect
                    value={subject}
                    options={SUBJECT_OPTIONS}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-11 rounded-xl text-xs font-semibold"
                  />
                </div>

                {/* Grade Selection (Reusable AppSelect) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Target Class / Grade</label>
                  <AppSelect
                    value={grade}
                    options={GRADE_OPTIONS}
                    onChange={(e) => setGrade(e.target.value)}
                    className="h-11 rounded-xl text-xs font-semibold"
                  />
                </div>

                {/* Chapter Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Chapter Number</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Chapter Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Chapter Name</label>
                  <input
                    type="text"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    placeholder="E.g., Pakistan Movement (1940–1947)"
                    className="w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* SLO Tags Section */}
              <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-foreground">
                    Curriculum Student Learning Outcomes (SLOs)
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Link specific exam SLO codes
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sloTagInput}
                    onChange={(e) => setSloTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSloTag();
                      }
                    }}
                    placeholder="Type SLO code (e.g., SLO 4.2, 5-Mark Question) and press Add"
                    className="flex-1 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSloTag}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer"
                  >
                    <AddSVG className="size-3.5" />
                    <span>Add SLO</span>
                  </button>
                </div>

                {/* Tags List */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sloTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSloTag(tag)}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Video Chapters / Key Moments */}
              <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClockSVG className="size-4 text-primary" />
                    <h4 className="text-xs font-black text-foreground">
                      Video Chapters & Key Timestamps
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Clickable timestamps for students
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={newMomentTime}
                      onChange={(e) => setNewMomentTime(e.target.value)}
                      placeholder="02:30"
                      className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      value={newMomentTitle}
                      onChange={(e) => setNewMomentTitle(e.target.value)}
                      placeholder="Topic introduction, core formula..."
                      className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddKeyMoment}
                      className="w-full h-full min-h-[36px] inline-flex items-center justify-center gap-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <AddSVG className="size-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Key Moments List */}
                <div className="space-y-1.5 pt-1">
                  {keyMoments.map((moment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono font-bold text-primary border border-primary/20">
                          {moment.formattedTime}
                        </span>
                        <span className="font-semibold text-foreground">{moment.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyMoment(idx)}
                        className="text-muted-foreground hover:text-rose-500 cursor-pointer"
                      >
                        <DeleteSVG className="size-3.5 text-current" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Captions & Subtitles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* English Captions */}
                <div className="rounded-3xl border border-border/70 bg-card p-4 space-y-2 shadow-xs">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>English Subtitles / Transcript (SRT or Text)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={englishCaptionText}
                    onChange={(e) => setEnglishCaptionText(e.target.value)}
                    placeholder="00:00 Welcome to Pakistan Studies chapter 4..."
                    className="w-full rounded-xl border border-border/70 bg-background p-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Urdu Captions */}
                <div className="rounded-3xl border border-border/70 bg-card p-4 space-y-2 shadow-xs">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Urdu Subtitles (اردو سب ٹائٹلز)</span>
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={urduCaptionText}
                    onChange={(e) => setUrduCaptionText(e.target.value)}
                    placeholder="۰۰:۰۰ پاکستان اسٹڈیز باب چہارم میں خوش آمدید..."
                    className="w-full rounded-xl border border-border/70 bg-background p-2.5 text-xs font-serif text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VISIBILITY & PUBLISH */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-3">
                <h3 className="text-sm font-black text-foreground">Select Visibility & Publish</h3>
                <p className="text-xs text-muted-foreground">
                  Choose who can view this lecture video and make it live on the student portal.
                </p>

                {/* Radio Cards */}
                <div className="space-y-3">
                  {/* Public */}
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-4 rounded-3xl border p-4 transition-all shadow-xs",
                      visibility === "public"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border/70 bg-card hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === "public"}
                      onChange={() => setVisibility("public")}
                      className="mt-1 accent-primary cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GlobeSVG className="size-4 text-primary" />
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          Public (Live for All Enrolled Students)
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Everyone enrolled in {subject} can watch this video immediately on the
                        student lectures portal.
                      </p>
                    </div>
                  </label>

                  {/* Unlisted */}
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-4 rounded-3xl border p-4 transition-all shadow-xs",
                      visibility === "unlisted"
                        ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                        : "border-border/70 bg-card hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="unlisted"
                      checked={visibility === "unlisted"}
                      onChange={() => setVisibility("unlisted")}
                      className="mt-1 accent-amber-500 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <EyeSVG className="size-4 text-amber-500" />
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          Unlisted (Direct Link Only)
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Only students or teachers with the direct share link will be able to watch
                        this video.
                      </p>
                    </div>
                  </label>

                  {/* Draft / Private */}
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-4 rounded-3xl border p-4 transition-all shadow-xs",
                      visibility === "draft"
                        ? "border-slate-500 bg-slate-500/5 ring-2 ring-slate-500/20"
                        : "border-border/70 bg-card hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="draft"
                      checked={visibility === "draft"}
                      onChange={() => setVisibility("draft")}
                      className="mt-1 accent-slate-500 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <LockSVG className="size-4 text-muted-foreground" />
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          Private / Draft (Admin Only)
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Saved in your studio library. Only administrators and editors can preview or
                        edit this lecture.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notification Checkbox */}
              <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyStudents}
                  onChange={(e) => setNotifyStudents(e.target.checked)}
                  className="rounded accent-primary size-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-foreground">
                  Send notification push to students enrolled in {subject} ({grade})
                </span>
              </label>

              {/* Final Summary Card */}
              <div className="rounded-3xl border border-border/70 bg-muted/30 p-4 space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                  Summary Review Before Publishing
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-36 aspect-video rounded-2xl object-cover border border-border/80 shadow-2xs"
                  />
                  <div className="space-y-1 min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {title || "Untitled Lecture"}
                    </h5>
                    {urduTitle && (
                      <p className="text-xs font-serif text-primary">{urduTitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-bold">
                      <span className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary">
                        {subject}
                      </span>
                      <span className="rounded-lg bg-muted border border-border/60 px-2 py-0.5 text-muted-foreground">
                        {grade}
                      </span>
                      <span className="rounded-lg bg-muted border border-border/60 px-2 py-0.5 text-muted-foreground">
                        {formatSecondsToTime(videoDurationSeconds)}
                      </span>
                      <span
                        className={cn(
                          "rounded-lg px-2 py-0.5 font-bold uppercase",
                          visibility === "public"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : visibility === "unlisted"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-muted text-muted-foreground border border-border/60"
                        )}
                      >
                        {visibility}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar during Upload */}
              {isUploading && (
                <div className="space-y-2 rounded-3xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span>Processing and publishing educational video...</span>
                    </span>
                    <span className="font-mono text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER CONTROLS */}
        <div className="flex items-center justify-between border-t border-border/70 bg-card/90 px-5 py-4 sm:px-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <AppButton
                type="button"
                onClick={handleNextStep}
                className="rounded-xl px-5 py-2.5 text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-4 ml-1" />
              </AppButton>
            ) : (
              <AppButton
                type="button"
                onClick={handlePublish}
                disabled={isUploading}
                className="rounded-xl px-6 py-2.5 text-xs font-black shadow-lg shadow-primary/25 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1.5" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <GlobeSVG className="size-4 mr-1.5 text-white" />
                    <span>Publish Video</span>
                  </>
                )}
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
