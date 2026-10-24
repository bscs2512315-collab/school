"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

type Particle = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
};

const TEXT = "EXBOARD AI";
const POINTER_RADIUS = 110;
const SCATTER_FORCE = 6;
const SPRING = 0.028;
const FRICTION = 0.86;

export function FooterWordmark() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef("rgba(15, 23, 42, 0.22)");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    colorRef.current =
      resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.22)" : "rgba(15, 23, 42, 0.22)";
  }, [resolvedTheme]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ring = ringRef.current;
    if (!wrap || !canvas || !ring) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: -9999, y: -9999, active: false };
    let particles: Particle[] = [];
    let dotSize = 3;
    let raf = 0;

    const build = () => {
      const width = wrap.clientWidth;
      if (width <= 0) return;

      const off = document.createElement("canvas");
      const octx = off.getContext("2d");
      if (!octx) return;
      const fontFamily = getComputedStyle(document.body).fontFamily;
      octx.font = `900 100px ${fontFamily}`;
      const measured = octx.measureText(TEXT).width;
      const fontSize = Math.floor((100 * width * 0.97) / measured);
      octx.font = `900 ${fontSize}px ${fontFamily}`;
      const metrics = octx.measureText(TEXT);
      const ascent = Math.ceil(metrics.actualBoundingBoxAscent);
      const descent = Math.ceil(metrics.actualBoundingBoxDescent);
      const height = Math.max(80, ascent + descent);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      off.width = width;
      off.height = height;
      octx.font = `900 ${fontSize}px ${fontFamily}`;
      octx.textAlign = "center";
      octx.textBaseline = "alphabetic";
      octx.fillStyle = "#000";
      octx.fillText(TEXT, width / 2, ascent);
      const pixels = octx.getImageData(0, 0, width, height).data;

      const gap = Math.max(4, Math.round(width / 190));
      dotSize = Math.max(2, Math.round(gap * 0.55));
      particles = [];
      for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < width; x += gap) {
          const alpha = pixels[(y * width + x) * 4 + 3];
          if (alpha > 128) {
            particles.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
          }
        }
      }
    };

    const draw = () => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = colorRef.current;

      for (const p of particles) {
        if (pointer.active && !reducedMotion) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_RADIUS * POINTER_RADIUS) {
            const d = Math.sqrt(d2) || 1;
            const force = (1 - d / POINTER_RADIUS) * SCATTER_FORCE;
            p.vx += (dx / d) * force + (Math.random() - 0.5) * 1.4;
            p.vy += (dy / d) * force + (Math.random() - 0.5) * 1.4;
          }
        }
        p.vx += (p.ox - p.x) * SPRING;
        p.vy += (p.oy - p.y) * SPRING;
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillRect(p.x, p.y, dotSize, dotSize);
      }
      raf = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - canvasRect.left;
      pointer.y = event.clientY - canvasRect.top;
      pointer.active = true;

      const wrapRect = wrap.getBoundingClientRect();
      ring.style.opacity = "1";
      ring.style.transform = `translate(${event.clientX - wrapRect.left}px, ${
        event.clientY - wrapRect.top
      }px) translate(-50%, -50%)`;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
      ring.style.opacity = "0";
    };

    build();
    draw();

    const observer = new ResizeObserver(build);
    observer.observe(wrap);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="relative mt-4 cursor-none overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="block w-full" />
      <div
        ref={ringRef}
        className="pointer-events-none absolute top-0 left-0 z-10 flex size-20 items-center justify-center rounded-full border-2 border-foreground/50 opacity-0 transition-opacity duration-200"
      >
        <span className="size-1.5 rounded-full bg-foreground/70" />
      </div>
    </div>
  );
}
