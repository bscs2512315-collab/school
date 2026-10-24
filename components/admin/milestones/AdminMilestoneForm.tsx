"use client";

import { Save, X } from "lucide-react";
import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import AppLabel from "@/components/AppLabel";
import { GenerateSectionDivider } from "@/components/generate/GeneratePaperUI";
import {
  DEFAULT_MILESTONE_COLOR,
  DEFAULT_MILESTONE_ICON,
  MILESTONE_COLOR_PRESETS,
  MILESTONE_ICON_KEYS,
  MILESTONE_ICON_MAP,
} from "@/lib/milestones/admin-milestone-options";
import { cn } from "@/lib/utils";

export interface MilestoneFormValues {
  level: number;
  name: string;
  points: number;
  icon: string;
  color: string;
  bgColor: string;
}

interface AdminMilestoneFormProps {
  mode: "create" | "edit";
  values: MilestoneFormValues;
  isSaving: boolean;
  onChange: (values: Partial<MilestoneFormValues>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function createEmptyMilestoneFormValues(): MilestoneFormValues {
  return {
    level: 1,
    name: "",
    points: 0,
    icon: DEFAULT_MILESTONE_ICON,
    color: DEFAULT_MILESTONE_COLOR.color,
    bgColor: DEFAULT_MILESTONE_COLOR.bgColor,
  };
}

export default function AdminMilestoneForm({
  mode,
  values,
  isSaving,
  onChange,
  onSave,
  onCancel,
}: AdminMilestoneFormProps) {
  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 px-6 py-5 sm:px-8">
        <h2 className="text-lg font-bold text-foreground">
          {mode === "create" ? "Create New Milestone" : "Edit Milestone"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define rank levels and point thresholds for student progression.
        </p>
      </div>

      <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <AppLabel>Level</AppLabel>
            <AppInput
              type="number"
              value={String(values.level)}
              onChange={(event) => onChange({ level: parseInt(event.target.value, 10) || 1 })}
              min={1}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <AppLabel required>Milestone Name</AppLabel>
            <AppInput
              value={values.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="e.g. Apprentice, Master"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <AppLabel required>Points Required</AppLabel>
            <AppInput
              type="number"
              value={String(values.points)}
              onChange={(event) => onChange({ points: parseInt(event.target.value, 10) || 0 })}
              min={0}
              className="h-12 rounded-xl"
            />
          </div>
        </div>

        <GenerateSectionDivider label="Appearance" />

        <div className="space-y-4">
          <AppLabel>Icon</AppLabel>
          <div className="flex flex-wrap gap-3">
            {MILESTONE_ICON_KEYS.map((iconKey) => {
              const IconComponent = MILESTONE_ICON_MAP[iconKey];
              const isSelected = values.icon === iconKey;

              return (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => onChange({ icon: iconKey })}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl border transition-all",
                    {
                      "border-primary bg-primary/10 text-primary": isSelected,
                      "border-border bg-muted/30 text-muted-foreground hover:bg-muted": !isSelected,
                    },
                  )}
                  aria-label={`Select ${iconKey} icon`}
                >
                  <IconComponent className="size-5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <AppLabel>Color Theme</AppLabel>
          <div className="flex flex-wrap gap-3">
            {MILESTONE_COLOR_PRESETS.map((preset) => {
              const isSelected = values.color === preset.color;

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ color: preset.color, bgColor: preset.bgColor })}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl border-2 transition-all",
                    preset.bgColor,
                    preset.color,
                    {
                      "border-current scale-105": isSelected,
                      "border-transparent opacity-70 hover:opacity-100": !isSelected,
                    },
                  )}
                  aria-label={`Select ${preset.label} theme`}
                >
                  <div className="size-4 rounded-full bg-current" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Preview
          </p>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl border border-border bg-background",
                values.bgColor,
                values.color,
              )}
            >
              {(() => {
                const PreviewIcon = MILESTONE_ICON_MAP[values.icon] || MILESTONE_ICON_MAP.Star;
                return <PreviewIcon className="size-7" />;
              })()}
            </div>
            <div>
              <p className="font-bold text-foreground">
                Level {values.level}: {values.name || "Milestone Name"}
              </p>
              <p className="text-sm text-muted-foreground">{values.points} points required</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <AppButton onClick={onSave} disabled={isSaving} className="h-11 rounded-xl px-6">
            <Save className="mr-2 size-4" />
            {isSaving ? "Saving..." : "Save Milestone"}
          </AppButton>
          <AppButton onClick={onCancel} variant="secondary" className="h-11 rounded-xl px-6">
            <X className="mr-2 size-4" />
            Cancel
          </AppButton>
        </div>
      </div>
    </div>
  );
}
