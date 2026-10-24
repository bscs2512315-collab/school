import type { ComponentType, SVGProps } from "react";
import BiologySVG from "@/public/svgs/BiologySVG";
import ChemistrySVG from "@/public/svgs/ChemistrySVG";
import PhysicsSVG from "@/public/svgs/PhysicsSVG";
import ComputerSVG from "@/public/svgs/ComputerSVG";
import BookOpenSVG from "@/public/svgs/BookOpenSVG";
import ScrollSVG from "@/public/svgs/ScrollSVG";
import SubjectsSVG from "@/public/svgs/SubjectsSVG";
import { Subject } from "@/types/enums";
import type { LucideIcon } from "lucide-react";

export type SubjectWatermarkItem =
  | { type: "icon"; icon: ComponentType<SVGProps<SVGSVGElement>> | LucideIcon; className: string }
  | { type: "text"; text: string; className: string };

export type SubjectWatermarkPlacement = "default" | "card";

const ICON_SM = "size-6 rotate-12 sm:size-7";
const ICON_SM_ALT = "size-6 -rotate-6 sm:size-7";
const TEXT_SM = "text-xl rotate-12 sm:text-2xl";
const TEXT_MD = "text-2xl -rotate-6 sm:text-3xl";

type CornerFn = (className: string) => string;

type CornerPlacement = {
  topLeft: CornerFn;
  topRight: CornerFn;
  bottomLeft: CornerFn;
  bottomRight: CornerFn;
};

const CORNERS: CornerPlacement = {
  topLeft: (className: string) => `top-2 left-2 sm:top-3 sm:left-3 ${className}`,
  topRight: (className: string) => `top-2 right-10 sm:top-3 sm:right-11 ${className}`,
  bottomLeft: (className: string) => `bottom-2 left-2 sm:bottom-3 sm:left-3 ${className}`,
  bottomRight: (className: string) => `bottom-2 right-2 sm:bottom-3 sm:right-3 ${className}`,
};

const CARD_CORNERS: CornerPlacement = {
  topLeft: (className: string) =>
    `top-[38%] left-0.5 -translate-y-1/2 sm:left-1 ${className}`,
  topRight: (className: string) =>
    `top-[36%] right-0.5 -translate-y-1/2 sm:right-1 ${className}`,
  bottomLeft: (className: string) =>
    `top-[58%] left-1 -translate-y-1/2 sm:left-2 ${className}`,
  bottomRight: (className: string) =>
    `top-[56%] right-1 -translate-y-1/2 sm:right-2 ${className}`,
};

