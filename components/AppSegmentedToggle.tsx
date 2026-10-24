"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedToggleOption {
  label: string;
  value: string;
  icon?: LucideIcon;
  count?: number;
}

interface AppSegmentedToggleProps {
  label?: string;
  options: SegmentedToggleOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function AppSegmentedToggle({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: AppSegmentedToggleProps) {
  const groupName = label ? label.replace(/\s+/g, "-").toLowerCase() : "radio-toggle";

  return (
    <fieldset className={cn("flex flex-col gap-2.5 border-0 p-0", className)} disabled={disabled}>
      {label ? (
        <legend className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </legend>
      ) : null}

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
        {options.map((option) => {
          const isActive = value === option.value;
          const Icon = option.icon;

          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 flex-1 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-all sm:min-w-36 sm:flex-none",
                {
                  "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10": isActive,
                  "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/40 hover:text-foreground":
                    !isActive,
                  "cursor-not-allowed opacity-50": disabled,
                },
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={isActive}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  {
                    "border-primary": isActive,
                    "border-muted-foreground/40": !isActive,
                  },
                )}
                aria-hidden="true"
              >
                {isActive ? <span className="size-2 rounded-full bg-primary" /> : null}
              </span>

              <span className="flex min-w-0 flex-1 items-center gap-2">
                {Icon ? <Icon className="size-4 shrink-0" /> : null}
                <span className="text-xs font-bold uppercase tracking-widest">{option.label}</span>
              </span>

              {option.count !== undefined ? (
                <span
                  className={cn(
                    "flex size-5 min-w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                    {
                      "bg-primary text-primary-foreground": isActive,
                      "bg-muted text-muted-foreground": !isActive,
                    },
                  )}
                >
                  {option.count}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
