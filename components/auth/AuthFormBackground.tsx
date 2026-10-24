"use client";

import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import ClassroomSVG from "@/public/svgs/ClassroomSVG";
import PhysicsSVG from "@/public/svgs/PhysicsSVG";
import SecureExamSVG from "@/public/svgs/SecureExamSVG";
import SyllabusSVG from "@/public/svgs/SyllabusSVG";

type WatermarkIcon = ComponentType<SVGProps<SVGSVGElement>>;

const FORM_WATERMARKS: { icon: WatermarkIcon; className: string }[] = [
  { icon: SecureExamSVG, className: "top-[6%] left-[5%] size-32 rotate-12" },
  { icon: SyllabusSVG, className: "top-[6%] right-[5%] size-32 -rotate-12" },
  { icon: ClassroomSVG, className: "bottom-[6%] left-[5%] size-32 -rotate-6" },
  { icon: PhysicsSVG, className: "bottom-[6%] right-[5%] size-32 rotate-12" },
];

export function AuthFormBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      {FORM_WATERMARKS.map(({ icon: Icon, className }, index) => (
        <Icon
          key={index}
          className={cn(
            "absolute text-foreground/10 dark:text-foreground/5",
            className,
          )}
        />
      ))}
    </div>
  );
}