function buildSubjectClusters(corners: CornerPlacement): Record<string, SubjectWatermarkItem[]> {
  return {
    [Subject.MATHEMATICS]: [
      { type: "text", text: "+", className: corners.topLeft(TEXT_SM) },
      { type: "text", text: "−", className: corners.topRight(TEXT_MD) },
      { type: "text", text: "×", className: corners.bottomLeft(TEXT_SM) },
      { type: "text", text: "÷", className: corners.bottomRight(TEXT_MD) },
    ],
    [Subject.CHEMISTRY]: [
      { type: "icon", icon: ChemistrySVG, className: corners.topLeft(ICON_SM) },
      { type: "icon", icon: ChemistrySVG, className: corners.topRight(ICON_SM_ALT) },
      { type: "icon", icon: PhysicsSVG, className: corners.bottomLeft(ICON_SM) },
      { type: "icon", icon: ChemistrySVG, className: corners.bottomRight(ICON_SM_ALT) },
    ],
    [Subject.BIOLOGY]: [
      { type: "icon", icon: BiologySVG, className: corners.topLeft(ICON_SM) },
      { type: "icon", icon: BiologySVG, className: corners.topRight(ICON_SM_ALT) },
      { type: "icon", icon: BiologySVG, className: corners.bottomLeft(ICON_SM) },
      { type: "icon", icon: BiologySVG, className: corners.bottomRight(ICON_SM_ALT) },
    ],
    [Subject.PHYSICS]: [
      { type: "icon", icon: PhysicsSVG, className: corners.topLeft(ICON_SM) },
      { type: "icon", icon: PhysicsSVG, className: corners.topRight(ICON_SM_ALT) },
      { type: "icon", icon: PhysicsSVG, className: corners.bottomLeft(ICON_SM) },
      { type: "icon", icon: PhysicsSVG, className: corners.bottomRight(ICON_SM_ALT) },
    ],
    [Subject.ENGLISH]: [
      { type: "icon", icon: BookOpenSVG, className: corners.topLeft(ICON_SM) },
      { type: "icon", icon: ScrollSVG, className: corners.topRight(ICON_SM_ALT) },
      { type: "icon", icon: BookOpenSVG, className: corners.bottomLeft(ICON_SM) },
      { type: "icon", icon: ScrollSVG, className: corners.bottomRight(ICON_SM_ALT) },
    ],
    [Subject.URDU]: [
      { type: "icon", icon: BookOpenSVG, className: corners.topLeft(ICON_SM) },
      { type: "icon", icon: ScrollSVG, className: corners.topRight(ICON_SM_ALT) },
      { type: "icon", icon: BookOpenSVG, className: corners.bottomLeft(ICON_SM) },
      { type: "icon", icon: ScrollSVG, className: corners.bottomRight(ICON_SM_ALT) },
    ],
    [Subject.PAKISTAN_STUDIES]: [
      { type: "icon", icon: BookOpenSVG, className: corners.topLeft(ICON_SM) },
      { type: "icon", icon: BookOpenSVG, className: corners.topRight(ICON_SM_ALT) },
      { type: "icon", icon: BookOpenSVG, className: corners.bottomLeft(ICON_SM) },
      { type: "icon", icon: BookOpenSVG, className: corners.bottomRight(ICON_SM_ALT) },
    ],
    [Subject.ISLAMIAT]: [
      { type: "icon", icon: BookOpenSVG, className: corners.topLeft(ICON_SM) },
      { type: "icon", icon: ScrollSVG, className: corners.topRight(ICON_SM_ALT) },
      { type: "icon", icon: BookOpenSVG, className: corners.bottomLeft(ICON_SM) },
      { type: "icon", icon: ScrollSVG, className: corners.bottomRight(ICON_SM_ALT) },
    ],
    [Subject.COMPUTER_SCIENCE]: [
      { type: "icon", icon: ComputerSVG, className: corners.topLeft(ICON_SM) },
      { type: "icon", icon: ComputerSVG, className: corners.topRight(ICON_SM_ALT) },
      { type: "icon", icon: ComputerSVG, className: corners.bottomLeft(ICON_SM) },
      { type: "icon", icon: ComputerSVG, className: corners.bottomRight(ICON_SM_ALT) },
    ],
  };
}

function getDefaultCluster(corners: CornerPlacement): SubjectWatermarkItem[] {
  return [
    { type: "icon", icon: SubjectsSVG, className: corners.topLeft(ICON_SM) },
    { type: "icon", icon: SubjectsSVG, className: corners.topRight(ICON_SM_ALT) },
    { type: "icon", icon: SubjectsSVG, className: corners.bottomLeft(ICON_SM) },
    { type: "icon", icon: SubjectsSVG, className: corners.bottomRight(ICON_SM_ALT) },
  ];
}

const SUBJECT_WATERMARK_CLUSTERS = buildSubjectClusters(CORNERS);
const CARD_SUBJECT_WATERMARK_CLUSTERS = buildSubjectClusters(CARD_CORNERS);

export function getSubjectWatermarkCluster(
  subject: string,
  placement: SubjectWatermarkPlacement = "default",
): SubjectWatermarkItem[] {
  const clusters =
    placement === "card" ? CARD_SUBJECT_WATERMARK_CLUSTERS : SUBJECT_WATERMARK_CLUSTERS;
  const corners = placement === "card" ? CARD_CORNERS : CORNERS;

  return clusters[subject] ?? getDefaultCluster(corners);
}
