import * as React from "react";
import { cn } from "@/lib/utils";

const Empty = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-1 w-full flex-col items-center justify-center my-auto p-8 sm:p-12 text-center select-none min-h-[50vh]",
            className
        )}
        {...props}
    />
);

const EmptyHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col items-center max-w-xl sm:max-w-2xl mx-auto space-y-2", className)} {...props} />
);

const EmptyMedia = ({
    className,
    variant = "icon",
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "icon" | "image" }) => (
    <div
        className={cn(
            "hidden",
            className
        )}
        {...props}
    />
);

const EmptyTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
        className={cn("text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-foreground dark:text-white uppercase font-sans break-words max-w-full leading-tight", className)}
        {...props}
    />
);

const EmptyDescription = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("text-sm sm:text-base text-muted-foreground dark:text-zinc-400 font-medium leading-relaxed max-w-md sm:max-w-lg mx-auto pt-1 break-words", className)} {...props} />
);

const EmptyContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("mt-5 flex flex-wrap items-center justify-center gap-3", className)} {...props} />
);

export {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
};
