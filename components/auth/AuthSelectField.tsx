"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import AppSelect from "@/components/AppSelect";
import { cn } from "@/lib/utils";

type AuthSelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  icon?: LucideIcon;
  wrapperClassName?: string;
  options: { value: string; label: string; disabled?: boolean }[];
};

export function AuthSelectField({
  label,
  icon: Icon,
  className,
  wrapperClassName,
  options,
  value,
  onChange,
  name,
  id,
  disabled,
}: AuthSelectFieldProps) {
  // Some callers pass a leading placeholder option with an empty value; use it
  // as the AppSelect placeholder and drop it from the real option list.
  const placeholderOption = options.find((option) => option.value === "");
  const realOptions = options.filter((option) => option.value !== "");

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <Typography
        variant="muted"
        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Typography>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
        <AppSelect
          id={id}
          name={name}
          value={typeof value === "string" ? value : value == null ? "" : String(value)}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholderOption?.label ?? "Select an option"}
          options={realOptions}
          className={cn(
            "border-border/50 bg-auth-input-bg",
            Icon ? "pl-12" : undefined,
            className,
          )}
        />
      </div>
    </div>
  );
}
