import { Award, BookOpen, Crown, Flame, Heart, Shield, Star, Zap, type LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import TrophySVG from "@/public/svgs/TrophySVG";

export const MILESTONE_ICON_MAP: Record<string, ComponentType<SVGProps<SVGSVGElement>> | LucideIcon> = {
  Star,
  Flame,
  BookOpen,
  Trophy: TrophySVG,
  Shield,
  Crown,
  Zap,
  Heart,
  Award,
};

export const MILESTONE_ICON_KEYS = Object.keys(MILESTONE_ICON_MAP);

export interface MilestoneColorPreset {
  color: string;
  bgColor: string;
  label: string;
}

export const MILESTONE_COLOR_PRESETS: MilestoneColorPreset[] = [
  { color: "text-primary", bgColor: "bg-primary/10", label: "Primary" },
  { color: "text-rank-1", bgColor: "bg-rank-1/10", label: "Gold" },
  { color: "text-rank-2", bgColor: "bg-rank-2/10", label: "Blue" },
  { color: "text-rank-3", bgColor: "bg-rank-3/10", label: "Purple" },
  { color: "text-destructive", bgColor: "bg-destructive/10", label: "Red" },
  { color: "text-trend-up", bgColor: "bg-trend-up/10", label: "Green" },
  { color: "text-muted-foreground", bgColor: "bg-muted", label: "Neutral" },
];

export const DEFAULT_MILESTONE_ICON = "Star";
export const DEFAULT_MILESTONE_COLOR = MILESTONE_COLOR_PRESETS[0];
