"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";

export type HighlighterColorId = "yellow" | "green" | "pink" | "blue" | "orange";

interface HighlighterColorConfig {
  id: HighlighterColorId;
  name: string;
  nibGradient: {
    start: string;
    mid1: string;
    mid2: string;
    end: string;
  };
  nibBevel: {
    start: string;
    mid: string;
    end: string;
  };
  strokeColor: (alpha: number, isDark: boolean) => string;
  dotBg: string;
}

const HIGHLIGHTER_COLORS: Record<HighlighterColorId, HighlighterColorConfig> = {
  yellow: {
    id: "yellow",
    name: "Golden Amber",
    nibGradient: {
      start: "#FDE68A",
      mid1: "#FBBF24",
      mid2: "#F59E0B",
      end: "#D97706",
    },
    nibBevel: {
      start: "#FFFBEB",
      mid: "#FEF3C7",
      end: "#FBBF24",
    },
    strokeColor: (a, dark) =>
      dark ? `rgba(251, 191, 36, ${0.92 * a})` : `rgba(251, 191, 36, ${0.88 * a})`,
    dotBg: "bg-amber-400",
  },
  green: {
    id: "green",
    name: "Neon Green",
    nibGradient: {
      start: "#A7F3D0",
      mid1: "#34D399",
      mid2: "#10B981",
      end: "#059669",
    },
    nibBevel: {
      start: "#FFFFFF",
      mid: "#D1FAE5",
      end: "#34D399",
    },
    strokeColor: (a, dark) =>
      dark ? `rgba(52, 211, 153, ${0.72 * a})` : `rgba(74, 222, 128, ${0.78 * a})`,
    dotBg: "bg-emerald-400",
  },
  pink: {
    id: "pink",
    name: "Neon Pink",
    nibGradient: {
      start: "#FBCFE8",
      mid1: "#F472B6",
      mid2: "#EC4899",
      end: "#DB2777",
    },
    nibBevel: {
      start: "#FFFFFF",
      mid: "#FCE7F3",
      end: "#F472B6",
    },
    strokeColor: (a, dark) =>
      dark ? `rgba(244, 114, 182, ${0.72 * a})` : `rgba(244, 114, 182, ${0.78 * a})`,
    dotBg: "bg-pink-400",
  },
  blue: {
    id: "blue",
    name: "Sky Blue",
    nibGradient: {
      start: "#BAE6FD",
      mid1: "#38BDF8",
      mid2: "#0EA5E9",
      end: "#0284C7",
    },
    nibBevel: {
      start: "#FFFFFF",
      mid: "#E0F2FE",
      end: "#38BDF8",
    },
    strokeColor: (a, dark) =>
      dark ? `rgba(56, 189, 248, ${0.72 * a})` : `rgba(56, 189, 248, ${0.75 * a})`,
    dotBg: "bg-sky-400",
  },
  orange: {
    id: "orange",
    name: "Tangerine",
    nibGradient: {
      start: "#FED7AA",
      mid1: "#FB923C",
      mid2: "#F97316",
      end: "#EA580C",
    },
    nibBevel: {
      start: "#FFFFFF",
      mid: "#FFEDD5",
      end: "#FB923C",
    },
    strokeColor: (a, dark) =>
      dark ? `rgba(251, 146, 60, ${0.72 * a})` : `rgba(251, 146, 60, ${0.75 * a})`,
    dotBg: "bg-orange-400",
  },
};

interface Point {
  x: number;
  y: number;
}

interface CompletedStroke {
  id: number;
  d: string;
  colorId: HighlighterColorId;
  completedAt: number;
  opacity: number;
}

// Convert screen points to smooth SVG path
function pointsToPath(pts: Point[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y}, ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
}

