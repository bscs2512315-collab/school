"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full";
  className?: string;
}

export default function PageContainer({
  children,
  maxWidth = "full",
  className,
}: PageContainerProps) {
  const maxWidthMap = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("mx-auto w-full max-w-full flex-1 flex flex-col space-y-6 overflow-x-clip px-4 pt-4 pb-3 sm:px-6 sm:pb-5 lg:space-y-10 lg:px-8 lg:py-6", maxWidthMap[maxWidth], className)}>
      {children}
    </div>
  );
}
