"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Layers,
  Filter,
  RotateCcw,
  CheckCheck,
  X,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratePaperChapter, ChapterSloItem, ChapterSubtopicItem } from "@/types/challenge";

export function getCognitiveLevelBadge(level?: string): {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (level?.toUpperCase()) {
    case "R":
    case "K":
      return {
        label: "Remembering / Knowledge",
        shortLabel: "K",
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/20",
      };
    case "U":
      return {
        label: "Understanding",
        shortLabel: "U",
        bg: "bg-purple-500/10 dark:bg-purple-500/20",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-500/20",
      };
    case "A":
    case "AP":
      return {
        label: "Application",
        shortLabel: "A",
        bg: "bg-teal-500/10 dark:bg-teal-500/20",
        text: "text-teal-600 dark:text-teal-400",
        border: "border-teal-500/20",
      };
    case "AN":
      return {
        label: "Analysis",
        shortLabel: "AN",
        bg: "bg-amber-500/10 dark:bg-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
      };
    case "E":
      return {
        label: "Evaluation",
        shortLabel: "E",
        bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/20",
      };
    case "C":
      return {
        label: "Creating",
        shortLabel: "C",
        bg: "bg-pink-500/10 dark:bg-pink-500/20",
        text: "text-pink-600 dark:text-pink-400",
        border: "border-pink-500/20",
      };
    default:
      return {
        label: level || "Outcome",
        shortLabel: level || "SLO",
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
      };
  }
}

interface ChapterSloSelectorProps {
  chapters: GeneratePaperChapter[];
  selectedChapterIds: string[];
  selectedSloNumbers: string[];
  onChangeSelectedSlos: (sloNumbers: string[]) => void;
  className?: string;
  /** Optional custom title header */
  title?: string;
  description?: string;
  /** Set to true to disable inner scroll container and allow natural page scroll */
  noInternalScroll?: boolean;
}

