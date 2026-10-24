"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CalendarSVG from "@/public/svgs/CalendarSVG";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

export interface AppDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateTimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplay(date: Date): string {
  const hours24 = date.getHours();
  const hour12 = hours24 % 12 || 12;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${pad(hour12)}:${pad(date.getMinutes())} ${meridiem}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function withDate(base: Date | null, year: number, month: number, day: number): Date {
  const next = base ? new Date(base) : new Date();
  if (!base) {
    next.setHours(9, 0, 0, 0);
  }
  next.setFullYear(year, month, day);
  return next;
}

function withTime(base: Date | null, hour24: number, minute: number): Date {
  const next = base ? new Date(base) : new Date();
  next.setHours(hour24, minute, 0, 0);
  return next;
}

function toHour24(hour12: number, meridiem: "AM" | "PM"): number {
  if (meridiem === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

function nearestMinuteOption(minute: number): string {
  const snapped = Math.round(minute / 5) * 5;
  return pad(snapped >= 60 ? 55 : snapped);
}

export default function AppDateTimePicker({
  value,
  onChange,
  id,
  disabled = false,
  className,
  placeholder = "dd/mm/yyyy, --:-- --",
}: AppDateTimePickerProps) {
  const selected = parseValue(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? new Date()));
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  const hour24 = selected?.getHours() ?? 9;
  const minute = selected?.getMinutes() ?? 0;
  const hour12 = hour24 % 12 || 12;
  const meridiem = hour24 >= 12 ? "PM" : "AM";

  const calendarDays = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const leading = first.getDay();
    const total = daysInMonth(viewMonth);
    const cells: Array<{ day: number; date: Date } | null> = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let day = 1; day <= total; day += 1) {
      cells.push({
        day,
        date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day),
      });
    }
    return cells;
  }, [viewMonth]);

  const close = useCallback(() => setOpen(false), []);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = Math.max(rect.width, 288);
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - panelWidth - 12,
    );
    const estimatedHeight = 360;
    const openAbove = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
    setMenuPosition({
      top: openAbove ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
      left,
      width: panelWidth,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setViewMonth(startOfMonth(parseValue(value) ?? new Date()));
    updateMenuPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        close();
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
    // Sync the visible month only when the picker opens, not on every value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [close, open, updateMenuPosition]);

  const emit = (date: Date) => {
    onChange(toDateTimeLocal(date));
  };

  const selectDay = (date: Date) => {
    emit(withDate(selected, date.getFullYear(), date.getMonth(), date.getDate()));
  };

  const selectHour = (hourLabel: string) => {
    emit(withTime(selected, toHour24(Number(hourLabel), meridiem), minute));
  };

  const selectMinute = (minuteLabel: string) => {
    emit(withTime(selected, hour24, Number(minuteLabel)));
  };

  const selectMeridiem = (next: "AM" | "PM") => {
    let next24 = hour24;
    if (next === "AM" && hour24 >= 12) next24 = hour24 - 12;
    if (next === "PM" && hour24 < 12) next24 = hour24 + 12;
    emit(withTime(selected, next24, minute));
  };

  const monthLabel = viewMonth.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-background px-4 text-left text-sm transition-all",
          "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
          {
            "border-primary ring-4 ring-primary/10": open,
            "border-border hover:border-primary/30": !open,
            "cursor-not-allowed opacity-50": disabled,
            "text-muted-foreground": !selected,
            "text-foreground": Boolean(selected),
          },
          className,
        )}
      >
        <span className="truncate">
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        <CalendarSVG className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                zIndex: 9999,
              }}
              className="rounded-2xl border border-border bg-popover p-3 shadow-lg"
            >
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                  onClick={() =>
                    setViewMonth(
                      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
                    )
                  }
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <p className="text-sm font-bold">{monthLabel}</p>
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                  onClick={() =>
                    setViewMonth(
                      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
                    )
                  }
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <span
                    key={day}
                    className="py-1 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    {day}
                  </span>
                ))}
                {calendarDays.map((cell, index) => {
                  if (!cell) {
                    return <span key={`empty-${index}`} />;
                  }
                  const isSelected = selected ? isSameDay(cell.date, selected) : false;
                  const isToday = isSameDay(cell.date, new Date());
                  return (
                    <button
                      key={`${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.day}`}
                      type="button"
                      onClick={() => selectDay(cell.date)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                        {
                          "bg-primary text-primary-foreground": isSelected,
                          "ring-1 ring-primary/40": isToday && !isSelected,
                          "hover:bg-muted": !isSelected,
                        },
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-border/40 pt-3">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Hour
                  </span>
                  <select
                    value={pad(hour12)}
                    onChange={(event) => selectHour(event.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                  >
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Minute
                  </span>
                  <select
                    value={nearestMinuteOption(minute)}
                    onChange={(event) => selectMinute(event.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                  >
                    {MINUTES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Period
                  </span>
                  <div className="flex h-10 overflow-hidden rounded-xl border border-border">
                    {(["AM", "PM"] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => selectMeridiem(item)}
                        className={cn("w-10 text-xs font-bold transition-colors", {
                          "bg-primary text-primary-foreground": meridiem === item,
                          "bg-background text-muted-foreground hover:bg-muted":
                            meridiem !== item,
                        })}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
