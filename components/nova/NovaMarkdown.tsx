"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { convertMathToHTML } from "@/lib/utils/math-notation";
import NovaCodeBlock from "@/components/nova/NovaCodeBlock";

interface NovaMarkdownProps {
  content: string;
  className?: string;
}

function isTableSeparatorRow(line: string): boolean {
  const cells = splitTableRow(line);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))
  );
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.includes("|", 1);
}

function splitTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

function renderInline(text: string): ReactNode[] {
  if (!text) return [];

  // Match links [label](url) and inline code `code`.
  // All other content (including LaTeX math, subscripts, superscripts, Greek letters, formulas, bold, italics)
  // is formatted through convertMathToHTML.
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const renderMathChunk = (chunk: string): ReactNode => {
    if (!chunk) return null;
    const html = convertMathToHTML(chunk);
    return (
      <span
        key={key++}
        className="nova-math-inline"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const chunk = text.slice(lastIndex, match.index);
      const node = renderMathChunk(chunk);
      if (node) nodes.push(node);
    }

    if (match[2] && match[3]) {
      const label = match[2];
      const href = match[3];
      const linkClassName =
        "font-semibold text-primary underline underline-offset-2 hover:text-primary/80 dark:text-white dark:hover:text-white/80";

      nodes.push(
        href.startsWith("/") ? (
          <Link key={key++} href={href} className={linkClassName}>
            {renderInline(label)}
          </Link>
        ) : (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {renderInline(label)}
          </a>
        ),
      );
    } else if (match[4]) {
      nodes.push(
        <code
          key={key++}
          className="rounded-md bg-primary/10 text-primary border border-primary/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-400/25 px-1.5 py-0.5 font-mono text-xs font-semibold"
        >
          {match[4]}
        </code>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    const chunk = text.slice(lastIndex);
    const node = renderMathChunk(chunk);
    if (node) nodes.push(node);
  }

  return nodes.length > 0 ? nodes : [renderMathChunk(text)];
}

function renderHeading(level: 1 | 2 | 3 | 4, text: string, key: number) {
  const className = cn("text-foreground first:mt-0", {
    "mb-2 mt-4 text-base font-bold": level === 1,
    "mb-2 mt-4 text-sm font-bold": level === 2,
    "mb-1.5 mt-3 text-sm font-bold": level === 3,
    "mb-1 mt-2 text-sm font-semibold": level === 4,
  });

  const children = renderInline(text);

  if (level === 1) return <h1 key={key} className={className}>{children}</h1>;
  if (level === 2) return <h2 key={key} className={className}>{children}</h2>;
  if (level === 3) return <h3 key={key} className={className}>{children}</h3>;
  return <h4 key={key} className={className}>{children}</h4>;
}

function renderTable(rows: string[][], key: number) {
  if (rows.length === 0) return null;

  const [header, ...body] = rows;

  return (
    <div
      key={key}
      className="my-3 max-w-full overflow-x-auto rounded-xl border border-border/60 bg-background/50"
    >
      <table className="w-full min-w-[16rem] border-collapse text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            {header.map((cell, cellIndex) => (
              <th
                key={cellIndex}
                className="px-3 py-2 font-bold text-foreground"
              >
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border/50 last:border-b-0"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-3 py-2 align-top text-foreground"
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function expandCollapsedTables(content: string): string {
  // Nova sometimes emits a whole GFM table on one line:
  // | H1 | H2 | | :--- | :--- | | r1 | r2 |
  return content.replace(/\|[^\n]*\|/g, (segment) => {
    if (!segment.includes("| |") && !segment.includes("|  |")) return segment;
    return segment.replace(/\|\s*\|/g, "|\n|");
  });
}

function expandCollapsedChoices(content: string): string {
  return content.split("\n").map((line) => {
    if (!/\bA\)\s+.+\bB\)\s+.+\bC\)\s+.+\bD\)\s+/i.test(line)) return line;
    const answerAt = line.search(/\s+Answer\s*:/i);
    const choices = answerAt >= 0 ? line.slice(0, answerAt) : line;
    const answer = answerAt >= 0 ? line.slice(answerAt).trim() : "";
    return choices.replace(/\s+(?=[B-D]\)\s+)/g, "\n") + (answer ? `\n\n${answer}` : "");
  }).join("\n");
}

