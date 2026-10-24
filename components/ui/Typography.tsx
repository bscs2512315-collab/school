import React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "p" | "muted" | "small" | "large";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
    variant?: TypographyVariant;
    as?: React.ElementType;
}

const variantMapping: Record<TypographyVariant, string> = {
    h1: "text-4xl font-bold text-primary tracking-tight",
    h2: "text-3xl font-semibold text-primary tracking-tight",
    h3: "text-2xl font-semibold text-primary tracking-tight",
    h4: "text-xl font-semibold text-primary tracking-tight",
    p: "leading-7 [&:not(:first-child)]:mt-6",
    muted: "text-sm text-muted-foreground font-medium",
    small: "text-sm font-medium leading-none",
    large: "text-lg font-semibold",
};

const tagMapping: Record<TypographyVariant, React.ElementType> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    p: "p",
    muted: "p",
    small: "small",
    large: "p",
};

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
    ({ className, variant = "p", as, children, ...props }, ref) => {
        const Component: any = as || tagMapping[variant] || "p";
        
        // Ensure Component is a valid React element type
        if (!Component) {
            console.error(`Invalid Typography variant: ${variant}`);
            return <p className={cn(variantMapping["p"], className)} {...props}>{children}</p>;
        }

        return (
            <Component
                ref={ref}
                className={cn(variantMapping[variant] || variantMapping["p"], className)}
                {...props}
            >
                {children}
            </Component>
        );
    }
);

Typography.displayName = "Typography";
