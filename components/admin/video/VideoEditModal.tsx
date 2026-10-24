"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { X, Upload } from "lucide-react";
import toast from "react-hot-toast";
import type { AdminVideo, VideoKeyMoment, VideoVisibility } from "@/types/video";
import { formatSecondsToTime, parseTimeToSeconds } from "@/types/video";
import { cn } from "@/lib/utils";
import AppSelect from "@/components/AppSelect";
import AppButton from "@/components/AppButton";
import PlaySVG from "@/public/svgs/PlaySVG";
import EditSVG from "@/public/svgs/EditSVG";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AddSVG from "@/public/svgs/AddSVG";
import ClockSVG from "@/public/svgs/ClockSVG";
import GlobeSVG from "@/public/svgs/GlobeSVG";
import EyeSVG from "@/public/svgs/EyeSVG";
import LockSVG from "@/public/svgs/LockSVG";

interface VideoEditModalProps {
  video: AdminVideo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVideo: AdminVideo) => void;
}

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

export function VideoEditModal({
  video,
  isOpen,
  onClose,
  onSave,
}: VideoEditModalProps) {
  const [title, setTitle] = useState("");
  const [urduTitle, setUrduTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [subject, setSubject] = useState("Pakistan Studies");
  const [grade, setGrade] = useState("Class 9 & 10 (Matric & O-Level)");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterName, setChapterName] = useState("");
  const [sloTags, setSloTags] = useState<string[]>([]);
  const [sloTagInput, setSloTagInput] = useState("");
  const [visibility, setVisibility] = useState<VideoVisibility>("public");
  const [keyMoments, setKeyMoments] = useState<VideoKeyMoment[]>([]);
  const [newMomentTime, setNewMomentTime] = useState("");
  const [newMomentTitle, setNewMomentTitle] = useState("");

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setUrduTitle(video.urduTitle || "");
      setDescription(video.description || "");
      setVideoUrl(video.videoUrl || "");
      setThumbnailUrl(video.thumbnailUrl || "");
      setSubject(video.subject || "Pakistan Studies");
      setGrade(video.grade || "Class 9 & 10 (Matric & O-Level)");
      setChapterNumber(video.chapterNumber || 1);
      setChapterName(video.chapterName || "");
      setSloTags(video.sloTags || []);
      setVisibility(video.visibility || "public");
      setKeyMoments(video.keyMoments || []);
    }
  }, [video]);

  if (!isOpen || !video) return null;

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setThumbnailUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

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

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a video title");
      return;
    }

    const updatedVideo: AdminVideo = {
      ...video,
      title: title.trim(),
      urduTitle: urduTitle.trim() || undefined,
      description: description.trim(),
      videoUrl: videoUrl.trim() || video.videoUrl,
      thumbnailUrl: thumbnailUrl || video.thumbnailUrl,
      subject,
      grade,
      chapterNumber,
      chapterName: chapterName.trim() || undefined,
      sloTags,
      visibility,
      keyMoments,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedVideo);
    toast.success("Video lecture updated successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-card/90 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <EditSVG className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                Edit Video Details
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Video ID: <span className="font-mono">{video.id}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 7 Columns */}
            <div className="space-y-4 lg:col-span-7">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Video Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Urdu Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Urdu / Bilingual Title</span>
                  <span className="text-[10px] text-primary font-serif">اردو عنوان</span>
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={urduTitle}
                  onChange={(e) => setUrduTitle(e.target.value)}
                  className="w-full rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-xs sm:text-sm font-serif text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Description & Synopsis</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-border/70 bg-background p-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                />
              </div>

              {/* Subject & Grade (Reusable AppSelect) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Subject</label>
                  <AppSelect
                    value={subject}
                    options={SUBJECT_OPTIONS}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-11 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Target Grade</label>
                  <AppSelect
                    value={grade}
                    options={GRADE_OPTIONS}
                    onChange={(e) => setGrade(e.target.value)}
                    className="h-11 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Chapter Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-foreground">Chapter #</label>
                  <input
                    type="number"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Chapter Name</label>
                  <input
                    type="text"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Right 5 Columns */}
            <div className="space-y-4 lg:col-span-5">
              {/* Thumbnail & Video Preview */}
              <div className="rounded-3xl border border-border/70 bg-card p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-foreground">Thumbnail Preview</h4>
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Upload className="size-3" />
                    <span>Change Image</span>
                  </button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </div>

                <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/80 bg-black">
                  <img
                    src={thumbnailUrl || video.thumbnailUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {video.formattedDuration}
                  </div>
                </div>

                {/* Video URL */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-foreground">Stream / MP4 URL</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Visibility Status */}
              <div className="rounded-3xl border border-border/70 bg-card p-4 space-y-2.5 shadow-xs">
                <label className="text-xs font-black text-foreground">Visibility Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center text-xs font-bold transition-all cursor-pointer",
                      visibility === "public"
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        : "border-border/70 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <GlobeSVG className="size-4 mb-1 text-current" />
                    <span>Public</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("unlisted")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center text-xs font-bold transition-all cursor-pointer",
                      visibility === "unlisted"
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20"
                        : "border-border/70 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <EyeSVG className="size-4 mb-1 text-current" />
                    <span>Unlisted</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("draft")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center text-xs font-bold transition-all cursor-pointer",
                      visibility === "draft"
                        ? "border-slate-500 bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-2 ring-slate-500/20"
                        : "border-border/70 hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <LockSVG className="size-4 mb-1 text-current" />
                    <span>Draft</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SLO Tags Section */}
          <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-black text-foreground">Associated Syllabus SLOs</h4>

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
                placeholder="Type SLO code (e.g. SLO 4.2) and click Add"
                className="flex-1 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSloTag}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 cursor-pointer"
              >
                Add Tag
              </button>
            </div>

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

          {/* Key Timestamps Section */}
          <div className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <ClockSVG className="size-4 text-primary" />
              <h4 className="text-xs font-black text-foreground">Video Chapters & Key Moments</h4>
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
                  placeholder="Key moment title"
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border/70 bg-card/90 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <AppButton
            onClick={handleSave}
            className="rounded-xl px-6 py-2.5 text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
          >
            Save Changes
          </AppButton>
        </div>
      </div>
    </div>
  );
}
