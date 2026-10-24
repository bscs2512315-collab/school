"use client";

import { Typography } from "./ui/Typography";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";

interface MCQOption {
  id: string;
  text: string;
}

interface MCQOptionsDisplayProps {
  options: MCQOption[];
  correctAnswerId: string | null;
  className?: string;
}

export default function MCQOptionsDisplay({
  options,
  correctAnswerId,
  className = "",
}: MCQOptionsDisplayProps) {
  const validOptions = options.filter((opt) => opt.text.trim());

  if (validOptions.length === 0) {
    return null;
  }

  const hasUrdu = validOptions.some((opt) => isUrduText(opt.text));

  return (
    <div className={`space-y-2 ${className}`}>
      <Typography variant="muted" className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
        MCQ Options
      </Typography>
      {validOptions.map((option, idx) => {
        const isUrdu = isUrduText(option.text) || hasUrdu;
        return (
          <div
            key={option.id}
            dir={isUrdu ? "rtl" : "ltr"}
            className={cn(
              "p-3 rounded-lg border",
              correctAnswerId === option.id
                ? "bg-green-500/10 border-green-500/50 dark:bg-green-500/20"
                : "bg-card border-border",
              isUrdu && "font-urdu"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold leading-none select-none text-muted-foreground shrink-0 self-center">
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className={cn("text-foreground flex-1 self-center", isUrdu ? "text-right leading-[2.2]" : "text-left")}>
                <span dangerouslySetInnerHTML={{ __html: convertMathToHTML(option.text) }} />
              </span>
              {correctAnswerId === option.id && (
                <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-bold shrink-0">
                  Correct
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

