"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, Sparkles } from "lucide-react";

/**
 * Shared building blocks for the Physics practicals:
 * Gamified Nova header, cyber glass telemetry cards, glowing precision sliders,
 * modern HUD gauges, SVG graphs, telemetry data tables, and obsidian result cards.
 */

// ── Gamified Header (Nova avatar + Quit → Physics Lab) ──────────────────────────
export function LabHero({ badge, title, children }: { badge: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 p-5 text-white shadow-2xl ring-1 ring-white/20 sm:p-6">
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 bottom-0 size-32 rounded-full bg-teal-300/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4 sm:gap-5">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-950/40 sm:size-20">
          <Image src="/nova-tutor-physics.webp" alt="Nova" fill sizes="80px" className="object-cover object-top" />
          <div className="absolute bottom-1 right-1 size-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
            <Sparkles size={11} /> {badge}
          </span>
          <h1 className="mt-1 text-xl font-black leading-tight tracking-tight sm:text-2xl text-white">{title}</h1>
          <p className="mt-1.5 text-sm leading-snug text-emerald-100/85">{children}</p>
        </div>
        <Link
          href="/student/lab-game/physics"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105 active:scale-95 shadow-md"
        >
          <LogOut size={14} /> Quit
        </Link>
      </div>
    </div>
  );
}

