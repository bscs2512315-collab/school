"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  RotateCcw,
  SwitchCamera,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function ExamCameraModal({
  isOpen,
  onClose,
  onCapture,
}: ExamCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Check if multiple camera devices exist
  useEffect(() => {
    if (!isOpen || typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => {
        setHasMultipleCameras(false);
      });
  }, [isOpen]);

  // Start / restart camera stream
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedBlob(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setCameraError(null);
      setIsLoading(true);
      return;
    }

    if (capturedBlob) {
      // In preview mode, stop camera stream to save battery and turn off indicator
      stopStream();
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setCameraError(null);

    async function startCamera() {
      stopStream();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera is not supported on this browser or device.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Camera access error:", err);
        setIsLoading(false);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setCameraError("No camera found on this device.");
        } else {
          setCameraError(err.message || "Failed to initialize camera. You can upload an image file instead.");
        }
      }
    }

    void startCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [isOpen, facingMode, capturedBlob, stopStream]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle capture shutter click
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Trigger flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, mirror image for natural feeling
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      },
      "image/jpeg",
      0.92,
    );
  };

  // Discard captured photo and retake
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedBlob(null);
  };

  // Confirm and upload photo
  const handleConfirm = () => {
    if (!capturedBlob) return;
    const fileName = `answer-${Date.now()}.jpg`;
    const file = new File([capturedBlob], fileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    stopStream();
    onCapture(file);
    onClose();
  };

  // Switch facing mode (back vs front camera)
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
      data-exam-allow-drop="true"
    >
      <div className="relative flex h-full max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Camera className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Capture Answer Photo</h3>
              <p className="text-[11px] text-neutral-400">
                {capturedBlob ? "Review your photo before uploading" : "Keep your handwritten page within frame"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            title="Close camera"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Camera Viewfinder / Preview Body */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
          {/* White shutter flash effect */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-30 bg-white transition-opacity duration-200",
              isFlashing ? "opacity-100" : "opacity-0",
            )}
          />

          {capturedBlob && previewUrl ? (
            /* Review captured photo */
            <div className="relative flex size-full items-center justify-center p-2">
              <img
                src={previewUrl}
                alt="Captured answer preview"
                className="max-h-full max-w-full rounded-2xl object-contain shadow-md"
              />
              <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10">
                Captured Photo
              </div>
            </div>
          ) : cameraError ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <AlertCircle className="size-6" />
              </div>
              <p className="max-w-sm text-sm font-medium text-neutral-200">{cameraError}</p>
              <p className="mt-2 text-xs text-neutral-400">
                You can close this modal and use the file upload option instead.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                Back to Upload
              </button>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative flex size-full items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
                  <Loader2 className="mb-2 size-8 animate-spin text-primary" />
                  <span className="text-xs font-medium text-neutral-300">Starting camera...</span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "size-full rounded-2xl object-cover sm:object-contain",
                  facingMode === "user" && "-scale-x-100", // mirror front camera
                )}
              />

              {/* Viewfinder Guide Overlay */}
              {!isLoading && (
                <div className="pointer-events-none absolute inset-6 sm:inset-10 flex flex-col items-center justify-between border-2 border-dashed border-white/30 rounded-2xl">
                  {/* Corner Accents */}
                  <div className="absolute -top-1 -left-1 size-5 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 size-5 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 size-5 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 size-5 border-b-3 border-r-3 border-primary rounded-br-lg" />

                  <span className="mt-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md border border-white/10">
                    Align your handwritten paper here
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Controls */}
        <div className="shrink-0 border-t border-white/10 bg-neutral-950/80 px-4 py-3 sm:py-4 backdrop-blur-md">
          {capturedBlob ? (
            /* Review Actions */
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 active:scale-95"
              >
                <RotateCcw className="size-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-lg transition-transform hover:opacity-95 active:scale-95"
              >
                <Check className="size-4 stroke-[2.5]" />
                Use Photo & Upload
              </button>
            </div>
          ) : !cameraError ? (
            /* Live Stream Controls */
            <div className="relative flex items-center justify-center">
              {/* Flip camera button (if multiple cameras available) */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  disabled={isLoading}
                  className="absolute left-2 sm:left-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-40"
                  title="Switch between front and back camera"
                >
                  <SwitchCamera className="size-5" />
                </button>
              )}

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={isLoading}
                aria-label="Capture answer photo"
                className="group flex size-16 sm:size-18 items-center justify-center rounded-full border-4 border-white p-1 transition-transform hover:scale-105 active:scale-90 disabled:opacity-50"
              >
                <div className="size-full rounded-full bg-white transition-colors group-hover:bg-primary group-active:scale-95" />
              </button>

              <span className="absolute right-2 sm:right-4 hidden text-[11px] font-medium text-neutral-400 sm:inline">
                {facingMode === "environment" ? "Rear Camera" : "Front Camera"}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
