import type { ComponentType, SVGProps } from "react";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface HistoryStatsCardProps {
  title: string;
  value: React.ReactNode;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  bottomLabel: string;
  progressColorClass?: string;
  progressWidthClass?: string;
}

export default function HistoryStatsCard({
  title,
  value,
  icon: Icon,
  bottomLabel,
  progressColorClass = "bg-background",
  progressWidthClass = "w-8 sm:w-12",
}: HistoryStatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl p-4 shadow-xl shadow-primary/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(22,163,74,0.15)] sm:rounded-[2.5rem] sm:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-sidebar-from via-primary to-sidebar-to" />
        <div className="absolute top-[-20%] right-[-10%] size-[80%] rounded-full bg-white/10 blur-[60px] transition-colors duration-700 group-hover:bg-white/15" />
        <div className="absolute bottom-[-10%] left-[-10%] size-[60%] rounded-full bg-black/25 blur-[40px] transition-colors duration-700 group-hover:bg-black/35" />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="absolute top-3 right-3 opacity-10 transition-transform duration-500 group-hover:scale-110 sm:top-5 sm:right-5">
        <Icon className="size-10 text-white sm:size-16" strokeWidth={1.25} />
      </div>

      <div className="relative z-10">
        <Typography className="mb-2 text-[8px] font-black uppercase tracking-widest text-white/60 sm:mb-4 sm:text-[10px] sm:tracking-[0.2em]">
          {title}
        </Typography>
        <Typography className="text-xl font-black text-white sm:text-4xl">{value}</Typography>
        <div className="mt-2 flex items-center gap-1 sm:mt-4 sm:gap-2">
          <div
            className={cn(
              "h-1 shrink-0 overflow-hidden rounded-full bg-white/20 sm:h-1.5",
              progressWidthClass,
            )}
          >
            <div className={cn("h-full w-full", progressColorClass)} />
          </div>
          <Typography className="truncate text-[8px] font-bold uppercase text-white/40 sm:text-[10px]">
            {bottomLabel}
          </Typography>
        </div>
      </div>
    </div>
  );
}
