"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AppLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export default function AppLabel({ 
  children, 
  className, 
  required,
  ...props 
}: AppLabelProps) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-foreground mb-2",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

