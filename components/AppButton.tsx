import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export interface AppButtonProps extends React.ComponentProps<typeof Button> {
    isLoading?: boolean;
    loadingText?: string;
}

export default function AppButton({
    className,
    variant,
    children,
    isLoading = false,
    loadingText,
    disabled,
    ...props
}: AppButtonProps) {
    return (
        <Button
            variant={variant}
            disabled={disabled || isLoading}
            aria-busy={isLoading || undefined}
            className={cn(
                "cursor-pointer",
                {
                    "border-0 bg-primary/10 text-primary shadow-none hover:bg-primary/15 hover:text-primary dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white":
                        variant === "outline",
                    "bg-secondary text-secondary-foreground hover:opacity-80":
                        variant === "secondary",
                },
                className
            )}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{loadingText || children}</span>
                </>
            ) : (
                children
            )}
        </Button>
    );
}
