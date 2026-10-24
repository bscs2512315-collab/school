"use client";

import Image from "next/image";
import { PRESET_AVATARS } from "@/constants/presetAvatars";
import { cn } from "@/lib/utils";

interface SettingsAvatarPickerProps {
  selectedSrc?: string | null;
  onSelect: (src: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function SettingsAvatarPicker({
  selectedSrc,
  onSelect,
  disabled = false,
  className,
}: SettingsAvatarPickerProps) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-border/60 bg-card p-4 sm:p-5",
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">Choose an avatar</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Use a preset if you prefer not to upload a photo.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8 sm:gap-3">
        {PRESET_AVATARS.map((avatar) => {
          const isSelected = selectedSrc === avatar.src;

          return (
            <button
              key={avatar.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(avatar.src)}
              aria-label={avatar.label}
              aria-pressed={isSelected}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border bg-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50",
                {
                  "border-primary ring-2 ring-primary/20": isSelected,
                  "border-border hover:border-primary/40": !isSelected,
                },
              )}
            >
              <Image
                src={avatar.src}
                alt={avatar.label}
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