function expandCollapsedBullets(content: string): string {
  return content
    // Split sentences that have inline bullets like: "at risk. - Blockchain (Decentralized):" or "blocks. - Each block"
    .replace(/([.:;!?)])\s+[-*•⁃◦–—−]\s+/g, "$1\n- ")
    // Split inline bullet headers when multiple bullets are concatenated with " - "
    .replace(/([^\n])\s+[-*•⁃◦–—−]\s+(?=[A-Z\*\`"'\d])/g, "$1\n- ")
    // Convert unicode bullets or standalone dashes at line start to standard markdown "- "
    .replace(/^[ \t]*[•⁃◦–—−]\s+/gm, "- ");
}

function renderCodeBlock(code: string, language: string | null, key: number) {
  return <NovaCodeBlock key={key} code={code} language={language} />;
}

function renderBlocks(content: string): ReactNode[] {
  const normalized = expandCollapsedBullets(
    expandCollapsedChoices(expandCollapsedTables(content.replace(/\r\n/g, "\n"))),
  );
  const lines = normalized.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let key = 0;
  let lastNumberedHeaderNum = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      const opening = line.trimStart().slice(3).trim();
      const languageMatch = opening.match(/^([a-zA-Z0-9_+#-]+)(?=\s|$)\s*/i);
      const language = languageMatch?.[1] ?? null;
      const firstLine = languageMatch ? opening.slice(languageMatch[0].length) : opening;
      const codeLines: string[] = [];
      let closed = false;
      if (firstLine) {
        const closeAt = firstLine.indexOf("```");
        codeLines.push(closeAt >= 0 ? firstLine.slice(0, closeAt) : firstLine);
        closed = closeAt >= 0;
      }
      index += 1;
      while (!closed && index < lines.length) {
        const nextLine = lines[index];
        const closeAt = nextLine.indexOf("```");
        if (closeAt >= 0) {
          if (nextLine.slice(0, closeAt).trim()) codeLines.push(nextLine.slice(0, closeAt));
          closed = true;
        } else {
          codeLines.push(nextLine);
        }
        index += 1;
      }
      blocks.push(renderCodeBlock(codeLines.join("\n"), language, key++));
      continue;
    }

    // Display Math: $$ ... $$ or \[ ... \]
    if (/^\s*(\$\$|\\\[)/.test(line)) {
      lastNumberedHeaderNum = 0;
      const isBracket = /^\s*\\\[/.test(line);
      const closeDelimiter = isBracket ? "\\]" : "$$";
      const restOfFirstLine = line.replace(/^\s*(\$\$|\\\[)/, "");
      const mathLines: string[] = [];
      let closed = false;

      if (restOfFirstLine.includes(closeDelimiter)) {
        const closeAt = restOfFirstLine.indexOf(closeDelimiter);
        mathLines.push(restOfFirstLine.slice(0, closeAt));
        closed = true;
      } else {
        if (restOfFirstLine.trim()) mathLines.push(restOfFirstLine);
      }

      index += 1;
      while (!closed && index < lines.length) {
        const nextLine = lines[index];
        const closeAt = nextLine.indexOf(closeDelimiter);
        if (closeAt >= 0) {
          if (nextLine.slice(0, closeAt).trim()) mathLines.push(nextLine.slice(0, closeAt));
          closed = true;
        } else {
          mathLines.push(nextLine);
        }
        index += 1;
      }

      const mathContent = mathLines.join("\n").trim();
      if (mathContent) {
        blocks.push(
          <div
            key={key++}
            className="my-3 overflow-x-auto rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-left text-sm sm:text-base leading-relaxed font-serif"
            dangerouslySetInnerHTML={{ __html: convertMathToHTML(`$$${mathContent}$$`) }}
          />,
        );
      }
      continue;
    }

    // Markdown thematic break: ---, ***, ___
    if (/^\s*([-*_])\1{2,}\s*$/.test(line.trim())) {
      lastNumberedHeaderNum = 0;
      blocks.push(
        <hr key={key++} className="my-3 border-0 border-t border-border/70" />,
      );
      index += 1;
      continue;
    }

    // Blockquotes
    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="mb-2 border-l-2 border-primary/40 pl-3 text-muted-foreground"
        >
          {renderInline(quoteLines.join(" "))}
        </blockquote>,
      );
      continue;
    }

    const headingMatch = line.trim().match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      lastNumberedHeaderNum = 0;
      const level = Math.min(headingMatch[1].length, 4) as 1 | 2 | 3 | 4;
      blocks.push(renderHeading(level, headingMatch[2], key++));
      index += 1;
      continue;
    }

    if (isTableRow(line)) {
      const tableLines: string[] = [];
      while (index < lines.length && isTableRow(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }

      const rows = tableLines
        .filter((tableLine) => !isTableSeparatorRow(tableLine))
        .map(splitTableRow)
        .filter((cells) => cells.some((cell) => cell.length > 0));

      const table = renderTable(rows, key++);
      if (table) blocks.push(table);
      continue;
    }

    // Unordered list items: -, *, +, •, ⁃, ◦, –, —, − (supports optional indentation)
    if (/^\s*[-*+•⁃◦–—−]\s+/.test(line)) {
      const items: { text: string; isIndented: boolean }[] = [];
      while (index < lines.length && /^\s*[-*+•⁃◦–—−]\s+/.test(lines[index])) {
        const isIndented = /^(\s{2,}|\t)[-*+•⁃◦–—−]\s+/.test(lines[index]);
        let itemText = lines[index].trim().replace(/^[-*+•⁃◦–—−]\s+/, "");
        index += 1;

        // Absorb multiline continuation text belonging to this bullet
        while (
          index < lines.length &&
          lines[index].trim() &&
          !/^\s*[-*+•⁃◦–—−]\s+/.test(lines[index]) &&
          !/^\s*\d+\.\s+/.test(lines[index]) &&
          !/^\s*#{1,4}\s+/.test(lines[index]) &&
          !/^\s*[A-D]\)\s+/.test(lines[index]) &&
          !/^\s*```/.test(lines[index]) &&
          !/^\s*(\$\$|\\\[)/.test(lines[index]) &&
          !/^\s*>\s?/.test(lines[index]) &&
          !/^\s*([-*_])\1{2,}\s*$/.test(lines[index]) &&
          !isTableRow(lines[index]) &&
          (/^(\s{2,}|\t)/.test(lines[index]) || !/^[A-Z0-9]/.test(lines[index].trim()))
        ) {
          itemText += " " + lines[index].trim();
          index += 1;
        }

        items.push({ text: itemText, isIndented });
      }
      blocks.push(
        <ul key={key++} className="my-2 space-y-1.5 pl-0.5 sm:pl-1">
          {items.map((item, itemIdx) => (
            <li
              key={itemIdx}
              className={cn(
                "flex items-start gap-2.5 text-foreground/90 leading-relaxed",
                item.isIndented && "ml-4 text-foreground/80 sm:ml-5",
              )}
            >
              {item.isIndented ? (
                <span className="mt-2 size-1.5 shrink-0 rounded-full border border-primary dark:border-emerald-400 bg-transparent" />
              ) : (
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary dark:bg-emerald-400" />
              )}
              <div className="min-w-0 flex-1">{renderInline(item.text)}</div>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Numbered list items: 1., 2., 3.
    const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const itemNum = parseInt(numberedMatch[1], 10);
      const itemText = numberedMatch[2];

      // Peek ahead to find next non-empty line
      let nextNonEmptyLine = "";
      for (let peek = index + 1; peek < lines.length; peek++) {
        const trimmed = lines[peek].trim();
        if (trimmed) {
          nextNonEmptyLine = trimmed;
          break;
        }
      }

      const isHeaderStyle =
        /^\s*[-*+•⁃◦–—−]\s+/.test(nextNonEmptyLine) ||
        (nextNonEmptyLine !== "" && !/^\s*\d+\.\s+/.test(nextNonEmptyLine));

      if (isHeaderStyle) {
        let displayNum = itemNum;
        if (itemNum === 1 && lastNumberedHeaderNum >= 1) {
          displayNum = lastNumberedHeaderNum + 1;
        }
        lastNumberedHeaderNum = displayNum;

        blocks.push(
          <div key={key++} className="mb-1.5 mt-3.5 flex items-baseline gap-2 font-bold text-foreground">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary dark:bg-primary/20 dark:text-primary-foreground">
              {displayNum}
            </span>
            <span className="text-sm font-bold text-foreground">{renderInline(itemText)}</span>
          </div>,
        );
        index += 1;
        continue;
      }

      // Compact sequential numbered list (1., 2., 3...)
      const items: ReactNode[] = [renderInline(itemText)];
      const startNum = itemNum;
      index += 1;
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        const text = lines[index].trim().replace(/^\d+\.\s+/, "");
        items.push(renderInline(text));
        index += 1;
      }

      blocks.push(
        <ol key={key++} start={startNum} className="my-2 space-y-1.5 pl-0.5 sm:pl-1">
          {items.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2.5 text-foreground/90 leading-relaxed">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-foreground/80">
                {startNum + itemIdx}
              </span>
              <div className="min-w-0 flex-1">{item}</div>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^\s*[A-D]\)\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*[A-D]\)\s+/.test(lines[index])) {
        const option = lines[index].trim();
        items.push(<li key={items.length} className="pl-1">{renderInline(option.slice(3))}</li>);
        index += 1;
      }
      blocks.push(<ol key={key++} type="A" className="mb-3 ml-5 list-[upper-alpha] space-y-1">{items}</ol>);
      continue;
    }

    const paragraphLines: string[] = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^\s*#{1,4}\s+/.test(lines[index]) &&
      !/^\s*[-*+•⁃◦–—−]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !/^\s*[A-D]\)\s+/.test(lines[index]) &&
      !/^\s*```/.test(lines[index]) &&
      !/^\s*(\$\$|\\\[)/.test(lines[index]) &&
      !/^\s*>\s?/.test(lines[index]) &&
      !/^\s*([-*_])\1{2,}\s*$/.test(lines[index]) &&
      !isTableRow(lines[index])
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={key++} className="mb-2 last:mb-0">
        {renderInline(paragraphLines.join(" "))}
      </p>,
    );
  }

  return blocks;
}

export default function NovaMarkdown({ content, className }: NovaMarkdownProps) {
  const blocks = renderBlocks(content);

  return (
    <div className={cn("nova-markdown space-y-1 text-sm leading-relaxed [&>*:last-child]:mb-0", className)}>
      {blocks.map((block, index) => (
        <Fragment key={index}>{block}</Fragment>
      ))}
    </div>
  );
}
