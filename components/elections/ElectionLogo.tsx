import { cn } from "@/lib/utils";

export default function ElectionLogo({
  src,
  alt = "",
  size = "md",
  className,
}: {
  src: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-2xl bg-card",
        {
          "h-14 w-24 p-1.5": size === "sm",
          "h-16 w-28 p-2": size === "md",
          "mx-auto h-24 w-56 p-3 shadow-md": size === "lg",
        },
        className,
      )}
    >
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
    </div>
  );
}