export default function ChapterSloSelector({
  chapters,
  selectedChapterIds,
  selectedSloNumbers,
  onChangeSelectedSlos,
  className,
  title = "Target Specific Syllabus SLOs",
  description = "Filter and pick exactly which Student Learning Outcomes to include in this paper",
  noInternalScroll = false,
}: ChapterSloSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCognitiveLevel, setSelectedCognitiveLevel] = useState<string>("ALL");
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Filter only to selected chapters
  const activeChapters = useMemo(() => {
    return chapters.filter((c) => selectedChapterIds.includes(c.id));
  }, [chapters, selectedChapterIds]);

  // All available testable SLOs across active chapters
  const allActiveSlos = useMemo(() => {
    const list: Array<ChapterSloItem & { chapterId: string; chapterNumber: number; chapterName: string }> = [];
    for (const ch of activeChapters) {
      const chSlos = ch.slos || [];
      for (const slo of chSlos) {
        const cog = slo.cognitiveLevel?.toUpperCase();
        if (cog === "CA" || cog === "FA") continue; // Skip classroom activities
        list.push({
          ...slo,
          chapterId: ch.id,
          chapterNumber: ch.chapterNumber,
          chapterName: ch.chapterName,
        });
      }
    }
    return list;
  }, [activeChapters]);

  const selectedSet = useMemo(() => new Set(selectedSloNumbers), [selectedSloNumbers]);

  const toggleSlo = (sloNumber: string) => {
    const next = new Set(selectedSloNumbers);
    if (next.has(sloNumber)) {
      next.delete(sloNumber);
    } else {
      next.add(sloNumber);
    }
    onChangeSelectedSlos(Array.from(next));
  };

  const selectAllActiveSlos = () => {
    onChangeSelectedSlos(allActiveSlos.map((s) => s.sloNumber));
  };

  const clearAllActiveSlos = () => {
    onChangeSelectedSlos([]);
  };

  const toggleChapterSlos = (chapter: GeneratePaperChapter) => {
    const chSlos = (chapter.slos || []).map((s) => s.sloNumber);
    const allSelected = chSlos.every((num) => selectedSet.has(num));

    const next = new Set(selectedSloNumbers);
    if (allSelected) {
      chSlos.forEach((num) => next.delete(num));
    } else {
      chSlos.forEach((num) => next.add(num));
    }
    onChangeSelectedSlos(Array.from(next));
  };

  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Filtered SLOs by search and cognitive level
  const filteredChapters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeChapters.map((ch) => {
      const subtopics = ch.subtopics || [];
      const filteredSubtopics: ChapterSubtopicItem[] = [];

      for (const sub of subtopics) {
        const filteredSlos = sub.slos.filter((slo) => {
          const cog = (slo.cognitiveLevel || "").toUpperCase();
          if (cog === "CA" || cog === "FA") return false;

          if (selectedCognitiveLevel !== "ALL" && cog !== selectedCognitiveLevel) {
            return false;
          }

          if (query) {
            const matchNum = slo.sloNumber.toLowerCase().includes(query);
            const matchText = slo.sloText.toLowerCase().includes(query);
            const matchTopic = (sub.subtopicName || "").toLowerCase().includes(query);
            if (!matchNum && !matchText && !matchTopic) return false;
          }

          return true;
        });

        if (filteredSlos.length > 0) {
          filteredSubtopics.push({
            ...sub,
            slos: filteredSlos,
          });
        }
      }

      const totalMatchingSlos = filteredSubtopics.reduce((acc, s) => acc + s.slos.length, 0);

      return {
        ...ch,
        subtopics: filteredSubtopics,
        matchingSlosCount: totalMatchingSlos,
      };
    }).filter((ch) => ch.subtopics.length > 0 || !query);
  }, [activeChapters, searchQuery, selectedCognitiveLevel]);

  if (activeChapters.length === 0) {
    return null;
  }

  const isAllSelected = allActiveSlos.length > 0 && allActiveSlos.every((s) => selectedSet.has(s.sloNumber));
  const isNoneSelected = selectedSloNumbers.length === 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-200",
        className,
      )}
    >
      {/* Header with Title & Quick Counts */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
              {title}
            </h4>
            <span className="whitespace-nowrap shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-extrabold text-primary">
              {selectedSloNumbers.length > 0
                ? `${selectedSloNumbers.length} / ${allActiveSlos.length} Selected`
                : `All ${allActiveSlos.length} SLOs Included`}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={selectAllActiveSlos}
            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-bold text-primary hover:bg-muted transition-colors cursor-pointer"
          >
            <CheckCheck className="size-3" />
            Select All
          </button>
          <button
            type="button"
            onClick={clearAllActiveSlos}
            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <X className="size-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Search & Cognitive Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter SLOs by number, keyword, or topic (e.g. 3.1, quadratic, cell)..."
            className="h-9 w-full rounded-xl border border-border bg-background pl-8 pr-8 text-xs font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Cognitive Level Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["ALL", "K", "U", "A", "AN", "E"].map((lvl) => {
            const isLvlSelected = selectedCognitiveLevel === lvl;
            const badge = lvl === "ALL" ? null : getCognitiveLevelBadge(lvl);

            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedCognitiveLevel(lvl)}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer",
                  isLvlSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
                )}
              >
                {lvl === "ALL" ? "All Levels" : badge?.shortLabel || lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapters & Subtopics Accordion */}
      <div
        className={cn(
          "space-y-3",
          !noInternalScroll && "max-h-[380px] overflow-y-auto pr-1 overscroll-contain",
        )}
      >
        {filteredChapters.map((chapter) => {
          const chSlos = chapter.slos || [];
          const chSloNumbers = chSlos.map((s) => s.sloNumber);
          const chSelectedCount = chSloNumbers.filter((num) => selectedSet.has(num)).length;
          const isChapterAllSelected = chSlos.length > 0 && chSelectedCount === chSlos.length;
          const isExpanded = expandedChapters[chapter.id] !== false; // expanded by default

          return (
            <div
              key={chapter.id}
              className="rounded-xl border border-border/70 bg-background/60 overflow-hidden transition-all shadow-2xs"
            >
              {/* Chapter Header Card */}
              <div className="flex items-center justify-between gap-3 p-3 bg-muted/25 border-b border-border/50">
                <button
                  type="button"
                  onClick={() => toggleChapterExpand(chapter.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer group"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-black text-primary">
                    {chapter.chapterNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                      {chapter.chapterName}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {chSelectedCount} of {chSlos.length} SLOs active
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Toggle all for this chapter */}
                <button
                  type="button"
                  onClick={() => toggleChapterSlos(chapter)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer shrink-0",
                    isChapterAllSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : chSelectedCount > 0
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Check className={cn("size-3", isChapterAllSelected ? "stroke-[3]" : "opacity-70")} />
                  <span>{isChapterAllSelected ? "All Selected" : `${chSelectedCount}/${chSlos.length}`}</span>
                </button>
              </div>

              {/* Subtopics and Individual SLOs */}
              {isExpanded && (
                <div className="p-2.5 space-y-3">
                  {(chapter.subtopics || []).map((subtopic, sIdx) => (
                    <div key={`${chapter.id}-sub-${sIdx}`} className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-1 pt-1 text-[11px] font-bold text-muted-foreground">
                        <span className="text-primary font-mono">{subtopic.subtopicNumber}</span>
                        <span className="truncate">{subtopic.subtopicName}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {subtopic.slos.map((slo) => {
                          const isSelected = selectedSet.has(slo.sloNumber);
                          const badge = getCognitiveLevelBadge(slo.cognitiveLevel);

                          return (
                            <button
                              key={slo.sloNumber}
                              type="button"
                              onClick={() => toggleSlo(slo.sloNumber)}
                              className={cn(
                                "flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer select-none",
                                isSelected
                                  ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20 shadow-2xs"
                                  : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/30",
                              )}
                            >
                              {/* Checkbox Icon */}
                              <div
                                className={cn(
                                  "flex size-4.5 shrink-0 items-center justify-center rounded-md border mt-0.5 transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/30 bg-background",
                                )}
                              >
                                {isSelected && <Check className="size-3 stroke-[3]" />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-black text-primary font-mono">
                                    SLO {slo.sloNumber}
                                  </span>
                                  {slo.cognitiveLevel && (
                                    <span
                                      className={cn(
                                        "rounded-md border px-1.5 py-0.2 text-[9px] font-black uppercase",
                                        badge.bg,
                                        badge.text,
                                        badge.border,
                                      )}
                                      title={badge.label}
                                    >
                                      {badge.shortLabel} · {badge.label}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs leading-snug text-foreground line-clamp-3">
                                  {slo.sloText}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {chapter.subtopics?.length === 0 && (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      No SLOs found matching your search in this chapter.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredChapters.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No SLOs match your search or filter. Try clearing your search query.
          </div>
        )}
      </div>
    </div>
  );
}
