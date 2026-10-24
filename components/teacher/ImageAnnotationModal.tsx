"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Circle,
  Download,
  Eraser,
  Highlighter,
  Minus,
  PenLine,
  Redo2,
  RotateCw,
  Square,
  Undo2,
  X,
} from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import AppButton from "@/components/AppButton";
import { cn } from "@/lib/utils";

export interface ImageAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialAnnotatedUrl?: string | null;
  onSave: (annotatedDataUrl: string) => void;
  title?: string;
  readOnly?: boolean;
}

type ToolMode = "pen" | "circle" | "line" | "rect" | "highlighter" | "eraser";

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  tool: ToolMode;
  color: string;
  size: number;
  points: StrokePoint[];
}

const COLOR_PRESETS = [
  { id: "red", label: "Red (Wrong / Error)", color: "#ef4444" },
  { id: "green", label: "Green (Correct)", color: "#22c55e" },
  { id: "blue", label: "Blue (Note)", color: "#3b82f6" },
  { id: "yellow", label: "Yellow (Warning)", color: "#eab308" },
  { id: "white", label: "White", color: "#ffffff" },
];

const SIZE_PRESETS = [
  { id: "fine", label: "Fine", penSize: 2.5, shapeSize: 2.5, highlighterSize: 14, eraserSize: 18 },
  { id: "medium", label: "Medium", penSize: 4.5, shapeSize: 4.5, highlighterSize: 24, eraserSize: 28 },
  { id: "bold", label: "Bold", penSize: 8, shapeSize: 7, highlighterSize: 36, eraserSize: 44 },
];

