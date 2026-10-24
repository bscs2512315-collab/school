"use client";

import CheckCircleSVG from "@/public/svgs/CheckCircleSVG";
import { convertMathToHTML, isUrduText } from "@/lib/utils/math-notation";
import { cn } from "@/lib/utils";
import { isShortMcqOption } from "@/lib/exam/mcq-options";

interface McqOption {
  id: string;
  text: string;
}

interface McqOptionButtonProps {
  option: McqOption;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
  isUrdu?: boolean;
}

export default function McqOptionButton({
  option,
  index,
  isSelected,
  onSelect,
  compact = false,
  isUrdu: isUrduProp,
}: McqOptionButtonProps) {
  const isShort = isShortMcqOption(option.text);
  const isUrdu = isUrduProp ?? isUrduText(option.text);

  return (
    <button
      type="button"
      onClick={onSelect}
      dir={isUrdu ? "rtl" : "ltr"}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border-2 p-3 transition-colors sm:gap-3 sm:rounded-2xl sm:p-4 group/opt",
        isUrdu ? "text-right font-urdu justify-start" : "text-left",
        {
          "col-span-1": isShort && compact,
          "col-span-2 sm:col-span-1": !isShort || !compact,
          "border-primary bg-primary/10": isSelected,
          "border-transparent bg-background hover:bg-muted/40 dark:bg-card/40 dark:hover:bg-muted/30": !isSelected,
        },
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg font-sans font-bold text-[11px] leading-none select-none self-center sm:size-8 sm:text-xs transition-colors",
          {
            "bg-primary text-primary-foreground shadow-xs": isSelected,
            "bg-muted/80 text-foreground/85 dark:bg-zinc-800 dark:text-zinc-100 dark:border dark:border-zinc-700/60 group-hover/opt:bg-muted dark:group-hover/opt:bg-zinc-700": !isSelected,
          },
        )}
      >
        <span className="flex items-center justify-center leading-none">
          {String.fromCharCode(65 + index)}
        </span>
      </div>
      <span
        className={cn("min-w-0 flex-1 self-center", {
          "text-primary font-semibold": isSelected,
          "text-foreground": !isSelected,
          "leading-[2.2] text-base sm:text-lg text-right font-urdu": isUrdu,
          "leading-snug text-sm font-medium sm:text-base text-left": !isUrdu,
        })}
        dangerouslySetInnerHTML={{ __html: convertMathToHTML(option.text) }}
      />
      {isSelected ? (
        <CheckCircleSVG className="hidden size-4 shrink-0 text-primary sm:block self-center" />
      ) : null}
    </button>
  );
}
