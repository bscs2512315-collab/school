"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, Search, X } from "lucide-react";
import ArrowDownSVG from "@/public/svgs/ArrowDownSVG";
import { cn } from "@/lib/utils";

export interface AppSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AppSelectProps {
  value?: string;
  options?: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  id?: string;
  name?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
}

function createSelectChangeEvent(
  value: string,
  name?: string,
): React.ChangeEvent<HTMLSelectElement> {
  return {
    target: { value, name: name ?? "" },
    currentTarget: { value, name: name ?? "" },
  } as React.ChangeEvent<HTMLSelectElement>;
}

export default function AppSelect({
  value = "",
  options = [],
  placeholder = "Select an option",
  disabled = false,
  searchable = false,
  className,
  id,
  name,
  onChange,
  onBlur,
}: AppSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const searchInputId = `${triggerId}-search`;

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
    preferUp: false,
  });

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const searchTerm = searchQuery.trim().toLowerCase();
  const cleanSearchTerm = searchTerm.replace(/[^a-z0-9]/g, "");

  const listOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    return options.filter((option) => {
      const labelLower = option.label.toLowerCase();
      const valueLower = option.value.toLowerCase();
      if (labelLower.includes(searchTerm) || valueLower.includes(searchTerm)) {
        return true;
      }
      if (cleanSearchTerm.length >= 2) {
        const cleanLabel = labelLower.replace(/[^a-z0-9]/g, "");
        const cleanValue = valueLower.replace(/[^a-z0-9]/g, "");
        return cleanLabel.includes(cleanSearchTerm) || cleanValue.includes(cleanSearchTerm);
      }
      return false;
    });
  }, [options, searchable, searchTerm, cleanSearchTerm]);

  const enabledOptions = useMemo(
    () => listOptions.filter((option) => !option.disabled),
    [listOptions],
  );

  const displayLabel = selectedOption?.label ?? placeholder;
  const hasValue = Boolean(selectedOption);

  const cleanPlaceholder = placeholder.replace(/^select\s+/i, "");
  const searchInputPlaceholder = `Search ${cleanPlaceholder.toLowerCase()}...`;

  const closeMenu = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
    setSearchQuery("");
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 768;
    const padding = 12;

    let width = rect.width;
    let left = rect.left;

    // Prevent horizontal overflow
    if (width > viewportWidth - padding * 2) {
      width = viewportWidth - padding * 2;
      left = padding;
    } else if (left + width > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - padding - width);
    } else if (left < padding) {
      left = padding;
    }

    // Determine vertical flip space
    const spaceBelow = viewportHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const preferUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    const maxHeight = preferUp
      ? Math.min(300, Math.max(140, spaceAbove - 8))
      : Math.min(300, Math.max(140, spaceBelow - 8));

    return {
      top: rect.bottom + 6,
      bottom: viewportHeight - rect.top + 6,
      left,
      width,
      maxHeight,
      preferUp,
    };
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;

    const pos = calculatePosition();
    if (pos) {
      setMenuPosition(pos);
    }

    setSearchQuery("");
    const selectedIndex = enabledOptions.findIndex((option) => option.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [calculatePosition, disabled, enabledOptions, value]);

  const updateMenuPosition = useCallback(() => {
    const pos = calculatePosition();
    if (pos) {
      setMenuPosition(pos);
    }
  }, [calculatePosition]);

  useEffect(() => {
    if (!open) return;
    if (searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open, searchable]);

  const selectOption = useCallback(
    (option: AppSelectOption) => {
      if (option.disabled) return;
      onChange?.(createSelectChangeEvent(option.value, name));
      closeMenu();
    },
    [closeMenu, name, onChange],
  );

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !listboxRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [closeMenu, open, updateMenuPosition]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        Math.min(current + 1, enabledOptions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = enabledOptions[highlightedIndex];
      if (option) {
        selectOption(option);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    const term = query.trim().toLowerCase();
    const matches = term
      ? options.filter(
          (option) =>
            !option.disabled &&
            (option.label.toLowerCase().includes(term) ||
              option.value.toLowerCase().includes(term)),
        )
      : options.filter((option) => !option.disabled);
    const selectedIndex = matches.findIndex((option) => option.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
    }

    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => {
        const next = current + 1;
        return next >= enabledOptions.length ? 0 : next;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => {
        const next = current - 1;
        return next < 0 ? enabledOptions.length - 1 : next;
      });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = enabledOptions[highlightedIndex];
      if (option) {
        selectOption(option);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        onBlur={onBlur}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 text-sm transition-all",
          "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
          {
            "border-primary ring-4 ring-primary/10": open,
            "border-border hover:border-primary/30": !open,
            "cursor-not-allowed opacity-50": disabled,
            "text-muted-foreground": !hasValue,
            "text-foreground": hasValue,
          },
          className,
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ArrowDownSVG
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", {
            "rotate-180 text-primary": open,
          })}
          aria-hidden="true"
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              style={{
                position: "fixed",
                left: menuPosition.left,
                width: menuPosition.width,
                maxHeight: menuPosition.maxHeight,
                zIndex: 99999,
                ...(menuPosition.preferUp
                  ? { bottom: menuPosition.bottom }
                  : { top: menuPosition.top }),
              }}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-xl backdrop-blur-md"
            >
              {searchable ? (
                <div className="shrink-0 border-b border-border/60 p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      id={searchInputId}
                      type="text"
                      role="searchbox"
                      aria-label={searchInputPlaceholder}
                      placeholder={searchInputPlaceholder}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery("");
                          setHighlightedIndex(0);
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <ul
                style={{
                  maxHeight: `${Math.max(100, menuPosition.maxHeight - (searchable ? 54 : 0))}px`,
                }}
                className="overflow-y-auto py-1 overscroll-contain"
              >
                {listOptions.map((option) => {
                  const enabledIndex = enabledOptions.findIndex(
                    (enabledOption) => enabledOption.value === option.value,
                  );
                  const isSelected = option.value === value;
                  const isHighlighted = enabledIndex === highlightedIndex;

                  return (
                    <li key={option.value} role="presentation">
                      <button
                        ref={(element) => {
                          if (enabledIndex >= 0) {
                            optionRefs.current[enabledIndex] = element;
                          }
                        }}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        onMouseEnter={() => {
                          if (!option.disabled && enabledIndex >= 0) {
                            setHighlightedIndex(enabledIndex);
                          }
                        }}
                        onClick={() => selectOption(option)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                          {
                            "bg-primary/10 text-primary font-semibold": isSelected,
                            "bg-muted text-foreground": isHighlighted && !isSelected,
                            "text-foreground hover:bg-muted": !isSelected && !isHighlighted,
                            "cursor-not-allowed opacity-50": option.disabled,
                          },
                        )}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                      </button>
                    </li>
                  );
                })}
                {listOptions.length === 0 ? (
                  <li className="px-3 py-2.5 text-sm text-muted-foreground">No options found</li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
