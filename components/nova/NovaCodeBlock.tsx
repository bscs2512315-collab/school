"use client";

import { useState, useMemo } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import Prism from "prismjs";

// Ensure Prism is globally available for language components
if (typeof window !== "undefined") {
  (window as unknown as { Prism: typeof Prism }).Prism = Prism;
} else if (typeof globalThis !== "undefined") {
  (globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;
}

// Load popular programming languages used in curriculum and exams
if (typeof require !== "undefined") {
  try {
    require("prismjs/components/prism-c");
    require("prismjs/components/prism-cpp");
    require("prismjs/components/prism-python");
    require("prismjs/components/prism-java");
    require("prismjs/components/prism-sql");
    require("prismjs/components/prism-bash");
    require("prismjs/components/prism-json");
    require("prismjs/components/prism-typescript");
    require("prismjs/components/prism-csharp");
    require("prismjs/components/prism-visual-basic");
  } catch {
    // Handled gracefully if environment lacks dynamic requires
  }
}

interface NovaCodeBlockProps {
  code: string;
  language?: string | null;
  className?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeLanguage(lang?: string | null, rawCode?: string): string {
  const clean = (lang || "").toLowerCase().trim();
  if (clean === "cpp" || clean === "c++") return "cpp";
  if (clean === "c") return "c";
  if (clean === "py" || clean === "python") return "python";
  if (clean === "js" || clean === "javascript") return "javascript";
  if (clean === "ts" || clean === "typescript") return "typescript";
  if (clean === "java") return "java";
  if (clean === "sql") return "sql";
  if (clean === "bash" || clean === "sh" || clean === "shell" || clean === "zsh") return "bash";
  if (clean === "json") return "json";
  if (clean === "html" || clean === "xml" || clean === "svg") return "markup";
  if (clean === "css") return "css";
  if (clean === "cs" || clean === "csharp" || clean === "c#") return "csharp";
  if (clean === "vb" || clean === "vbnet" || clean === "visual-basic") return "visual-basic";

  // Auto-detect from code patterns if language tag was omitted
  if (rawCode) {
    if (/#include\s*<iostream>|cout\s*<<|cin\s*>>/i.test(rawCode)) return "cpp";
    if (/#include\s*<stdio\.h>|printf\s*\(|scanf\s*\(/i.test(rawCode)) return "c";
    if (/\bdef\s+[a-zA-Z_]\w*\s*\(|\bprint\s*\(|\belif\b|\bimport\s+numpy\b/i.test(rawCode)) return "python";
    if (/\bconsole\.log\(|\bconst\s+\w+\s*=|\blet\s+\w+\s*=/i.test(rawCode)) return "javascript";
    if (/\bSELECT\b[\s\S]+\bFROM\b/i.test(rawCode)) return "sql";
    if (/<\/?[a-z][\s\S]*>/i.test(rawCode)) return "markup";
  }

  return clean || "plaintext";
}

function getDisplayLanguage(lang: string): string {
  switch (lang) {
    case "cpp": return "C++";
    case "c": return "C";
    case "python": return "Python";
    case "javascript": return "JavaScript";
    case "typescript": return "TypeScript";
    case "java": return "Java";
    case "sql": return "SQL";
    case "bash": return "Terminal";
    case "json": return "JSON";
    case "markup": return "HTML";
    case "css": return "CSS";
    case "csharp": return "C#";
    case "visual-basic": return "Visual Basic";
    default: return lang.toUpperCase() || "CODE";
  }
}

export default function NovaCodeBlock({ code, language, className }: NovaCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const cleanCode = useMemo(() => code.trimEnd(), [code]);
  const normLang = useMemo(() => normalizeLanguage(language, cleanCode), [language, cleanCode]);
  const displayLang = useMemo(() => getDisplayLanguage(normLang), [normLang]);

  const highlightedHtml = useMemo(() => {
    const grammar = Prism.languages[normLang] || Prism.languages.plaintext;
    try {
      if (grammar) {
        return Prism.highlight(cleanCode, grammar, normLang);
      }
    } catch {
      // Fallback
    }
    return escapeHtml(cleanCode);
  }, [cleanCode, normLang]);

  const lines = useMemo(() => cleanCode.split("\n"), [cleanCode]);
  const showLineNumbers = lines.length > 2;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = cleanCode;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Ignored
      }
    }
  };

  return (
    <div
      className={cn(
        "nova-code-block group my-3.5 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117] text-slate-100 shadow-md shadow-black/25 transition-all",
        className,
      )}
    >
      {/* IDE Header Bar */}
      <div className="flex select-none items-center justify-between border-b border-slate-800/80 bg-[#161b22] px-3.5 py-2">
        <div className="flex items-center gap-2.5">
          {/* Language badge */}
          <span className="rounded-md bg-slate-800/70 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-slate-300">
            {displayLang}
          </span>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Code copied to clipboard" : "Copy code"}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all active:scale-95 cursor-pointer",
            copied
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent hover:border-slate-700/60",
          )}
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Editor Body */}
      <div className="relative flex overflow-x-auto text-[13px] font-mono leading-relaxed">
        {/* Optional Line Numbers Column */}
        {showLineNumbers && (
          <div
            className="flex select-none flex-col border-r border-slate-800/60 bg-[#0d1117]/60 py-3.5 pl-3 pr-2.5 text-right font-mono text-[11px] text-slate-600"
            aria-hidden="true"
          >
            {lines.map((_, i) => (
              <span key={i} className="leading-relaxed">
                {i + 1}
              </span>
            ))}
          </div>
        )}

        {/* Code Content */}
        <pre className="min-w-full flex-1 overflow-x-auto p-3.5 selection:bg-sky-500/30">
          <code
            className="font-mono text-slate-200"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
}
