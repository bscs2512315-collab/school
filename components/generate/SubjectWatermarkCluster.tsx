"use client";

import { cn } from "@/lib/utils";
import { getSubjectWatermarkCluster, type SubjectWatermarkPlacement } from "@/lib/generate/subject-watermark-clusters";

interface SubjectWatermarkClusterProps {
  subject: string;
  className?: string;
  placement?: SubjectWatermarkPlacement;
}

export default function SubjectWatermarkCluster({
  subject,
  className,
  placement = "default",
}: SubjectWatermarkClusterProps) {
  const cluster = getSubjectWatermarkCluster(subject, placement);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 select-none overflow-hidden rounded-[inherit]",
        className,
      )}
    >
      {cluster.map((item, index) =>
        item.type === "icon" ? (
          <item.icon
            key={index}
            className={cn("absolute text-white/12", item.className)}
          />
        ) : (
          <span
            key={index}
            className={cn(
              "absolute font-black leading-none text-white/12",
              item.className,
            )}
          >
            {item.text}
          </span>
        ),
      )}
    </div>
  );
}