export function LandingCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hidden, setHidden] = useState(true);
  const selectedColor: HighlighterColorId = "yellow";
  const [completedStrokes, setCompletedStrokes] = useState<CompletedStroke[]>([]);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const activePathRef = useRef<SVGPathElement | null>(null);

  // Dragging & drawing state
  const isMouseDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const currentColorRef = useRef<HighlighterColorId>("yellow");
  currentColorRef.current = selectedColor;
  const nextId = useRef(1);

  // Check for fine pointer (desktop / mouse)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
  }, []);

  // Only hide native cursor when custom cursor is active and visible
  useEffect(() => {
    const area = document.querySelector(".landing-cursor-area");
    if (enabled && !hidden) {
      document.documentElement.classList.add("landing-cursor-active");
      area?.classList.add("landing-cursor-active");
    } else {
      document.documentElement.classList.remove("landing-cursor-active");
      area?.classList.remove("landing-cursor-active");
    }

    return () => {
      document.documentElement.classList.remove("landing-cursor-active");
      const currentArea = document.querySelector(".landing-cursor-area");
      currentArea?.classList.remove("landing-cursor-active");
    };
  }, [enabled, hidden]);

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    setCompletedStrokes([]);
    currentPointsRef.current = [];
    if (activePathRef.current) {
      activePathRef.current.setAttribute("d", "");
    }
  }, []);

  // Keyboard shortcut to clear
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearHighlights();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, clearHighlights]);

  // Main mouse events
  useEffect(() => {
    if (!enabled) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMouseMove = (e: MouseEvent) => {
      // 1-to-1 viewport placement: tip apex touches (e.clientX, e.clientY)
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      setHidden(false);

      if (isMouseDownRef.current) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          document.body.style.userSelect = "none";
        }

        currentPointsRef.current.push({ x: e.clientX, y: e.clientY });

        if (activePathRef.current) {
          const d = pointsToPath(currentPointsRef.current);
          activePathRef.current.setAttribute("d", d);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left click only

      const target = e.target as Element | null;
      // Allow buttons, links, inputs, and interactive elements to receive normal clicks without drawing
      const isInteractive = Boolean(
        target?.closest?.('a, button, [role="button"], input, textarea, select, label, [data-interactive]')
      );

      if (isInteractive) {
        return;
      }

      isMouseDownRef.current = true;
      isDraggingRef.current = false;
      currentPointsRef.current = [{ x: e.clientX, y: e.clientY }];

      if (activePathRef.current) {
        activePathRef.current.setAttribute("d", pointsToPath(currentPointsRef.current));
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isMouseDownRef.current = false;
      document.body.style.userSelect = "";

      if (isDraggingRef.current && currentPointsRef.current.length > 1) {
        const d = pointsToPath(currentPointsRef.current);
        const stroke: CompletedStroke = {
          id: nextId.current++,
          d,
          colorId: currentColorRef.current,
          completedAt: performance.now(),
          opacity: 1,
        };
        setCompletedStrokes((prev) => [...prev, stroke]);
      }

      currentPointsRef.current = [];
      isDraggingRef.current = false;
      if (activePathRef.current) {
        activePathRef.current.setAttribute("d", "");
      }
    };

    const onMouseEnter = (e: MouseEvent) => {
      if (cursor) {
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      setHidden(false);
    };
    const onMouseLeave = () => {
      setHidden(true);
      isMouseDownRef.current = false;
      isDraggingRef.current = false;
      document.body.style.userSelect = "";
      currentPointsRef.current = [];
      if (activePathRef.current) {
        activePathRef.current.setAttribute("d", "");
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.documentElement.addEventListener("mouseenter", onMouseEnter);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.documentElement.removeEventListener("mouseenter", onMouseEnter);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.body.style.userSelect = "";
    };
  }, [enabled]);

  // Stroke Auto-Fadeout Loop: strokes stay for 2.4s, then smoothly fade out over 0.8s
  useEffect(() => {
    if (!enabled || completedStrokes.length === 0) return;

    let rafId = 0;
    const checkFade = () => {
      const now = performance.now();
      let hasChanges = false;

      const updated = completedStrokes
        .map((s) => {
          const age = now - s.completedAt;
          if (age < 2400) {
            return s;
          }
          const progress = (age - 2400) / 800;
          const opacity = Math.max(0, 1 - progress);
          if (opacity !== s.opacity) {
            hasChanges = true;
          }
          return { ...s, opacity };
        })
        .filter((s) => s.opacity > 0);

      if (updated.length !== completedStrokes.length || hasChanges) {
        setCompletedStrokes(updated);
      }

      if (updated.length > 0) {
        rafId = requestAnimationFrame(checkFade);
      }
    };

    rafId = requestAnimationFrame(checkFade);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, completedStrokes]);

  if (!enabled) return null;

  const activeColorCfg = HIGHLIGHTER_COLORS[selectedColor];

  return (
    <>
      {/*
        SVG Drawing Overlay (Fixed to Viewport):
        Using pure SVG vector paths guarantees 100% precision.
        Coordinates (clientX, clientY) match the pen tip down to 0.0px on all devices and Retina scales.
      */}
      <svg
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[88] size-full"
      >
        {/* Completed Strokes with Smooth Fadeout */}
        {completedStrokes.map((s) => {
          const cfg = HIGHLIGHTER_COLORS[s.colorId];
          return (
            <path
              key={s.id}
              d={s.d}
              stroke={cfg.strokeColor(s.opacity, isDark)}
              strokeWidth={12}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ opacity: s.opacity }}
            />
          );
        })}

        {/* Active Dragging Stroke */}
        <path
          ref={activePathRef}
          d=""
          stroke={activeColorCfg.strokeColor(1, isDark)}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/*
        Highlighter Pen Cursor Container:
        Positioned at (clientX, clientY).
        In viewBox="-10 -65 105 75", the apex of the chisel nib is at (0, 0).
        Inside the 105x75 SVG element, (0, 0) is at x = 10px, y = 65px.
        By applying translate(-10px, -65px) and scale(0.75) with transformOrigin="10px 65px",
        the chisel nib apex scales around itself and touches the EXACT (clientX, clientY) pixel!
        Orientation: Body extends UP-RIGHT (-34° angle), tip points down-left to (0, 0).
      */}
      <div
        ref={cursorRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[100] will-change-transform"
        style={{
          opacity: hidden ? 0 : 1,
          transition: "opacity 0.15s ease-out",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "105px",
            height: "75px",
            transform: "translate(-10px, -65px) scale(0.75)",
            transformOrigin: "10px 65px",
          }}
        >
          {/*
            Highlighter Pen SVG:
            - Tilted towards the right (barrel goes UP-RIGHT, apex touches 0,0).
            - Compact, refined cursor sizing (105x75 viewBox, barrel length ~75px).
            - Light mode contrast: Black barrel, Yellow accent & nib, Primary Green grip/collar.
            - Dark mode contrast: White barrel, Yellow accent & nib, Primary Green grip/collar.
          */}
          <svg
            width="105"
            height="75"
            viewBox="-10 -65 105 75"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block overflow-visible select-none"
          >
            <defs>
              {/* Soft realistic drop shadow */}
              <filter id="pen-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="2" dy="4" stdDeviation="2.5" floodColor="#020617" floodOpacity="0.3" />
              </filter>

              {/* Barrel Gradients: Black in Light Mode, White in Dark Mode */}
              <linearGradient id="barrel-top" x1="0%" y1="0%" x2="0%" y2="100%">
                {isDark ? (
                  <>
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="40%" stopColor="#F8FAFC" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="35%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1E293B" />
                  </>
                )}
              </linearGradient>

              <linearGradient id="barrel-specular" x1="0%" y1="0%" x2="0%" y2="100%">
                {isDark ? (
                  <>
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#F1F5F9" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                    <stop offset="60%" stopColor="#94A3B8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
                  </>
                )}
              </linearGradient>

              <linearGradient id="barrel-mid" x1="0%" y1="0%" x2="0%" y2="100%">
                {isDark ? (
                  <>
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="50%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="50%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#020617" />
                  </>
                )}
              </linearGradient>

              <linearGradient id="barrel-bot" x1="0%" y1="0%" x2="0%" y2="100%">
                {isDark ? (
                  <>
                    <stop offset="0%" stopColor="#CBD5E1" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#000000" />
                  </>
                )}
              </linearGradient>

              {/* Primary Green Grip / Collar Gradients */}
              <linearGradient id="primary-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                {isDark ? (
                  <>
                    <stop offset="0%" stopColor="#4ADE80" />
                    <stop offset="35%" stopColor="#16A34A" />
                    <stop offset="85%" stopColor="#15803D" />
                    <stop offset="100%" stopColor="#14532D" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#15803D" />
                    <stop offset="30%" stopColor="#005F02" />
                    <stop offset="85%" stopColor="#004D02" />
                    <stop offset="100%" stopColor="#003501" />
                  </>
                )}
              </linearGradient>

              {/* Golden Amber Accent Trim Gradients */}
              <linearGradient id="yellow-accent" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="40%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>

              {/* Chisel Felt Nib Gradients */}
              <linearGradient id="nib-body" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={activeColorCfg.nibGradient.start} />
                <stop offset="35%" stopColor={activeColorCfg.nibGradient.mid1} />
                <stop offset="75%" stopColor={activeColorCfg.nibGradient.mid2} />
                <stop offset="100%" stopColor={activeColorCfg.nibGradient.end} />
              </linearGradient>

              <linearGradient id="nib-bevel" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={activeColorCfg.nibBevel.start} />
                <stop offset="30%" stopColor={activeColorCfg.nibBevel.mid} />
                <stop offset="100%" stopColor={activeColorCfg.nibBevel.end} />
              </linearGradient>
            </defs>

            <g filter="url(#pen-shadow)">
              {/* Rotate around origin (0, 0) by -34°: barrel extends UP-RIGHT, apex touches (0, 0) */}
              <g transform="rotate(-34)">
                {/* Tail plug stopper */}
                <path
                  d="M 83 -4.5 C 85 -4.5 86.5 -2.5 86.5 0.5 C 86.5 3.5 85 5.5 83 5.5 L 76 5.5 L 76 -4.5 Z"
                  fill={isDark ? "#F8FAFC" : "#0F172A"}
                  stroke={isDark ? "#CBD5E1" : "#334155"}
                  strokeWidth="0.4"
                />
                <ellipse cx="83" cy="0.5" rx="1.8" ry="4.5" fill={isDark ? "#E2E8F0" : "#334155"} opacity="0.8" />

                {/* Yellow Accent Ring at tail */}
                <rect x="73" y="-5.5" width="3" height="12" rx="1" fill="url(#yellow-accent)" stroke="#CA8A04" strokeWidth="0.3" />

                {/* Main Faceted Barrel (Black in Light, White in Dark) */}
                {/* Top Facet */}
                <polygon points="24,-6.8 73,-6.8 73,-1.8 24,-1.8" fill="url(#barrel-top)" />
                {/* Specular shine on top facet */}
                <polygon points="25,-6 72,-6 72,-3.2 25,-3.2" fill="url(#barrel-specular)" />

                {/* Middle Facet (main face) */}
                <polygon points="24,-1.8 73,-1.8 73,3.8 24,3.8" fill="url(#barrel-mid)" />

                {/* Bottom Facet (shaded) */}
                <polygon points="24,3.8 73,3.8 73,8 24,8" fill="url(#barrel-bot)" />

                {/* Facet seam lines */}
                <line x1="24" y1="-1.8" x2="73" y2="-1.8" stroke={isDark ? "#E2E8F0" : "#475569"} strokeWidth="0.4" opacity="0.8" />
                <line x1="24" y1="3.8" x2="73" y2="3.8" stroke={isDark ? "#CBD5E1" : "#000000"} strokeWidth="0.35" />

                {/* Yellow Accent Step Ring between barrel and grip */}
                <rect x="21.5" y="-6.2" width="2.5" height="13.2" rx="0.8" fill="url(#yellow-accent)" stroke="#CA8A04" strokeWidth="0.3" />

                {/* Primary Green Grip Section */}
                <rect x="9" y="-5.5" width="12.5" height="11.8" rx="1.2" fill="url(#primary-grad)" stroke={isDark ? "#15803D" : "#003501"} strokeWidth="0.35" />

                {/* Grip Ribs */}
                <line x1="12" y1="-5" x2="12" y2="6" stroke={isDark ? "#14532D" : "#003501"} strokeWidth="0.8" strokeLinecap="round" />
                <line x1="12.5" y1="-5" x2="12.5" y2="6" stroke="#4ADE80" strokeWidth="0.5" strokeLinecap="round" opacity="0.75" />

                <line x1="15" y1="-5" x2="15" y2="6" stroke={isDark ? "#14532D" : "#003501"} strokeWidth="0.8" strokeLinecap="round" />
                <line x1="15.5" y1="-5" x2="15.5" y2="6" stroke="#4ADE80" strokeWidth="0.5" strokeLinecap="round" opacity="0.75" />

                <line x1="18" y1="-5" x2="18" y2="6" stroke={isDark ? "#14532D" : "#003501"} strokeWidth="0.8" strokeLinecap="round" />
                <line x1="18.5" y1="-5" x2="18.5" y2="6" stroke="#4ADE80" strokeWidth="0.5" strokeLinecap="round" opacity="0.75" />

                {/* Primary Green Conical Nose Collar */}
                <polygon points="9,-5 4,-3 4,4.2 9,6" fill="url(#primary-grad)" stroke={isDark ? "#15803D" : "#003501"} strokeWidth="0.35" />
                <line x1="8.5" y1="-4" x2="4.5" y2="-2.2" stroke="#4ADE80" strokeWidth="0.55" opacity="0.7" />

                {/* Golden Amber Retaining Ring */}
                <rect x="2" y="-3" width="2" height="7.2" rx="0.6" fill="url(#yellow-accent)" stroke="#D97706" strokeWidth="0.25" />

                {/* Golden Amber Chisel Felt Nib (Apex touches EXACTLY at 0, 0!) */}
                {/* Lower wedge face */}
                <polygon points="2,-2.2 0,0 1.8,3.8 2,3.8" fill="url(#nib-body)" stroke="#D97706" strokeWidth="0.25" />
                {/* Beveled chisel face facet */}
                <polygon points="2,-2.2 0,0 0.5,1.2 2,-0.2" fill="url(#nib-bevel)" />

                {/* Sharp Chisel Tip Apex Gleam */}
                <line x1="0.5" y1="0" x2="0" y2="0" stroke="#FFFFFF" strokeWidth="0.75" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </>
  );
}

