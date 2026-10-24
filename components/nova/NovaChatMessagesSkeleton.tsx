import { cn } from "@/lib/utils";

interface NovaChatMessagesSkeletonProps {
  className?: string;
}

export default function NovaChatMessagesSkeleton({
  className,
}: NovaChatMessagesSkeletonProps) {
  return (
    <div
      className={cn("space-y-6 py-2", className)}
      aria-busy="true"
      aria-label="Loading chat messages"
    >
      {/* 1. User message skeleton (right aligned) */}
      <div className="flex flex-row-reverse items-start gap-2.5 sm:gap-3">
        <div className="size-8 shrink-0 rounded-full bg-primary/20 animate-pulse" />
        <div className="min-w-0 max-w-[85%] sm:max-w-[70%] space-y-2 rounded-2xl rounded-tr-md bg-primary/10 border border-primary/20 px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-xs animate-pulse">
          <div className="h-3.5 w-48 max-w-full rounded bg-primary/30" />
          <div className="h-3.5 w-32 max-w-full rounded bg-primary/20" />
        </div>
      </div>

      {/* 2. Assistant message skeleton (left aligned) */}
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="min-w-0 max-w-[88%] sm:max-w-[82%] space-y-3 rounded-2xl rounded-tl-md border border-border/70 bg-card px-4 py-3.5 sm:px-5 sm:py-4 shadow-xs animate-pulse">
          <div className="h-3.5 w-[90%] rounded bg-muted/80" />
          <div className="h-3.5 w-[96%] rounded bg-muted/70" />
          <div className="h-3.5 w-[80%] rounded bg-muted/60" />
          <div className="h-3.5 w-[65%] rounded bg-muted/50" />
          <div className="mt-3 flex items-center justify-end pt-2 border-t border-border/40">
            <div className="h-4 w-16 rounded bg-muted/40" />
          </div>
        </div>
      </div>

      {/* 3. Second user message skeleton */}
      <div className="flex flex-row-reverse items-start gap-2.5 sm:gap-3">
        <div className="size-8 shrink-0 rounded-full bg-primary/20 animate-pulse" />
        <div className="min-w-0 max-w-[75%] sm:max-w-[60%] space-y-2 rounded-2xl rounded-tr-md bg-primary/10 border border-primary/20 px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-xs animate-pulse">
          <div className="h-3.5 w-52 max-w-full rounded bg-primary/30" />
        </div>
      </div>

      {/* 4. Second assistant message skeleton */}
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="min-w-0 max-w-[88%] sm:max-w-[82%] space-y-3 rounded-2xl rounded-tl-md border border-border/70 bg-card px-4 py-3.5 sm:px-5 sm:py-4 shadow-xs animate-pulse">
          <div className="h-3.5 w-[88%] rounded bg-muted/80" />
          <div className="h-3.5 w-[76%] rounded bg-muted/70" />
          <div className="h-3.5 w-[50%] rounded bg-muted/60" />
          <div className="mt-3 flex items-center justify-end pt-2 border-t border-border/40">
            <div className="h-4 w-16 rounded bg-muted/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
