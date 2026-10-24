"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AppIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function AppIconButton({
  children,
  variant = "default",
  size = "md",
  className,
  ...props
}: AppIconButtonProps) {
  const variantClasses = {
    default: "hover:bg-muted text-foreground",
    destructive: "hover:bg-destructive/10 text-destructive",
    ghost: "hover:bg-muted/50 text-muted-foreground",
  };

  const sizeClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
  };

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer rounded-lg transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

