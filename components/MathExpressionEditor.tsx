"use client";

import { useState, useRef, useEffect } from "react";
import { convertMathToHTML } from "@/lib/utils/math-notation";

interface MathExpressionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MathExpressionEditor({
  value,
  onChange,
  placeholder = "Enter question text...",
  className = "",
}: MathExpressionEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const insertSuperscript = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    // Insert ^ for superscript
    const newText = before + (selected ? "^" + selected : "^") + after;
    onChange(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newPos = start + (selected ? selected.length + 1 : 1);
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertSubscript = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    // Insert _ for subscript
    const newText = before + (selected ? "_" + selected : "_") + after;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + (selected ? selected.length + 1 : 1);
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertFraction = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = value;
    const before = text.substring(0, start);
    const after = text.substring(start);

    const newText = before + " / " + after;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + 3;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const previewText = convertMathToHTML(value || "");

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300">
          Question Text
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={insertSuperscript}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title="Insert superscript (^)"
          >
            x²
          </button>
          <button
            type="button"
            onClick={insertSubscript}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title="Insert subscript (_)"
          >
            x₂
          </button>
          <button
            type="button"
            onClick={insertFraction}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title="Insert fraction (/)"
          >
            a/b
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="min-h-[120px] p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 backgroundspace-pre-wrap">
          {previewText || <span className="text-slate-500">{placeholder}</span>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          placeholder={placeholder}
          className="w-full min-h-[120px] p-4 bg-slate-800 border border-slate-700 rounded-lg text-background placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
        />
      )}

      <p className="text-xs text-slate-500">
        Tip: Use ^ for superscripts (e.g., 2^4 becomes 2⁴) and _ for subscripts (e.g., H_2O becomes H₂O). Use / for fractions.
      </p>
    </div>
  );
}

