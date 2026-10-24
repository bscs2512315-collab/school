import type { ComponentType, SVGProps } from "react";
import BiologySVG from "@/public/svgs/BiologySVG";
import ChemistrySVG from "@/public/svgs/ChemistrySVG";
import PhysicsSVG from "@/public/svgs/PhysicsSVG";
import CalculatorSVG from "@/public/svgs/CalculatorSVG";
import ComputerSVG from "@/public/svgs/ComputerSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import ScrollSVG from "@/public/svgs/ScrollSVG";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import { Subject } from "@/types/enums";

import ClassroomSVG from "@/public/svgs/ClassroomSVG";

export type SubjectIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface ClassroomThemePalette {
  gradient: string;
  border: string;
  badgeBg: string;
  icon: SubjectIconComponent;
  name: string;
}

export const CLASSROOM_PALETTES: ClassroomThemePalette[] = [
  {
    name: "amber",
    gradient: "bg-linear-to-br from-[#f59e0b] via-[#d97706] to-[#b45309]",
    border: "border-amber-300/40 shadow-amber-500/15",
    badgeBg: "bg-white/20 border-white/25 text-white",
    icon: CalculatorSVG,
  },
  {
    name: "blue",
    gradient: "bg-linear-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
    border: "border-blue-300/40 shadow-blue-500/15",
    badgeBg: "bg-white/20 border-white/25 text-white",
    icon: PhysicsSVG,
  },
  {
    name: "purple",
    gradient: "bg-linear-to-br from-[#a855f7] via-[#9333ea] to-[#7e22ce]",
    border: "border-purple-300/40 shadow-purple-500/15",
    badgeBg: "bg-white/20 border-white/25 text-white",
    icon: ChemistrySVG,
  },
  {
    name: "green",
    gradient: "bg-linear-to-br from-[#008503] via-[#005f02] to-[#004a02]",
    border: "border-primary-light/40 shadow-emerald-500/15",
    badgeBg: "bg-white/20 border-white/25 text-white",
    icon: CalculatorSVG,
  },
  {
    name: "rose",
    gradient: "bg-linear-to-br from-[#e11d48] via-[#be123c] to-[#9f1239]",
    border: "border-rose-300/40 shadow-rose-500/15",
    badgeBg: "bg-white/20 border-white/25 text-white",
    icon: BookOpenSVG,
  },
  {
    name: "teal",
    gradient: "bg-linear-to-br from-[#059669] via-[#047857] to-[#065f46]",
    border: "border-emerald-300/40 shadow-teal-500/15",
    badgeBg: "bg-white/20 border-white/25 text-white",
    icon: BiologySVG,
  },
  {
    name: "indigo",
    gradient: "bg-linear-to-br from-[#4f46e5] via-[#4338ca] to-[#3730a3]",
    border: "border-indigo-300/40 shadow-indigo-500/15",
    badgeBg: "bg-white/20 border-white/25 text-white",
    icon: ComputerSVG,
  },
];

export function getClassroomPalette(
  subject?: string | null,
  name?: string | null,
  index?: number,
): ClassroomThemePalette {
  const icon = getSubjectIcon(subject || name || "");

  // Prioritize index-based distinct colors (like Top Performers #1 Gold, #2 Blue, #3 Purple, etc.)
  if (typeof index === "number" && index >= 0) {
    const pal = CLASSROOM_PALETTES[index % CLASSROOM_PALETTES.length];
    return { ...pal, icon };
  }

  // Fallback to string hash
  const searchStr = `${subject || ""} ${name || ""}`.toLowerCase();
  const hash = (searchStr || "default")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pal = CLASSROOM_PALETTES[hash % CLASSROOM_PALETTES.length];
  return { ...pal, icon };
}

const SUBJECT_ICON_MAP: Record<string, SubjectIconComponent> = {
  [Subject.MATHEMATICS]: CalculatorSVG,
  "General Mathematics": CalculatorSVG,
  "General Math": CalculatorSVG,
  [Subject.ENGLISH]: BookOpenSVG,
  "English Compulsory": BookOpenSVG,
  "English Literature": BookOpenSVG,
  Ethics: BookOpenSVG,
  "Business Statistics": BookOpenSVG,
  Economics: BookOpenSVG,
  [Subject.CHEMISTRY]: ChemistrySVG,
  [Subject.PHYSICS]: PhysicsSVG,
  [Subject.BIOLOGY]: BiologySVG,
  [Subject.URDU]: BookOpenSVG,
  "Urdu Compulsory": BookOpenSVG,
  "Urdu Literature": BookOpenSVG,
  Sindhi: BookOpenSVG,
  [Subject.PAKISTAN_STUDIES]: BookOpenSVG,
  PSt: BookOpenSVG,
  "P.St": BookOpenSVG,
  PST: BookOpenSVG,
  "Pak Studies": BookOpenSVG,
  "Pak. Studies": BookOpenSVG,
  "Pakistan Studies (English)": BookOpenSVG,
  "Pakistan Studies (Urdu)": BookOpenSVG,
  [Subject.ISLAMIAT]: BookOpenSVG,
  [Subject.COMPUTER_SCIENCE]: ComputerSVG,
  "Principles of Accounting": CalculatorSVG,
  "Business Studies": BuildingSVG,
  Civics: BookOpenSVG,
  "General Science": BiologySVG,
};

export function getSubjectIcon(subject: string): SubjectIconComponent {
  if (!subject) return SubjectsSVG;
  const trimmed = subject.trim();
  if (SUBJECT_ICON_MAP[trimmed]) return SUBJECT_ICON_MAP[trimmed];

  const lower = trimmed.toLowerCase();
  if (lower.includes("pak") || lower.includes("pst")) return BookOpenSVG;
  if (lower.includes("math") || lower.includes("algebra") || lower.includes("calc")) return CalculatorSVG;
  if (lower.includes("physic")) return PhysicsSVG;
  if (lower.includes("chem")) return ChemistrySVG;
  if (lower.includes("bio") || lower.includes("botany") || lower.includes("plant") || lower.includes("zoology")) return BiologySVG;
  if (lower.includes("computer") || /\b(cs|it|ict)\b/.test(lower) || lower.includes("program")) return ComputerSVG;
  if (lower.includes("urdu") || lower.includes("eng") || lower.includes("islam") || lower.includes("quran") || lower.includes("ethic") || lower.includes("stat")) return BookOpenSVG;
  if (lower.includes("account") || lower.includes("commerce") || lower.includes("bank")) return CalculatorSVG;
  if (lower.includes("busin") || lower.includes("econom")) return BookOpenSVG;

  return BookOpenSVG;
}
