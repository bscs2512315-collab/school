"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Check } from "lucide-react";
import ArrowDownSVG from "@/public/svgs/ArrowDownSVG";
import { cn } from "@/lib/utils";

export interface ChapterItem {
  id: string;
  chapterNumber: number;
  chapterName: string;
  questionCount?: number;
}

export interface ChapterMultiSelectProps {
  chapters: ChapterItem[];
  selectedIds: string[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export default function ChapterMultiSelect({
  chapters,
  selectedIds,
  loading = false,
  disabled = false,
  placeholder = "Select chapters",
  className,
  onToggle,
  onSelectAll,
  onClear,
}: ChapterMultiSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
    preferUp: false,
  });

  const filteredChapters = chapters.filter((c) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      c.chapterName.toLowerCase().includes(term) ||
      String(c.chapterNumber).includes(term)
    );
  });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 12;

    let width = rect.width;
    let left = rect.left;
    if (width > viewportWidth - padding * 2) {
      width = viewportWidth - padding * 2;
      left = padding;
    } else if (left + width > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - padding - width);
    } else if (left < padding) {
      left = padding;
    }

    const spaceBelow = viewportHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const preferUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = preferUp
      ? Math.min(320, Math.max(160, spaceAbove - 8))
      : Math.min(320, Math.max(160, spaceBelow - 8));

    setPosition({
      top: rect.bottom + 6,
      bottom: viewportHeight - rect.top + 6,
      left,
      width,
      maxHeight,
      preferUp,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePosition]);

  const triggerLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} of ${chapters.length} chapters selected`
      : placeholder;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 text-sm transition-all",
          "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
          {
            "border-primary ring-4 ring-primary/10": open,
            "border-border hover:border-primary/30": !open,
            "cursor-not-allowed opacity-50": disabled,
            "text-muted-foreground": selectedIds.length === 0,
            "text-foreground font-semibold": selectedIds.length > 0,
          },
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{triggerLabel}</span>
        <ArrowDownSVG
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", {
            "rotate-180 text-primary dark:text-foreground": open,
          })}
          aria-hidden="true"
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              style={{
                position: "fixed",
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
                zIndex: 99999,
                ...(position.preferUp
                  ? { bottom: position.bottom }
                  : { top: position.top }),
              }}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-xl backdrop-blur-md"
            >
              {/* Search */}
              <div className="shrink-0 border-b border-border/60 p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search chapters..."
                    className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Select All / Clear */}
              <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectAll();
                    setQuery("");
                  }}
                  className="text-[11px] font-extrabold text-primary hover:underline dark:text-white cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {selectedIds.length}/{chapters.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setQuery("");
                  }}
                  className="text-[11px] font-extrabold text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Chapter list */}
              <ul
                style={{
                  maxHeight: `${Math.max(150, position.maxHeight - 108)}px`,
                }}
                className="overflow-y-auto py-1 overscroll-contain"
              >
                {filteredChapters.map((ch) => {
                  const isSelected = selectedIds.includes(ch.id);
                  return (
                    <li key={ch.id}>
                      <button
                        type="button"
                        onClick={() => onToggle(ch.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold dark:bg-muted dark:text-foreground"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-black text-muted-foreground">
                            {ch.chapterNumber}
                          </span>
                          <span className="truncate">{ch.chapterName}</span>
                        </span>
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background",
                          )}
                        >
                          {isSelected && <Check className="size-3.5 stroke-[3]" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {filteredChapters.length === 0 ? (
                  <li className="px-3 py-2.5 text-sm text-muted-foreground text-center">
                    No matching chapters
                  </li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
