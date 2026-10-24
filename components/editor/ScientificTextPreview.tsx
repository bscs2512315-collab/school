"use client";

import { memo, useMemo } from "react";
import { formatScientificTextForDisplay, parseScientificText } from "@/lib/scientific-notation/parse";
import { cn } from "@/lib/utils";

interface ScientificTextPreviewProps {
  text: string;
  className?: string;
  emptyLabel?: string;
}

function formatListMarkers(part: string): string {
  return part.replace(
    /(^|[\n.?!])\s*(?!(?:part|step|element|version|table|figure)\s+)(([ivx]+|[a-e])[.)]\s*)/gi,
    "$1\n\n$2",
  );
}

function ScientificTextPreviewComponent({
  text,
  className,
  emptyLabel = "Preview will appear here",
}: ScientificTextPreviewProps) {
  const tokens = useMemo(() => parseScientificText(formatScientificTextForDisplay(text)), [text]);

  if (!text.trim()) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>{emptyLabel}</p>
    );
  }

  return (
    <span className={cn("text-sm leading-relaxed text-foreground", className)}>
      {tokens.map((token, index) => {
        if (token.type === "sup") {
          return (
            <sup key={index} className="relative ml-0.5 align-baseline text-[0.7em]">
              {token.value}
            </sup>
          );
        }

        if (token.type === "sub") {
          return (
            <sub key={index} className="relative top-[0.1em] ml-0.5 align-baseline text-[0.7em]">
              {token.value}
            </sub>
          );
        }

        if (token.type === "stacked") {
          return (
            <span
              key={index}
              className="mr-0.5 inline-flex flex-col align-middle leading-none"
              style={{ fontSize: "0.55em" }}
            >
              <span className="mb-[-0.1em]">{token.sup}</span>
              <span className="mt-[-0.1em]">{token.sub}</span>
            </span>
          );
        }

        return (
          <span key={index} style={{ whiteSpace: "pre-wrap" }}>
            {formatListMarkers(token.value)}
          </span>
        );
      })}
    </span>
  );
}

const ScientificTextPreview = memo(ScientificTextPreviewComponent);
export default ScientificTextPreview;
