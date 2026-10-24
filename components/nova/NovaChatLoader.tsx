import AppLoader from "@/components/AppLoader";
import { cn } from "@/lib/utils";

export default function NovaChatLoader({ className, label = "Nova is thinking" }: { className?: string; label?: string }) {
  return (
    <div
      className={cn("flex items-center gap-2.5 py-0.5", className)}
      role="status"
      aria-label={label}
    >
      <span className="nova-thinking-shimmer text-xs font-semibold text-primary dark:text-emerald-400" aria-hidden="true">{label}</span>
      <AppLoader size={0.2} inline />
    </div>
  );
}
