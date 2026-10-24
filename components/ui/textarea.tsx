import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, autoResize = true, style, onInput, ...props },
    forwardedRef
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const adjustHeight = React.useCallback(() => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    useIsomorphicLayoutEffect(() => {
      adjustHeight();
    }, [props.value, props.defaultValue, adjustHeight]);

    React.useEffect(() => {
      if (!autoResize) return;
      const el = internalRef.current;
      if (!el) return;

      let prevWidth = el.clientWidth;
      const ro = new ResizeObserver(() => {
        if (el.clientWidth !== prevWidth) {
          prevWidth = el.clientWidth;
          adjustHeight();
        }
      });
      ro.observe(el);

      return () => ro.disconnect();
    }, [autoResize, adjustHeight]);

    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full rounded-xl border border-input bg-transparent px-5 py-3 text-base transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          autoResize && "resize-none overflow-hidden [field-sizing:content]",
          className
        )}
        style={{
          ...(autoResize ? { fieldSizing: "content" } : {}),
          ...style,
        }}
        ref={setRef}
        onInput={(e) => {
          if (autoResize) {
            adjustHeight();
          }
          onInput?.(e);
        }}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
