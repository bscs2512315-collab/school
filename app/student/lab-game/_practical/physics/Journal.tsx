"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  BookOpen,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Calculator,
  Target,
  Wrench,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { convertMathToHTML } from "@/lib/utils/math-notation";

export type JournalConfig = {
  expNo: number;
  title: string;
  object: string;
  apparatus: string;
  formula?: string;
  theory: React.ReactNode;
  method: string[];
  observation: React.ReactNode;
  calculation: React.ReactNode;
  result: React.ReactNode;
  errors?: string[];
  precautions?: string[];
  playRoute?: string;
  parameters?: { label: string; value: string }[];
  tables?: {
    title?: string;
    head: string[];
    rows: (string | number)[][];
    note?: string;
  }[];
};

const DEFAULT_ERRORS = [
  "The temperature/conditions of the surroundings may change during the experiment.",
  "The least count of the instruments limits the reading accuracy.",
  "Zero and parallax errors while taking readings.",
  "Heat losses / stray resistances not fully accounted for.",
  "Personal (human) error in observation and timing.",
];

/**
 * Render text or mathematical notation with proper vertical fractions and symbols
 */
export function MathFormatted({
  content,
  className,
  as = "div",
}: {
  content?: string | React.ReactNode;
  className?: string;
  as?: "div" | "span" | "p";
}) {
  if (!content) return null;
  if (typeof content !== "string") {
    const Component = as;
    return <Component className={className}>{content}</Component>;
  }

  const html = convertMathToHTML(content);
  const Component = as;
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function JTable({
  head,
  rows,
  title,
  note,
}: {
  head: string[];
  rows: (string | number)[][];
  title?: string;
  note?: string;
}) {
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xs">
      {title && (
        <div className="border-b border-black/5 bg-[#f8faf8] px-4 py-2 text-xs font-black uppercase tracking-wider text-primary">
          {title}
        </div>
      )}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-primary/20 bg-primary/5 text-xs font-bold uppercase tracking-wider text-primary-dark">
              {head.map((h, i) => (
                <th key={i} className="px-4 py-2.5 font-black whitespace-nowrap">
                  <MathFormatted content={h} as="span" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 font-mono text-[13px] text-black/80">
            {rows.map((r, i) => (
              <tr
                key={i}
                className={cn(
                  "transition-colors hover:bg-black/2.5",
                  i % 2 === 1 ? "bg-[#fcfdfc]" : "bg-white",
                )}
              >
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={cn(
                      "px-4 py-2.5 whitespace-nowrap",
                      j === 0 ? "font-bold text-black" : "text-black/80",
                    )}
                  >
                    <MathFormatted content={String(c)} as="span" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && (
        <div className="border-t border-black/5 bg-[#fbfcfb] px-4 py-1.5 text-xs italic text-black/60">
          <MathFormatted content={note} as="span" />
        </div>
      )}
    </div>
  );
}

/**
 * PDF / Lab Journal Document View — continuous vertical flow
 */
export function JournalDocument({
  config,
  className,
  isEmbedded = false,
}: {
  config: JournalConfig;
  className?: string;
  isEmbedded?: boolean;
}) {
  const errors = config.errors ?? DEFAULT_ERRORS;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-4xl rounded-2xl md:rounded-3xl bg-white p-4 sm:p-8 md:p-10 text-[#1f2937] shadow-xl ring-1 ring-black/5",
        className,
      )}
    >
      {/* Header / Cover Section */}
      <header className="border-b-2 border-primary/20 pb-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-2.5 h-12 w-40 sm:h-14 sm:w-48">
            <Image
              src="/AppLogoLight.png"
              alt="ExBoard AI"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="mt-2 font-serif text-2xl font-black tracking-tight text-[#111827] sm:text-3xl md:text-4xl">
            Experiment No. {config.expNo}
          </h1>
          <h2 className="mt-1.5 font-serif text-base sm:text-xl md:text-2xl font-bold text-primary-dark">
            {config.title}
          </h2>

          {/* Academic meta row */}
          <div className="mt-4 grid w-full grid-cols-2 gap-2 rounded-xl border border-black/10 bg-[#f9faf9] p-2.5 text-left text-xs sm:grid-cols-4 sm:p-3 sm:text-[13px]">
            <div>
              <span className="block font-bold text-black/40 uppercase text-[9px] sm:text-[10px] tracking-wider">
                Subject
              </span>
              <span className="font-bold text-black">Physics Lab</span>
            </div>
            <div>
              <span className="block font-bold text-black/40 uppercase text-[9px] sm:text-[10px] tracking-wider">
                Grade Level
              </span>
              <span className="font-bold text-black">HSSC-II (XII)</span>
            </div>
            <div>
              <span className="block font-bold text-black/40 uppercase text-[9px] sm:text-[10px] tracking-wider">
                Curriculum
              </span>
              <span className="font-bold text-black">AKUEB Pattern</span>
            </div>
            <div>
              <span className="block font-bold text-black/40 uppercase text-[9px] sm:text-[10px] tracking-wider">
                Status
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-primary">
                <CheckCircle2 className="size-3.5" /> Complete Lab
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Journal Document Body */}
      <main className="mt-6 space-y-7 sm:space-y-8">
        {/* 1. OBJECT / AIM */}
        <section id="section-object" className="scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-black/10 pb-1.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              1
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-primary sm:text-base">
              Object / Aim of Experiment
            </h3>
          </div>
          <div className="mt-2.5 rounded-xl border border-primary/15 bg-primary/5 p-3.5 text-sm font-medium leading-relaxed text-[#111827] sm:text-base">
            <p>{config.object}</p>
          </div>
        </section>

        {/* 2. APPARATUS REQUIRED */}
        <section id="section-apparatus" className="scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-black/10 pb-1.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              2
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-primary sm:text-base">
              Apparatus & Materials Required
            </h3>
          </div>
          <div className="mt-2.5 rounded-xl border border-black/10 bg-[#fbfcfb] p-3.5 text-sm leading-relaxed text-[#2d3748] sm:text-[15px]">
            <p>{config.apparatus}</p>
          </div>
        </section>

        {/* 3. PRINCIPLE & THEORY */}
        <section id="section-theory" className="scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-black/10 pb-1.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              3
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-primary sm:text-base">
              Principle & Working Theory
            </h3>
          </div>
          <div className="mt-2.5 space-y-3 font-serif text-[15px] leading-relaxed text-[#1f2937] sm:text-base">
            {typeof config.theory === "string" ? (
              <MathFormatted content={config.theory} />
            ) : (
              config.theory
            )}
          </div>
        </section>

        {/* 4. STEP-BY-STEP PROCEDURE */}
        <section id="section-method" className="scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-black/10 pb-1.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              4
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-primary sm:text-base">
              Experimental Procedure / Method
            </h3>
          </div>
          <div className="mt-2.5">
            <ol className="space-y-2 pl-0.5">
              {config.method.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-[#2d3748] sm:text-[15px]"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. OBSERVATIONS & TABULATION */}
        <section id="section-observation" className="scroll-mt-24">
          <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
                5
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary sm:text-base">
                Observations & Data Tabulation
              </h3>
            </div>
            {config.playRoute && !isEmbedded && (
              <Link
                href={config.playRoute}
                className="hidden items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition hover:bg-primary/20 sm:inline-flex"
              >
                <FlaskConical className="size-3.5" /> Virtual Lab
              </Link>
            )}
          </div>

          <div className="mt-3 space-y-3.5">
            {/* Parameters list if provided */}
            {config.parameters && config.parameters.length > 0 && (
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-black/10 bg-[#fcfdfc] p-3 sm:grid-cols-2 sm:p-4">
                {config.parameters.map((param, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-black/5 pb-1 text-xs sm:text-[13px]"
                  >
                    <span className="font-semibold text-black/70">
                      <MathFormatted content={param.label} as="span" />:
                    </span>
                    <span className="font-mono font-bold text-primary-dark">
                      <MathFormatted content={param.value} as="span" />
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Observation Node */}
            <div className="space-y-2.5 font-serif text-[15px] leading-relaxed text-[#1f2937]">
              {typeof config.observation === "string" ? (
                <MathFormatted content={config.observation} />
              ) : (
                config.observation
              )}
            </div>

            {/* Structured Tables if provided */}
            {config.tables &&
              config.tables.map((tbl, i) => (
                <JTable
                  key={i}
                  title={tbl.title}
                  head={tbl.head}
                  rows={tbl.rows}
                  note={tbl.note}
                />
              ))}

            {/* Virtual Lab Launcher Banner */}
            {config.playRoute && (
              <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-3.5 sm:flex-row sm:items-center sm:p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-2xs">
                    <FlaskConical className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-black">
                      Interactive 3D Virtual Lab
                    </p>
                    <p className="text-[11px] sm:text-xs text-black/60">
                      Record real-time readings and plot graphs interactively.
                    </p>
                  </div>
                </div>
                <Link
                  href={config.playRoute}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-black text-white shadow-2xs transition hover:bg-primary-dark"
                >
                  Launch Lab <ChevronRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 6. CALCULATIONS & ANALYSIS */}
        <section id="section-calculation" className="scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-black/10 pb-1.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              6
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-primary sm:text-base">
              Calculations & Analysis
            </h3>
          </div>
          <div className="mt-2.5 rounded-xl border border-black/10 bg-[#fcfdfc] p-3.5 text-sm leading-relaxed text-[#1f2937] sm:p-4">
            {typeof config.calculation === "string" ? (
              <MathFormatted content={config.calculation} />
            ) : (
              config.calculation
            )}
          </div>
        </section>

        {/* 7. RESULT & CONCLUSION */}
        <section id="section-result" className="scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-black/10 pb-1.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              7
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-primary sm:text-base">
              Result & Conclusion
            </h3>
          </div>
          <div className="mt-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm font-bold leading-relaxed text-emerald-950 sm:p-4 sm:text-base">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                {typeof config.result === "string" ? (
                  <MathFormatted content={config.result} />
                ) : (
                  config.result
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 8. SOURCES OF ERROR & PRECAUTIONS */}
        <section id="section-errors" className="scroll-mt-24">
          <div className="flex items-center gap-2 border-b border-black/10 pb-1.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              8
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-primary sm:text-base">
              Sources of Error & Precautions
            </h3>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 sm:p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-800">
                <AlertTriangle className="size-4 text-amber-600" /> Possible Sources of Error
              </h4>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-black/75 sm:text-[13px]">
                {errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-600" />
                    <span><MathFormatted content={e} as="span" /></span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 sm:p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-800">
                <ShieldCheck className="size-4 text-blue-600" /> Lab Precautions
              </h4>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-black/75 sm:text-[13px]">
                {(config.precautions ?? [
                  "Ensure all connections and instruments are securely fastened.",
                  "Take readings perpendicularly at eye level to eliminate parallax error.",
                  "Allow the apparatus to attain steady thermal equilibrium before logging.",
                  "Handle sensitive glassware and hot liquid containers with care.",
                ]).map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue-600" />
                    <span><MathFormatted content={p} as="span" /></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/**
 * Continuous-Scroll Modal Journal for in-game lab simulations
 */
export default function Journal({
  config,
  onClose,
}: {
  config: JournalConfig;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#f4f6f4] shadow-2xl border border-white/20">
        {/* Sticky Modal Top Bar */}
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white shadow-2xs">
              <BookOpen size={14} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-black text-black">
                Practical Journal · Experiment {config.expNo}
              </p>
              <p className="line-clamp-1 text-[11px] font-semibold text-black/55">
                {config.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full bg-black px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-black/80 shadow-2xs"
          >
            <X size={13} /> Close
          </button>
        </div>

        {/* Scrollable PDF Document Sheet */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-5 md:p-6">
          <JournalDocument config={config} isEmbedded />
        </div>
      </div>
    </div>
  );
}

// Self-contained button that opens the journal modal for a practical simulation.
export function JournalButton({
  config,
  disabled,
}: {
  config: JournalConfig;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-primary-dark disabled:opacity-50"
      >
        <BookOpen size={16} /> Open practical journal
      </button>
      {open && <Journal config={config} onClose={() => setOpen(false)} />}
    </>
  );
}
