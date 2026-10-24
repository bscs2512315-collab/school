"use client";

import { useEffect, useRef, useState } from "react";
import AppButton from "@/components/AppButton";
import CameraSVG from "@/public/svgs/CameraSVG";
import { cn } from "@/lib/utils";

const MAX_SELFIE_WIDTH = 720;
const JPEG_QUALITY = 0.85;

export default function VoterSelfieCapture({
  previewUrl,
  onCapture,
  onRetake,
}: {
  previewUrl: string | null;
  onCapture: (file: File) => void;
  onRetake: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (previewUrl) {
      stopCamera();
      return;
    }

    let cancelled = false;
    const start = async () => {
      setStarting(true);
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stopTracks(stream);
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch {
        if (!cancelled) {
          setCameraError("Camera access is required. Allow the camera and try again.");
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [previewUrl]);

  const stopCamera = () => {
    if (streamRef.current) {
      stopTracks(streamRef.current);
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const scale = Math.min(1, MAX_SELFIE_WIDTH / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "voter-selfie.jpg", { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Live selfie *
      </p>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-muted",
          {
            "border-border/60": !previewUrl,
            "border-primary/30": Boolean(previewUrl),
          },
        )}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Your selfie"
            className="aspect-square w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            className="aspect-square w-full -scale-x-100 object-cover"
            autoPlay
            playsInline
            muted
          />
        )}
        {starting && !previewUrl ? (
          <p className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-medium">
            Starting camera...
          </p>
        ) : null}
      </div>
      {cameraError ? (
        <p className="text-sm font-medium text-destructive">{cameraError}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Use the front camera. File uploads are not allowed.
        </p>
      )}
      {previewUrl ? (
        <AppButton
          type="button"
          variant="outline"
          className="h-11 w-full rounded-2xl font-bold"
          onClick={onRetake}
        >
          Retake selfie
        </AppButton>
      ) : (
        <AppButton
          type="button"
          className="h-11 w-full rounded-2xl font-black"
          disabled={Boolean(cameraError) || starting}
          onClick={takePhoto}
        >
          <CameraSVG className="size-4" />
          Take selfie
        </AppButton>
      )}
    </div>
  );
}

function stopTracks(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}
