"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import AppButton from "@/components/AppButton";
import AppDateTimePicker from "@/components/AppDateTimePicker";
import { apiPatch } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { parsePaperDifficulty } from "@/lib/paper/difficulty";
import { parsePaperVariant } from "@/lib/paper/variant-parser";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  paperId: string;
  paperTitle: string;
  currentDueDate: string | null | undefined;
  classroomId?: string;
  onSuccess?: (updated: {
    id: string;
    dueDate: string | null;
    affectedPaperIds?: string[];
  }) => void;
}

function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No deadline set";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeRemaining(dateStr: string | null | undefined): {
  isOverdue: boolean;
  text: string;
} {
  if (!dateStr) {
    return { isOverdue: false, text: "Open submission anytime" };
  }
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const isOverdue = diffMs < 0;
  const absSec = Math.floor(Math.abs(diffMs) / 1000);

  const days = Math.floor(absSec / 86400);
  const hours = Math.floor((absSec % 86400) / 3600);
  const minutes = Math.floor((absSec % 3600) / 60);

  let durationStr = "";
  if (days > 0) {
    durationStr = `${days} day${days > 1 ? "s" : ""}${hours > 0 ? ` ${hours} hr${hours > 1 ? "s" : ""}` : ""}`;
  } else if (hours > 0) {
    durationStr = `${hours} hr${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min` : ""}`;
  } else {
    durationStr = `${Math.max(1, minutes)} min`;
  }

  if (isOverdue) {
    return { isOverdue: true, text: `Deadline ended ${durationStr} ago` };
  }
  return { isOverdue: false, text: `${durationStr} remaining` };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateToLocalPickerString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ExtendDeadlineModal({
  isOpen,
  onClose,
  paperId,
  paperTitle,
  currentDueDate,
  classroomId,
  onSuccess,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [applyToAllSets, setApplyToAllSets] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentDueDate) {
        const d = new Date(currentDueDate);
        if (!Number.isNaN(d.getTime())) {
          setSelectedDate(dateToLocalPickerString(d));
        } else {
          setSelectedDate("");
        }
      } else {
        // Default to 3 days from now at 11:59 PM if no deadline exists yet
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        defaultDate.setHours(23, 59, 0, 0);
        setSelectedDate(dateToLocalPickerString(defaultDate));
      }
      setApplyToAllSets(true);
    }
  }, [isOpen, currentDueDate]);

  const diff = useMemo(() => parsePaperDifficulty(paperTitle), [paperTitle]);
  const variant = useMemo(() => parsePaperVariant(paperTitle), [paperTitle]);
  const deadlineStatus = useMemo(
    () => formatTimeRemaining(currentDueDate),
    [currentDueDate],
  );

  const applyPreset = (daysToAdd: number | "endOfWeek") => {
    let base = new Date();
    if (currentDueDate) {
      const parsed = new Date(currentDueDate);
      if (!Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        base = parsed;
      }
    }

    const next = new Date(base);
    if (daysToAdd === "endOfWeek") {
      const dayOfWeek = next.getDay(); // 0 is Sunday
      const diffToSunday = (7 - dayOfWeek) % 7 || 7;
      next.setDate(next.getDate() + diffToSunday);
      next.setHours(23, 59, 0, 0);
    } else {
      next.setDate(next.getDate() + daysToAdd);
      if (next.getHours() === 0 && next.getMinutes() === 0) {
        next.setHours(23, 59, 0, 0);
      }
    }

    setSelectedDate(dateToLocalPickerString(next));
  };

  const handleSave = async (clearDeadline = false) => {
    const finalDate = clearDeadline ? null : selectedDate ? new Date(selectedDate).toISOString() : null;

    setSaving(true);
    try {
      const res = await apiPatch<{
        id: string;
        dueDate: string | null;
        affectedPaperIds?: string[];
      }>(`/teacher/papers/${paperId}`, {
        dueDate: finalDate,
        applyToAllSets,
      });

      if (res.success && res.data) {
        toast.success(
          clearDeadline
            ? "Deadline removed — test is now open indefinitely."
            : applyToAllSets && (res.data.affectedPaperIds?.length ?? 1) > 1
              ? `Deadline extended for all ${res.data.affectedPaperIds?.length} test sets!`
              : "Test deadline extended successfully!",
        );
        onSuccess?.({
          id: paperId,
          dueDate: res.data.dueDate,
          affectedPaperIds: res.data.affectedPaperIds,
        });
        onClose();
      } else {
        toast.error(res.message || "Failed to update deadline");
      }
    } catch (err) {
      console.error("Extend deadline error:", err);
      toast.error("Failed to extend deadline");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-2xl space-y-5 text-foreground animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="size-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  Extend Test Deadline
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm">
                  {variant.baseTitle || paperTitle}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Current Deadline Status Card */}
        <div
          className={cn(
            "rounded-2xl border p-3.5 space-y-1.5 transition-colors",
            !currentDueDate
              ? "border-border/60 bg-muted/30"
              : deadlineStatus.isOverdue
                ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                : "border-primary/30 bg-primary/5 text-foreground",
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              {deadlineStatus.isOverdue ? (
                <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <Calendar className="size-4 text-primary shrink-0" />
              )}
              <span>Current Status:</span>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wider",
                !currentDueDate
                  ? "bg-muted text-muted-foreground"
                  : deadlineStatus.isOverdue
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                    : "bg-primary/20 text-primary",
              )}
            >
              {!currentDueDate
                ? "No Deadline"
                : deadlineStatus.isOverdue
                  ? "Overdue"
                  : "Active"}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-semibold">
              {formatDisplayDate(currentDueDate)}
            </span>
            <span className="text-[11px] opacity-80 font-medium">
              {deadlineStatus.text}
            </span>
          </div>
        </div>

        {/* Quick Extend Presets */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span>Quick Extension Presets</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "+1 Day", val: 1 },
              { label: "+3 Days", val: 3 },
              { label: "+1 Week", val: 7 },
              { label: "End of Week", val: "endOfWeek" as const },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.val)}
                className="flex items-center justify-center gap-1 rounded-xl border border-border/80 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 px-3 py-2 text-xs font-bold text-foreground transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date & Time Picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              New Deadline Date & Time
            </label>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
              >
                Clear Input
              </button>
            )}
          </div>
          <AppDateTimePicker
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Select new deadline date & time"
          />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Students who submit after this deadline receive 50% fewer points.
            Extending the deadline immediately removes penalties for submissions
            made within the extended window.
          </p>
        </div>

        {/* Apply to All Sets Checkbox */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-start gap-3">
          <input
            id="applyToAllSetsCheckbox"
            type="checkbox"
            checked={applyToAllSets}
            onChange={(e) => setApplyToAllSets(e.target.checked)}
            className="mt-0.5 size-4 rounded-sm border-border text-primary focus:ring-primary cursor-pointer accent-primary"
          />
          <label
            htmlFor="applyToAllSetsCheckbox"
            className="text-xs font-medium text-foreground cursor-pointer select-none space-y-0.5"
          >
            <div className="font-bold flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              <span>Apply new deadline to all sets of this test</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Updates all variant sets (Set A, Set B, etc.) for this chapter/test in this classroom simultaneously.
            </p>
          </label>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/60">
          <div>
            {currentDueDate && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave(true)}
                className="text-xs font-bold text-destructive hover:underline cursor-pointer disabled:opacity-50"
              >
                Remove Deadline
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={onClose}
              className="font-bold cursor-pointer"
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              size="sm"
              disabled={saving || (!selectedDate && !currentDueDate)}
              onClick={() => void handleSave(false)}
              className="font-bold cursor-pointer min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <span>Save Deadline</span>
                  <ArrowRight className="size-3.5 ml-1" />
                </>
              )}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
