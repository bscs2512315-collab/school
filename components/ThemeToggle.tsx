"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import MoonSVG from "@/public/svgs/MoonSVG";
import SunSVG from "@/public/svgs/SunSVG";
import { cn } from "@/lib/utils";

export function ThemeToggle({ label, className, disableHover = false }: { label?: string; className?: string; disableHover?: boolean }) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={cn("group flex items-center rounded-lg p-2 text-muted-foreground", !disableHover && "transition-all hover:bg-muted", className)}
            title="Toggle theme"
        >
            {mounted ? (
                resolvedTheme === "dark" ? (
                    <SunSVG className={cn("size-6 shrink-0", !disableHover && "transition-transform duration-300 group-hover:scale-110 group-hover:text-primary")} />
                ) : (
                    <MoonSVG className={cn("size-6 shrink-0", !disableHover && "transition-transform duration-300 group-hover:scale-110 group-hover:text-primary")} />
                )
            ) : (
                <span className="size-6" aria-hidden />
            )}
            {label ? <span className="ml-3">{label}</span> : <span className="sr-only">Toggle theme</span>}
        </button>
    );
}