// ── Gamified Telemetry Panel ──────────────────────────────────────────────────
export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-black/10 bg-white/95 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-black/5 pb-2.5">
          {title && (
            <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              {title}
            </h2>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Glowing Precision Slider ──────────────────────────────────────────────────
export function Slider({
  label,
  unit = "",
  min,
  max,
  step = 0.01,
  value,
  onChange,
  disabled,
}: {
  label: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={`rounded-2xl bg-black/[0.035] p-3 border border-black/5 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
      <div className="mb-2 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-700 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" /> {label}
        </span>
        <span className="rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-black text-primary shadow-2xs">
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary focus:outline-none"
          style={{
            background: `linear-gradient(to right, #10b981 ${percentage}%, #e2e8f0 ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
}

// ── Gamified Radial Meter with Digital LED Readout ───────────────────────────
export function Meter({
  label,
  unit,
  value,
  min = 0,
  max,
  color = "#10b981",
}: {
  label: string;
  unit: string;
  value: number;
  min?: number;
  max: number;
  color?: string;
}) {
  const W = 180, H = 120;
  const cx = W / 2, cy = 105, r = 70;
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const ang = Math.PI * (1 - t); // 180° (left) → 0° (right)
  const nx = cx + Math.cos(ang) * (r - 2);
  const ny = cy - Math.sin(ang) * (r - 2);
  const ticks = Array.from({ length: 11 }, (_, i) => i / 10);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[180px]">
        {/* Background track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Active colored track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${Math.PI * r * t} ${Math.PI * r}`}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
        {/* Graduation ticks */}
        {ticks.map((tt, i) => {
          const a = Math.PI * (1 - tt);
          const isMajor = i % 5 === 0;
          const x1 = cx + Math.cos(a) * (r + 4);
          const y1 = cy - Math.sin(a) * (r + 4);
          const x2 = cx + Math.cos(a) * (r - (isMajor ? 12 : 7));
          const y2 = cy - Math.sin(a) * (r - (isMajor ? 12 : 7));
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isMajor ? "#64748b" : "#cbd5e1"}
              strokeWidth={isMajor ? 2 : 1}
            />
          );
        })}
        {/* Needle pointer */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          className="transition-all duration-150"
        />
        <circle cx={cx} cy={cy} r={6} fill="#0f172a" />
        <circle cx={cx} cy={cy} r={3} fill="#ffffff" />
      </svg>
      {/* Digital Readout */}
      <div className="mt-1 flex flex-col items-center">
        <div className="flex items-baseline gap-1 rounded-xl bg-slate-900 px-3 py-1 font-mono text-white shadow-inner">
          <span className="text-base font-black text-emerald-400">
            {value.toFixed(unit === "A" ? 3 : 2)}
          </span>
          <span className="text-[11px] font-bold text-slate-400">{unit}</span>
        </div>
        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ── SVG Precision Graph ───────────────────────────────────────────────────────
export type Pt = { x: number; y: number };
export function Graph({
  points,
  xLabel,
  yLabel,
  xMax,
  yMax,
  mode = "line",
  color = "#10b981",
  heightPx,
  light = false,
}: {
  points: Pt[];
  xLabel: string;
  yLabel: string;
  xMax?: number;
  yMax?: number;
  mode?: "line" | "scatter" | "fit";
  color?: string;
  heightPx?: number;
  light?: boolean;
}) {
  const W = 460, H = 300, pad = { l: 48, r: 16, t: 16, b: 42 };
  const xm = xMax ?? Math.max(1, ...points.map((p) => p.x)) * 1.08;
  const ym = yMax ?? Math.max(0.001, ...points.map((p) => p.y)) * 1.12;
  const px = (x: number) => pad.l + (x / xm) * (W - pad.l - pad.r);
  const py = (y: number) => H - pad.b - (y / ym) * (H - pad.t - pad.b);
  const grid = Array.from({ length: 6 }, (_, i) => i / 5);
  const sorted = [...points].sort((a, b) => a.x - b.x);

  let fit: { m: number; c: number } | null = null;
  if (mode === "fit" && points.length >= 2) {
    const n = points.length;
    const sx = points.reduce((s, p) => s + p.x, 0);
    const sy = points.reduce((s, p) => s + p.y, 0);
    const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
    const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
    const m = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
    fit = { m, c: (sy - m * sx) / n };
  }

  return (
    <div className={`overflow-hidden rounded-2xl border p-2 shadow-inner ${light ? "border-slate-200 bg-white" : "border-slate-200/80 bg-slate-950"}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        style={heightPx ? { height: heightPx } : undefined}
      >
        {/* Subtle grid */}
        {grid.map((g, i) => (
          <g key={`x${i}`}>
            <line x1={px(g * xm)} y1={pad.t} x2={px(g * xm)} y2={H - pad.b} stroke={light ? "#e2e8f0" : "#1e293b"} strokeWidth={1} />
            <text x={px(g * xm)} y={H - pad.b + 16} textAnchor="middle" fontSize={10} fill={light ? "#475569" : "#64748b"} fontWeight={700}>
              {(g * xm).toFixed(xm < 3 ? 1 : 0)}
            </text>
          </g>
        ))}
        {grid.map((g, i) => (
          <g key={`y${i}`}>
            <line x1={pad.l} y1={py(g * ym)} x2={W - pad.r} y2={py(g * ym)} stroke={light ? "#e2e8f0" : "#1e293b"} strokeWidth={1} />
            <text x={pad.l - 6} y={py(g * ym) + 3} textAnchor="end" fontSize={10} fill={light ? "#475569" : "#64748b"} fontWeight={700}>
              {(g * ym).toFixed(ym < 3 ? 2 : ym < 30 ? 1 : 0)}
            </text>
          </g>
        ))}
        {/* Axes */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke={light ? "#64748b" : "#475569"} strokeWidth={1.5} />
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke={light ? "#64748b" : "#475569"} strokeWidth={1.5} />
        <text x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill={light ? "#475569" : "#94a3b8"} fontWeight={800}>
          {xLabel}
        </text>
        <text
          x={14}
          y={(pad.t + H - pad.b) / 2}
          textAnchor="middle"
          fontSize={11}
          fill={light ? "#475569" : "#94a3b8"}
          fontWeight={800}
          transform={`rotate(-90 14 ${(pad.t + H - pad.b) / 2})`}
        >
          {yLabel}
        </text>

        {/* Best-fit line */}
        {fit && (
          <line
            x1={px(0)}
            y1={py(fit.c)}
            x2={px(xm)}
            y2={py(fit.m * xm + fit.c)}
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}
        {/* Connecting plotted curve */}
        {sorted.length > 1 && (
          <polyline
            fill="none"
            stroke={color}
            strokeWidth={mode === "fit" ? 1.5 : 2.5}
            strokeOpacity={mode === "fit" ? 0.6 : 1}
            points={sorted.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}
          />
        )}
        {/* Glowing data dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={px(p.x)} cy={py(p.y)} r={5} fill={color} opacity={0.4} />
            <circle cx={px(p.x)} cy={py(p.y)} r={3.5} fill={color} stroke="#ffffff" strokeWidth={1.5} />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Telemetry Data Table ─────────────────────────────────────────────────────
export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="px-3 py-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-xs text-slate-400">
                Take readings to populate the telemetry log…
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="hover:bg-emerald-50/50 transition-colors">
                {r.map((cell, j) => (
                  <td key={j} className="px-3 py-2 font-mono">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Cyber Obsidian Result Card ───────────────────────────────────────────────
export function ResultCard({
  formula,
  value,
  unit,
  expected,
  note,
}: {
  formula: string;
  value: number | null;
  unit: string;
  expected?: { value: number; label?: string };
  note?: string;
}) {
  const err = value != null && expected ? Math.abs((value - expected.value) / expected.value) * 100 : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4 sm:p-5 text-white shadow-2xl border border-emerald-500/30">
      <div className="absolute -right-8 -top-8 size-28 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-300 border border-emerald-500/30">
          <Sparkles size={11} /> Calculated Output
        </span>
        {value != null && (
          <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
            Complete
          </span>
        )}
      </div>

      <p className="mt-2 font-mono text-xs text-emerald-300/90">{formula}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight">
        {value != null ? value.toPrecision(3) : "—"}{" "}
        <span className="text-sm font-bold text-emerald-400/80">{unit}</span>
      </p>

      {expected && value != null && (
        <p className="mt-1 text-[11px] font-bold text-slate-300">
          Accepted: {expected.value} {unit} · <span className="text-emerald-400">Error {err!.toFixed(1)}%</span>
        </p>
      )}
      {note && <p className="mt-2 text-xs leading-relaxed text-slate-300/80">{note}</p>}
    </div>
  );
}
