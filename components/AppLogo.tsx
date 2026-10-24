"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";

interface AppLogoProps {
  /** `sidebar` = branded logo for green sidebar. `dark` = logo for dark/colored backgrounds. `light` = logo for light backgrounds. `auto` = follows theme. */
  variant?: "auto" | "light" | "dark" | "sidebar";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export default function AppLogo({
  variant = "auto",
  className,
  imageClassName,
  priority = false,
}: AppLogoProps) {
  if (variant === "sidebar" || variant === "dark") {
    return (
      <div
        className={cn(
          "relative shrink-0",
          {
            "h-10 w-36": variant !== "sidebar",
            "h-20 w-48 max-w-full": variant === "sidebar",
          },
          className,
        )}
      >
        <Image
          src="/AppLogoDark.png"
          alt={APP_NAME}
          fill
          unoptimized
          sizes={variant === "sidebar" ? "216px" : "144px"}
          className={cn("object-contain object-left", imageClassName)}
          priority={priority}
        />
      </div>
    );
  }

  if (variant === "light") {
    return (
      <div className={cn("relative shrink-0 h-10 w-36", className)}>
        <Image
          src="/AppLogoLight.png"
          alt={APP_NAME}
          fill
          unoptimized
          sizes="144px"
          className={cn("object-contain object-left", imageClassName)}
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0 h-10 w-36", className)}>
      <Image
        src="/AppLogoDark.png"
        alt={APP_NAME}
        fill
        unoptimized
        sizes="280px"
        className={cn("hidden dark:block object-contain object-left", imageClassName)}
        priority={priority}
      />
      <Image
        src="/AppLogoLight.png"
        alt={APP_NAME}
        fill
        unoptimized
        sizes="280px"
        className={cn("block dark:hidden object-contain object-left", imageClassName)}
        priority={priority}
      />
    </div>
  );
}
