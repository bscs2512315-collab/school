"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  FolderOpen,
  ImagePlus,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadState } from "@/types/generate";
import { MAX_IMAGES_PER_QUESTION, toUploadItemList } from "@/lib/exam/multi-upload";
import ExamCameraModal from "./ExamCameraModal";

interface ExamUploadZoneProps {
  upload: UploadState;
  onAddFiles: (files: File[]) => void;
  onRetry: (uploadId: string) => void;
  onRemove: (uploadId: string) => void;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/*";

export default function ExamUploadZone({
  upload,
  onAddFiles,
  onRetry,
  onRemove,
}: ExamUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const items = toUploadItemList(upload);
  const hasItems = items.length > 0;
  const uploadedCount = items.filter((it) => it.status === "uploaded").length;
  const uploadingCount = items.filter((it) => it.status === "uploading").length;
  const failedCount = items.filter((it) => it.status === "failed").length;
  const retryableFailed = items.filter(
    (it) => it.status === "failed" && Boolean(it.file),
  );
  const atCapacity = items.length >= MAX_IMAGES_PER_QUESTION;

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const handleCancel = () => {
      if (typeof window !== "undefined") {
        setTimeout(() => {
          (window as any).__examFilePickerActive = false;
        }, 1000);
      }
    };
    input.addEventListener("cancel", handleCancel);
    return () => {
      input.removeEventListener("cancel", handleCancel);
    };
  }, []);

  const openFilePicker = () => {
    if (typeof window !== "undefined") {
      (window as any).__examFilePickerActive = true;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        (window as any).__examFilePickerActive = false;
      }, 1000);
    }
    const files = Array.from(event.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length > 0) {
      onAddFiles(files);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length > 0) {
      onAddFiles(files);
    }
  };

  if (!hasItems) {
    return (
      <div data-exam-allow-drop="true" className="w-full">
        {/* Idle Upload Options: Dual Action Layout */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Option 1: Take Photo Directly with Camera (Recommended for anti-cheat safety) */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center transition-all hover:border-primary hover:bg-primary/10 hover:shadow-md sm:p-8 active:scale-[0.99]"
          >
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-primary-foreground">
              <Sparkles className="size-3" />
              <span>Recommended</span>
            </div>
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
              <Camera className="size-7" />
            </div>
            <h4 className="text-sm font-bold text-foreground sm:text-base">
              Take Photo with Camera
            </h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              Direct in-app capture — snaps your written paper instantly without leaving the exam.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-background/80 px-3 py-1 text-xs font-semibold text-primary dark:text-foreground shadow-xs border border-border/60">
              Open Camera
            </span>
          </button>

          {/* Option 2: Upload existing image file / Gallery */}
          <button
            type="button"
            onClick={openFilePicker}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-all hover:border-primary/40 hover:bg-muted/50 sm:p-8 active:scale-[0.99]"
          >
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-transform group-hover:scale-110">
              <Upload className="size-7 text-primary dark:text-foreground" />
            </div>
            <h4 className="text-sm font-bold text-foreground sm:text-base">
              Upload from Device
            </h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              Choose existing images or drop them here. You can add several pages per question.
            </p>
            <span className="mt-3 text-[11px] font-medium text-muted-foreground/80">
              JPEG, PNG, WebP · up to 10MB each
            </span>
          </button>
        </div>

        {/* Hidden file input with safe anti-cheat tracking */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* In-app WebRTC Camera Capture Modal */}
        <ExamCameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => onAddFiles([file])}
        />
      </div>
    );
  }

  return (
    <div data-exam-allow-drop="true" className="w-full">
      <div
        className={cn("relative overflow-hidden rounded-2xl border-2 border-dashed p-3 sm:p-4 bg-muted/10", {
          "border-primary/40": uploadingCount === 0 && failedCount === 0,
          "border-destructive/40": failedCount > 0 && uploadingCount === 0,
          "border-border": uploadingCount > 0,
        })}
      >
        {/* Image gallery */}
        <div
          className={cn(
            "grid gap-3",
            items.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3",
          )}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt="Your answer"
                  className={cn(
                    "mx-auto max-h-72 w-full rounded-xl object-contain shadow-xs",
                    {
                      "opacity-50": item.status === "uploading",
                      "opacity-40": item.status === "failed",
                    },
                  )}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted/30 text-muted-foreground">
                  <ImagePlus className="size-8" />
                </div>
              )}

              {/* Uploading overlay */}
              {item.status === "uploading" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 rounded-xl backdrop-blur-xs">
                  <Loader2 className="mb-2 size-8 animate-spin text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Uploading...
                  </span>
                </div>
              ) : null}

              {/* Failed overlay */}
              {item.status === "failed" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-destructive/10 p-3 backdrop-blur-xs">
                  <XCircle className="size-7 text-destructive" />
                  <span className="text-xs font-bold text-destructive">
                    Upload failed
                  </span>
                  {item.file ? (
                    <button
                      type="button"
                      onClick={() => onRetry(item.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground transition-opacity hover:opacity-90"
                    >
                      <RotateCcw className="size-3.5" />
                      Retry
                    </button>
                  ) : null}
                </div>
              ) : null}

              {/* Status chip */}
              {item.status === "uploaded" ? (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                  <CheckCircle2 className="size-3" />
                  Done
                </span>
              ) : null}

              {/* Remove button (not while uploading) */}
              {item.status !== "uploading" ? (
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => onRemove(item.id)}
                  className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm border border-border transition-all hover:bg-destructive hover:text-destructive-foreground hover:scale-105 active:scale-95"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Summary footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <CheckCircle2 className="size-4" />
            <span>
              {uploadedCount} image{uploadedCount !== 1 ? "s" : ""} uploaded
              {uploadingCount > 0 ? ` · ${uploadingCount} uploading` : ""}
              {failedCount > 0 ? ` · ${failedCount} failed` : ""}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {retryableFailed.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  retryableFailed.forEach((it) => onRetry(it.id))
                }
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw className="size-3.5 text-destructive" />
                Retry failed
              </button>
            ) : null}
            <button
              type="button"
              disabled={atCapacity}
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="size-3.5 text-primary" />
              <span>Take Photo</span>
            </button>
            <button
              type="button"
              disabled={atCapacity}
              onClick={openFilePicker}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FolderOpen className="size-3.5 text-muted-foreground" />
              <span>{hasItems ? "Add more" : "Choose File"}</span>
            </button>
          </div>
        </div>

        {atCapacity ? (
          <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
            You can upload up to {MAX_IMAGES_PER_QUESTION} images per question.
          </p>
        ) : (
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-center text-[11px] font-medium text-muted-foreground"
          >
            <Plus className="mr-1 inline size-3" />
            Drop more images here to add them
          </div>
        )}
      </div>

      {/* Hidden file input with safe anti-cheat tracking */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* In-app WebRTC Camera Capture Modal */}
      <ExamCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => onAddFiles([file])}
      />
    </div>
  );
}