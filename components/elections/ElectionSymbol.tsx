import { emojiFromSymbol, isEmojiSymbol } from "@/lib/elections/symbols";
import { cn } from "@/lib/utils";

export default function ElectionSymbol({
  symbolUrl,
  name = "",
  className,
  imgClassName,
}: {
  symbolUrl: string | null | undefined;
  name?: string;
  className?: string;
  imgClassName?: string;
}) {
  if (!symbolUrl) return null;

  if (isEmojiSymbol(symbolUrl)) {
    return (
      <span
        role="img"
        aria-label={name || "symbol"}
        className={cn(
          "flex items-center justify-center text-4xl leading-none",
          className,
        )}
      >
        {emojiFromSymbol(symbolUrl)}
      </span>
    );
  }

  return (
    <img
      src={symbolUrl}
      alt={name || "symbol"}
      className={cn("object-contain", imgClassName)}
    />
  );
}
