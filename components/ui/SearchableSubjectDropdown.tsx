"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Subject } from "@/types/enums";

export const ALL_APP_SUBJECTS: string[] = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Urdu",
  "Pakistan Studies",
  "Islamiat",
  "General Mathematics",
  "General Science",
  "Economics",
  "Principles of Accounting",
  "Principles of Commerce",
  "Business Statistics",
  "Commercial Geography",
  "Civics",
  "Ethics / Religious Studies",
  "History of Pakistan",
];

// Combine predefined enum values and all app subjects uniquely
const COMBINED_SUBJECT_LIST: string[] = Array.from(
  new Set([
    ...Object.values(Subject),
    ...ALL_APP_SUBJECTS,
  ])
);

interface SearchableSubjectDropdownProps {
  selectedSubjects: string[];
  onChange: (subjects: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchableSubjectDropdown({
  selectedSubjects = [],
  onChange,
  placeholder = "Search and select subjects...",
  className,
  disabled = false,
}: SearchableSubjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return COMBINED_SUBJECT_LIST;
    return COMBINED_SUBJECT_LIST.filter((s) =>
      s.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      onChange(selectedSubjects.filter((s) => s !== subject));
    } else {
      onChange([...selectedSubjects, subject]);
    }
  };

  const removeSubject = (subject: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(selectedSubjects.filter((s) => s !== subject));
  };

  const selectAllFiltered = () => {
    const combined = Array.from(new Set([...selectedSubjects, ...filteredSubjects]));
    onChange(combined);
  };

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={dropdownRef} className={cn("relative w-full space-y-2", className)}>
      {/* Dropdown Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2 text-sm shadow-xs transition-all",
          "hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          isOpen && "border-primary ring-2 ring-primary/20",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0 pr-2">
          {selectedSubjects.length === 0 ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="size-4 text-muted-foreground/70" />
              {placeholder}
            </span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary dark:text-logo-green">
                <BookOpen className="size-3.5" />
                {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? "s" : ""} selected
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
          {selectedSubjects.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md p-1 hover:bg-muted hover:text-foreground text-xs font-medium"
              title="Clear all"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180 text-primary")}
          />
        </div>
      </div>

      {/* Selected Subjects Chips/Pills underneath */}
      {selectedSubjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedSubjects.map((subject) => (
            <span
              key={subject}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary dark:text-logo-green animate-in fade-in zoom-in-95 duration-150"
            >
              {subject}
              <button
                type="button"
                onClick={(e) => removeSubject(subject, e)}
                className="rounded-full p-0.5 hover:bg-primary/20 hover:text-primary transition-colors"
                aria-label={`Remove ${subject}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="border-b border-border/80 p-2.5 bg-muted/30">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all subjects..."
                className="h-9 w-full rounded-xl border border-border/70 bg-card pl-9 pr-8 text-xs font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-semibold text-muted-foreground">
              <span>{filteredSubjects.length} subject{filteredSubjects.length !== 1 ? "s" : ""} available</span>
              <div className="flex items-center gap-2">
                {filteredSubjects.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-primary hover:underline dark:text-logo-green"
                  >
                    Select all
                  </button>
                )}
                {selectedSubjects.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Subjects List */}
          <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-border/20">
            {filteredSubjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No subjects found matching <span className="font-bold text-foreground">"{searchQuery}"</span>
              </div>
            ) : (
              filteredSubjects.map((subject) => {
                const isSelected = selectedSubjects.includes(subject);
                return (
                  <div
                    key={subject}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => toggleSubject(subject)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSubject(subject);
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary dark:text-logo-green font-bold"
                        : "text-foreground hover:bg-muted/70"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex size-4.5 items-center justify-center rounded-md border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground dark:bg-logo-green dark:border-logo-green dark:text-black"
                            : "border-border bg-card"
                        )}
                      >
                        {isSelected && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <span>{subject}</span>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] uppercase tracking-wider text-primary/75 dark:text-logo-green/75 font-bold">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
