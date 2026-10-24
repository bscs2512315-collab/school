"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SolvedExerciseDetail } from "@/types/solved-notes";
import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { convertMathToHTML, isUrduText, isArabicText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import NovaEmptyState from "@/components/NovaEmptyState";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import SolvedNotesSVG from "@/public/svgs/SolvedNotesSVG";
import LightbulbSVG from "@/public/svgs/LightbulbSVG";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface QuestionPart {
  partNumber: string;
  partText: string;
  solution: string;
  explanation?: string;
}

interface ExerciseQuestion {
  sectionTitle?: string;
  questionNumber?: string;
  questionText?: string;
  content?: string;
  parts?: QuestionPart[];
}

interface SolvedNotesReaderProps {
  exercise: SolvedExerciseDetail & {
    contentMarkdown?: string | null;
    sections?: ExerciseQuestion[] | null;
    cognitiveLevel?: string | null;
  };
}

function formatExerciseShortNumber(raw?: string): string {
  if (!raw) return "";
  let clean = raw.trim();
  clean = clean.replace(/^Exercise\s+/i, "");
  clean = clean.replace(/^Review Exercise\s+/i, "Rev ");
  return clean;
}

function isUrduOrArabicSubject(subject?: string | null): boolean {
  if (!subject) return false;
  return /urdu|islamiat|islamiyat|arabic|quran|mutalia|pakistan\s*studies/i.test(subject);
}

function formatUrduQuestionLabel(raw?: string, isUrdu?: boolean): string {
  if (!raw) return "";
  if (!isUrdu) return raw;
  let clean = raw.trim();
  if (/^Q(uestion)?\.?\s*\d+/i.test(clean)) {
    return clean.replace(/^Q(uestion)?\.?\s*/i, "س ");
  }
  if (/^\d+$/.test(clean)) {
    return `س ${clean}`;
  }
  return clean;
}

function formatUrduPartNumber(partNum?: string, isUrdu?: boolean): string {
  if (!partNum) return "";
  let clean = partNum.trim();
  if (!clean) return "";
  if (isUrdu && /^Q\d+/i.test(clean)) {
    return clean.replace(/^Q/i, "س ");
  }
  if (clean.startsWith("(") && clean.endsWith(")")) {
    return clean;
  }
  return `(${clean})`;
}

/**
 * Custom Markdown to HTML parser tailored for academic notes and examination syllabi.
 * Supports both Handwritten Notebook Mode (black/blue ink & highlighter notes)
 * and Standard Digital Book Mode with authentic Urdu Nastaliq and Arabic typography.
 */
function renderMarkdownToHtml(md: string, isNotebook: boolean = true): string {
  if (!md) return "";
  const lines = md.split("\n");
  const htmlOut: string[] = [];
  let inList = false;
  let inBlockquote = false;
  let blockquoteBuffer: string[] = [];

  const flushBlockquote = () => {
    if (inBlockquote && blockquoteBuffer.length > 0) {
      const bqContent = blockquoteBuffer.join("<br />");
      const isUrduBq = isUrduText(bqContent);
      const isArabicBq = isArabicText(bqContent);
      const fontCls = isArabicBq
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrduBq
        ? "font-urdu text-right leading-[2.2]"
        : "";

      if (isNotebook) {
        htmlOut.push(
          `<div dir="${isUrduBq ? "rtl" : "ltr"}" class="my-5 rounded-2xl bg-amber-100/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/50 p-4 sm:p-5 text-base sm:text-lg leading-relaxed shadow-xs ${fontCls}">` +
            `<div class="font-medium ink-question-black">${convertMathToHTML(bqContent)}</div>` +
          `</div>`
        );
      } else {
        htmlOut.push(
          `<div dir="${isUrduBq ? "rtl" : "ltr"}" class="my-5 rounded-2xl bg-primary/5 dark:bg-primary/10 border-l-4 border-primary p-4 sm:p-5 text-sm sm:text-base leading-relaxed text-foreground shadow-xs ${fontCls}">` +
            `<div class="font-medium text-foreground/90">${convertMathToHTML(bqContent)}</div>` +
          `</div>`
        );
      }
      blockquoteBuffer = [];
      inBlockquote = false;
    }
  };

  const flushList = () => {
    if (inList) {
      htmlOut.push("</ul>");
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith(">")) {
      flushList();
      inBlockquote = true;
      blockquoteBuffer.push(trimmed.replace(/^>\s*/, ""));
      continue;
    } else {
      flushBlockquote();
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      const title = trimmed.replace(/^#\s+/, "");
      const isUrdu = isUrduText(title);
      const isArabic = isArabicText(title);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";
      htmlOut.push(
        `<h2 dir="${isUrdu ? "rtl" : "ltr"}" class="${isNotebook ? 'text-xl sm:text-2xl font-bold ink-question-black' : 'text-lg sm:text-xl font-black text-foreground'} my-3 ${fontCls}">` +
          `<span>${convertMathToHTML(title)}</span>` +
        `</h2>`
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      const title = trimmed.replace(/^##\s+/, "");
      const isUrdu = isUrduText(title);
      const isArabic = isArabicText(title);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";
      htmlOut.push(
        `<h3 dir="${isUrdu ? "rtl" : "ltr"}" class="${isNotebook ? 'text-lg sm:text-xl font-bold ink-question-black' : 'text-base sm:text-lg font-bold text-foreground'} my-2.5 ${fontCls}">` +
          `<span>${convertMathToHTML(title)}</span>` +
        `</h3>`
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      const title = trimmed.replace(/^###\s+/, "");
      const isUrdu = isUrduText(title);
      const isArabic = isArabicText(title);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";
      htmlOut.push(
        `<h3 dir="${isUrdu ? "rtl" : "ltr"}" class="${isNotebook ? 'text-lg sm:text-xl font-bold ink-question-black' : 'text-base sm:text-lg font-bold text-foreground'} my-2.5 ${fontCls}">` +
          `<span>${convertMathToHTML(title)}</span>` +
        `</h3>`
      );
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      flushList();
      const title = trimmed.replace(/^####\s+/, "");
      const isUrdu = isUrduText(title);
      const isArabic = isArabicText(title);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";
      htmlOut.push(
        `<h4 dir="${isUrdu ? "rtl" : "ltr"}" class="${isNotebook ? 'text-base sm:text-lg font-bold ink-question-black' : 'text-sm sm:text-base font-bold text-foreground'} my-2 ${fontCls}">` +
          `<span>${convertMathToHTML(title)}</span>` +
        `</h4>`
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        htmlOut.push(`<ul class="space-y-2.5 my-3 pl-0.5 sm:pl-1">`);
        inList = true;
      }
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      const isUrdu = isUrduText(itemText);
      const isArabic = isArabicText(itemText);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";
      htmlOut.push(
        `<li dir="${isUrdu ? "rtl" : "ltr"}" class="flex items-start gap-2.5 ${isNotebook ? 'text-base sm:text-lg leading-relaxed ink-question-black' : 'text-sm sm:text-base leading-relaxed text-foreground/90'} ${fontCls}">` +
          `<span class="size-2 rounded-full ${isNotebook ? 'bg-slate-800 dark:bg-slate-200' : 'bg-primary/60'} mt-2 shrink-0"></span>` +
          `<div class="flex-1 ${isUrdu ? 'text-right' : ''}">${convertMathToHTML(itemText)}</div>` +
        `</li>`
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList) {
        htmlOut.push(`<ul class="space-y-2.5 my-3 pl-0.5 sm:pl-1">`);
        inList = true;
      }
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        const isUrdu = isUrduText(numMatch[2]);
        const isArabic = isArabicText(numMatch[2]);
        const fontCls = isArabic
          ? "font-arabic font-urdu text-right leading-[2.2]"
          : isUrdu
          ? "font-urdu text-right leading-[2.2]"
          : "";
        htmlOut.push(
          `<li dir="${isUrdu ? "rtl" : "ltr"}" class="flex items-start gap-2.5 ${isNotebook ? 'text-base sm:text-lg leading-relaxed ink-question-black' : 'text-sm sm:text-base leading-relaxed text-foreground/90'} ${fontCls}">` +
            `<span class="font-black ${isNotebook ? 'ink-question-black' : 'text-primary'} text-sm sm:text-base pt-0.5 shrink-0">${numMatch[1]}.</span>` +
            `<div class="flex-1 ${isUrdu ? 'text-right' : ''}">${convertMathToHTML(numMatch[2])}</div>` +
          `</li>`
        );
        continue;
      }
    }

    if (inList && (rawLine.startsWith("  ") || rawLine.startsWith("\t")) && !trimmed.startsWith("- ") && !trimmed.startsWith("* ") && !trimmed.startsWith("#") && !/^\d+\.\s+/.test(trimmed)) {
      if (htmlOut.length > 0) {
        const lastIdx = htmlOut.length - 1;
        if (htmlOut[lastIdx].endsWith("</li>")) {
          htmlOut[lastIdx] = htmlOut[lastIdx].replace(/<\/li>$/, `<div class="mt-2 overflow-x-auto">${convertMathToHTML(trimmed)}</div></li>`);
          continue;
        }
      }
    }

    flushList();

    if (trimmed === "") {
      continue;
    }

    // Display Math Formula block $$ ... $$
    if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
      const mathInner = trimmed.slice(2, -2).trim();
      const isUrdu = isUrduText(mathInner);
      htmlOut.push(
        `<div class="my-3 py-1.5 px-2 ${isUrdu ? 'text-right' : 'text-left'} font-medium text-base sm:text-lg overflow-x-auto ${isNotebook ? 'ink-answer-blue' : 'text-foreground'}">` +
          `${convertMathToHTML(mathInner)}` +
        `</div>`
      );
      continue;
    }

    const isUrdu = isUrduText(trimmed);
    const isArabic = isArabicText(trimmed);
    const fontCls = isArabic
      ? "font-arabic font-urdu text-right leading-[2.2]"
      : isUrdu
      ? "font-urdu text-right leading-[2.2]"
      : "";

    htmlOut.push(
      `<p dir="${isUrdu ? "rtl" : "ltr"}" class="${isNotebook ? 'text-base sm:text-lg leading-relaxed ink-question-black' : 'text-sm sm:text-base leading-relaxed text-foreground/90'} ${fontCls} my-2.5">${convertMathToHTML(trimmed)}</p>`
    );
  }

  flushList();
  flushBlockquote();

  return htmlOut.join("\n");
}

/**
 * Dedicated Step-by-Step Solution Parser & Renderer.
 */
function renderSolutionStepsToHtml(solution: string, isNotebook: boolean = true): string {
  if (!solution) return "";

  const lines = solution.split("\n");
  const htmlOut: string[] = [];
  let inStepCard = false;
  let inList = false;

  const closeStepCard = () => {
    if (inStepCard) {
      htmlOut.push(`</div>`);
      inStepCard = false;
    }
  };

  const closeList = () => {
    if (inList) {
      htmlOut.push(`</div>`);
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    let trimmed = rawLine.trim();

    if (!trimmed) {
      continue;
    }

    // Display Equation $$ ... $$
    if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
      const mathInner = trimmed.slice(2, -2).trim();
      const mathHtml = convertMathToHTML(mathInner);
      const isUrdu = isUrduText(mathInner);
      
      const mathBlock = `<div class="my-2.5 py-1 px-1 ${isUrdu ? 'text-right' : 'text-left'} font-medium text-base sm:text-lg overflow-x-auto ${isNotebook ? 'ink-answer-blue' : 'text-foreground'}">${mathHtml}</div>`;

      if (inStepCard) {
        htmlOut.push(`<div class="pt-1">${mathBlock}</div>`);
      } else {
        closeList();
        htmlOut.push(mathBlock);
      }
      continue;
    }

    // Numbered Item: e.g. "1. **Title**" or "1. Description"
    const stepMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (stepMatch) {
      closeStepCard();
      closeList();

      const stepNum = stepMatch[1];
      const stepContent = stepMatch[2];
      const isUrdu = isUrduText(stepContent);
      const isArabic = isArabicText(stepContent);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";

      if (isNotebook) {
        htmlOut.push(
          `<div dir="${isUrdu ? "rtl" : "ltr"}" class="flex items-start gap-2.5 my-2 ${fontCls}">` +
            `<span class="font-bold ink-question-black text-base pt-0.5 shrink-0">${stepNum}.</span>` +
            `<div class="flex-1 text-base sm:text-lg ink-answer-blue leading-relaxed ${isUrdu ? 'text-right' : ''}">${convertMathToHTML(stepContent)}</div>` +
          `</div>`
        );
      } else {
        htmlOut.push(
          `<div dir="${isUrdu ? "rtl" : "ltr"}" class="flex items-start gap-2.5 my-2 ${fontCls}">` +
            `<span class="font-black text-primary text-sm pt-0.5 shrink-0">${stepNum}.</span>` +
            `<div class="flex-1 text-sm sm:text-base text-foreground/90 leading-relaxed ${isUrdu ? 'text-right' : ''}">${convertMathToHTML(stepContent)}</div>` +
          `</div>`
        );
      }
      continue;
    }

    // Bullet point: "- **Title:** Description" or "* Item"
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      closeStepCard();
      if (!inList) {
        htmlOut.push(`<div class="space-y-2 my-2.5">`);
        inList = true;
      }
      const bulletContent = bulletMatch[1];
      const isUrdu = isUrduText(bulletContent);
      const isArabic = isArabicText(bulletContent);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";

      if (isNotebook) {
        htmlOut.push(
          `<div dir="${isUrdu ? "rtl" : "ltr"}" class="flex items-start gap-2.5 text-base sm:text-lg ink-answer-blue leading-relaxed pl-1 sm:pl-2 ${fontCls}">` +
            `<span class="size-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2.5 shrink-0"></span>` +
            `<div class="flex-1 ${isUrdu ? 'text-right' : ''}">${convertMathToHTML(bulletContent)}</div>` +
          `</div>`
        );
      } else {
        htmlOut.push(
          `<div dir="${isUrdu ? "rtl" : "ltr"}" class="flex items-start gap-2.5 text-sm sm:text-base text-foreground/90 leading-relaxed pl-1 sm:pl-2 ${fontCls}">` +
            `<span class="size-2 rounded-full bg-primary/70 mt-2 shrink-0"></span>` +
            `<div class="flex-1 ${isUrdu ? 'text-right' : ''}">${convertMathToHTML(bulletContent)}</div>` +
          `</div>`
        );
      }
      continue;
    }

    // Indented content under an active Step Card
    if (inStepCard && (rawLine.startsWith("  ") || rawLine.startsWith("\t"))) {
      const isUrdu = isUrduText(trimmed);
      const isArabic = isArabicText(trimmed);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";

      htmlOut.push(
        `<div dir="${isUrdu ? "rtl" : "ltr"}" class="${isUrdu ? 'pr-1.5 sm:pr-4 text-right' : 'pl-1.5 sm:pl-4'} ${isNotebook ? 'text-base sm:text-lg ink-answer-blue' : 'text-sm sm:text-base text-foreground/90'} leading-relaxed ${fontCls}">` +
          `${convertMathToHTML(trimmed)}` +
        `</div>`
      );
      continue;
    }

    // Section bold headers like "**LHS:**", "**RHS:**", "**Given:**", "**Answer:**"
    if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) {
      closeStepCard();
      closeList();
      let headerText = trimmed;
      if (isUrduText(headerText) || /answer/i.test(headerText)) {
        headerText = headerText.replace(/\*\*(Answer|ANSWER)\s*:\*\*/g, "**جواب:**");
      }
      const isUrdu = isUrduText(headerText);
      const isArabic = isArabicText(headerText);
      const fontCls = isArabic
        ? "font-arabic font-urdu text-right leading-[2.2]"
        : isUrdu
        ? "font-urdu text-right leading-[2.2]"
        : "";

      if (isNotebook) {
        htmlOut.push(
          `<div dir="${isUrdu ? "rtl" : "ltr"}" class="text-sm sm:text-base font-bold uppercase tracking-wider ink-question-black pt-3 pb-1 mb-2 ${fontCls}">` +
            `${convertMathToHTML(headerText)}` +
          `</div>`
        );
      } else {
        htmlOut.push(
          `<div dir="${isUrdu ? "rtl" : "ltr"}" class="text-xs sm:text-sm font-black uppercase tracking-wider text-primary pt-3 pb-1 mb-2 ${fontCls}">` +
            `${convertMathToHTML(headerText)}` +
          `</div>`
        );
      }
      continue;
    }

    // Standard line / paragraph (rendered in its own block/line)
    closeStepCard();
    closeList();
    let bodyText = trimmed;
    if (/^Answer:\s*/i.test(bodyText) && isUrduText(bodyText)) {
      bodyText = bodyText.replace(/^Answer:\s*/i, "جواب: ").replace(/^ANSWER:\s*/, "جواب: ");
    }
    const isUrdu = isUrduText(bodyText);
    const isArabic = isArabicText(bodyText);
    const fontCls = isArabic
      ? "font-arabic font-urdu text-right leading-[2.2]"
      : isUrdu
      ? "font-urdu text-right leading-[2.2]"
      : "";

    htmlOut.push(
      `<div dir="${isUrdu ? "rtl" : "ltr"}" class="${isNotebook ? 'text-base sm:text-lg font-medium ink-answer-blue' : 'text-sm sm:text-base font-medium text-foreground/90'} leading-relaxed my-2 ${fontCls}">` +
        `${convertMathToHTML(bodyText)}` +
      `</div>`
    );
  }

  closeStepCard();
  closeList();

  return htmlOut.join("\n");
}

export default function SolvedNotesReader({ exercise }: SolvedNotesReaderProps) {
  const router = useRouter();

  // Mode: "notebook" (Default: Handwritten spiral notebook) or "standard" (Clean digital book)
  const [viewMode, setViewMode] = useState<"notebook" | "standard">("notebook");

  // Parse structured questions/sections with fallback support for raw JSON
  const questions: ExerciseQuestion[] = useMemo(() => {
    if (exercise.sections && Array.isArray(exercise.sections) && exercise.sections.length > 0) {
      return exercise.sections;
    }
    if (typeof (exercise.sections as unknown) === "string" && (exercise.sections as unknown as string).trim()) {
      try {
        const parsed = JSON.parse(exercise.sections as unknown as string);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        if (parsed?.sections && Array.isArray(parsed.sections)) return parsed.sections;
      } catch {
        // ignore
      }
    }
    if (exercise.contentMarkdown) {
      const trimmed = exercise.contentMarkdown.trim();
      if (trimmed.startsWith("```json") || (trimmed.startsWith("{") && trimmed.includes('"sections"'))) {
        try {
          const cleanJson = trimmed.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed?.sections && Array.isArray(parsed.sections)) {
            return parsed.sections;
          }
        } catch {
          // ignore
        }
      }
    }
    return [];
  }, [exercise.sections, exercise.contentMarkdown]);

  // Clean Markdown Notes (extracting markdown from JSON blocks if present)
  const cleanMarkdownNotes = useMemo(() => {
    if (!exercise.contentMarkdown) return null;
    let md = exercise.contentMarkdown.trim();
    if (md === "" || md === "No text content available.") return null;

    if (md.startsWith("```json") || (md.startsWith("{") && md.includes('"sections"'))) {
      try {
        const cleanJson = md.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed?.markdown && typeof parsed.markdown === "string" && parsed.markdown.trim()) {
          return parsed.markdown.trim();
        }
        return null;
      } catch {
        // ignore
      }
    }
    return md;
  }, [exercise.contentMarkdown]);

  const hasMarkdownNotes = Boolean(cleanMarkdownNotes);
  const hasStructuredQuestions = questions.length > 0;
  const hasDigitalContent = hasMarkdownNotes || hasStructuredQuestions;

  const isSubjectUrdu = useMemo(() => {
    return isUrduOrArabicSubject(exercise.subject);
  }, [exercise.subject]);

  // Load saved notebook preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("exboard_notes_view_mode");
      if (saved === "standard" || saved === "notebook") {
        setViewMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleModeChange = (mode: "notebook" | "standard") => {
    setViewMode(mode);
    try {
      localStorage.setItem("exboard_notes_view_mode", mode);
    } catch {
      // ignore
    }
  };

  const isNotebook = viewMode === "notebook";

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-between space-y-6">
      <div className="space-y-5 flex-1">
        {/* 🌟 Rich Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark p-5 sm:p-7 text-primary-foreground shadow-lg space-y-4">
          <div className="pointer-events-none absolute -right-8 -top-10 size-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 size-40 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 flex items-center justify-between gap-2.5 w-full">
            <div className="flex items-center gap-2 min-w-0">
              {exercise.chapterName && (
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primary shadow-xs truncate">
                  Unit {exercise.chapterNumber}: {exercise.chapterName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primary shadow-xs">
                Class {exercise.class}
              </span>
              {exercise.board && (
                <span className="hidden sm:inline-flex rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primary shadow-xs">
                  {exercise.board}
                </span>
              )}
              {exercise.cognitiveLevel && (
                <>
                  <span
                    className="flex sm:hidden size-7 items-center justify-center rounded-full bg-amber-400 text-slate-900 text-xs font-black shadow-xs"
                    title={`Cognitive Level: ${exercise.cognitiveLevel}`}
                  >
                    {exercise.cognitiveLevel.replace(/[\[\]]/g, "")}
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-lg bg-amber-400 text-slate-900 px-2.5 py-1 text-xs font-black shadow-xs">
                    Cognitive Level [{exercise.cognitiveLevel.replace(/[\[\]]/g, "")}]
                  </span>
                </>
              )}
            </div>
          </div>

          <h1
            dir={isUrduText(exercise.title || exercise.exerciseNumber) ? "rtl" : "ltr"}
            className={cn(
              "relative z-10 text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-primary-foreground leading-snug",
              isUrduText(exercise.title || exercise.exerciseNumber) && "font-urdu text-right leading-[2.0]"
            )}
          >
            {exercise.title || exercise.exerciseNumber}
          </h1>
        </div>

        {/* 🎛️ Interactive Handwritten vs Standard Mode Switcher */}
        {hasDigitalContent && (
          <div className="print:hidden flex items-center justify-start">
            <div className="inline-flex p-1 rounded-xl bg-muted/40 dark:bg-zinc-900/50 border border-border/80 shadow-2xs">
              <button
                onClick={() => handleModeChange("notebook")}
                className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isNotebook
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Switch to Handwritten Mode"
              >
                <SolvedNotesSVG className="size-4 shrink-0" />
                <span>Handwritten</span>
              </button>
              <button
                onClick={() => handleModeChange("standard")}
                className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  !isNotebook
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Switch to Standard Mode"
              >
                <SyllabusSVG className="size-4 shrink-0" />
                <span>Standard</span>
              </button>
            </div>
          </div>
        )}

        {/* 📄 MAIN TEXT CONTENT DISPLAY */}
        {hasDigitalContent ? (
          /* ====================================================================
             📓 REAL NOTEBOOK & STANDARD DIGITAL STUDY TEXT
             ==================================================================== */
          <div
            className={`relative transition-all duration-300 rounded-3xl ${
              isNotebook
                ? "notebook-paper-bg notebook-ruled-grid font-handwriting shadow-md border border-amber-900/10 dark:border-zinc-800 p-3.5 sm:px-5 sm:py-6 md:px-6 md:py-8"
                : "bg-card border border-border/70 shadow-sm p-4 sm:p-6 md:p-8"
            }`}
          >
            {/* Spiral Binder Ring Coils (Visible in Notebook Mode on Tablet/Desktop) */}
            {isNotebook && (
              <div className="hidden sm:flex flex-col justify-between absolute -left-3.5 top-8 bottom-8 w-7 pointer-events-none z-20 py-2 select-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-center my-1">
                    <div className="size-3 rounded-full bg-slate-800/30 dark:bg-black/80 shadow-inner flex items-center justify-center relative">
                      <div className="w-5 h-2 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 dark:from-zinc-500 dark:via-zinc-200 dark:to-zinc-600 shadow-sm transform -rotate-12 absolute -left-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="w-full space-y-10 pl-0">
              {/* Core Comprehensive Study Notes & Theory */}
              {hasMarkdownNotes && cleanMarkdownNotes && (
                <div
                  className={`prose dark:prose-invert max-w-none ${
                    isNotebook ? "ink-question-black" : "text-foreground/90 dark:text-zinc-200"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownToHtml(cleanMarkdownNotes, isNotebook),
                  }}
                />
              )}

              {/* Model Exam Questions & Solutions */}
              {hasStructuredQuestions && (
                <div className="space-y-8 pt-4">
                  <div
                    dir={isSubjectUrdu ? "rtl" : "ltr"}
                    className={cn(
                      "flex items-center gap-2.5 pb-2 text-primary font-bold text-sm uppercase tracking-wider",
                      isSubjectUrdu && "font-urdu text-right"
                    )}
                  >
                    {!isNotebook && <SyllabusSVG className="size-5 shrink-0 text-primary" />}
                    <span>{isSubjectUrdu ? "امتحانی سوالات و جوابات" : "Examination Questions & Answers"}</span>
                  </div>

                  <div className="space-y-10">
                    {questions.map((q, qIdx) => {
                      const hasParts = q.parts && q.parts.length > 0;
                      const isQUrdu =
                        isSubjectUrdu ||
                        isUrduText(q.questionNumber) ||
                        isUrduText(q.questionText) ||
                        isUrduText(q.content) ||
                        (q.parts && q.parts.some((p) => isUrduText(p.partText) || isUrduText(p.solution) || isUrduText(p.explanation)));

                      const formattedQNum = formatUrduQuestionLabel(
                        q.questionNumber || (isSubjectUrdu ? `س ${qIdx + 1}` : undefined),
                        isQUrdu
                      );

                      return (
                        <div key={qIdx} className="space-y-4">
                          <div className="space-y-2">
                            {(formattedQNum || q.questionText) && (
                              <div
                                dir={isQUrdu ? "rtl" : "ltr"}
                                className={cn(
                                  "text-lg sm:text-xl font-bold ink-question-black leading-relaxed",
                                  isNotebook ? "font-bold" : "font-black text-foreground",
                                  isQUrdu && "font-urdu text-right leading-[2.2]"
                                )}
                              >
                                {formattedQNum && (
                                  <span className={cn("inline-block", isQUrdu ? "ml-2 font-bold" : "mr-2 uppercase tracking-wider")}>
                                    {formattedQNum}
                                  </span>
                                )}
                                {q.questionText && (
                                  <span
                                    className={cn(
                                      isArabicText(q.questionText) && "font-arabic font-urdu"
                                    )}
                                    dangerouslySetInnerHTML={{
                                      __html: convertMathToHTML(q.questionText),
                                    }}
                                  />
                                )}
                              </div>
                            )}
                            {q.content && (
                              <div
                                dir={isQUrdu ? "rtl" : "ltr"}
                                className={cn(
                                  "text-base sm:text-lg leading-relaxed",
                                  isNotebook ? "ink-question-black/80" : "text-muted-foreground text-sm sm:text-base",
                                  isQUrdu && "font-urdu text-right leading-[2.2]"
                                )}
                                dangerouslySetInnerHTML={{
                                  __html: convertMathToHTML(q.content),
                                }}
                              />
                            )}
                          </div>

                          {/* Sub-parts List */}
                          {hasParts && (
                            <div className="space-y-6">
                              {q.parts!.map((part, pIdx) => {
                                const isPartUrdu =
                                  isQUrdu ||
                                  isUrduText(part.partNumber) ||
                                  isUrduText(part.partText) ||
                                  isUrduText(part.solution) ||
                                  isUrduText(part.explanation);

                                const hasPartNum = !!(part.partNumber && part.partNumber.trim() !== "");
                                const formattedPartNum = hasPartNum
                                  ? formatUrduPartNumber(part.partNumber, isPartUrdu)
                                  : "";
                                const hasPartText = !!(part.partText && part.partText.trim() !== "");
                                const hasHeader = hasPartNum || hasPartText;
                                const isArabicPartText = isArabicText(part.partText);

                                return (
                                  <div key={pIdx} className="space-y-2">
                                    {hasHeader && (
                                      <div
                                        dir={isPartUrdu ? "rtl" : "ltr"}
                                        className={cn(
                                          "flex items-start gap-2",
                                          isPartUrdu && "font-urdu text-right leading-[2.2]"
                                        )}
                                      >
                                        {hasPartNum && (
                                          <span className={cn(
                                            "font-bold ink-question-black shrink-0",
                                            isPartUrdu ? "text-lg sm:text-xl font-urdu" : "text-base sm:text-lg"
                                          )}>
                                            {formattedPartNum}
                                          </span>
                                        )}
                                        {hasPartText && (
                                          <div
                                            className={cn(
                                              "font-bold ink-question-black leading-relaxed flex-1",
                                              isArabicPartText
                                                ? "font-arabic font-urdu text-lg sm:text-xl text-right leading-[2.2]"
                                                : isPartUrdu
                                                ? "text-lg sm:text-xl font-urdu text-right"
                                                : "text-base sm:text-lg"
                                            )}
                                            dangerouslySetInnerHTML={{
                                              __html: convertMathToHTML(part.partText),
                                            }}
                                          />
                                        )}
                                      </div>
                                    )}

                                    <div
                                      dir={isPartUrdu ? "rtl" : "ltr"}
                                      className={cn(
                                        hasHeader
                                          ? isPartUrdu
                                            ? "pr-2 sm:pr-3"
                                            : "pl-2 sm:pl-3"
                                          : "pl-0",
                                        "space-y-2"
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "font-bold uppercase tracking-wider",
                                          isPartUrdu
                                            ? "text-base sm:text-lg font-urdu text-right leading-[2.2]"
                                            : "text-sm sm:text-base",
                                          isNotebook
                                            ? "ink-answer-blue font-bold"
                                            : "text-primary font-black"
                                        )}
                                      >
                                        {isPartUrdu ? "جواب:" : "Answer:"}
                                      </div>
                                      <div
                                        className={cn(
                                          "font-medium leading-relaxed overflow-x-auto space-y-2",
                                          isPartUrdu
                                            ? "text-lg sm:text-xl font-urdu text-right leading-[2.2]"
                                            : "text-base sm:text-lg",
                                          isNotebook
                                            ? "ink-answer-blue"
                                            : "text-foreground/90 font-normal text-sm sm:text-base"
                                        )}
                                        dangerouslySetInnerHTML={{
                                          __html: renderSolutionStepsToHtml(part.solution, isNotebook),
                                        }}
                                      />

                                      {part.explanation && (
                                        <div
                                          dir={isPartUrdu ? "rtl" : "ltr"}
                                          className={cn(
                                            "mt-4 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-2xs w-fit max-w-full bg-primary/10 dark:bg-primary/15 border border-primary/25 dark:border-primary/40 text-foreground",
                                            isPartUrdu
                                              ? "font-urdu text-right leading-[2.2] text-base sm:text-lg"
                                              : "text-sm sm:text-base"
                                          )}
                                        >
                                          <div className={cn(
                                            "flex items-center gap-2 font-bold text-primary dark:text-logo-green",
                                            isPartUrdu && "text-right"
                                          )}>
                                            <LightbulbSVG className="size-5.5 sm:size-6 shrink-0 text-primary dark:text-logo-green" />
                                            <span>{isPartUrdu ? "امتحانی نکتہ و تشریح:" : "Exam Insight & Rationale:"}</span>
                                          </div>
                                          <div
                                            className={cn(
                                              "leading-relaxed font-medium",
                                              isPartUrdu && "font-urdu text-right leading-[2.2]"
                                            )}
                                            dangerouslySetInnerHTML={{
                                              __html: convertMathToHTML(part.explanation),
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ====================================================================
             🚫 REUSABLE EMPTY STATE (WHEN DIGITIZATION IS IN PROGRESS)
             ==================================================================== */
          <NovaEmptyState
            title="No Text Notes Available"
            description="The text notes and step-by-step solutions for this exercise are currently being digitized."
            variant="card"
            className="min-h-[40vh] py-12"
          />
        )}
      </div>

      {/* 🧭 Bottom Responsive Exercise Pagination Strip */}
      <div className="print:hidden pt-8 pb-4 border-t border-border/60 px-1 sm:px-3 md:px-5 mt-auto">
        {/* Mobile: 50 / 50 widths with only Prev & Next buttons */}
        <div className="grid grid-cols-2 gap-2 sm:hidden w-full">
          {exercise.prevExercise ? (
            <Link
              href={FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(
                exercise.prevExercise.id,
                exercise.subject
              )}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90 active:scale-95 cursor-pointer truncate"
              title={`Previous: ${exercise.prevExercise.exerciseNumber}`}
            >
              <ChevronLeft className="size-4 shrink-0" />
              <span className="truncate">Prev: {formatExerciseShortNumber(exercise.prevExercise.exerciseNumber)}</span>
            </Link>
          ) : (
            <div className="inline-flex w-full items-center justify-center rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 text-xs font-medium text-muted-foreground/40 select-none">
              First Exercise
            </div>
          )}

          {exercise.nextExercise ? (
            <Link
              href={FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(
                exercise.nextExercise.id,
                exercise.subject
              )}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90 active:scale-95 cursor-pointer truncate"
              title={`Next: ${exercise.nextExercise.exerciseNumber}`}
            >
              <span className="truncate">Next: {formatExerciseShortNumber(exercise.nextExercise.exerciseNumber)}</span>
              <ChevronRight className="size-4 shrink-0" />
            </Link>
          ) : (
            <div className="inline-flex w-full items-center justify-center rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 text-xs font-medium text-muted-foreground/40 select-none">
              Last Exercise
            </div>
          )}
        </div>

        {/* Tablet & Desktop: Full Pagination with Center Exercise Numbers */}
        <div className="hidden sm:flex items-center justify-between gap-4 w-full">
          {/* Prev Button */}
          <div className="shrink-0">
            {exercise.prevExercise ? (
              <Link
                href={FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(
                  exercise.prevExercise.id,
                  exercise.subject
                )}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
                title={`Previous: ${exercise.prevExercise.exerciseNumber}`}
              >
                <ChevronLeft className="size-4 shrink-0" />
                <span>Prev:</span>
                <span>{formatExerciseShortNumber(exercise.prevExercise.exerciseNumber)}</span>
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground/40 px-3">First</span>
            )}
          </div>

          {/* Center All Chapter Exercises Pagination Strip */}
          {exercise.chapterExercises && exercise.chapterExercises.length > 0 && (
            <div className="flex flex-1 items-center justify-center gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar max-w-full">
              {exercise.chapterExercises.map((ex) => {
                const isCurrent = ex.id === exercise.id;
                const shortNum = formatExerciseShortNumber(ex.exerciseNumber);

                if (isCurrent) {
                  return (
                    <span
                      key={ex.id}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-white shadow-xs ring-2 ring-primary/30 shrink-0"
                    >
                      {shortNum}
                    </span>
                  );
                }

                return (
                  <Link
                    key={ex.id}
                    href={FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(ex.id, exercise.subject)}
                    className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card hover:bg-muted hover:border-primary px-3 py-1.5 text-xs font-bold text-foreground transition-all shrink-0 active:scale-95 shadow-2xs"
                    title={ex.title || ex.exerciseNumber}
                  >
                    {shortNum}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Next Button */}
          <div className="shrink-0">
            {exercise.nextExercise ? (
              <Link
                href={FRONTEND_ROUTES.STUDENT_SOLVED_NOTES_EXERCISE(
                  exercise.nextExercise.id,
                  exercise.subject
                )}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
                title={`Next: ${exercise.nextExercise.exerciseNumber}`}
              >
                <span>Next:</span>
                <span>{formatExerciseShortNumber(exercise.nextExercise.exerciseNumber)}</span>
                <ChevronRight className="size-4 shrink-0" />
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground/40 px-3">Last</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
