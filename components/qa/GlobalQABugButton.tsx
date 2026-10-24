"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bug,
  X,
  Sparkles,
  Gamepad2,
  Layout,
  Smartphone,
  AlertTriangle,
  Lightbulb,
  Send,
  Upload,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ChevronDown,
  Monitor,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/user/useUserProfile";
import { cn } from "@/lib/utils";

const QA_CATEGORIES = [
  {
    id: "LAB_GAME_BUG",
    label: "🎮 Virtual Lab / Game Issue",
    desc: "Physics/Chemistry simulation logic, controls, canvas rendering",
    icon: Gamepad2,
    color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "UI_UX_IMPROVEMENT",
    label: "🎨 UI / UX Enhancement",
    desc: "Design, spacing, colors, buttons, readability, better user experience",
    icon: Layout,
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "RESPONSIVENESS",
    label: "📱 Mobile / Tablet Layout",
    desc: "Broken responsive layout, cut off text on smaller screens",
    icon: Smartphone,
    color: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    id: "PAGE_ERROR_CRASH",
    label: "⚠️ Broken Feature / Error",
    desc: "Button not working, infinite loading, crash, console error",
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "FEATURE_REQUEST",
    label: "💡 Feature / UX Idea",
    desc: "Suggest a new tool, student flow, or capability for this page",
    icon: Lightbulb,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "OTHER",
    label: "💬 General QA Feedback",
    desc: "Other observations or general quality notes",
    icon: Bug,
    color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
];

const PRIORITY_LEVELS = [
  { id: "NORMAL", label: "Normal", color: "bg-muted text-muted-foreground" },
  { id: "HIGH", label: "High Priority ⚡", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { id: "CRITICAL", label: "Critical Blocker 🚨", color: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" },
];

export default function GlobalQABugButton() {
  const { data: user } = useUserProfile();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("UI_UX_IMPROVEMENT");
  const [priority, setPriority] = useState("NORMAL");
  const [description, setDescription] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenInfo, setScreenInfo] = useState<{ width: number; height: number; userAgent: string }>({
    width: 0,
    height: 0,
    userAgent: "",
  });

  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false,
  });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Check if current user has QA or Admin privileges
  const isQA =
    user?.role === "QA" ||
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === "mtahatalib110+aliya@gmail.com" ||
    user?.email?.toLowerCase().includes("taha");

  // Load saved position from localStorage or set safe initial position
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem("qa_widget_position");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const clampedX = Math.min(Math.max(8, parsed.x), window.innerWidth - 180);
          const clampedY = Math.min(Math.max(8, parsed.y), window.innerHeight - 60);
          setPosition({ x: clampedX, y: clampedY });
          return;
        }
      }
    } catch {}

    // Default position: bottom-left offset above the sidebar footer
    setPosition({ x: 20, y: Math.max(20, window.innerHeight - 76) });
  }, []);

  // Update bounds on window resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const widgetWidth = widgetRef.current?.offsetWidth || 150;
        const widgetHeight = widgetRef.current?.offsetHeight || 44;
        return {
          x: Math.min(Math.max(8, prev.x), window.innerWidth - widgetWidth - 8),
          y: Math.min(Math.max(8, prev.y), window.innerHeight - widgetHeight - 8),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    const currentX = position?.x ?? 20;
    const currentY = position?.y ?? (window.innerHeight - 76);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      moved: false,
    };

    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 5) {
      dragStartRef.current.moved = true;
    }

    const widgetWidth = widgetRef.current?.offsetWidth || 150;
    const widgetHeight = widgetRef.current?.offsetHeight || 44;

    const newX = Math.min(
      Math.max(8, dragStartRef.current.initialX + deltaX),
      window.innerWidth - widgetWidth - 8
    );
    const newY = Math.min(
      Math.max(8, dragStartRef.current.initialY + deltaY),
      window.innerHeight - widgetHeight - 8
    );

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (dragStartRef.current.moved && position) {
      try {
        localStorage.setItem("qa_widget_position", JSON.stringify(position));
      } catch {}
    }
  };

  const handleWidgetClick = () => {
    if (dragStartRef.current.moved) {
      return;
    }
    if (isLabGame) setCategory("LAB_GAME_BUG");
    setIsOpen(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        userAgent: navigator.userAgent,
      });

      const handleResize = () => {
        setScreenInfo({
          width: window.innerWidth,
          height: window.innerHeight,
          userAgent: navigator.userAgent,
        });
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Handle clipboard paste for screenshots
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageUpload(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  if (!isQA) return null;

  // Detect if current page is a Virtual Lab Game
  const isLabGame = pathname?.includes("/lab") || pathname?.includes("/game");

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      // Create local preview
      const previewUrl = URL.createObjectURL(file);
      setScreenshotPreview(previewUrl);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "qa_screenshots");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setScreenshotUrl(data.url || data.secure_url || previewUrl);
        toast.success("Screenshot attached! 📸");
      } else {
        // Fallback to base64 preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshotUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        toast.success("Screenshot attached locally!");
      }
    } catch {
      toast.error("Failed to upload screenshot image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please provide a description of the bug or desired UI change.");
      return;
    }

    setIsSubmitting(true);
    const fullUrl = typeof window !== "undefined" ? window.location.href : pathname;
    const pageTitle = typeof document !== "undefined" ? document.title : "";

    const bugType = isLabGame ? "LAB_GAME" : category === "UI_UX_IMPROVEMENT" ? "UI_UX" : "GLOBAL_PAGE";

    const payload = {
      bugType,
      category,
      title: `${isLabGame ? "🎮 Lab Game" : "🌐 Page"} Issue: ${pathname}`,
      description: description.trim(),
      metadata: {
        page_url: fullUrl,
        page_pathname: pathname,
        page_search: searchParams?.toString() || "",
        page_title: pageTitle,
        screen_resolution: `${screenInfo.width}x${screenInfo.height}`,
        device_type: screenInfo.width < 768 ? "Mobile" : screenInfo.width < 1024 ? "Tablet" : "Desktop",
        browser_info: screenInfo.userAgent,
        priority,
        screenshot_url: screenshotUrl || screenshotPreview,
        submitted_from: "GLOBAL_QA_WIDGET",
      },
    };

    try {
      const res = await fetch("/api/qa/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Bug / UX feedback reported to QA tracker! 🚀");
        setIsOpen(false);
        setDescription("");
        setScreenshotUrl(null);
        setScreenshotPreview(null);
      } else {
        toast.error(data.error || "Failed to submit report");
      }
    } catch {
      toast.error("Submission failed. Please check network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Draggable Floating Trigger Button */}
      <div
        ref={widgetRef}
        style={
          position
            ? {
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 9999,
                touchAction: "none",
              }
            : {
                position: "fixed",
                left: "20px",
                bottom: "20px",
                zIndex: 9999,
                touchAction: "none",
              }
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "flex items-center gap-2 print:hidden select-none cursor-grab active:cursor-grabbing",
          !isDragging && "transition-all duration-75"
        )}
      >
        <button
          type="button"
          onClick={handleWidgetClick}
          className={cn(
            "group flex items-center gap-2 rounded-full px-3.5 py-2.5 shadow-2xl transition-all duration-200 active:scale-95",
            "border border-amber-500/40 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600",
            "hover:shadow-amber-500/30 hover:scale-105",
            isDragging && "scale-105 shadow-amber-500/50 ring-2 ring-white/60 cursor-grabbing"
          )}
          title="Drag to move anywhere • Click to report bug"
        >
          <GripVertical className="size-3.5 text-white/70 -mr-0.5 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            {isLabGame ? (
              <Gamepad2 className="size-4 animate-bounce" />
            ) : (
              <Bug className="size-4 transition-transform group-hover:rotate-12" />
            )}
            <span className="absolute -top-1 -right-1 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
          </div>
          <span className="text-xs font-black tracking-wide hidden sm:inline-block">
            {isLabGame ? "QA Game / UX" : "QA Bug Report"}
          </span>
        </button>
      </div>

      {/* Reporting Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs">
                  {isLabGame ? <Gamepad2 className="size-6" /> : <Bug className="size-6" />}
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                    <span>{isLabGame ? "Virtual Lab & Game QA Report" : "Page QA & UX Report"}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-mono truncate max-w-[280px] sm:max-w-md">
                    <Monitor className="size-3 shrink-0" />
                    <span>{pathname}</span>
                    <span>•</span>
                    <span>{screenInfo.width}x{screenInfo.height}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-2">
                  Select Issue / Improvement Category:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QA_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-2xl p-2.5 text-left border transition-all active:scale-[0.98]",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                            : "border-border/60 bg-background/50 hover:bg-muted hover:border-border"
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-xl",
                            cat.color
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{cat.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                            {cat.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Selector */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-bold text-foreground shrink-0">Priority:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRIORITY_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setPriority(lvl.id)}
                      className={cn(
                        "rounded-xl border px-2.5 py-1 text-xs font-bold transition-all active:scale-95",
                        priority === lvl.id
                          ? cn("border-primary ring-1 ring-primary", lvl.color)
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Describe the Bug or Requested UI/UX Change:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isLabGame
                      ? "e.g. When moving the rheostat slider in Ohm's Law game, current increases too fast. Also add reset button on mobile view..."
                      : "e.g. The cards on this page are cut off on small screens. Please add better padding and fix font hierarchy..."
                  }
                  className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none font-medium"
                />
              </div>

              {/* Screenshot Attachment / Paste */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-foreground">Attach Screenshot (Optional):</span>
                  <span className="text-[11px] text-muted-foreground">Tip: Paste (Ctrl+V) from clipboard</span>
                </div>

                {screenshotPreview || screenshotUrl ? (
                  <div className="relative rounded-2xl border border-border bg-muted/30 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <img
                        src={screenshotPreview || screenshotUrl || ""}
                        alt="Screenshot Preview"
                        className="size-10 rounded-lg object-cover border border-border shrink-0"
                      />
                      <span className="text-xs font-medium text-foreground truncate">
                        Screenshot attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotPreview(null);
                        setScreenshotUrl(null);
                      }}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-background/50 hover:bg-muted/40 hover:border-primary/50 p-3 text-xs font-semibold text-muted-foreground cursor-pointer transition-all">
                    {isUploadingImage ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <Upload className="size-4 text-muted-foreground" />
                    )}
                    <span>{isUploadingImage ? "Uploading..." : "Upload or Drop Screenshot Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Submitting to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>Submit Bug Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
