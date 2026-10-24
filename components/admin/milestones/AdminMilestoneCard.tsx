"use client";

import { Award, Edit2 } from "lucide-react";
import DeleteSVG from "@/public/svgs/DeleteSVG";
import { Typography } from "@/components/ui/Typography";
import { MILESTONE_ICON_MAP } from "@/lib/milestones/admin-milestone-options";
import { cn } from "@/lib/utils";
import type { AdminMilestone } from "@/types/past-paper";

interface AdminMilestoneCardProps {
  milestone: AdminMilestone;
  onEdit: (milestone: AdminMilestone) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

function MilestoneCardBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/95 to-primary-dark" />
      <div className="absolute top-[-20%] right-[-10%] size-[80%] rounded-full bg-background/10 blur-[80px] transition-colors duration-700 group-hover:bg-background/15" />
      <div className="absolute bottom-[-10%] left-[-10%] size-[60%] rounded-full bg-primary-light/20 blur-[60px] transition-colors duration-700 group-hover:bg-primary-light/30" />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}

export default function AdminMilestoneCard({
  milestone,
  onEdit,
  onDelete,
  isDeleting = false,
}: AdminMilestoneCardProps) {
  const IconComponent = MILESTONE_ICON_MAP[milestone.icon] || Award;
  const levelLabel = milestone.level || 1;

  return (
    <div className="group relative flex min-h-72 flex-col overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
      <MilestoneCardBackground />

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(milestone)}
          className="flex size-9 items-center justify-center rounded-xl border border-background/20 bg-background/15 text-background backdrop-blur-md transition-colors hover:bg-background hover:text-primary"
          aria-label={`Edit ${milestone.name}`}
        >
          <Edit2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(milestone.id)}
          disabled={isDeleting}
          className="flex size-9 items-center justify-center rounded-xl border border-background/20 bg-destructive/20 text-background backdrop-blur-md transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
          aria-label={`Delete ${milestone.name}`}
        >
          <DeleteSVG className="size-4" />
        </button>
      </div>

      <div className="absolute top-4 left-4 z-0 pointer-events-none select-none sm:top-6 sm:left-6">
        <span className="text-6xl font-black tracking-tighter text-background/10 sm:text-7xl">
          {levelLabel}
        </span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 text-center sm:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/10 px-3 py-1.5 backdrop-blur-md">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-background">
            Level {levelLabel}
          </span>
        </div>

        <div
          className={cn(
            "mb-5 flex size-20 items-center justify-center rounded-3xl border border-white/20 bg-background shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3 sm:size-24",
            milestone.bg_color,
            milestone.color,
          )}
        >
          <IconComponent className="size-10 sm:size-11" />
        </div>

        <p className="mb-2 text-2xl font-bold text-background sm:text-3xl">
          {milestone.name}
        </p>

        <span className="rounded-full border border-white/20 bg-background/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-background backdrop-blur-md sm:text-xs">
          {milestone.points_required} Points Required
        </span>
      </div>
    </div>
  );
}
