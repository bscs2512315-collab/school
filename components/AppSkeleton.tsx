import { cn } from "@/lib/utils";

interface AppSkeletonProps {
  className?: string;
  rows?: number;
}

export default function AppSkeleton({ className, rows = 3 }: AppSkeletonProps) {
  return (
    <ul className={cn("space-y-2", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="animate-pulse rounded-xl px-3 py-2.5">
          <div
            className={cn("h-4 rounded-md bg-muted", {
              "w-[88%]": index % 3 === 0,
              "w-[72%]": index % 3 === 1,
              "w-[80%]": index % 3 === 2,
            })}
          />
          <div className="mt-2 h-2.5 w-12 rounded-md bg-muted" />
        </li>
      ))}
    </ul>
  );
}
