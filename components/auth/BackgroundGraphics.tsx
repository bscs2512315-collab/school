"use client";

import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import BuildingSVG from "@/public/svgs/BuildingSVG";
import LabGameSVG from "@/public/svgs/LabGameSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";
import TrophySVG from "@/public/svgs/TrophySVG";

type WatermarkIcon = ComponentType<SVGProps<SVGSVGElement>>;

const LEFT_WATERMARKS: { icon: WatermarkIcon; className: string }[] = [
  { icon: SyllabusSVG, className: "top-[22%] left-[6%] size-24 -rotate-12" },
  { icon: TrophySVG, className: "top-[20%] right-[8%] size-28 rotate-8" },
  { icon: BuildingSVG, className: "bottom-[30%] left-[7%] size-24 rotate-6" },
  { icon: LabGameSVG, className: "bottom-[14%] right-[7%] size-24 -rotate-8" },
];

export const BackgroundGraphics = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {LEFT_WATERMARKS.map(({ icon: Icon, className }, index) => (
        <Icon
          key={index}
          className={cn("absolute text-primary-foreground/10", className)}
        />
      ))}
    </div>
  );
};
