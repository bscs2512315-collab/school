"use client";

import React, { useState } from "react";
import ClockSVG from "@/public/svgs/ClockSVG";
import SparklesSVG from "@/public/svgs/SparklesSVG";
import ArrowRightSVG from "@/public/svgs/ArrowRightSVG";
import ArrowLeftSVG from "@/public/svgs/ArrowLeftSVG";

interface Option {
  id: string;
  label: string;
  text: string;
  isCorrect?: boolean;
}

const SAMPLE_QUESTION = {
  subject: "Mathematics • AKUEB",
  paper: "Class XI • Year 2025",
  qNum: 1,
  totalQ: 50,
  marks: 1,
  timeRemaining: "59:53",
  prefix: "The simplified form of",
  fractionNum: "2i",
  fractionDen: "1+i",
  suffix: "is equal to",
  options: [
    { id: "A", label: "A", text: "1+i", isCorrect: true },
    { id: "B", label: "B", text: "1-i" },
    { id: "C", label: "C", text: "2+2i" },
    { id: "D", label: "D", text: "2-2i" },
  ] as Option[],
  explanation: "Multiply by conjugate: 2i(1-i)/(1+1) = 2i(1-i)/2 = i - i² = 1+i",
};

export function PaperSolvingMockup() {
  const [selectedId, setSelectedId] = useState<string>("A");

  return (
    <div className="flex h-full w-full flex-col select-none bg-slate-950/95 text-slate-100 font-sans text-left overflow-hidden">
      {/* Mini Window Sub-header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate font-bold text-slate-200">
            {SAMPLE_QUESTION.subject}
          </span>
          <span className="text-white/40">•</span>
          <span className="text-white/60 font-medium truncate">
            {SAMPLE_QUESTION.paper}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-300">
            <ClockSVG className="size-2.5 text-amber-400 animate-pulse" />
            <span>{SAMPLE_QUESTION.timeRemaining}</span>
          </div>
          <span className="hidden sm:inline-block rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-300">
            Live Exam
          </span>
        </div>
      </div>

      {/* Question Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 sm:p-3 flex flex-col justify-between gap-2">
        {/* Question Header & Meta */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wide">
                Question {SAMPLE_QUESTION.qNum}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                of {SAMPLE_QUESTION.totalQ}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-300">
                {SAMPLE_QUESTION.marks} Mark
              </span>
              <span className="text-[9.5px] font-bold text-emerald-400 flex items-center gap-0.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                Solved
              </span>
            </div>
          </div>

          {/* Question Stem with Math Fraction */}
          <div className="text-[11px] sm:text-[12.5px] font-semibold leading-relaxed text-slate-100 flex items-center flex-wrap gap-x-1.5">
            <span>{SAMPLE_QUESTION.prefix}</span>
            <span className="inline-flex flex-col items-center justify-center align-middle mx-0.5 text-[10px] sm:text-[11px] font-bold">
              <span className="border-b border-current px-1 leading-none">
                {SAMPLE_QUESTION.fractionNum}
              </span>
              <span className="leading-none pt-0.5">
                {SAMPLE_QUESTION.fractionDen}
              </span>
            </span>
            <span>{SAMPLE_QUESTION.suffix}</span>
          </div>
        </div>

        {/* MCQ 4 Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
          {SAMPLE_QUESTION.options.map((opt) => {
            const isSelected = selectedId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedId(opt.id)}
                className={`group relative flex items-center gap-2 rounded-xl p-1.5 sm:p-2 text-left transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? "border-emerald-400/80 bg-emerald-500/20 text-white shadow-sm shadow-emerald-500/20"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]"
                }`}
              >
                {/* Option Letter Pill */}
                <span
                  className={`flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-colors ${
                    isSelected
                      ? "bg-emerald-400 text-emerald-950"
                      : "bg-white/10 text-slate-300 group-hover:bg-white/20"
                  }`}
                >
                  {opt.label}
                </span>

                {/* Option Text */}
                <span className="flex-1 text-[11px] sm:text-[12px] font-bold leading-tight truncate">
                  {opt.text}
                </span>

                {/* Checked Icon */}
                {isSelected && (
                  <span className="shrink-0 flex size-3.5 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 font-black text-[9px]">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* AI Instant Insight Pill */}
        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-1 text-[9.5px] sm:text-[10.5px] font-medium text-emerald-200 shadow-xs">
          <SparklesSVG className="size-3 text-emerald-400 shrink-0" />
          <span className="font-bold text-emerald-300">Nova AI:</span>
          <span className="truncate text-emerald-100/90">{SAMPLE_QUESTION.explanation}</span>
          <span className="ml-auto shrink-0 font-bold text-emerald-400 text-[9px] bg-emerald-500/20 px-1 rounded">
            +1 pt
          </span>
        </div>
      </div>

      {/* Mini Navigation Footer & Question Palette */}
      <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/90 px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px]">
        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer font-bold transition-colors">
          <ArrowLeftSVG className="size-3" />
          <span className="hidden xs:inline">Prev</span>
        </div>

        {/* Mini Question Matrix */}
        <div className="flex items-center gap-1">
          <span className="flex size-4 sm:size-4.5 items-center justify-center rounded-md bg-emerald-500 text-[9px] font-black text-white shadow-xs shadow-emerald-500/50 scale-110">
            1
          </span>
          {[2, 3, 4, 5].map((num) => (
            <span
              key={num}
              className="flex size-4 sm:size-4.5 items-center justify-center rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400"
            >
              {num}
            </span>
          ))}
          <span className="hidden sm:inline text-slate-500 text-[9px]">...</span>
          <span className="hidden sm:flex size-4 sm:size-4.5 items-center justify-center rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400">
            50
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-0.5 text-[9.5px] sm:text-[10px] font-black text-white shadow-sm transition-transform active:scale-95 cursor-pointer">
          <span>Next</span>
          <ArrowRightSVG className="size-2.5 sm:size-3" />
        </div>
      </div>
    </div>
  );
}
