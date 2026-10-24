"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImageIcon, Minus, Plus, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import AppButton from "@/components/AppButton";

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

interface QuestionImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  skeletonHeightClass?: string;
  zoomable?: boolean;
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function DiagramZoomOverlay({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPanRef = useRef<{ x: number; y: number } | null>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  scaleRef.current = scale;
  offsetRef.current = offset;

  const applyZoom = useCallback((next: number) => {
    const clamped = clampZoom(next);
    setScale(clamped);
    if (clamped <= MIN_ZOOM) {
      setOffset({ x: 0, y: 0 });
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      applyZoom(scaleRef.current + direction);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointersRef.current.size === 1) {
      lastPanRef.current = { x: event.clientX, y: event.clientY };
    }
    if (pointersRef.current.size === 2) {
      const points = [...pointersRef.current.values()];
      lastPinchDistRef.current = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y,
      );
      lastPanRef.current = null;
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2) {
      const points = [...pointersRef.current.values()];
      const distance = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y,
      );
      if (lastPinchDistRef.current && lastPinchDistRef.current > 0) {
        applyZoom(scaleRef.current * (distance / lastPinchDistRef.current));
      }
      lastPinchDistRef.current = distance;
      return;
    }

    if (pointersRef.current.size === 1 && scaleRef.current > MIN_ZOOM) {
      const last = lastPanRef.current;
      if (!last) {
        lastPanRef.current = { x: event.clientX, y: event.clientY };
        return;
      }
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      lastPanRef.current = { x: event.clientX, y: event.clientY };
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    lastPinchDistRef.current = null;
    lastPanRef.current = null;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background/95"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed question diagram"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2 sm:px-4">
        <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
          Pinch, scroll, or use the buttons to zoom
        </p>
        <div className="flex items-center gap-1.5">
          <AppButton
            type="button"
            variant="outline"
            size="icon"
            aria-label="Zoom out"
            onClick={() => applyZoom(scale - ZOOM_STEP)}
            disabled={scale <= MIN_ZOOM}
          >
            <Minus className="size-4" />
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            size="icon"
            aria-label="Zoom in"
            onClick={() => applyZoom(scale + ZOOM_STEP)}
            disabled={scale >= MAX_ZOOM}
          >
            <Plus className="size-4" />
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            size="icon"
            aria-label="Reset zoom"
            onClick={() => applyZoom(MIN_ZOOM)}
            disabled={scale <= MIN_ZOOM}
          >
            <RotateCcw className="size-4" />
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            size="icon"
            aria-label="Close diagram zoom"
            onClick={onClose}
          >
            <X className="size-4" />
          </AppButton>
        </div>
      </div>
      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() =>
          applyZoom(scale > MIN_ZOOM ? MIN_ZOOM : MIN_ZOOM + ZOOM_STEP * 2)
        }
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="pointer-events-none absolute top-1/2 left-1/2 max-h-full max-w-full origin-center select-none object-contain"
          style={{
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
          }}
        />
      </div>
    </div>,
    document.body,
  );
}

export const globalPreloadedImageUrls = new Set<string>();
export { useQuestionDiagramPreloader } from "@/hooks/exam/useQuestionDiagramPreloader";

/**
 * Preload question diagram images silently into browser cache and in-memory set
 */
export function preloadQuestionImages(urls: (string | null | undefined)[]) {
  if (typeof window === "undefined" || !urls || urls.length === 0) return;
  for (const url of urls) {
    if (!url || typeof url !== "string" || !url.trim() || globalPreloadedImageUrls.has(url)) {
      continue;
    }
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      globalPreloadedImageUrls.add(url);
    };
  }
}

export default function QuestionImage({
  src,
  alt = "Question diagram",
  className,
  containerClassName,
  skeletonHeightClass = "h-40 sm:h-52",
  zoomable = true,
}: QuestionImageProps) {
  const isInitiallyCached = Boolean(src && globalPreloadedImageUrls.has(src));
  const [isLoaded, setIsLoaded] = useState(isInitiallyCached);
  const [hasError, setHasError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    if (!src || !src.trim()) {
      setIsLoaded(false);
      setHasError(false);
      setIsZoomOpen(false);
      return;
    }

    if (globalPreloadedImageUrls.has(src)) {
      setIsLoaded(true);
      setHasError(false);
      return;
    }

    setIsLoaded(false);
    setHasError(false);
    setIsZoomOpen(false);

    const img = new window.Image();
    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      globalPreloadedImageUrls.add(src);
      setIsLoaded(true);
      return;
    }

    img.onload = () => {
      globalPreloadedImageUrls.add(src);
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      setTimeout(() => {
        const retryImg = new window.Image();
        retryImg.src = src;
        retryImg.onload = () => {
          globalPreloadedImageUrls.add(src);
          setIsLoaded(true);
          setHasError(false);
        };
        retryImg.onerror = () => {
          setHasError(true);
        };
      }, 400);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (!src || !src.trim()) return null;

  const canZoom = zoomable && isLoaded && !hasError;

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full flex-col items-center justify-center overflow-hidden rounded-xl",
        containerClassName,
      )}
    >
      {!isLoaded && !hasError ? (
        <div
          className={cn(
            "flex w-full animate-pulse flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/30 shadow-xs",
            skeletonHeightClass,
          )}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted/60">
              <ImageIcon className="size-5 animate-pulse text-muted-foreground/50" />
            </div>
            <span className="text-xs font-medium tracking-wide">
              Loading diagram...
            </span>
          </div>
        </div>
      ) : null}

      {hasError ? (
        <div
          className={cn(
            "flex w-full flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/20 p-4 text-center text-xs text-muted-foreground",
            skeletonHeightClass,
          )}
        >
          <ImageIcon className="mb-1.5 size-5 opacity-40" />
          <span className="text-xs text-muted-foreground/80">
            Diagram not available
          </span>
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canZoom}
        onClick={() => {
          if (canZoom) setIsZoomOpen(true);
        }}
        className={cn("group relative mx-auto block max-w-full rounded-lg text-center", {
          "cursor-zoom-in": canZoom,
          "cursor-default": !canZoom,
          hidden: !isLoaded || hasError,
        })}
        aria-label={canZoom ? "Zoom question diagram" : alt}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={() => {
            setIsLoaded(true);
            setHasError(false);
          }}
          onError={() => {
            if (!isLoaded) {
              setHasError(true);
            }
          }}
          className={cn(
            "mx-auto rounded-lg object-contain select-none transition-opacity duration-300",
            className,
          )}
        />
        {canZoom ? (
          <span className="mt-1.5 block text-center text-xs font-normal text-muted-foreground/75 transition-colors group-hover:text-foreground select-none">
            Click to zoom
          </span>
        ) : null}
      </button>

      {isZoomOpen ? (
        <DiagramZoomOverlay
          src={src}
          alt={alt}
          onClose={() => setIsZoomOpen(false)}
        />
      ) : null}
    </div>
  );
}