export default function ImageAnnotationModal({
  isOpen,
  onClose,
  imageUrl,
  initialAnnotatedUrl,
  onSave,
  title = "Mark Answer Sheet",
  readOnly = false,
}: ImageAnnotationModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<ToolMode>("pen");
  const [selectedColor, setSelectedColor] = useState("#ef4444"); // Red by default
  const [selectedSizeId, setSelectedSizeId] = useState<"fine" | "medium" | "bold">("medium");
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [imageLoaded, setImageLoaded] = useState(false);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Load the background image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    setImageLoaded(false);
    setRotation(0);
    setStrokes([]);
    setHistory([]);
    setHistoryIndex(-1);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Fallback without crossOrigin if CORS restricts
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        imageRef.current = fallbackImg;
        setImageLoaded(true);
      };
      fallbackImg.src = imageUrl;
    };
    img.src = initialAnnotatedUrl || imageUrl;
  }, [isOpen, imageUrl, initialAnnotatedUrl]);

  // Compute natural dimensions considering rotation
  const getRotatedDimensions = useCallback((img: HTMLImageElement, rot: number) => {
    const isSideways = rot === 90 || rot === 270;
    const width = isSideways ? img.naturalHeight : img.naturalWidth;
    const height = isSideways ? img.naturalWidth : img.naturalHeight;
    return { width, height };
  }, []);

  // Helper to draw a single stroke / shape
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (!stroke.points || stroke.points.length === 0) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = stroke.size;
    } else if (stroke.tool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.globalAlpha = 0.45;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.globalAlpha = 1.0;
    }

    const p0 = stroke.points[0];
    const pEnd = stroke.points[stroke.points.length - 1];

    if (stroke.tool === "line") {
      // Straight line from start to end
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    } else if (stroke.tool === "circle") {
      // Circle / Oval bounded by start and end points
      const cx = (p0.x + pEnd.x) / 2;
      const cy = (p0.y + pEnd.y) / 2;
      const rx = Math.abs(pEnd.x - p0.x) / 2;
      const ry = Math.abs(pEnd.y - p0.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 2), Math.max(ry, 2), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (stroke.tool === "rect") {
      // Rectangle / Box
      const x = Math.min(p0.x, pEnd.x);
      const y = Math.min(p0.y, pEnd.y);
      const w = Math.abs(pEnd.x - p0.x);
      const h = Math.abs(pEnd.y - p0.y);
      ctx.beginPath();
      ctx.strokeRect(x, y, Math.max(w, 2), Math.max(h, 2));
    } else {
      // Freehand pen, highlighter, or eraser
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);

      if (stroke.points.length === 1) {
        ctx.arc(p0.x, p0.y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          const prev = stroke.points[i - 1];
          const midX = (prev.x + pt.x) / 2;
          const midY = (prev.y + pt.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Redraw the entire canvas: background image rotated + all strokes + optional live preview stroke
  const redrawCanvas = useCallback(
    (previewStroke?: Stroke | null) => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img || !imageLoaded) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = getRotatedDimensions(img, rotation);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw rotated background image
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2,
        img.naturalWidth,
        img.naturalHeight
      );
      ctx.restore();

      // 2. Draw all committed vector strokes
      for (const stroke of strokes) {
        drawStroke(ctx, stroke);
      }

      // 3. Draw live preview stroke (for shapes/lines during drag)
      if (previewStroke) {
        drawStroke(ctx, previewStroke);
      }
    },
    [imageLoaded, rotation, strokes, getRotatedDimensions]
  );

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Convert pointer screen position to canvas coordinate space
  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      return { x, y };
    },
    []
  );

  const getCurrentSize = useCallback(() => {
    const sizeConfig = SIZE_PRESETS.find((s) => s.id === selectedSizeId) || SIZE_PRESETS[1];
    if (tool === "highlighter") return sizeConfig.highlighterSize;
    if (tool === "eraser") return sizeConfig.eraserSize;
    if (tool === "circle" || tool === "line" || tool === "rect") return sizeConfig.shapeSize;
    return sizeConfig.penSize;
  }, [selectedSizeId, tool]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !imageLoaded) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if browser doesn't support pointerCapture
    }

    const strokeSize = getCurrentSize();
    const isShape = tool === "line" || tool === "circle" || tool === "rect";

    const newStroke: Stroke = {
      tool,
      color: tool === "eraser" ? "rgba(0,0,0,1)" : selectedColor,
      size: strokeSize,
      points: isShape ? [pt, pt] : [pt],
    };

    currentStrokeRef.current = newStroke;
    isDrawingRef.current = true;

    if (!isShape) {
      // For freehand, also track in strokes state for redraws
      setStrokes((prev) => [...prev, newStroke]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;

    const stroke = currentStrokeRef.current;
    const isShape = stroke.tool === "line" || stroke.tool === "circle" || stroke.tool === "rect";

    if (isShape) {
      stroke.points[1] = pt;
      redrawCanvas(stroke);
      return;
    }

    // Freehand pen, highlighter, or eraser
    stroke.points.push(pt);

    // Fast-path direct draw on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pts = stroke.points;
    if (pts.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = stroke.size;
    } else if (stroke.tool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.globalAlpha = 0.45;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.globalAlpha = 1.0;
    }

    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    isDrawingRef.current = false;

    if (currentStrokeRef.current) {
      const isShape =
        currentStrokeRef.current.tool === "line" ||
        currentStrokeRef.current.tool === "circle" ||
        currentStrokeRef.current.tool === "rect";

      const updatedStrokes = isShape
        ? [...strokes, currentStrokeRef.current]
        : [...strokes];

      setStrokes(updatedStrokes);

      // Save state into undo history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updatedStrokes);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      currentStrokeRef.current = null;
    }

    redrawCanvas();
  };

  const handleUndo = () => {
    if (historyIndex <= 0) {
      if (historyIndex === 0) {
        setStrokes([]);
        setHistoryIndex(-1);
      }
      return;
    }
    const newIdx = historyIndex - 1;
    setStrokes(history[newIdx]);
    setHistoryIndex(newIdx);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setStrokes(history[newIdx]);
    setHistoryIndex(newIdx);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setStrokes([]);
  };

  const handleRotate = () => {
    setRotation((prev) => ((prev + 90) % 360) as number);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/webp", 0.92);
    onSave(dataUrl);
    onClose();
  };

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Esc, R, P, C, L, B, H, E)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      } else if (!e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === "r") handleRotate();
        else if (key === "p") setTool("pen");
        else if (key === "c") setTool("circle");
        else if (key === "l") setTool("line");
        else if (key === "b") setTool("rect");
        else if (key === "h") setTool("highlighter");
        else if (key === "e") setTool("eraser");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, historyIndex, history, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
      style={{ touchAction: "none" }}
    >
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <PenLine className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground sm:text-base">{title}</h3>
            <p className="text-[11px] font-medium text-muted-foreground">
              Mark mistakes with circles, lines & red pen • Rotate sideways photos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <AppButton
              type="button"
              onClick={handleSave}
              className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold"
            >
              <Check className="size-4" />
              Save Markings
            </AppButton>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-4 bg-neutral-950/40">
        {!imageLoaded ? (
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs font-semibold">Loading student answer sheet...</p>
          </div>
        ) : (
          <div className="relative flex max-h-full max-w-full items-center justify-center">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={cn(
                "max-h-[calc(100vh-140px)] max-w-full rounded-xl shadow-2xl border border-border/40 object-contain touch-none cursor-crosshair",
                tool === "eraser" && "cursor-cell"
              )}
            />
          </div>
        )}
      </main>

      {/* Bottom Floating Drawing Toolbar */}
      {!readOnly && (
        <footer className="shrink-0 border-t border-border/70 bg-card/90 p-2 sm:p-3 backdrop-blur-md">
          <div className="mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-5xl">
            {/* Tool Selection (Pen, Circle, Line, Box, Highlighter, Eraser) */}
            <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setTool("pen")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all",
                  tool === "pen"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Pen (P) - Freehand drawing"
              >
                <PenLine className="size-3.5" />
                <span>Pen</span>
              </button>

              <button
                type="button"
                onClick={() => setTool("circle")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all",
                  tool === "circle"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Circle / Oval (C) - Circle wrong terms or steps"
              >
                <Circle className="size-3.5" />
                <span>Circle</span>
              </button>

              <button
                type="button"
                onClick={() => setTool("line")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all",
                  tool === "line"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Straight Line (L) - Underline or strike-through"
              >
                <Minus className="size-3.5" />
                <span>Line</span>
              </button>

              <button
                type="button"
                onClick={() => setTool("rect")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all",
                  tool === "rect"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Box / Rectangle (B) - Enclose calculation area"
              >
                <Square className="size-3.5" />
                <span>Box</span>
              </button>

              <button
                type="button"
                onClick={() => setTool("highlighter")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all",
                  tool === "highlighter"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Highlighter (H) - Highlight text"
              >
                <Highlighter className="size-3.5" />
                <span>Highlight</span>
              </button>

              <button
                type="button"
                onClick={() => setTool("eraser")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all",
                  tool === "eraser"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title="Eraser (E)"
              >
                <Eraser className="size-3.5" />
                <span>Eraser</span>
              </button>
            </div>

            {/* Color Palette (when in Pen, Circle, Line, Box, Highlighter) */}
            {tool !== "eraser" && (
              <div className="flex items-center gap-1.5 rounded-2xl border border-border/60 bg-muted/40 p-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={cn(
                      "size-6 rounded-full border border-black/20 shadow-xs transition-transform active:scale-95 flex items-center justify-center",
                      selectedColor === c.color && "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110"
                    )}
                    title={c.label}
                  >
                    {selectedColor === c.color && (
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          c.id === "white" || c.id === "yellow" ? "bg-black" : "bg-white"
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Stroke Thickness Selection */}
            <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1">
              {SIZE_PRESETS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSizeId(s.id as "fine" | "medium" | "bold")}
                  className={cn(
                    "flex items-center justify-center rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-all",
                    selectedSizeId === s.id
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Action Tools: Rotate, Undo, Redo, Clear */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRotate}
                className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-foreground transition-all hover:bg-muted active:scale-95"
                title="Rotate 90° clockwise (R) - Fix sideways photo"
              >
                <RotateCw className="size-4" />
              </button>

              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex < 0 && strokes.length === 0}
                className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-40"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="size-4" />
              </button>

              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-40"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="size-4" />
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={strokes.length === 0}
                className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-destructive transition-all hover:bg-destructive/10 active:scale-95 disabled:opacity-40"
                title="Clear all annotations"
              >
                <DeleteSVG className="size-4" />
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
