"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
// NOTE: This editor intentionally propagates `onChange` synchronously on every
// edit. An earlier debounced version dropped the last keystroke when the user
// clicked "Save"/"Publish" within the debounce window, silently discarding
// edits (e.g. an MCQ option) while still reporting success.
import {
  ChevronDown,
  FlaskConical,
  Omega,
  Sigma,
  Subscript,
  Superscript,
} from "lucide-react";
import ScientificTextPreview from "@/components/editor/ScientificTextPreview";
import { insertAtSelection, wrapSelection } from "@/lib/scientific-notation/insert";
import {
  CHEMISTRY_SNIPPETS,
  FORMAT_SNIPPETS,
  GREEK_SNIPPETS,
  MATH_SNIPPETS,
} from "@/lib/scientific-notation/snippets";
import type { ScientificSnippet } from "@/lib/scientific-notation/types";
import { cn } from "@/lib/utils";

interface ScientificTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minRows?: number;
  className?: string;
  debounceMs?: number;
  showPreview?: boolean;
  showHint?: boolean;
}

function SnippetMenu({
  label,
  icon: Icon,
  snippets,
  onInsert,
}: {
  label: string;
  icon: typeof Sigma;
  snippets: ScientificSnippet[];
  onInsert: (insert: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon className="size-3.5" />
        {label}
        <ChevronDown className="size-3" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 grid min-w-40 grid-cols-2 gap-1 rounded-xl border border-border bg-card p-2 shadow-lg">
          {snippets.map((snippet) => (
            <button
              key={snippet.id}
              type="button"
              onClick={() => {
                onInsert(snippet.insert);
                setOpen(false);
              }}
              className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-foreground hover:bg-muted"
            >
              {snippet.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ScientificTextEditorComponent({
  value,
  onChange,
  label,
  placeholder = "Enter text with math or chemistry notation...",
  minRows = 5,
  className,
  showPreview = true,
  showHint = true,
}: ScientificTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  // Keep local draft (for cursor/snippet handling) and the parent in sync on
  // every edit — no debounce, so a save immediately after typing never loses
  // the last keystroke.
  const commit = useCallback(
    (nextValue: string) => {
      setDraft(nextValue);
      onChange(nextValue);
    },
    [onChange],
  );

  const applyEdit = useCallback(
    (nextValue: string, cursor: number) => {
      commit(nextValue);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    },
    [commit],
  );

  const insertSnippet = useCallback(
    (insertText: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        commit(`${draft}${insertText}`);
        return;
      }

      const { value: nextValue, cursor } = insertAtSelection(
        draft,
        textarea.selectionStart,
        textarea.selectionEnd,
        insertText,
      );
      applyEdit(nextValue, cursor);
    },
    [applyEdit, commit, draft],
  );

  const wrap = useCallback(
    (mode: "superscript" | "subscript" | "caret" | "underscore") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { value: nextValue, cursor } = wrapSelection(
        draft,
        textarea.selectionStart,
        textarea.selectionEnd,
        mode,
      );
      applyEdit(nextValue, cursor);
    },
    [applyEdit, draft],
  );

  return (
    <div className={cn("space-y-3", className)}>
      {label ? (
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => wrap("superscript")}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          title="Superscript"
        >
          <Superscript className="size-3.5" />
          Sup
        </button>
        <button
          type="button"
          onClick={() => wrap("subscript")}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          title="Subscript"
        >
          <Subscript className="size-3.5" />
          Sub
        </button>
        <SnippetMenu label="Math" icon={Sigma} snippets={MATH_SNIPPETS} onInsert={insertSnippet} />
        <SnippetMenu
          label="Chem"
          icon={FlaskConical}
          snippets={CHEMISTRY_SNIPPETS}
          onInsert={insertSnippet}
        />
        <SnippetMenu
          label="Symbols"
          icon={Omega}
          snippets={GREEK_SNIPPETS}
          onInsert={insertSnippet}
        />
        <SnippetMenu
          label="Format"
          icon={ChevronDown}
          snippets={FORMAT_SNIPPETS}
          onInsert={insertSnippet}
        />
      </div>

      <div
        className={cn("grid gap-3", {
          "lg:grid-cols-2": showPreview,
        })}
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => commit(event.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />

        {showPreview ? (
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Live Preview
            </p>
            <ScientificTextPreview text={draft} />
          </div>
        ) : null}
      </div>

      {showHint ? (
        <p className="text-xs text-muted-foreground">
          Use <code className="rounded bg-primary/10 px-1 py-0.5 text-primary">(superscript=2)</code>,{" "}
          <code className="rounded bg-primary/10 px-1 py-0.5 text-primary">(subscript=2)</code>,{" "}
          <code className="rounded bg-primary/10 px-1 py-0.5 text-primary">^2</code>, or{" "}
          <code className="rounded bg-primary/10 px-1 py-0.5 text-primary">_2</code> notation.
        </p>
      ) : null}
    </div>
  );
}

const ScientificTextEditor = memo(ScientificTextEditorComponent);
export default ScientificTextEditor;
