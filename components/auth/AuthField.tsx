"use client";

import React, { type ComponentType, type SVGProps } from "react";
import AppInput from "@/components/AppInput";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

type AuthFieldProps = React.ComponentProps<typeof AppInput> & {
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  rightElement?: React.ReactNode;
  wrapperClassName?: string;
};

export function AuthField({
  label,
  icon: Icon,
  rightElement,
  className,
  wrapperClassName,
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      <Typography
        variant="muted"
        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Typography>
      <div className="relative group">
        {Icon ? (
          <Icon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none" />
        ) : null}
        <AppInput
          className={cn(
            "h-12 bg-auth-input-bg border-border/50 focus-visible:border-primary transition-all rounded-xl",
            Icon ? "pl-12 pr-12" : "px-5",
            className,
          )}
          {...inputProps}
        />
        {rightElement ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        ) : null}
      </div>
    </div>
  );
}
