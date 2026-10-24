import sanitizeHtml from "sanitize-html";

// Matches matrix literals like [[1, 2, 3], [4, 5, 6]] or [[1, 2], [3, 4]]
const matrixPattern = /\[\s*\[[^[\]]+\](?:\s*,\s*\[[^[\]]+\])*\s*\]/g;

// Matches determinant literals like |[a, b, c], [b, a, b], [c, c, a]|, |[[a, b], [c, d]]|, or | [1, 2], [3, 4] |
const determinantPattern = /\|\s*\[?\s*(\[[^[\]]+\](?:\s*,\s*\[[^[\]]+\])*)\s*\]?\s*\|/g;

// Matches parenthesized matrix literals like ([a, b, c], [b, a, b]), ([[1, 2], [3, 4]]), or ( [[1, 2], [3, 4]] )
const pmatrixPattern = /\(\s*\[?\s*(\[[^[\]]+\](?:\s*,\s*\[[^[\]]+\])*)\s*\]?\s*\)/g;

const ALLOWED_MATH_TAGS = new Set([
  "span",
  "sup",
  "sub",
  "br",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "b",
  "i",
  "u",
  "strong",
  "em",
  "p",
  "pre",
  "code",
  "svg",
  "path",
  "g",
  "polyline",
  "polygon",
  "circle",
  "ellipse",
  "rect",
  "line",
  "text",
  "tspan",
  "defs",
  "clippath",
  "mask",
  "pattern",
  "use",
]);

const BLACKBOARD_BOLD_MAP: Record<string, string> = {
  N: "ℕ",
  Z: "ℤ",
  Q: "ℚ",
  R: "ℝ",
  C: "ℂ",
  W: "𝕎",
  P: "ℙ",
  E: "𝔼",
  O: "𝕆",
  H: "ℍ",
  D: "𝔻",
  A: "𝔸",
  B: "𝔹",
  F: "𝔽",
  G: "𝔾",
  I: "𝕀",
  J: "𝕁",
  K: "𝕂",
  L: "𝕃",
  M: "𝕄",
  S: "𝕊",
  T: "𝕋",
  U: "𝕌",
  V: "𝕍",
  X: "𝕏",
  Y: "𝕐",
};

const UNICODE_SUB_TO_ASCII: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  "₊": "+", "₋": "-", "₌": "=", "₍": "(", "₎": ")",
  "ₐ": "a", "ₑ": "e", "ₕ": "h", "ᵢ": "i", "ⱼ": "j",
  "ₖ": "k", "ₗ": "l", "ₘ": "m", "ₙ": "n", "ₒ": "o",
  "ₚ": "p", "ᵣ": "r", "ₛ": "s", "ₜ": "t", "ᵤ": "u",
  "ᵥ": "v", "ₓ": "x"
};

const UNICODE_SUP_TO_ASCII: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "⁺": "+", "⁻": "-", "⁼": "=", "⁽": "(", "⁾": ")",
  "ⁿ": "n", "ᵃ": "a", "ᵇ": "b", "ᶜ": "c", "ᵈ": "d",
  "ᵉ": "e", "ᶠ": "f", "ᵍ": "g", "ʰ": "h", "ⁱ": "i",
  "ʲ": "j", "ᵏ": "k", "ˡ": "l", "ᵐ": "m", "ᵒ": "o",
  "ᵖ": "p", "ʳ": "r", "ˢ": "s", "ᵗ": "t", "ᵘ": "u",
  "ᵛ": "v", "ʷ": "w", "ˣ": "x", "ʸ": "y", "ᶻ": "z"
};

function sanitizeAttributes(tagName: string, attrString: string): string {
  if (!attrString.trim()) return "";

  const allowedAttrs: string[] = [];
  // Match key="val", key='val', key=val, or standalone key
  const attrRegex = /([a-zA-Z0-9_\-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrString)) !== null) {
    const attrName = match[1].toLowerCase();
    const attrValue = match[2] ?? match[3] ?? match[4] ?? "";

    // Reject all event handlers immediately (on*, onerror, onclick, etc.)
    if (attrName.startsWith("on") || attrName.includes("on")) continue;

    if (attrName === "class") {
      // Allow safe class names (letters, digits, dashes, underscores, spaces, brackets, dots, colons, percent)
      if (/^[a-zA-Z0-9_\-\s\[\]\.\:\/\%]+$/.test(attrValue)) {
        allowedAttrs.push(`class="${attrValue.replace(/"/g, "&quot;")}"`);
      }
    } else if (attrName === "dir") {
      if (/^(ltr|rtl|auto)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`dir="${attrValue.trim().toLowerCase()}"`);
      }
    } else if (attrName === "aria-hidden") {
      if (/^(true|false)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`aria-hidden="${attrValue.trim().toLowerCase()}"`);
      }
    } else if (attrName === "id") {
      if (/^[a-zA-Z0-9_\-]+$/.test(attrValue.trim())) {
        allowedAttrs.push(`id="${attrValue.trim()}"`);
      }
    } else if (attrName === "viewbox") {
      if (/^[0-9\s\.\,\-]+$/.test(attrValue.trim())) {
        allowedAttrs.push(`viewBox="${attrValue.trim()}"`);
      }
    } else if (attrName === "preserveaspectratio") {
      if (/^[a-zA-Z\s]+$/i.test(attrValue.trim())) {
        allowedAttrs.push(`preserveAspectRatio="${attrValue.trim()}"`);
      }
    } else if (attrName === "d") {
      if (/^[a-zA-Z0-9\s\.\,\-]+$/.test(attrValue.trim())) {
        allowedAttrs.push(`d="${attrValue.trim()}"`);
      }
    } else if (attrName === "points") {
      if (/^[0-9\s\.\,\-]+$/.test(attrValue.trim())) {
        allowedAttrs.push(`points="${attrValue.trim()}"`);
      }
    } else if (
      attrName === "x" ||
      attrName === "y" ||
      attrName === "x1" ||
      attrName === "y1" ||
      attrName === "x2" ||
      attrName === "y2" ||
      attrName === "cx" ||
      attrName === "cy" ||
      attrName === "r" ||
      attrName === "rx" ||
      attrName === "ry" ||
      attrName === "width" ||
      attrName === "height" ||
      attrName === "dx" ||
      attrName === "dy"
    ) {
      if (/^[0-9\.\-]+(?:px|em|rem|%)?$/.test(attrValue.trim())) {
        allowedAttrs.push(`${attrName}="${attrValue.trim()}"`);
      }
    } else if (attrName === "fill" || attrName === "stroke") {
      if (/^(none|currentColor|#[0-9a-fA-F]{3,8}|[a-zA-Z]+|url\(#[a-zA-Z0-9_\-]+\)|var\([a-zA-Z0-9_\-,\s#]+\))$/i.test(attrValue.trim())) {
        allowedAttrs.push(`${attrName}="${attrValue.trim()}"`);
      }
    } else if (attrName === "paint-order") {
      if (/^[a-zA-Z\s,]+$/i.test(attrValue.trim())) {
        allowedAttrs.push(`paint-order="${attrValue.trim().toLowerCase()}"`);
      }
    } else if (attrName === "stroke-width") {
      if (/^[0-9\.]+(?:px|em|rem|%)?$/.test(attrValue.trim())) {
        allowedAttrs.push(`stroke-width="${attrValue.trim()}"`);
      }
    } else if (attrName === "stroke-linecap") {
      if (/^(round|butt|square)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`stroke-linecap="${attrValue.trim()}"`);
      }
    } else if (attrName === "stroke-linejoin") {
      if (/^(miter|round|bevel)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`stroke-linejoin="${attrValue.trim()}"`);
      }
    } else if (attrName === "stroke-dasharray") {
      if (/^[0-9\s\,\.\-]+$/.test(attrValue.trim())) {
        allowedAttrs.push(`stroke-dasharray="${attrValue.trim()}"`);
      }
    } else if (attrName === "vector-effect") {
      if (/^(non-scaling-stroke|none)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`vector-effect="${attrValue.trim()}"`);
      }
    } else if (attrName === "opacity" || attrName === "fill-opacity" || attrName === "stroke-opacity") {
      if (/^[0-9\.]+$/.test(attrValue.trim())) {
        allowedAttrs.push(`${attrName}="${attrValue.trim()}"`);
      }
    } else if (attrName === "font-size") {
      if (/^[0-9\.]+(?:px|em|rem|%)?$/.test(attrValue.trim())) {
        allowedAttrs.push(`font-size="${attrValue.trim()}"`);
      }
    } else if (attrName === "font-family") {
      if (/^[a-zA-Z0-9_\-\s,']+$/.test(attrValue.trim())) {
        allowedAttrs.push(`font-family="${attrValue.trim()}"`);
      }
    } else if (attrName === "font-weight") {
      if (/^(normal|bold|bolder|lighter|[1-9]00)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`font-weight="${attrValue.trim()}"`);
      }
    } else if (attrName === "font-style") {
      if (/^(normal|italic|oblique)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`font-style="${attrValue.trim()}"`);
      }
    } else if (attrName === "text-anchor") {
      if (/^(start|middle|end)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`text-anchor="${attrValue.trim()}"`);
      }
    } else if (attrName === "dominant-baseline") {
      if (/^(auto|middle|central|hanging|mathematical|text-top|text-bottom|alphabetic|ideographic)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`dominant-baseline="${attrValue.trim()}"`);
      }
    } else if (attrName === "fill-rule") {
      if (/^(nonzero|evenodd|inherit)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`fill-rule="${attrValue.trim()}"`);
      }
    } else if (attrName === "patternunits") {
      if (/^(userSpaceOnUse|objectBoundingBox)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`patternUnits="${attrValue.trim()}"`);
      }
    } else if (attrName === "patterntransform") {
      if (/^[a-zA-Z0-9\s\.\,\-\(\)]+$/.test(attrValue.trim())) {
        allowedAttrs.push(`patternTransform="${attrValue.trim()}"`);
      }
    } else if (attrName === "transform") {
      if (/^[a-zA-Z0-9\s\.\,\-\(\)]+$/.test(attrValue.trim())) {
        allowedAttrs.push(`transform="${attrValue.trim()}"`);
      }
    } else if (attrName === "clip-path" || attrName === "clippath") {
      if (/^(url\(#[a-zA-Z0-9_\-]+\)|none)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`clip-path="${attrValue.trim()}"`);
      }
    } else if (attrName === "mask") {
      if (/^(url\(#[a-zA-Z0-9_\-]+\)|none)$/i.test(attrValue.trim())) {
        allowedAttrs.push(`mask="${attrValue.trim()}"`);
      }
    } else if (attrName === "data-venn-diagram" || attrName === "data-venn-card") {
      allowedAttrs.push(`${attrName}="true"`);
    } else if (attrName === "style") {
      // Disallow dangerous CSS functions / protocols
      if (!/url\s*\(|expression\s*\(|javascript\s*:|@import|-moz-binding|behavior\s*:/i.test(attrValue)) {
        const cleanStyle = attrValue.replace(/[<>"']/g, "");
        allowedAttrs.push(`style="${cleanStyle}"`);
      }
    }
  }

  return allowedAttrs.length > 0 ? " " + allowedAttrs.join(" ") : "";
}

/**
 * Strict parser-based sanitizer for HTML from convertMathToHTML.
 * Strips all active/executable content and restricts output strictly to safe math formatting tags and styles.
 */
export function sanitizeRenderedMath(html: string): string {
  if (!html) return html;
  return sanitizeHtml(html, {
    allowedTags: [...ALLOWED_MATH_TAGS],
    parser: { lowerCaseAttributeNames: false },
    disallowedTagsMode: "discard",
    nonTextTags: ["script", "style", "textarea", "iframe", "object", "template"],
    allowedAttributes: {
      "*": [
        "class", "dir", "aria-hidden", "id", "style", "viewBox",
        "preserveAspectRatio", "d", "points", "x", "y", "x1", "y1",
        "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height",
        "dx", "dy", "fill", "stroke", "stroke-width", "stroke-linecap",
        "stroke-linejoin", "stroke-dasharray", "vector-effect", "opacity",
        "fill-opacity", "stroke-opacity", "font-size", "font-family",
        "font-weight", "font-style", "text-anchor", "dominant-baseline",
        "fill-rule", "patternUnits", "patternTransform", "transform",
        "clip-path", "mask", "data-venn-diagram", "data-venn-card", "paint-order",
      ],
    },
    allowedStyles: {
      "*": Object.fromEntries([
        "position", "display", "align-items", "align-self", "justify-content",
        "flex-direction", "flex-shrink", "top", "left", "width", "height",
        "min-width", "max-width", "min-height", "margin", "margin-top",
        "margin-bottom", "margin-left", "margin-right", "padding", "padding-left",
        "border", "border-top", "border-bottom", "border-left", "border-right",
        "border-radius", "border-collapse", "background", "background-color",
        "color", "font-family", "font-size", "font-weight", "font-style",
        "line-height", "letter-spacing", "text-align", "text-decoration",
        "text-decoration-thickness", "vertical-align", "white-space", "overflow",
        "overflow-x", "opacity", "transform", "transform-origin", "z-index",
        "user-select", "-webkit-text-stroke", "paint-order",
      ].map((property) => [property, [/^(?!.*(?:url\s*\(|expression\s*\(|@import|javascript|behavior|binding|[<>]))[#\w\s.,()%+\-/]{0,200}$/i]])),
    },
    parseStyleAttributes: true,
  });
}


function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape source text before generating math markup while preserving the small,
 * attribute-free HTML subset used by imported papers. This makes raw tags and
 * malformed attributes inert before any string transformations take place.
 */
function escapeMathSource(value: string): string {
  const preserved: string[] = [];
  const keep = (token: string) => {
    const index = preserved.push(token) - 1;
    return `\uE000${index}\uE001`;
  };

  let tokenized = value.replace(
    /<\s*\/?\s*(?:b|i|u|strong|em|p|div|span|sup|sub|br|table|thead|tbody|tr|th|td|pre|code|svg|path|g|polyline|polygon|circle|ellipse|rect|line|text|tspan|defs|clipPath|clippath|mask|pattern|use)\b[^>]*\/?>/gi,
    keep,
  );

  const safeEntities = new Set([
    "amp", "lt", "gt", "radic", "theta", "phi", "pi", "sigma",
    "deg", "times", "divide", "ang", "angle", "frasl", "plusmn",
    "minus", "le", "ge", "ne", "infin", "nbsp", "quot",
  ]);
  tokenized = tokenized.replace(/&([a-z][a-z0-9]+);/gi, (entity, name) =>
    safeEntities.has(String(name).toLowerCase()) ? keep(entity) : entity,
  );

  return escapeHtml(tokenized).replace(/\uE000(\d+)\uE001/g, (_match, index) =>
    preserved[Number(index)],
  );
}

// Units that should NOT be converted to vertical fractions
const UNIT_REGEX = /\b(km\/h|m\/s²?|cm\/s|mm\/s|g\/cm³?|g\/dm³?|mol\/dm³?|kg\/m³?|rad\/s|j\/k|n\/m)\b/i;

// Words and standard abbreviations that should NOT be converted to fractions
const WORD_BLACKLIST =
  /(?<![\^a-zA-Z0-9])\b(and\/or|either\/or|he\/she|his\/her|him\/her|true\/false|yes\/no|pass\/fail|on\/off|high\/low|input\/output|i\/o|i\/p|o\/p|r\/w|tcp\/ip|udp\/ip|ac\/dc|client\/server|master\/slave|read\/write|sender\/receiver|w\/o|c\/o|n\/a|b\/w|w\/r\/t|a\/c|d\/o|s\/o)\b/i;

// Date pattern e.g. 2024/2025, 2023/24, or 2026/09/13
const DATE_REGEX = /\b(?:(?:19|20)\d{2}\s*\/\s*(?:(?:19|20)?\d{2})|\d{4}\/\d{1,2}\/\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4})\b/;

const UNICODE_SUP_CHARS = "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ";
const UNICODE_SUB_CHARS = "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ";
const SCRIPT_SUFFIX_REGEX = `(?:<sup>[^<]+<\\/sup>|<sub>[^<]+<\\/sub>|\\^\\{[^}]+\\}|_\\{[^}]+\\}|\\^\\([a-zA-Z0-9+\\-*\\/=]+\\)|_\\([a-zA-Z0-9+\\-*\\/=]+\\)|\\^[0-9a-zA-Z+-]+|_[0-9a-zA-Z+-]+|[${UNICODE_SUP_CHARS}]+|[${UNICODE_SUB_CHARS}]+)`;

export function isFractionBlacklisted(str: string): boolean {
  return UNIT_REGEX.test(str) || WORD_BLACKLIST.test(str) || DATE_REGEX.test(str);
}

/**
 * Detect whether a given text string contains Arabic/Urdu characters.
 * Matches standard Arabic (\u0600-\u06FF), Arabic Supplement (\u0750-\u077F),
 * and Arabic Presentation Forms (\uFB50-\uFDFF, \uFE70-\uFEFF).
 */
export function isUrduText(text?: string | null): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Detect whether text is predominantly Arabic (e.g. Quranic verses, Hadith with tashkeel / harakat).
 */
export function isArabicText(text?: string | null): boolean {
  if (!text) return false;
  return /[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(text);
}

/**
 * Render an nth-root radical (e.g., ⁵√7 or ∛(x + 3 / 3)) with the root index neatly positioned
 * above the radical hook, scaling dynamically to full fraction / content height.
 */
export function buildRadicalHTML(index: string, radicand?: string): string {
  const rootIndex = `<span class="root-index" style="position:absolute;left:-0.15em;top:-0.15em;font-size:0.55em;line-height:1;font-weight:600;z-index:1;">${index}</span>`;
  const radicalSvg = `<svg viewBox="0 0 10 32" preserveAspectRatio="none" style="width:0.65em;height:auto;min-height:1.2em;display:inline-block;align-self:stretch;flex-shrink:0;vertical-align:top;overflow:visible;" aria-hidden="true"><path d="M 0.5,19 L 2.8,17.5 L 5.2,30.5 L 9.8,1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="miter" vector-effect="non-scaling-stroke"></path></svg>`;
  if (radicand) {
    return `<span class="indexed-radical" style="display:inline-flex;position:relative;align-items:stretch;vertical-align:middle;white-space:nowrap;margin:0 1.5px;padding-left:0.25em;">${rootIndex}${radicalSvg}<span class="radicand" style="border-top:1.6px solid currentColor;display:inline-block;padding:1px 3px 0 2px;margin-left:-0.5px;">${radicand}</span></span>`;
  }
  return `<span class="indexed-radical" style="display:inline-flex;position:relative;align-items:baseline;vertical-align:middle;white-space:nowrap;margin:0 1.5px;padding-left:0.25em;">${rootIndex}${radicalSvg}</span>`;
}

function buildSquareRootHTML(radicand: string): string {
  const isFraction = /class=["']inline-fraction["']|class=["']numerator["']/.test(radicand);
  const radicandPadding = isFraction ? "padding:2px 3px 0 2px;" : "padding:1px 3px 0 2px;";
  return `<span class="square-radical" style="display:inline-flex;align-items:stretch;vertical-align:middle;white-space:nowrap;margin:0 1.5px;"><svg viewBox="0 0 10 32" preserveAspectRatio="none" style="width:0.65em;height:auto;min-height:1.2em;display:inline-block;align-self:stretch;flex-shrink:0;vertical-align:top;overflow:visible;" aria-hidden="true"><path d="M 0.5,19 L 2.8,17.5 L 5.2,30.5 L 9.8,1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="miter" vector-effect="non-scaling-stroke"></path></svg><span class="radicand" style="border-top:1.6px solid currentColor;display:inline-block;${radicandPadding}margin-left:-0.5px;">${radicand}</span></span>`;
}

function convertSquareRadicals(text: string): string {
  let result = "";
  let sourceCursor = 0;

  while (sourceCursor < text.length) {
    const rootAt = text.indexOf("√", sourceCursor);
    if (rootAt === -1) return result + text.slice(sourceCursor);
    result += text.slice(sourceCursor, rootAt);
    let radicandStart = rootAt + 1;

    // Skip any whitespace after √ (e.g. "√ 7" -> "√7")
    while (radicandStart < text.length && /\s/.test(text[radicandStart])) {
      radicandStart++;
    }

    if (radicandStart >= text.length) {
      result += `<span class="square-radical" style="display:inline-flex;align-items:stretch;vertical-align:middle;white-space:nowrap;margin:0 1.5px;"><svg viewBox="0 0 10 32" preserveAspectRatio="none" style="width:0.65em;height:auto;min-height:1.2em;display:inline-block;align-self:stretch;flex-shrink:0;vertical-align:top;overflow:visible;" aria-hidden="true"><path d="M 0.5,19 L 2.8,17.5 L 5.2,30.5 L 9.8,1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="miter" vector-effect="non-scaling-stroke"></path></svg></span>`;
      sourceCursor = text.length;
      break;
    }

    // 1. Parenthesized radicand: √(x + y) or √(7/4)
    if (text[radicandStart] === "(") {
      let depth = 0;
      let end = -1;
      for (let i = radicandStart; i < text.length; i++) {
        if (text[i] === "(") depth++;
        if (text[i] === ")") {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end !== -1) {
        result += buildSquareRootHTML(text.slice(radicandStart + 1, end));
        sourceCursor = end + 1;
        continue;
      }
    }

    // 2. Curly braced radicand: √{x + y} or √{7}
    if (text[radicandStart] === "{") {
      let depth = 0;
      let end = -1;
      for (let i = radicandStart; i < text.length; i++) {
        if (text[i] === "{") depth++;
        if (text[i] === "}") {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end !== -1) {
        result += buildSquareRootHTML(text.slice(radicandStart + 1, end));
        sourceCursor = end + 1;
        continue;
      }
    }

    // 3. Pre-rendered inline-fraction: √<span class="inline-fraction"...>...</span>
    if (text.slice(radicandStart).startsWith("<span class=\"inline-fraction\"")) {
      let spanDepth = 0;
      let end = -1;
      let i = radicandStart;
      while (i < text.length) {
        if (text.slice(i, i + 5) === "<span") {
          spanDepth++;
          i += 5;
        } else if (text.slice(i, i + 7) === "</span>") {
          spanDepth--;
          i += 7;
          if (spanDepth === 0) {
            end = i;
            break;
          }
        } else {
          i++;
        }
      }
      if (end !== -1) {
        result += buildSquareRootHTML(text.slice(radicandStart, end));
        sourceCursor = end;
        continue;
      }
    }

    // 4. Simple token, Greek letters, sub/sup, or placeholder §FRAC\d+§
    const simple = text.slice(radicandStart).match(/^(?:§FRAC\d+§|(?:[a-zA-Z0-9α-ωΑ-ΩθΔπβγλμση]+(?:<sup>[^<]+<\/sup>|<sub>[^<]+<\/sub>|\^[0-9a-zA-Z+-]+|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)*)+)/i)?.[0];
    if (simple) {
      result += buildSquareRootHTML(simple);
      sourceCursor = radicandStart + simple.length;
    } else {
      result += `<span class="square-radical" style="display:inline-flex;align-items:stretch;vertical-align:middle;white-space:nowrap;margin:0 1.5px;"><svg viewBox="0 0 10 32" preserveAspectRatio="none" style="width:0.65em;height:auto;min-height:1.2em;display:inline-block;align-self:stretch;flex-shrink:0;vertical-align:top;overflow:visible;" aria-hidden="true"><path d="M 0.5,19 L 2.8,17.5 L 5.2,30.5 L 9.8,1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="miter" vector-effect="non-scaling-stroke"></path></svg></span>`;
      sourceCursor = radicandStart;
    }
  }

  return result;
}

/**
 * Render a mathematical angle symbol (∠) with sizing, height, and weight matching capital letters (e.g. A, B, C).
 */
export function buildAngleHTML(symbol = "∠"): string {
  return `<span class="math-angle" style="display:inline-block;font-size:1.48em;font-weight:700;line-height:1;transform:scale(1.18, 1.42);transform-origin:bottom left;vertical-align:-0.07em;margin-right:0.08em;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">${escapeHtml(symbol)}</span>`;
}

export function formatCodeSnippet(code: string): string {
  let cleaned = code
    .replace(/≪/g, "<<")
    .replace(/»/g, ">>")
    .replace(/“|”/g, '"')
    .replace(/‘|’/g, "'")
    .trim();

  // If already properly multiline (more than 3 lines), keep existing lines but clean symbols
  const lines = cleaned.split("\n");
  if (lines.length > 3) {
    return lines.map((l) => l.replace(/≪/g, "<<").replace(/»/g, ">>")).join("\n");
  }

  // Otherwise, format C/C++/Java/JS single-line code into structured lines
  let formatted = cleaned;
  formatted = formatted.replace(/(#include\s*<[^>]+>)\s*/g, "$1\n");
  formatted = formatted.replace(/(#include\s*"[^"]+")\s*/g, "$1\n");
  formatted = formatted.replace(/(using\s+namespace\s+[^;]+;)\s*/g, "$1\n\n");
  formatted = formatted.replace(/(;\s*)(?=(?:int|void|float|double|char|bool)\s+main\s*\()/g, ";\n\n");
  formatted = formatted.replace(/((?:int|void|float|double|char|bool)\s+main\s*\([^)]*\)\s*\{)\s*/g, "$1\n");
  formatted = formatted.replace(/(for\s*\([^)]*\)\s*\{)\s*/g, "$1\n");
  formatted = formatted.replace(/(while\s*\([^)]*\)\s*\{)\s*/g, "$1\n");
  formatted = formatted.replace(/(do\s*\{)\s*/g, "$1\n");
  formatted = formatted.replace(/(if\s*\([^)]*\)\s*\{)\s*/g, "$1\n");
  formatted = formatted.replace(/(else\s*\{)\s*/g, "$1\n");

  const forLoops: string[] = [];
  formatted = formatted.replace(/for\s*\([^)]+\)/g, (match) => {
    forLoops.push(match);
    return `§§FOR_${forLoops.length - 1}§§`;
  });

  formatted = formatted.replace(/;\s*/g, ";\n");
  formatted = formatted.replace(/§§FOR_(\d+)§§/g, (_, i) => forLoops[Number(i)]);
  formatted = formatted.replace(/\s*\}\s*/g, "\n}\n");
  formatted = formatted.replace(/(\}\s*while\s*\([^)]+\)\s*;)\s*/g, "$1\n");

  const rawLines = formatted.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  let indent = 0;
  const resultLines: string[] = [];

  for (const line of rawLines) {
    if (line.startsWith("}")) {
      indent = Math.max(0, indent - 1);
    }
    const padding = "  ".repeat(indent);
    resultLines.push(padding + line);
    if (line.endsWith("{")) {
      indent++;
    }
  }

  return resultLines.join("\n");
}

export function buildCodeBlockHTML(code: string, _lang?: string): string {
  const formatted = formatCodeSnippet(code);
  const escaped = escapeHtml(formatted);
  return `<pre class="bg-gray-900 text-gray-100 dark:bg-gray-950 p-3.5 rounded-lg font-mono text-[0.88em] leading-relaxed overflow-x-auto my-3 border border-gray-700/60 shadow-sm" style="background:#181825;color:#cdd6f4;padding:12px 14px;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:0.86em;line-height:1.5;overflow-x:auto;margin:10px 0;white-space:pre;text-align:left;border:1px solid #313244;display:block;" dir="ltr"><code>${escaped}</code></pre>`;
}

export function buildInlineCodeHTML(code: string): string {
  const escaped = escapeHtml(code.trim());
  return `<code class="bg-primary/10 text-primary border border-primary/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-400/25 px-1.5 py-0.5 rounded-md font-mono text-[0.88em] font-semibold" dir="ltr">${escaped}</code>`;
}

export function convertAngleSymbols(text: string): string {
  if (!text) return text;
  return text.replace(/[∠∡∢]/g, (match) => buildAngleHTML(match));
}

/**
 * Render a mathematical union symbol (∪) with thick, crisp SVG geometry matching textbook math typography.
 */
export function buildUnionHTML(_symbol = "∪"): string {
  return `<svg class="math-union" viewBox="0 0 16 16" width="0.86em" height="0.86em" style="display:inline-block;vertical-align:-0.07em;margin:0 0.12em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-label="∪"><path d="M 3.2 3.2 L 3.2 9.6 A 4.8 4.8 0 0 0 12.8 9.6 L 12.8 3.2" /></svg>`;
}

/**
 * Render a mathematical intersection symbol (∩) with thick, crisp SVG geometry matching textbook math typography.
 */
export function buildIntersectionHTML(_symbol = "∩"): string {
  return `<svg class="math-intersection" viewBox="0 0 16 16" width="0.86em" height="0.86em" style="display:inline-block;vertical-align:-0.07em;margin:0 0.12em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-label="∩"><path d="M 3.2 12.8 L 3.2 6.4 A 4.8 4.8 0 0 1 12.8 6.4 L 12.8 12.8" /></svg>`;
}

export function convertUnionSymbols(text: string): string {
  if (!text) return text;
  if (text.includes("math-union")) {
    return text.replace(/<svg class="math-union"[^>]*>.*?<\/svg>|∪/g, (match) => {
      if (match.startsWith("<svg")) return match;
      return buildUnionHTML("∪");
    });
  }
  return text.replace(/∪/g, () => buildUnionHTML("∪"));
}

export function convertIntersectionSymbols(text: string): string {
  if (!text) return text;
  if (text.includes("math-intersection")) {
    return text.replace(/<svg class="math-intersection"[^>]*>.*?<\/svg>|∩/g, (match) => {
      if (match.startsWith("<svg")) return match;
      return buildIntersectionHTML("∩");
    });
  }
  return text.replace(/∩/g, () => buildIntersectionHTML("∩"));
}

const BB_UNICODE_CHARS = /[ℕℤℚℝℂ𝕎ℙ𝔼𝕆ℍ𝔻𝔸𝔹𝔽𝔾𝕀𝕁𝕂𝕃𝕄𝕊𝕋𝕌𝕍𝕏𝕐]/gu;

/**
 * Render a blackboard bold mathematical set symbol (𝕎, ℤ, ℕ, ℚ, ℝ, etc.) with thick, bold stroke weight.
 */
export function buildBlackboardBoldHTML(symbol: string): string {
  const char = BLACKBOARD_BOLD_MAP[symbol] || symbol;
  return `<span class="math-bb font-bold" style="display:inline-block;font-weight:800;-webkit-text-stroke:0.5px currentColor;line-height:1;margin:0 0.04em;font-family:'KaTeX_AMS','Cambria Math','STIXGeneral','Noto Sans Math','Segoe UI Symbol','Apple Symbols',serif,sans-serif;">${escapeHtml(char)}</span>`;
}

export function convertBlackboardBoldSymbols(text: string): string {
  if (!text) return text;
  let res = text.replace(/\\mathbb\s*\{([A-Za-z])\}/g, (_, ch) => buildBlackboardBoldHTML(ch));
  res = res.replace(/\\mathbb\s*([A-Za-z])\b/g, (_, ch) => buildBlackboardBoldHTML(ch));

  if (res.includes("math-bb")) {
    return res.replace(/<span[^>]*class="[^"]*math-bb[^"]*"[^>]*>[\s\S]*?<\/span>|[ℕℤℚℝℂ𝕎ℙ𝔼𝕆ℍ𝔻𝔸𝔹𝔽𝔾𝕀𝕁𝕂𝕃𝕄𝕊𝕋𝕌𝕍𝕏𝕐]/gu, (match) => {
      if (match.startsWith("<span")) return match;
      return buildBlackboardBoldHTML(match);
    });
  }
  return res.replace(BB_UNICODE_CHARS, (ch) => buildBlackboardBoldHTML(ch));
}

/**
 * Render a right reaction / mapping arrow (→) as a crisp, bold vector icon.
 */
export function buildRightArrowHTML(): string {
  return `<svg class="math-arrow-right inline-block" viewBox="0 0 20 16" width="1.2em" height="1.15em" style="display:inline-block;vertical-align:-0.16em;margin:0 0.3em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="→"><line x1="2" y1="8" x2="16.5" y2="8" /><polyline points="11.5 3.5 16.5 8 11.5 12.5" /></svg>`;
}

/**
 * Render an implies / right double arrow (⟹) as a crisp vector icon.
 */
export function buildImpliesArrowHTML(): string {
  return `<svg class="math-arrow-implies inline-block" viewBox="0 0 20 16" width="1.25em" height="1.15em" style="display:inline-block;vertical-align:-0.16em;margin:0 0.3em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-label="⟹"><line x1="2" y1="5.5" x2="16.5" y2="5.5" /><line x1="2" y1="10.5" x2="16.5" y2="10.5" /><polyline points="11.5 3 16.5 8 11.5 13" stroke-width="2.2" /></svg>`;
}

/**
 * Render a left arrow (←) as a crisp, bold vector icon.
 */
export function buildLeftArrowHTML(): string {
  return `<svg class="math-arrow-left inline-block" viewBox="0 0 20 16" width="1.2em" height="1.15em" style="display:inline-block;vertical-align:-0.16em;margin:0 0.3em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="←"><line x1="18" y1="8" x2="3.5" y2="8" /><polyline points="8.5 3.5 3.5 8 8.5 12.5" /></svg>`;
}

/**
 * Render a bidirectional arrow (↔) as a crisp vector icon.
 */
export function buildBidirArrowHTML(): string {
  return `<svg class="math-arrow-bidir inline-block" viewBox="0 0 22 16" width="1.3em" height="1.15em" style="display:inline-block;vertical-align:-0.16em;margin:0 0.3em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="↔"><line x1="3.5" y1="8" x2="18.5" y2="8" /><polyline points="8.5 3.5 3.5 8 8.5 12.5" /><polyline points="13.5 3.5 18.5 8 13.5 12.5" /></svg>`;
}

/**
 * Render a chemical equilibrium harpoon arrow (⇌) as a crisp vector icon.
 */
export function buildEquilibriumArrowHTML(): string {
  return `<svg class="math-arrow-equilibrium inline-block" viewBox="0 0 22 16" width="1.35em" height="1.15em" style="display:inline-block;vertical-align:-0.16em;margin:0 0.3em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-label="⇌"><line x1="3" y1="5.5" x2="19" y2="5.5" /><polyline points="14 2 19 5.5" /><line x1="19" y1="10.5" x2="3" y2="10.5" /><polyline points="8 14 3 10.5" /></svg>`;
}

/**
 * Render an if-and-only-if double arrow (⟺) as a crisp vector icon.
 */
export function buildIffArrowHTML(): string {
  return `<svg class="math-arrow-iff inline-block" viewBox="0 0 22 16" width="1.35em" height="1.15em" style="display:inline-block;vertical-align:-0.16em;margin:0 0.3em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-label="⟺"><line x1="4.5" y1="5.5" x2="17.5" y2="5.5" /><line x1="4.5" y1="10.5" x2="17.5" y2="10.5" /><polyline points="8.5 3 3.5 8 8.5 13" stroke-width="2" /><polyline points="13.5 3 18.5 8 13.5 13" stroke-width="2" /></svg>`;
}

export function convertArrowSymbols(text: string): string {
  if (!text) return text;
  let result = text
    .replace(/&lt;==&gt;|<==>/g, "⟺")
    .replace(/&lt;=&gt;|<=>/g, "⇌")
    .replace(/==&gt;|==>/g, "⟹")
    .replace(/=&gt;|=>/g, "⟹")
    .replace(/&lt;--&gt;|<-->/g, "↔")
    .replace(/&lt;-&gt;|<->/g, "↔")
    .replace(/--&gt;|-->/g, "→")
    .replace(/-&gt;|->/g, "→")
    .replace(/&lt;--|<--/g, "←")
    .replace(/&lt;-|<-/g, "←")
    .replace(/⇌|⇄|&rlhar;/g, "⇌");

  if (result.includes("math-arrow-")) {
    return result.replace(/<svg class="math-arrow-[^>]*>.*?<\/svg>|[→⟹⇒←↔⟺⇌]|&#8594;|&#8592;|&#10233;|&#10234;|&#8652;/g, (match) => {
      if (match.startsWith("<svg")) return match;
      if (match === "→" || match === "&#8594;") return buildRightArrowHTML();
      if (match === "⟹" || match === "⇒" || match === "&#10233;") return buildImpliesArrowHTML();
      if (match === "←" || match === "&#8592;") return buildLeftArrowHTML();
      if (match === "↔" || match === "&#8652;") return buildBidirArrowHTML();
      if (match === "⟺" || match === "&#10234;") return buildIffArrowHTML();
      if (match === "⇌") return buildEquilibriumArrowHTML();
      return match;
    });
  }

  return result
    .replace(/→|&#8594;/g, () => buildRightArrowHTML())
    .replace(/⟹|⇒|&#10233;/g, () => buildImpliesArrowHTML())
    .replace(/←|&#8592;/g, () => buildLeftArrowHTML())
    .replace(/↔|&#8652;/g, () => buildBidirArrowHTML())
    .replace(/⟺|&#10234;/g, () => buildIffArrowHTML())
    .replace(/⇌/g, () => buildEquilibriumArrowHTML());
}

/**
 * Render a mathematical empty / null set symbol (∅) with thick, rotated vector geometry.
 */
export function buildEmptySetHTML(): string {
  return `<svg class="math-empty-set" viewBox="0 0 16 16" width="1.05em" height="1.05em" style="display:inline-block;vertical-align:-0.15em;margin:0 0.1em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="∅"><circle cx="8" cy="8" r="5.3" /><line x1="2" y1="14" x2="14" y2="2" /></svg>`;
}

export function convertEmptySetSymbols(text: string): string {
  if (!text) return text;
  if (text.includes("math-empty-set")) {
    return text.replace(/<svg class="math-empty-set"[^>]*>.*?<\/svg>|∅/g, (match) => {
      if (match.startsWith("<svg")) return match;
      return buildEmptySetHTML();
    });
  }
  return text.replace(/∅/g, () => buildEmptySetHTML());
}

/**
 * Render a mathematical symmetric difference / Delta / triangle symbol (Δ, △) with crisp, thick equilateral SVG vector geometry.
 */
export function buildDeltaHTML(): string {
  return `<svg class="math-delta" viewBox="0 0 16 16" width="0.92em" height="0.92em" style="display:inline-block;vertical-align:-0.09em;margin:0 0.12em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-label="Δ"><polygon points="8,2.2 14.6,13.6 1.4,13.6" /></svg>`;
}

export function convertDeltaSymbols(text: string): string {
  if (!text) return text;
  if (text.includes("math-delta")) {
    return text.replace(/<svg class="math-delta"[^>]*>.*?<\/svg>|[Δ△]/g, (match) => {
      if (match.startsWith("<svg")) return match;
      return buildDeltaHTML();
    });
  }
  return text.replace(/[Δ△]/g, () => buildDeltaHTML());
}

/**
 * Convert standard markdown text formatting (bold **...**, __...__, and italic *...*) into HTML tags.
 */
export function convertMarkdownFormatting(text: string): string {
  if (!text) return text;
  let result = text;
  // 1. Triple asterisks (Bold + Italic): ***text*** or ___text___
  result = result.replace(/\*\*\*([^\n]+?)\*\*\*/g, "<b><i>$1</i></b>");
  result = result.replace(/___([^\n]+?)___/g, "<b><i>$1</i></b>");
  // 2. Bold: **text** or __text__ (allowing nested *italic* or other content within the same line)
  result = result.replace(/\*\*([^\n]+?)\*\*/g, "<b>$1</b>");
  result = result.replace(/__([^\n_]+?)__/g, "<b>$1</b>");
  // 3. Italic: *text* (avoiding standalone * math multiplication operators like "2 * 3")
  result = result.replace(/(?<![a-zA-Z0-9*])\*([^*\n\s](?:[^*\n]*?[^*\n\s])?)\*(?![a-zA-Z0-9*])/g, "<i>$1</i>");
  result = result.replace(/(?<![a-zA-Z0-9_])_([^_\n\s](?:[^_\n]*?[^_\n\s])?)_(?![a-zA-Z0-9_])/g, "<i>$1</i>");
  return result;
}

/**
 * Render a mathematical vector with a right arrow directly on top of the base letters (e.g. MN, AB, A, v, r).
 */
export function buildVectorHTML(base: string): string {
  const trimmed = base.trim();
  return `<span class="math-vector" style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:-0.12em;line-height:1;margin:0 0.1em;"><span class="vector-arrow" style="display:block;line-height:1;width:100%;margin-bottom:-1px;user-select:none;"><svg viewBox="0 0 16 6" width="100%" height="0.42em" preserveAspectRatio="none" style="display:block;overflow:visible;" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="0" y1="3" x2="15.5" y2="3" /><polyline points="11 0.5 15.5 3 11 5.5" /></svg></span><span class="vector-base" style="line-height:1;font-weight:600;letter-spacing:0.02em;">${escapeHtml(trimmed)}</span></span>`;
}

export function buildOverlineHTML(base: string): string {
  const trimmed = base.trim();
  return `<span class="math-overline math-conjugate" style="display:inline-block;border-top:1.5px solid currentColor;line-height:1;padding-top:1.5px;vertical-align:baseline;margin:0 0.04em;text-decoration:none;">${trimmed}</span>`;
}

/**
 * Render a unit vector with a cap/hat (^) centered directly on top of the letter (e.g. i, j, k, n, r, u, v).
 */
export function buildUnitVectorHTML(letter: string): string {
  const trimmed = letter.trim();
  return `<span class="math-unit-vector" style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:-0.08em;line-height:1;margin:0 0.06em;"><span class="unit-hat" style="font-size:0.68em;line-height:0.35;font-weight:900;user-select:none;font-family:system-ui,-apple-system,sans-serif;">^</span><span class="unit-letter" style="line-height:1;font-style:italic;font-weight:600;font-family:'Times New Roman',serif,Cambria,serif;">${escapeHtml(trimmed)}</span></span>`;
}

/**
 * Convert vector and unit vector notation into textbook formatting:
 * - \vec{MN}, \vec{AB}, \vec{A}, \vec{v}, \overrightarrow{MN} -> right arrow directly above letters
 * - MN→, AB→, r→, v→, F→ -> right arrow directly above letters
 * - \hat{i}, \hat{j}, \hat{k}, \hat{n}, \hat{r} -> cap (^) directly above letter
 * - i^, j^, k^, n^, r^ -> cap (^) directly above letter
 * - î, ĵ, î, ĵ, k̂ -> cap (^) directly above letter
 */
export function convertVectorsToHTML(text: string): string {
  if (!text) return text;
  let result = text;

  // 1. LaTeX \vec{...}, \overrightarrow{...}
  result = result.replace(/\\(?:vec|overrightarrow)\s*\{([^{}]+)\}/g, (_m, base) => buildVectorHTML(base));
  result = result.replace(/\\(?:vec|overrightarrow)\s*([a-zA-Z]{1,3})/g, (_m, base) => buildVectorHTML(base));

  // 2. Explicit (vector=...) and (vec=...)
  result = result.replace(/\((?:vector|vec)=([^)]+)\)/gi, (_m, base) => buildVectorHTML(base));

  // 3. Arrow trailing after uppercase vector letters: MN→, AB→, etc. (do NOT match lowercase letters like 'i → (i)' which are equation labels or limits)
  result = result.replace(/(?<![a-zA-Z])([A-Z]{2,3})\s*(?:→|&rarr;|&#8594;)(?!\s*[a-zA-Z0-9+\-±∞θπ\\&<{(])/g, (_m, base) => buildVectorHTML(base));
  result = result.replace(/(?<![a-zA-Z])([A-Z]{1,3})\s*->(?!\s*[a-zA-Z0-9+\-±∞θπ\\&<{(])/g, (_m, base) => buildVectorHTML(base));

  // 4. LaTeX \hat{...}, \hat i, \hat j, \hat k, dotless \hat{\imath}, \hat{\mathbf{i}}
  result = result.replace(/\\hat\s*\{\\?(?:imath|mathbf\{i\}|mathbf\{imath\}|text\{i\}|bm\{i\})\}/gi, () => buildUnitVectorHTML("i"));
  result = result.replace(/\\hat\s*\{\\?(?:jmath|mathbf\{j\}|mathbf\{jmath\}|text\{j\}|bm\{j\})\}/gi, () => buildUnitVectorHTML("j"));
  result = result.replace(/\\hat\s*\{\\?(?:mathbf\{k\}|text\{k\}|bm\{k\})\}/gi, () => buildUnitVectorHTML("k"));
  result = result.replace(/\\hat\s*\\imath\b/gi, () => buildUnitVectorHTML("i"));
  result = result.replace(/\\hat\s*\\jmath\b/gi, () => buildUnitVectorHTML("j"));
  result = result.replace(/\\hat\s*\{([^{}]+)\}/g, (_m, letter) => buildUnitVectorHTML(letter));
  result = result.replace(/\\hat\s*([a-zA-Z])/g, (_m, letter) => buildUnitVectorHTML(letter));

  // 4b. Text unit vectors: i_hat, j_hat, k_hat, r_hat, n_hat, u_hat, x_hat, y_hat, z_hat, or i_cap, etc.
  result = result.replace(/\b([ijkrugnvabcxyIJK])(?:_hat|_cap|\s+hat|\s+cap)\b/gi, (_m, letter) => buildUnitVectorHTML(letter.toLowerCase()));

  // 5. Explicit (hat=...), (cap=...), (unit=...)
  result = result.replace(/\((?:hat|cap|unit|unit_vector)=([^)]+)\)/gi, (_m, letter) => buildUnitVectorHTML(letter));

  // 6. Caret hat trailing after standard unit vector letters: i^, j^, k^, n^, r^, u^, v^
  // STRICT: Must only apply to vector unit symbols, and must NOT be followed by math operators, fractions, exponents, carets, braces, backslashes, digits, or HTML tags.
  result = result.replace(/(?<![a-zA-Z0-9])([ijknruvIJKNRUV])\^(?!\s*(?:[a-zA-Z0-9+\-*\/\\({<\[_§]|-|\+))/g, (_m, letter) => buildUnitVectorHTML(letter));

  // 7. Unicode combining circumflex or precomposed unit vector characters (î, ĵ, î, ĵ, k̂, etc.)
  result = result.replace(/([ijknruvIJKNRUV])\u0302/g, (_m, letter) => buildUnitVectorHTML(letter));
  result = result.replace(/î/g, () => buildUnitVectorHTML("i"));
  result = result.replace(/ĵ/g, () => buildUnitVectorHTML("j"));

  return result;
}

function buildLimitHTML(approach: string): string {
  const normalizedApproach = approach
    .replace(/\\rightarrow\b|\\to\b|-&gt;|->/g, " → ")
    .replace(/\s*→\s*/g, " → ")
    .replace(/\\infty\b/g, "∞")
    .replace(/<\/?sub>/gi, "")
    .trim();
  return `<span class="math-limit" style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;vertical-align:middle;line-height:0.9;margin:0 0.12em;"><span style="font-family:serif;font-size:1.02em;">lim</span><span style="font-size:0.58em;white-space:nowrap;margin-top:0.08em;text-align:center;">${normalizedApproach}</span></span>`;
}

export function buildIntegralHTML(lower: string, upper: string): string {
  const normUpper = upper
    .replace(/\\pi\b/g, "π")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\infty\b/g, "∞")
    .replace(/\(superscript=([^)]+)\)/g, "<sup>$1</sup>")
    .replace(/\(subscript=([^)]+)\)/g, "<sub>$1</sub>")
    .replace(/<\/?sup>/gi, "")
    .replace(/<\/?sub>/gi, "")
    .trim();
  const normLower = lower
    .replace(/\\pi\b/g, "π")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\infty\b/g, "∞")
    .replace(/\(superscript=([^)]+)\)/g, "<sup>$1</sup>")
    .replace(/\(subscript=([^)]+)\)/g, "<sub>$1</sub>")
    .replace(/<\/?sup>/gi, "")
    .replace(/<\/?sub>/gi, "")
    .trim();

  return `<span class="math-integral" style="display:inline-flex;align-items:center;vertical-align:middle;margin:0 2px;"><span style="font-family:'Cambria Math','STIX Two Math',serif;font-size:1.35em;line-height:1;">∫</span><span style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;font-size:0.62em;line-height:1;margin-left:1px;margin-right:2px;vertical-align:middle;"><span style="margin-bottom:0.2em;text-align:center;">${normUpper}</span><span style="margin-top:0.2em;text-align:center;">${normLower}</span></span></span>`;
}

/**
 * Render a chemical nuclide / isotope notation with mass number (superscript)
 * and atomic number (subscript) vertically stacked directly on top of each other.
 * Example: 63.5 on top, 29 on bottom, Cu to the right -> ⁶³·⁵₂₉Cu
 */
export function buildNuclideHTML(mass: string, atomic: string, element: string = ""): string {
  const normMass = mass.replace(/<\/?sup>/gi, "").replace(/<\/?sub>/gi, "").trim();
  const normAtomic = atomic.replace(/<\/?sup>/gi, "").replace(/<\/?sub>/gi, "").trim();
  const cleanElem = element.trim();

  return `<span class="math-nuclide" style="display:inline-flex;align-items:center;vertical-align:-0.22em;line-height:1;margin:0 0.12em;font-style:normal;"><span style="display:inline-flex;flex-direction:column;align-items:flex-end;justify-content:center;font-size:0.62em;line-height:1;margin-right:2px;"><span style="line-height:1;margin-bottom:0.12em;text-align:right;">${normMass}</span><span style="line-height:1;text-align:right;">${normAtomic}</span></span>${cleanElem ? `<span style="font-size:1em;line-height:1;display:inline-block;">${cleanElem}</span>` : ""}</span>`;
}

export function convertNuclidesToHTML(text: string): string {
  if (!text) return text;

  // A chemical nuclide MUST have a chemical element symbol (e.g. U, Cu, He, H, C, Fe, Pb, etc.) or radiation particle (alpha, beta, gamma, n, p, e)
  // and MUST NOT be preceded by an alphanumeric or variable character (which would be an indexed variable with exponent like r_1^2 or x_i^2).
  const elemPattern = "(?:[A-Z][a-z]?|[αβγnpedX]|\\\\(?:alpha|beta|gamma|nu|mu))";

  // 1. Match HTML <sup>mass</sup><sub>atomic</sub>Element or <sub>atomic</sub><sup>mass</sup>Element
  let result = text.replace(
    new RegExp(`(?<![a-zA-Z0-9α-ωΑ-Ω_§\\]\\)])(?:<sup>([0-9.]+)<\/sup>\\s*<sub>([0-9.]+)<\/sub>|<sub>([0-9.]+)<\/sub>\\s*<sup>([0-9.]+)<\/sup>)\\s*(${elemPattern})`, "g"),
    (_match, supMass, subAtomic, subAtomic2, supMass2, elem) => {
      const mass = supMass || supMass2;
      const atomic = subAtomic || subAtomic2;
      return buildNuclideHTML(mass, atomic, elem);
    }
  );

  // 2. Match LaTeX ^{mass}_{atomic}Element or _{atomic}^{mass}Element
  result = result.replace(
    new RegExp(`(?<![a-zA-Z0-9α-ωΑ-Ω_§\\]\\)])(?:\\^\\{([0-9.]+)\\}_\\{([0-9.]+)\\}|_\\{([0-9.]+)\\}\\^\\{([0-9.]+)\\})\\s*(${elemPattern})`, "g"),
    (_match, supMass, subAtomic, subAtomic2, supMass2, elem) => {
      const mass = supMass || supMass2;
      const atomic = subAtomic || subAtomic2;
      return buildNuclideHTML(mass, atomic, elem);
    }
  );

  return result;
}

function convertIndexedRadicals(text: string): string {
  const indexes: Record<string, string> = {
    "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6",
    "⁷": "7", "⁸": "8", "⁹": "9", "ⁿ": "n",
  };
  const pattern = /\(\s*<sup>([^<]+)<\/sup>\s*\)\s*√|([²³⁴⁵⁶⁷⁸⁹ⁿ])\s*√/g;
  let result = "";
  let sourceCursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    result += text.slice(sourceCursor, match.index);
    const index = match[1] || indexes[match[2]] || match[2];
    const radicandStart = pattern.lastIndex;
    if (text[radicandStart] === "(") {
      let depth = 0;
      let end = -1;
      for (let i = radicandStart; i < text.length; i++) {
        if (text[i] === "(") depth++;
        if (text[i] === ")") {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end !== -1) {
        result += buildRadicalHTML(index, text.slice(radicandStart + 1, end));
        sourceCursor = end + 1;
        pattern.lastIndex = sourceCursor;
        continue;
      }
    }

    const simple = text.slice(radicandStart).match(/^[a-z0-9]+/i)?.[0];
    if (simple) {
      result += buildRadicalHTML(index, simple);
      sourceCursor = radicandStart + simple.length;
      pattern.lastIndex = sourceCursor;
    } else {
      result += buildRadicalHTML(index);
      sourceCursor = radicandStart;
    }
  }
  return result + text.slice(sourceCursor);
}

function isFullyWrappedInGroup(str: string, open: string, close: string): boolean {
  if (!str.startsWith(open) || !str.endsWith(close)) return false;
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === open) depth++;
    else if (str[i] === close) {
      depth--;
      if (depth === 0 && i < str.length - 1) return false;
    }
  }
  return depth === 0;
}

/**
 * Render a vertical mathematical fraction: numerator on top, a horizontal
 * fraction bar below it, and denominator centered underneath for superior UX.
 */
export function buildFractionHTML(numerator: string, denominator: string): string {
  let num = numerator.trim();
  let den = denominator.trim();
  let signPrefix = "";

  // Handle leading sign (-, ±, +)
  const signMatch = num.match(/^([-–—]|±|\+)\s*/);
  if (signMatch) {
    const signChar = signMatch[1] === "-" || signMatch[1] === "–" || signMatch[1] === "—" ? "−" : signMatch[1];
    signPrefix = `<span style="vertical-align:middle;margin-right:1.5px;">${signChar}</span>`;
    num = num.slice(signMatch[0].length).trim();
  }

  // Strip wrapping outer parens or brackets ONLY if they wrap the entire term
  if (isFullyWrappedInGroup(num, "(", ")") || isFullyWrappedInGroup(num, "[", "]")) {
    const inner = num.slice(1, -1).trim();
    if (!inner.includes("[") && !inner.includes("]")) {
      num = inner;
    }
  }
  if (isFullyWrappedInGroup(den, "(", ")") || isFullyWrappedInGroup(den, "[", "]")) {
    const inner = den.slice(1, -1).trim();
    if (!inner.includes("[") && !inner.includes("]")) {
      den = inner;
    }
  }

  // Handle leading sign again if it was inside parens e.g. (-3) -> -3
  const innerSignMatch = num.match(/^([-–—]|±|\+)\s*/);
  if (innerSignMatch) {
    const signChar = innerSignMatch[1] === "-" || innerSignMatch[1] === "–" || innerSignMatch[1] === "—" ? "−" : innerSignMatch[1];
    signPrefix = `<span style="vertical-align:middle;margin-right:1.5px;">${signChar}</span>`;
    num = num.slice(innerSignMatch[0].length).trim();
  }

  // Helper to resolve superscripts and subscripts inside numerator and denominator
  const resolveScripts = (val: string) => {
    return val
      .replace(/\(superscript=((?:[^()]+|\([^()]*\))+)\)/g, "<sup>$1</sup>")
      .replace(/superscript=((?:[^()]+|\([^()]*\))+)/g, "<sup>$1</sup>")
      .replace(/\(subscript=((?:[^()]+|\([^()]*\))+)\)/g, "<sub>$1</sub>")
      .replace(/subscript=((?:[^()]+|\([^()]*\))+)/g, "<sub>$1</sub>")
      .replace(/\s*\^\{([^}]+)\}/g, "<sup>$1</sup>")
      .replace(/\s*\^\(([a-zA-Z0-9+\-*/=]+)\)/g, "<sup>$1</sup>")
      .replace(/(?<=[a-zA-Z0-9α-ωΑ-Ω\)\>\]§\}\|])\s*\^(-?\d+(?:\.\d+)?|[a-zA-Zα-ωΑ-Ω+-]+)/g, "<sup>$1</sup>")
      .replace(/\s*_\{([^}]+)\}/g, "<sub>$1</sub>")
      .replace(/\s*_\(([a-zA-Z0-9+\-*/=]+)\)/g, "<sub>$1</sub>")
      .replace(/(?<=[a-zA-Z0-9α-ωΑ-Ω\)\>\]§\}\|∫])\s*_(\d+|[a-zA-Zα-ωΑ-Ω])/g, "<sub>$1</sub>");
  };

  num = resolveScripts(num);
  den = resolveScripts(den);
  num = convertVectorsToHTML(num);
  den = convertVectorsToHTML(den);

  const hasRadicalInDen = /√|square-radical|indexed-radical|radicand|&radic;|sqrt/i.test(den);
  const denPadding = hasRadicalInDen ? "padding:7px 3px 1px 3px;" : "padding:3px 3px 0 3px;";

  const hasRadicalInNum = /√|square-radical|indexed-radical|radicand|&radic;|sqrt/i.test(num);
  const numPadding = hasRadicalInNum ? "padding:0 3px 5px 3px;" : "padding:0 3px 2.5px 3px;";

  return (
    signPrefix +
    `<span class="inline-fraction" style="display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;padding:0 2px;line-height:1.15;font-size:0.92em;margin:0 2px;">` +
    `<span class="numerator" style="border-bottom:1.5px solid currentColor;${numPadding}display:inline-block;white-space:nowrap;">${num}</span>` +
    `<span class="denominator" style="${denPadding}display:inline-block;white-space:nowrap;">${den}</span>` +
    `</span>`
  );
}

const MATH_FN_PREFIX_REGEX = "(?:det|sin|cos|tan|sec|csc|cosec|cot|cotan|log|ln|lg|exp|lim|sinh|cosh|tanh|sech|csch|coth|arcsin|arccos|arctan|arcsec|arccsc|arccot|asin|acos|atan)";

const ENGLISH_STOPWORDS = new Set([
  "of", "to", "in", "on", "at", "by", "as", "or", "if", "an", "am", "be",
  "do", "go", "he", "me", "my", "no", "so", "up", "us", "we", "is", "it",
  "and", "the", "for", "with", "from", "that", "this", "then", "than",
  "into", "over", "also", "each", "both", "such", "when", "what", "which",
  "where", "while", "after", "before", "during", "since", "until", "about",
  "above", "below", "under"
]);

/**
 * Wrap inline content (e.g. an inner square matrix or tall math expression)
 * with full-height round parentheses SVGs.
 */
export function wrapWithTallParentheses(content: string): string {
  return (
    `<span style="display:inline-flex;align-items:stretch;vertical-align:middle;margin:0 2px;line-height:1;">` +
    `<svg viewBox="0 0 8 32" preserveAspectRatio="none" style="width:0.42em;min-width:6px;max-width:9px;height:auto;align-self:stretch;flex-shrink:0;vertical-align:middle;margin-right:2px;" aria-hidden="true"><path d="M 6.5,1.2 Q 1,16 6.5,30.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" vector-effect="non-scaling-stroke"></path></svg>` +
    content +
    `<svg viewBox="0 0 8 32" preserveAspectRatio="none" style="width:0.42em;min-width:6px;max-width:9px;height:auto;align-self:stretch;flex-shrink:0;vertical-align:middle;margin-left:2px;" aria-hidden="true"><path d="M 1.5,1.2 Q 7,16 1.5,30.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" vector-effect="non-scaling-stroke"></path></svg>` +
    `</span>`
  );
}

/**
 * Wrap inline content with full-height square brackets.
 */
export function wrapWithTallBrackets(content: string): string {
  return (
    `<span style="display:inline-flex;align-items:stretch;vertical-align:middle;margin:0 2px;line-height:1;">` +
    `<span style="display:inline-block;width:4px;border-top:1.8px solid currentColor;border-bottom:1.8px solid currentColor;border-left:1.8px solid currentColor;border-radius:1px 0 0 1px;margin-right:2px;align-self:stretch;"></span>` +
    content +
    `<span style="display:inline-block;width:4px;border-top:1.8px solid currentColor;border-bottom:1.8px solid currentColor;border-right:1.8px solid currentColor;border-radius:0 1px 1px 0;margin-left:2px;align-self:stretch;"></span>` +
    `</span>`
  );
}

/**
 * Convert fractions written as (A) / (B), A / (B), (A) / B, or A / B into vertical fractions:
 * numerator A, a horizontal line below it, and denominator B underneath.
 */
export function convertFractionsToHTML(text: string): string {
  if (!text) return text;

  // Protect all HTML tags EXCEPT <sup> and <sub> tags so class names (e.g. border-border/70, bg-muted/20) are never converted into fractions
  // while preserving superscript/subscript markup in math expressions.
  const htmlTags: string[] = [];
  let result = text.replace(/<(?!\/?(?:sup|sub)\b)[^>]+>/gi, (tag) => {
    htmlTags.push(tag);
    return `\uE008${htmlTags.length - 1}\uE009`;
  });

  const fractions: string[] = [];

  const addFrac = (n: string, d: string) => {
    const idx = fractions.length;
    fractions.push(buildFractionHTML(n, d));
    return `§FRAC${idx}§`;
  };

  // 1. Recursive LaTeX fractions with balanced braces: \frac{a}{b} -> addFrac
  let maxDepth = 15;
  while (result.includes("\\frac") && maxDepth-- > 0) {
    const idx = result.indexOf("\\frac");
    if (idx === -1) break;

    let cursor = idx + 5;
    while (cursor < result.length && /\s/.test(result[cursor])) cursor++;

    let num: string | null = null;
    let den: string | null = null;
    let endCursor = cursor;

    if (cursor < result.length && result[cursor] === "{") {
      const numStart = cursor + 1;
      let depth = 1;
      cursor++;
      while (cursor < result.length && depth > 0) {
        if (result[cursor] === "{") depth++;
        else if (result[cursor] === "}") depth--;
        cursor++;
      }
      if (depth === 0) {
        num = result.slice(numStart, cursor - 1);
        while (cursor < result.length && /\s/.test(result[cursor])) cursor++;
        if (cursor < result.length && result[cursor] === "{") {
          const denStart = cursor + 1;
          let denDepth = 1;
          cursor++;
          while (cursor < result.length && denDepth > 0) {
            if (result[cursor] === "{") denDepth++;
            else if (result[cursor] === "}") denDepth--;
            cursor++;
          }
          if (denDepth === 0) {
            den = result.slice(denStart, cursor - 1);
            endCursor = cursor;
          }
        } else {
          const tokenMatch = result.slice(cursor).match(/^([a-zA-Z0-9]+)/);
          if (tokenMatch) {
            den = tokenMatch[1];
            endCursor = cursor + tokenMatch[1].length;
          }
        }
      }
    } else {
      const tokenMatch = result.slice(cursor).match(/^([a-zA-Z0-9]+)/);
      if (tokenMatch) {
        num = tokenMatch[1];
        cursor += tokenMatch[1].length;
        while (cursor < result.length && /\s/.test(result[cursor])) cursor++;
        if (cursor < result.length && result[cursor] === "{") {
          const denStart = cursor + 1;
          let denDepth = 1;
          cursor++;
          while (cursor < result.length && denDepth > 0) {
            if (result[cursor] === "{") denDepth++;
            else if (result[cursor] === "}") denDepth--;
            cursor++;
          }
          if (denDepth === 0) {
            den = result.slice(denStart, cursor - 1);
            endCursor = cursor;
          }
        } else {
          const denTokenMatch = result.slice(cursor).match(/^([a-zA-Z0-9]+)/);
          if (denTokenMatch) {
            den = denTokenMatch[1];
            endCursor = cursor + denTokenMatch[1].length;
          }
        }
      }
    }

    if (num !== null && den !== null) {
      const replacement = addFrac(num, den);
      result = result.slice(0, idx) + replacement + result.slice(endCursor);
    } else {
      result = result.slice(0, idx) + "" + result.slice(idx + 5);
    }
  }

  // 2. Both parenthesized: (A) / (B) or [A] / [B] with optional leading math function / sign and optional trailing exponents
  const parenFracPattern = new RegExp(
    `((?:^|[-+\\s=*·×±≤≥({\\[,:>\\uE009]+))(?:([-–—±]?\\s*${MATH_FN_PREFIX_REGEX}\\s*)|([-–—±]))?(\\((?:[^()]|\\([^()]*\\))+\\)|\\[(?:[^\\[\\]]|\\[[^\\[\\]]*\\])+\\])(${SCRIPT_SUFFIX_REGEX}*)?\\s*\\/\\s*(?:(${MATH_FN_PREFIX_REGEX})\\s*)?(\\((?:[^()]|\\([^()]*\\))+\\)|\\[(?:[^\\[\\]]|\\[[^\\[\\]]*\\])+\\])(${SCRIPT_SUFFIX_REGEX}*)?`,
    "gi",
  );
  result = result.replace(
    parenFracPattern,
    (match, leadingSpace, fn1, sign1, num, exp1, fn2, den, exp2) => {
      if (isFractionBlacklisted(match)) return match;
      const fullNum = (fn1 || sign1 || "") + num + (exp1 || "");
      const fullDen = fn2 ? `${fn2}${den}${exp2 || ""}` : `${den}${exp2 || ""}`;
      return (leadingSpace || "") + addFrac(fullNum, fullDen);
    },
  );

  const parenGroup = `(?:\\((?:[^()]|\\([^()]*\\))+\\)|\\[(?:[^\\[\\]]|\\[[^\\[\\]]*\\])+\\])(?:!|${SCRIPT_SUFFIX_REGEX})*`;
  const simpleTerm = `(?:√\\s*(?:\\((?:[^()]|\\([^()]*\\))+\\)|[a-zA-Z0-9α-ωΑ-ΩθΔπβγ]+)|det\\s*\\([^()]+\\)|(?:d[a-zA-Zα-ωΑ-ΩθΔπ]|Δ[a-zA-Zα-ωΑ-Ωθ])|(?:[a-zA-Z0-9α-ωΑ-ΩθΔπβγλμση]+(?:${SCRIPT_SUFFIX_REGEX})*)+)(?:!|${SCRIPT_SUFFIX_REGEX})*`;

  // Multi-factor with parens: e.g. K^2(K+1)^2, (K+1)^2(K+2)^2, (y-2)^2
  const parenProduct = `(?:[-–—±]?\\s*(?:${simpleTerm}\\s*)?(?:${parenGroup}\\s*)+(?:${simpleTerm})?|${parenGroup})`;

  // Explicit multiplication: e.g. 0! × n!, a × b
  const timesProduct = `(?:[-–—±]?\\s*${simpleTerm}(?:\\s*[*·×]\\s*${simpleTerm})+)`;

  // Any numerator
  const numeratorPattern = `(?:${timesProduct}|${parenProduct}|[-–—±]?\\s*${simpleTerm})`;

  const denominatorPattern = `(?:${parenGroup}|${simpleTerm})`;

  // 3. Bracketed fractions: [ A / B ] -> tall square brackets wrapping fraction
  // e.g. [0! * n! / (n-1)!], [0! × n! / (n-1)!], [a / b]
  const bracketedFracPattern = /\[\s*([^/[\]]+?)\s*\/\s*([^/[\]]+?)\s*\]/gi;
  result = result.replace(bracketedFracPattern, (match, num, den) => {
    if (isFractionBlacklisted(match)) return match;
    const raw = `${num}/${den}`.replace(/\s+/g, "");
    if (isFractionBlacklisted(raw)) return match;
    if (ENGLISH_STOPWORDS.has(num.trim().toLowerCase()) || ENGLISH_STOPWORDS.has(den.trim().toLowerCase())) return match;
    return wrapWithTallBrackets(addFrac(num.trim(), den.trim()));
  });

  // 4. Parenthesized fraction with attached exponent: e.g. (4/100)^8, (a/b)^n, (4/100)⁸
  const parenFracWithExpPattern = new RegExp(
    `\\(\\s*([^/()]+?)\\s*\\/\\s*([^/()]+?)\\s*\\)(${SCRIPT_SUFFIX_REGEX}+)`,
    "gi",
  );
  result = result.replace(parenFracWithExpPattern, (match, num, den, exp) => {
    if (isFractionBlacklisted(match)) return match;
    const raw = `${num}/${den}`.replace(/\s+/g, "");
    if (isFractionBlacklisted(raw)) return match;
    if (ENGLISH_STOPWORDS.has(num.trim().toLowerCase()) || ENGLISH_STOPWORDS.has(den.trim().toLowerCase())) return match;
    return wrapWithTallParentheses(addFrac(num.trim(), den.trim())) + exp;
  });

  // 5. Parenthesized simple fractions without exponent: e.g. (49/10), (1/2), (3/4), (-2/5), (a/b)
  result = result.replace(
    /\(\s*([-–—±]?\s*(?:\d+(?:\.\d+)?|[a-zA-Zα-ωΑ-ΩθΔπβγλμση]+(?:<sup>[^<]+<\/sup>|<sub>[^<]+<\/sub>|\^[0-9a-zA-Z+-]+|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)*))\s*\/\s*([-–—±]?\s*(?:\d+(?:\.\d+)?|[a-zA-Zα-ωΑ-ΩθΔπβγλμση]+(?:<sup>[^<]+<\/sup>|<sub>[^<]+<\/sub>|\^[0-9a-zA-Z+-]+|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)*))\s*\)/g,
    (match, num, den) => {
      if (isFractionBlacklisted(match)) return match;
      const raw = `${num}/${den}`.replace(/\s+/g, "");
      if (isFractionBlacklisted(raw)) return match;
      if (ENGLISH_STOPWORDS.has(num.trim().toLowerCase()) || ENGLISH_STOPWORDS.has(den.trim().toLowerCase())) return match;
      return addFrac(num, den);
    },
  );

  // 6. Multi-factor composite numerator slash fraction:
  // e.g. K²(K+1)² / 4, (K+1)²(K+2)² / 4, (K+1)³(K+2)³ / 4, (y - 2)^2 / 25, (-a)<sup>n</sup> / a, 6a³b⁴ / 3a²b, 1/2
  const prefixClass = `(?:^|[-+=<\\s*·×±≤≥({\\[,:>«\\uE009]+)`;
  const suffixClass = `(?=[\\s=+\\-)}\\],;.<({\\[«\\uE008]|$)`;

  const fracRegex = new RegExp(`(${prefixClass})(${numeratorPattern})\\s*\\/\\s*(${denominatorPattern})(${suffixClass})`, "g");

  result = result.replace(fracRegex, (fullMatch, prefix, num, den) => {
    if (num.includes("§FRAC") || den.includes("§FRAC")) return fullMatch;
    const raw = `${num}/${den}`.replace(/\s+/g, "");
    if (isFractionBlacklisted(raw) || isFractionBlacklisted(fullMatch.trim())) return fullMatch;
    if (ENGLISH_STOPWORDS.has(num.trim().toLowerCase()) || ENGLISH_STOPWORDS.has(den.trim().toLowerCase())) return fullMatch;

    // Allow calculus differentials (dθ, dt, dx, dy, dP, dT, ΔL, ΔT, etc.)
    const isDifferential =
      /^(?:[-–—±]?d[a-zA-Zα-ωΑ-ΩθΔπ]|[-–—±]?Δ[a-zA-Zα-ωΑ-Ωθ])$/.test(num.trim()) ||
      /^(?:d[a-zA-Zα-ωΑ-ΩθΔπ]|Δ[a-zA-Zα-ωΑ-Ωθ])$/.test(den.trim());

    // Don't match generic multi-letter words like he/she unless they are differentials
    if (!isDifferential && /^[a-zA-Z]{3,}$/.test(num.trim()) && /^[a-zA-Z]{3,}$/.test(den.trim())) return fullMatch;
    // Don't match dates e.g. 2024/2025
    if (/^\d{4}$/.test(num.trim()) && /^\d{2,4}$/.test(den.trim())) return fullMatch;

    return prefix + addFrac(num, den);
  });

  // Restore placeholders to rendered HTML
  result = result.replace(/§FRAC(\d+)§/g, (_, id) => fractions[Number(id)]);

  // Restore protected HTML tags
  result = result.replace(/\uE008(\d+)\uE009/g, (_, id) => htmlTags[Number(id)]);

  return result;
}



/**
 * Convert conjugate and overline notations into a horizontal bar at the top:
 * - conj(z₁ + z₂) → horizontal bar over z₁ + z₂
 * - conj(z₁) → horizontal bar over z₁
 * - \overline{...} → horizontal bar over ...
 * - \bar{...} → horizontal bar over ...
 */
export function convertConjugatesToHTML(text: string): string {
  if (!text) return text;
  let result = text;

  // 1. Support LaTeX \overline{...}, \widebar{...}, \overbar{...}, and \bar{...}
  let depthLimit = 5;
  while (
    (result.includes("\\overline") ||
      result.includes("\\widebar") ||
      result.includes("\\overbar") ||
      result.includes("\\bar{") ||
      /\\bar\s+[a-zA-Z0-9_]/.test(result)) &&
    depthLimit-- > 0
  ) {
    result = result.replace(
      /\\(?:overline|widebar|overbar)\s*\{([^{}]+)\}/g,
      (_m, inner) => buildOverlineHTML(inner),
    );
    result = result.replace(/\\bar\s*\{([^{}]+)\}/g, (_m, inner) =>
      buildOverlineHTML(inner),
    );
    result = result.replace(/\\bar\s*([a-zA-Z0-9_]+)/g, (_m, inner) =>
      buildOverlineHTML(inner),
    );
  }
  result = result.replace(/\\bar\s*([a-zA-Z0-9_]+)/g, (_m, inner) =>
    buildOverlineHTML(inner),
  );

  // 2. Match "conj(...)" with support for nested parentheses
  const conjRegex = /\bconj\s*\(/gi;
  let match: RegExpExecArray | null;

  while ((match = conjRegex.exec(result)) !== null) {
    const startIndex = match.index;
    const openParenIndex = startIndex + match[0].length - 1;

    let depth = 1;
    let closeParenIndex = -1;
    for (let i = openParenIndex + 1; i < result.length; i++) {
      if (result[i] === "(") {
        depth++;
      } else if (result[i] === ")") {
        depth--;
        if (depth === 0) {
          closeParenIndex = i;
          break;
        }
      }
    }

    if (closeParenIndex !== -1) {
      const innerContent = result
        .substring(openParenIndex + 1, closeParenIndex)
        .trim();
      const replacement = buildOverlineHTML(innerContent);
      result =
        result.substring(0, startIndex) +
        replacement +
        result.substring(closeParenIndex + 1);
      conjRegex.lastIndex = startIndex + replacement.length;
    } else {
      conjRegex.lastIndex = openParenIndex + 1;
    }
  }

  return result;
}

/**
 * Render LaTeX table array (e.g. grouped frequency distributions)
 */
function buildArrayTableHTML(body: string): string {
  const cleanBody = body.replace(/\\(?:hline|cline\{[^}]*\})/gi, "").trim();
  const rawRows = cleanBody.split(/\\\\|\n/).map((r) => r.trim()).filter(Boolean);
  if (rawRows.length === 0) return body;

  const rows = rawRows
    .map((row) =>
      row
        .split(/&amp;|&/i)
        .map((cell) => cell.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim())
        .filter((c) => c !== "")
    )
    .filter((row) => row.length > 0);

  if (rows.length === 0) return body;

  const rowsHtml = rows
    .map((row, rIdx) => {
      const isHeader = rIdx === 0 && rows.length > 1;
      const tag = isHeader ? "th" : "td";
      const bgStyle = isHeader ? "background-color:rgba(128,128,128,0.08);font-weight:600;" : "";
      const cellsHtml = row
        .map(
          (cell) =>
            `<${tag} style="border:1px solid currentColor;padding:4px 10px;text-align:center;white-space:nowrap;${bgStyle}">${cell}</${tag}>`
        )
        .join("");
      return `<tr>${cellsHtml}</tr>`;
    })
    .join("");

  return `<span style="display:inline-block;overflow-x:auto;vertical-align:middle;margin:4px 0;"><table style="border-collapse:collapse;border:1px solid currentColor;display:inline-table;font-size:0.92em;text-align:center;"><tbody>${rowsHtml}</tbody></table></span>`;
}

function formatMatrixCell(cell: string): string {
  let c = cell.trim();
  c = convertVectorsToHTML(c);
  c = convertFractionsToHTML(c);
  return c;
}

/**
 * Render a parsed matrix (rows of cell strings) as an inline HTML table
 * flanked by bracket bars.
 */
function buildMatrixHTML(rows: string[][]): string {
  const rowsHTML = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) => {
              const trimmed = cell.trim();
              if (trimmed === "|" || trimmed === "&#124;" || trimmed === "\\vert" || trimmed === "\\mid") {
                return `<td style="padding:0 6px;width:1px;border-left:1.8px solid currentColor;vertical-align:middle;"></td>`;
              }
              return `<td style="padding:2px 8px;text-align:center;white-space:nowrap;line-height:1.3;">${formatMatrixCell(cell)}</td>`;
            }
          )
          .join("")}</tr>`,
    )
    .join("");

  return (
    `<span style="display:inline-flex;align-items:stretch;vertical-align:middle;margin:0 3px;line-height:1;">` +
    `<span style="display:inline-block;width:5px;border-top:2px solid currentColor;border-bottom:2px solid currentColor;border-left:2px solid currentColor;border-radius:2px 0 0 2px;margin-right:2px;align-self:stretch;"></span>` +
    `<table style="border-collapse:collapse;margin:0;line-height:1.3;font-size:inherit;"><tbody>${rowsHTML}</tbody></table>` +
    `<span style="display:inline-block;width:5px;border-top:2px solid currentColor;border-bottom:2px solid currentColor;border-right:2px solid currentColor;border-radius:0 2px 2px 0;margin-left:2px;align-self:stretch;"></span>` +
    `</span>`
  );
}

/**
 * Render a parsed determinant (rows of cell strings) as an inline HTML table
 * flanked by single straight vertical bars.
 */
function buildDeterminantHTML(rows: string[][]): string {
  const rowsHTML = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="padding:2px 8px;text-align:center;white-space:nowrap;line-height:1.3;">${formatMatrixCell(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  return (
    `<span style="display:inline-flex;align-items:stretch;vertical-align:middle;margin:0 3px;line-height:1;">` +
    `<span style="display:inline-block;width:2px;border-left:2px solid currentColor;margin-right:2px;align-self:stretch;"></span>` +
    `<table style="border-collapse:collapse;margin:0;line-height:1.3;font-size:inherit;"><tbody>${rowsHTML}</tbody></table>` +
    `<span style="display:inline-block;width:2px;border-right:2px solid currentColor;margin-left:2px;align-self:stretch;"></span>` +
    `</span>`
  );
}

/**
 * Render a parsed parenthesized matrix (rows of cell strings) as an inline HTML table
 * flanked by curved full-height round brackets.
 */
function buildParenthesizedMatrixHTML(rows: string[][]): string {
  const rowsHTML = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="padding:2px 8px;text-align:center;white-space:nowrap;line-height:1.3;">${formatMatrixCell(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  return (
    `<span style="display:inline-flex;align-items:stretch;vertical-align:middle;margin:0 3px;line-height:1;">` +
    `<svg viewBox="0 0 8 32" preserveAspectRatio="none" style="width:0.42em;min-width:6px;max-width:9px;height:auto;align-self:stretch;flex-shrink:0;vertical-align:middle;margin-right:2px;" aria-hidden="true"><path d="M 6.5,1.2 Q 1,16 6.5,30.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" vector-effect="non-scaling-stroke"></path></svg>` +
    `<table style="border-collapse:collapse;margin:0;line-height:1.3;font-size:inherit;"><tbody>${rowsHTML}</tbody></table>` +
    `<svg viewBox="0 0 8 32" preserveAspectRatio="none" style="width:0.42em;min-width:6px;max-width:9px;height:auto;align-self:stretch;flex-shrink:0;vertical-align:middle;margin-left:2px;" aria-hidden="true"><path d="M 1.5,1.2 Q 7,16 1.5,30.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" vector-effect="non-scaling-stroke"></path></svg>` +
    `</span>`
  );
}


function replaceBalancedFractions(text: string): string {
  let result = text;
  const fracRegex = /\\(?:frac|dfrac|tfrac)\b/g;
  let safety = 300;
  while (safety-- > 0) {
    fracRegex.lastIndex = 0;
    const match = fracRegex.exec(result);
    if (!match) break;
    const fracIdx = match.index;
    let i = fracIdx + match[0].length;
    while (i < result.length && /\s/.test(result[i])) i++;
    
    let num = "";
    if (result[i] === "{") {
      let depth = 1;
      const numStart = ++i;
      while (i < result.length && depth > 0) {
        if (result[i] === "{") depth++;
        else if (result[i] === "}") depth--;
        i++;
      }
      if (depth !== 0) break;
      num = result.substring(numStart, i - 1);
    } else {
      const singleMatch = result.substring(i).match(/^([a-zA-Z0-9]+)/);
      if (!singleMatch) break;
      num = singleMatch[1];
      i += num.length;
    }

    while (i < result.length && /\s/.test(result[i])) i++;

    let den = "";
    if (result[i] === "{") {
      let depth = 1;
      const denStart = ++i;
      while (i < result.length && depth > 0) {
        if (result[i] === "{") depth++;
        else if (result[i] === "}") depth--;
        i++;
      }
      if (depth !== 0) break;
      den = result.substring(denStart, i - 1);
    } else {
      const singleMatch = result.substring(i).match(/^([a-zA-Z0-9]+)/);
      if (!singleMatch) break;
      den = singleMatch[1];
      i += den.length;
    }

    const before = result.substring(0, fracIdx);
    const after = result.substring(i);
    result = `${before}(${num.trim()}) / (${den.trim()})${after}`;
  }
  return result;
}

function replaceBalancedBinomials(text: string): string {
  let result = text;
  const binomRegex = /\\binom\b/g;
  let safety = 300;
  while (safety-- > 0) {
    binomRegex.lastIndex = 0;
    const match = binomRegex.exec(result);
    if (!match) break;
    const idx = match.index;
    let i = idx + match[0].length;
    while (i < result.length && /\s/.test(result[i])) i++;

    let n = "";
    if (result[i] === "{") {
      let depth = 1;
      const start = ++i;
      while (i < result.length && depth > 0) {
        if (result[i] === "{") depth++;
        else if (result[i] === "}") depth--;
        i++;
      }
      if (depth !== 0) break;
      n = result.substring(start, i - 1);
    } else {
      const singleMatch = result.substring(i).match(/^([a-zA-Z0-9]+)/);
      if (!singleMatch) break;
      n = singleMatch[1];
      i += n.length;
    }

    while (i < result.length && /\s/.test(result[i])) i++;

    let r = "";
    if (result[i] === "{") {
      let depth = 1;
      const start = ++i;
      while (i < result.length && depth > 0) {
        if (result[i] === "{") depth++;
        else if (result[i] === "}") depth--;
        i++;
      }
      if (depth !== 0) break;
      r = result.substring(start, i - 1);
    } else {
      const singleMatch = result.substring(i).match(/^([a-zA-Z0-9]+)/);
      if (!singleMatch) break;
      r = singleMatch[1];
      i += r.length;
    }

    const before = result.substring(0, idx);
    const after = result.substring(i);
    const binomHtml = `<span class="math-binom" style="display:inline-flex;flex-direction:row;align-items:center;vertical-align:middle;margin:0 2px;"><span style="font-size:1.2em;line-height:1;font-weight:300;">(</span><span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.1;font-size:0.88em;padding:0 2px;"><span style="display:inline-block;white-space:nowrap;">${n.trim()}</span><span style="display:inline-block;white-space:nowrap;">${r.trim()}</span></span><span style="font-size:1.2em;line-height:1;font-weight:300;">)</span></span>`;
    result = `${before}${binomHtml}${after}`;
  }
  return result;
}

function replaceBalancedRadicals(text: string): string {
  let result = text;
  let safety = 300;
  while (safety-- > 0) {
    const sqrtIdx = result.indexOf("\\sqrt");
    if (sqrtIdx === -1) break;
    let i = sqrtIdx + 5;
    while (i < result.length && /\s/.test(result[i])) i++;
    
    let indexArg: string | null = null;
    if (result[i] === "[") {
      const closeBracket = result.indexOf("]", i);
      if (closeBracket !== -1) {
        indexArg = result.substring(i + 1, closeBracket);
        i = closeBracket + 1;
        while (i < result.length && /\s/.test(result[i])) i++;
      }
    }

    let inner = "";
    if (result[i] === "{") {
      let depth = 1;
      const start = ++i;
      while (i < result.length && depth > 0) {
        if (result[i] === "{") depth++;
        else if (result[i] === "}") depth--;
        i++;
      }
      if (depth !== 0) break;
      inner = result.substring(start, i - 1);
    } else {
      const singleMatch = result.substring(i).match(/^([a-zA-Z0-9]+)/);
      if (!singleMatch) break;
      inner = singleMatch[1];
      i += inner.length;
    }

    const before = result.substring(0, sqrtIdx);
    const after = result.substring(i);
    if (indexArg) {
      result = `${before}${buildRadicalHTML(indexArg, inner)}${after}`;
    } else {
      result = `${before}√(${inner.trim()})${after}`;
    }
  }
  return result;
}

/**
 * Convert mathematical notation to HTML with proper superscripts
 */
function preprocessLaTeX(text: string): string {
  if (!text) return text;
  let result = text;

  // 0. Normalize double/multiple escaped backslashes before LaTeX macros or symbols
  // e.g. \\rightleftharpoons -> \rightleftharpoons, \\frac -> \frac, \\sqrt -> \sqrt, \\alpha -> \alpha
  result = result.replace(/\\\\+([a-zA-Z]+|[{}_\^])/g, "\\$1");

  // Separate adjacent concatenated backslash macros (e.g. \sin\alpha\cos\beta -> \sin \alpha \cos \beta)
  result = result.replace(/(\\[a-zA-Z]+)(?=\\[a-zA-Z]+)/g, "$1 ");
  result = result.replace(/\\(pm|mp)(?=[a-zA-Z\\])/g, "$1 ");

  // Unwrap mhchem \ce{...}
  result = result.replace(/\\ce\s*\{([^}]+)\}/g, "$1");

  // Normalize stored HTML math entities before pattern matching.
  result = result
    .replace(/&radic;/gi, "√")
    .replace(/&pi;/gi, "π")
    .replace(/&theta;/gi, "θ")
    .replace(/&phi;/gi, "φ")
    .replace(/&Sigma;/g, "Σ")
    .replace(/&times;/gi, "×")
    .replace(/&divide;/gi, "÷")
    .replace(/&frasl;/gi, "/")
    .replace(/&plusmn;/gi, "±")
    .replace(/&minus;/gi, "-")
    .replace(/&deg;/gi, "°")
    .replace(/&ang(?:le)?;/gi, "∠")
    .replace(/\b([Ii])\s*\/\s*([Oo])\b/g, "$1/$2");

  // Fix OCR/typos where end{environment} is missing leading backslash
  result = result.replace(/(?<!\\)end\{(align\*?|aligned|gather\*?|matrix|bmatrix|pmatrix|vmatrix|cases)\}/gi, "\\end{$1}");

  // Multi-line LaTeX environments (align, aligned, gather, cases)
  result = result.replace(/\\begin\{(?:align\*?|aligned|gather\*?)\}([\s\S]*?)\\end\{(?:align\*?|aligned|gather\*?)\}/gi, (_m, body) => {
    return body
      .trim()
      .split(/\\\\/)
      .map((line: string) => line.replace(/&amp;|&/g, " ").trim())
      .filter(Boolean)
      .join("<br />");
  });

  result = result.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/gi, (_m, body) => {
    const lines = body
      .trim()
      .split(/\\\\/)
      .map((line: string) => {
        const parts = line.split(/&amp;|&/);
        if (parts.length > 1) {
          return parts.map((p: string) => p.trim()).join("&nbsp;&nbsp;");
        }
        return line.trim();
      })
      .filter(Boolean);
    return `<span class="math-cases" style="display:inline-flex;align-items:center;vertical-align:middle;margin:0 4px;"><span style="font-size:1.6em;line-height:1;margin-right:2px;font-weight:200;">{</span><span style="display:inline-flex;flex-direction:column;align-items:flex-start;line-height:1.4;">${lines.map((l: string) => `<span>${l}</span>`).join("")}</span></span>`;
  });

  // Normalize limit notation into a placeholder so later subscript and
  // fraction conversions cannot split the approach expression apart.
  result = result
    .replace(/\\lim\s*_\s*\{([^{}]+)\}/gi, "(limit=$1)")
    .replace(/\\lim\s*_\s*([a-zA-Z0-9\\]+)/gi, "(limit=$1)")
    .replace(/\blim\s*<sub>\s*([^<]+)\s*<\/sub>/gi, "(limit=$1)")
    .replace(/\blim\s*_\s*\{([^{}]+)\}/gi, "(limit=$1)")
    .replace(/\blim\s*_\s*\(([^()]+)\)/gi, "(limit=$1)")
    .replace(/\blim\s*\(\s*([^()]*(?:→|\\to\b|\\rightarrow\b|-&gt;|->)[^()]*)\s*\)/gi, "(limit=$1)");

  // Normalize definite integral notation into a placeholder
  result = result
    .replace(/\\int\s*_\s*\{([^{}]+)\}\s*\^\s*\{([^{}]+)\}/g, "(integral=lower:$1, upper:$2)")
    .replace(/\\int\s*\^\s*\{([^{}]+)\}\s*_\s*\{([^{}]+)\}/g, "(integral=lower:$2, upper:$1)")
    .replace(/\\int\s*_\s*([a-zA-Z0-9πθ\-]+)\s*\^\s*([a-zA-Z0-9πθ\-]+)/g, "(integral=lower:$1, upper:$2)")
    .replace(/\\int\s*\^\s*([a-zA-Z0-9πθ\-]+)\s*_\s*([a-zA-Z0-9πθ\-]+)/g, "(integral=lower:$2, upper:$1)")
    .replace(/\\int\s*_\s*\{([^{}]+)\}\s*\^\s*([a-zA-Z0-9πθ\-]+)/g, "(integral=lower:$1, upper:$2)")
    .replace(/\\int\s*_\s*([a-zA-Z0-9πθ\-]+)\s*\^\s*\{([^{}]+)\}/g, "(integral=lower:$1, upper:$2)")
    .replace(/\\int\s*\^\s*\{([^{}]+)\}\s*_\s*([a-zA-Z0-9πθ\-]+)/g, "(integral=lower:$2, upper:$1)")
    .replace(/\\int\s*\^\s*([a-zA-Z0-9πθ\-]+)\s*_\s*\{([^{}]+)\}/g, "(integral=lower:$2, upper:$1)")
    .replace(/\\int\b/g, "∫");

  // Unicode integral patterns
  result = result
    .replace(/∫\s*\(\s*<sub>\s*([^-<]*[-–—]?)\s*<\/sub>\s*([a-zA-Z0-9πθ]+)\s*\)\s*<sup>\s*([^<]+)\s*<\/sup>/g, "(integral=lower:-$2, upper:$3)")
    .replace(/∫\s*<sub>\s*([^<]+)\s*<\/sub>\s*<sup>\s*([^<]+)\s*<\/sup>/g, "(integral=lower:$1, upper:$2)")
    .replace(/∫\s*<sup>\s*([^<]+)\s*<\/sup>\s*<sub>\s*([^<]+)\s*<\/sub>/g, "(integral=lower:$2, upper:$1)")
    .replace(/∫\s*_\s*\{([^{}]+)\}\s*\^\s*\{([^{}]+)\}/g, "(integral=lower:$1, upper:$2)")
    .replace(/∫\s*\^\s*\{([^{}]+)\}\s*_\s*\{([^{}]+)\}/g, "(integral=lower:$2, upper:$1)")
    .replace(/∫\s*_([a-zA-Z0-9πθ\-]+)\s*\^([a-zA-Z0-9πθ\-]+)/g, "(integral=lower:$1, upper:$2)")
    .replace(/∫\s*\^([a-zA-Z0-9πθ\-]+)\s*_([a-zA-Z0-9πθ\-]+)/g, "(integral=lower:$2, upper:$1)")
    .replace(/∫\s*\(stacked=(?:sup:([^,)]+),\s*sub:([^,)]+)|sub:([^,)]+),\s*sup:([^,)]+))\)/g, (_m, s1, b1, b2, s2) => {
      const up = s1 || s2;
      const lo = b1 || b2;
      return `(integral=lower:${lo}, upper:${up})`;
    });

  // Pre-process fractional exponents (e.g. e^-\frac{t}{RC}, x^\frac{1}{2}, e^-t/RC) into balanced braced superscripts
  // so they are not fragmented by downstream fraction or vector conversion
  result = result.replace(/\^-\s*\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "^{-\\frac{$1}{$2}}");
  result = result.replace(/\^\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "^{\\frac{$1}{$2}}");
  result = result.replace(/(?<=[a-zA-Z0-9α-ωΑ-Ω)\]}])\^-\s*([a-zA-Z0-9α-ωΑ-Ω]+)\/([a-zA-Z0-9α-ωΑ-Ω]+)(?![a-zA-Z0-9_])/g, "^{-\\frac{$1}{$2}}");
  result = result.replace(/(?<=[a-zA-Z0-9α-ωΑ-Ω)\]}])\^([a-zA-Z0-9α-ωΑ-Ω]+)\/([a-zA-Z0-9α-ωΑ-Ω]+)(?![a-zA-Z0-9_])/g, "^{\\frac{$1}{$2}}");
  result = result.replace(/\^\{\s*-\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\/\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\}/g, "^{-\\frac{$1}{$2}}");
  result = result.replace(/\^\{\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\/\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\}/g, "^{\\frac{$1}{$2}}");
  result = result.replace(/([a-zA-Z0-9α-ωΑ-Ω)\]}])\^\s*-?\s*\(\s*-\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\/\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\)/g, "$1^{-\\frac{$2}{$3}}");
  result = result.replace(/([a-zA-Z0-9α-ωΑ-Ω)\]}])\^\s*-\s*\(\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\/\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\)/g, "$1^{-\\frac{$2}{$3}}");
  result = result.replace(/([a-zA-Z0-9α-ωΑ-Ω)\]}])\^\s*\(\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\/\s*([a-zA-Z0-9α-ωΑ-Ω]+)\s*\)/g, "$1^{\\frac{$2}{$3}}");

  // Math and physics variable subscripts: Q_max, V_0, I_rms, v_avg, P_max, k_B, N_A, R_eq, E_k, \lambda_max, \theta_0, etc.
  const greekMathName = /^(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Delta|Theta|Lambda|Sigma|Phi|Psi|Omega)$/i;
  result = result.replace(/\b([a-zA-Zα-ωΑ-Ω]|\\?[a-zA-Z]+)_([a-zA-Z0-9α-ωΑ-Ω]+)\b/g, (m, base, sub) => {
    if (sub.toLowerCase() === "hat" || sub.toLowerCase() === "cap") return m;
    const isG = greekMathName.test(base.replace(/^\\/, ""));
    const isSingle = base.length === 1;
    const isKnownSub = /^(?:max|min|avg|rms|in|out|net|total|eff|eq|initial|final|peak|ref|res|ind|cap|cell|rad|rel|cm|ext|int|th|emf|src|load|sat|crit|kin|pot|rest|loss|gain|opt|dir|elec|mag|grav|orbit|escape|trans|rot|vib|stp|std|vap|fus|sub|auto|air|water|ice|earth|sun|moon|\d+|[a-zA-Z]{1,2})$/i.test(sub);

    if ((isSingle || isG) && (isKnownSub || sub.length <= 4)) {
      if (isG) {
        return `\\${base.replace(/^\\/, "")}_{${sub}}`;
      }
      return `${base}_{${sub}}`;
    }
    return m;
  });

  // 1. Binomial coefficients: \binom{n}{r} -> (<div ...>)
  result = replaceBalancedBinomials(result);

  // 2. Recursive LaTeX fractions with balanced braces: \frac{a}{b}, \dfrac{a}{b}, \tfrac{a}{b} -> (a) / (b)
  result = replaceBalancedFractions(result);

  // 3. LaTeX radicals with balanced braces: \sqrt[n]{x} or \sqrt{x}
  result = replaceBalancedRadicals(result);

  // 2. LaTeX array environment (e.g. grouped frequency distributions \begin{array}{|c|c|...} ... \end{array})
  result = result.replace(
    /\\begin\{array\}(?:\{[^}]*\})?([\s\S]*?)\\end\{array\}/gi,
    (_m, body) => buildArrayTableHTML(body),
  );

  // Fix OCR/typos where end{environment} is missing leading backslash
  result = result.replace(/(?<!\\)end\{(align\*?|aligned|gather\*?|matrix|bmatrix|pmatrix|vmatrix|cases)\}/gi, "\\end{$1}");

  // 3. LaTeX matrix / determinant environments
  // Convert |\begin{bmatrix}...| or |\begin{matrix}...| into \begin{vmatrix}...
  result = result.replace(/(?:\\left\||\|)\s*(?:\$)?\s*\\begin\{(?:bmatrix|pmatrix|matrix|smallmatrix|vmatrix|Vmatrix|Bmatrix)\}([\s\S]*?)\\end\{(?:bmatrix|pmatrix|matrix|smallmatrix|vmatrix|Vmatrix|Bmatrix)\}\s*(?:\$)?\s*(?:\\right\||\|)/gi, (_m, body) => {
    return `\\begin{vmatrix}${body}\\end{vmatrix}`;
  });

  // Convert \det\begin{bmatrix}... or \det(\begin{bmatrix}...) into \begin{vmatrix}...
  result = result.replace(/(?:\\det\b|det\b)\s*\(?\s*\\begin\{(?:bmatrix|pmatrix|matrix|smallmatrix|vmatrix|Vmatrix|Bmatrix)\}([\s\S]*?)\\end\{(?:bmatrix|pmatrix|matrix|smallmatrix|vmatrix|Vmatrix|Bmatrix)\}\s*\)?/gi, (_m, body) => {
    return `\\begin{vmatrix}${body}\\end{vmatrix}`;
  });

  result = result.replace(/\\begin\{(?:vmatrix|Vmatrix)\}([\s\S]*?)\\end\{(?:vmatrix|Vmatrix)\}/gi, (_m, body) => {
    const rows = body
      .trim()
      .split(/\\\\|\n/)
      .map((row: string) => {
        const cells = row
          .split(/&amp;|&/i)
          .map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim())
          .filter((c: string) => c !== "");
        return `[${cells.join(", ")}]`;
      })
      .filter((r: string) => r !== "[]");
    return `|${rows.join(", ")}|`;
  });

  result = result.replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/gi, (_m, body) => {
    const rows = body
      .trim()
      .split(/\\\\|\n/)
      .map((row: string) => {
        const cells = row
          .split(/&amp;|&/i)
          .map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim())
          .filter((c: string) => c !== "");
        return `[${cells.join(", ")}]`;
      })
      .filter((r: string) => r !== "[]");
    return `(${rows.join(", ")})`;
  });

  result = result.replace(/\\begin\{(?:bmatrix|matrix|smallmatrix|Bmatrix)\}([\s\S]*?)\\end\{(?:bmatrix|matrix|smallmatrix|Bmatrix)\}/gi, (_m, body) => {
    const rows = body
      .trim()
      .split(/\\\\|\n/)
      .map((row: string) => {
        const cells = row
          .split(/&amp;|&/i)
          .map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim())
          .filter((c: string) => c !== "");
        return `[${cells.join(", ")}]`;
      })
      .filter((r: string) => r !== "[]");
    return `[${rows.join(", ")}]`;
  });

  // Helper to parse multi-row matrix/determinant bodies with \\, \ (with space), ;, or \n
  const parseDelimitedMatrixRows = (body: string): string[][] | null => {
    const trimmed = body.trim();
    if (!trimmed) return null;

    // Never parse text containing HTML entities (like &quot;, &#39;, &amp;) as a matrix
    if (/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/.test(trimmed)) return null;

    // Normalize detached signs before digits or symbols e.g. "- 1" -> "-1", "+ 2" -> "+2"
    const normalized = trimmed.replace(/(?<=^|[\s,&;\\|])([+-])\s+(\d+|[a-zA-Zα-ωΑ-Ω])/g, "$1$2");

    // Split rows by \\, \n, ;, or single \ followed by whitespace/end
    const rawRows = normalized
      .split(/(?:\\{2,}|\n|;|\s*\\(?=\s|$))/)
      .map((r: string) => r.trim())
      .filter(Boolean);

    if (rawRows.length < 2) return null;

    const hasAmp = rawRows.some((r: string) => /&amp;|&|\\amp\b|\bamp;/i.test(r));
    const hasComma = !hasAmp && rawRows.some((r: string) => r.includes(","));

    const parsedRows: string[][] = [];
    for (const r of rawRows) {
      let cells: string[];
      if (hasAmp) {
        cells = r
          .split(/&amp;|&|\\amp\b|\bamp;/i)
          .map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim())
          .filter((c: string) => c !== "");
      } else if (hasComma) {
        cells = r.split(",").map((c: string) => c.trim()).filter(Boolean);
      } else {
        cells = r.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
      }
      if (cells.length === 0) return null;
      parsedRows.push(cells);
    }

    const firstLen = parsedRows[0].length;
    if (firstLen === 0) return null;
    if (!parsedRows.every((row) => row.length === firstLen)) return null;

    // Reject prose: if any cell is or contains normal multi-letter words (not math symbols/numbers)
    const hasProseWords = parsedRows.some((row) =>
      row.some((cell) =>
        /\b(?:pronounced|quot|sharp|and|the|for|with|from|that|this|these|those|which|where|when|what|how|why|type|modern|object|class|method)\b/i.test(cell) ||
        (cell.length > 5 && !/[0-9+\-*\/=^_\\]/.test(cell)),
      ),
    );
    if (hasProseWords) return null;

    return parsedRows;
  };

  // Convert bracketed multiline matrices: [ 1 2 4 \ -1 2 5 \ 0 1 -1 ] or [ 1, 2 ; 3, 4 ] or [ 1 & 2 \\ 3 & 4 ]
  result = result.replace(/\[\s*([^[\]]+?(?:\\{2,}|\n|;|\s*\\(?=\s|$))[^[\]]+?)\s*\]/g, (match, body) => {
    const rows = parseDelimitedMatrixRows(body);
    if (rows) {
      return `[${rows.map((r) => `[${r.join(", ")}]`).join(", ")}]`;
    }
    return match;
  });

  // Convert parenthesized multiline matrices: ( 1 2 4 \ -1 2 5 \ 0 1 -1 ) or ( 1, 2 ; 3, 4 )
  result = result.replace(/\(\s*([^()]+?(?:\\{2,}|\n|;|\s*\\(?=\s|$))[^()]+?)\s*\)/g, (match, body) => {
    const rows = parseDelimitedMatrixRows(body);
    if (rows) {
      return `(${rows.map((r) => `[${r.join(", ")}]`).join(", ")})`;
    }
    return match;
  });

  // Convert determinant vertical bars: | 1 2 4 \ -1 2 5 \ 0 1 -1 | or | 1 2 ; 3 4 |
  result = result.replace(/\|\s*([^|]+?(?:\\{2,}|\n|;|\s*\\(?=\s|$))[^|]+?)\s*\|/g, (match, body) => {
    const rows = parseDelimitedMatrixRows(body);
    if (rows) {
      return `|${rows.map((r) => `[${r.join(", ")}]`).join(", ")}|`;
    }
    return match;
  });

  // Convert raw matrix text like [ 1 amp; 5 amp; 8 ] or [ 1 & 5 & 8 ] into [[1, 5, 8]]
  result = result.replace(/\[\s*([^[\]]+?(?:&amp;|&|\bamp;)[^[\]]+?)\s*\]/gi, (match, body) => {
    const cells = body
      .split(/&amp;|&|\bamp;|,/i)
      .map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim())
      .filter((c: string) => c !== "");
    if (cells.length > 1) {
      return `[[${cells.join(", ")}]]`;
    }
    return match;
  });

  // Convert space-separated row matrix literals like [ 1 2 3 ] or [ a b c ] into [[1, 2, 3]]
  result = result.replace(/\[\s*([a-zA-Z0-9α-ωΑ-Ω\-+]+(?:\s+[a-zA-Z0-9α-ωΑ-Ω\-+]+)+)\s*\]/g, (match, body) => {
    const cells = body.split(/\s+/).map((c: string) => c.trim()).filter(Boolean);
    if (cells.length >= 2 && cells.every((c: string) => /^[-+]?(?:\d+(?:\.\d+)?|[a-zA-Zα-ωΑ-Ω])$/.test(c))) {
      return `[[${cells.join(", ")}]]`;
    }
    return match;
  });

  // Transpose notation: A^\top, A^\intercal, A^T, A^t, [ ... ]^\top, [ ... ](transpose), [ ... ] (transpose)
  result = result.replace(/\\\^/g, "^");
  result = result.replace(/\^\\top\b/g, "^t");
  result = result.replace(/\^\\intercal\b/g, "^t");
  result = result.replace(/\^\{\\top\}/g, "^t");
  result = result.replace(/\^\{\\intercal\}/g, "^t");
  result = result.replace(/(?<=[a-zA-Z0-9α-ωΑ-Ω\)\]§\}\>])\s*(?:\^\s*)?\(?\s*(?:transpose|transposed)\s*\)?(?![a-zA-Z])/gi, "^t");

  // Convert det([[...]]) or det([a, b], [c, d]) function notation to standard determinant vertical bars |[...]
  result = result.replace(/(?:\\det\b|det\b)\s*\(?\s*\[?\s*(\[[^[\]]+\](?:\s*,\s*\[[^[\]]+\])*)\s*\]?\s*\)?/gi, (_m, body) => `|${body}|`);

  // Format question equality colon `=:` or `= :` with proper spacing e.g. " = :"
  result = result.replace(/\s*=(?::\s*|:\s*$)/g, " = : ");
  result = result.replace(/(?<=\S)=:(?=\s|$)/g, " = : ");

  // Convert remaining standalone LaTeX line breaks (\\) to <br />
  result = result.replace(/\\\\+/g, "<br />");

  // Normalize Unicode subscript numbers and characters (r₁ -> r_{1}, r₂ -> r_{2})
  result = result.replace(/([a-zA-Zα-ωΑ-Ω])([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ]+)/g, (_m, base, subs) => {
    const norm = subs.split("").map((c: string) => UNICODE_SUB_TO_ASCII[c] ?? c).join("");
    return `${base}_{${norm}}`;
  });

  // Normalize Unicode superscript characters (x² -> x^{2}, m² -> m^{2})
  result = result.replace(/([a-zA-Z0-9α-ωΑ-Ω)\]}])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃ-ᶻ]+)/g, (_m, base, sups) => {
    const norm = sups.split("").map((c: string) => UNICODE_SUP_TO_ASCII[c] ?? c).join("");
    return `${base}^{${norm}}`;
  });

  // Convert physical variables followed by single digits (r1, r2, C1, C2, v1, v2, t1, t2, q1, q2) into subscripts
  result = result.replace(/\b([rRcCvVqQmMIiFfTtPpXxYyZzkKaAdDsS])([1-9])\b/g, (match, letter, digit) => {
    if (letter === "A" && (digit === "3" || digit === "4" || digit === "5")) return match;
    if (letter === "B" && (digit === "4" || digit === "5")) return match;
    return `${letter}_{${digit}}`;
  });

  // Convert Greek variable subscripts without underscore: epsilon0, lambda1, theta2, omega1, mu0, etc.
  result = result.replace(
    /\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|rho|sigma|tau|upsilon|phi|chi|psi|omega)([0-9])\b/gi,
    (_m, name, digit) => {
      return `\\${name}_{${digit}}`;
    },
  );

  // Convert Greek variable names before exponents: omega^2 -> \omega^2, theta^2 -> \theta^2, etc.
  result = result.replace(
    /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\s*\^/gi,
    "\\$1^",
  );

  // Convert Greek variable names with trig functions (including powers): sin alpha, sec^2 phi, cos² omega, etc.
  result = result.replace(
    /\b(sin|cos|tan|sec|csc|cot)(?:<sup>[^<]+<\/sup>|\^[0-9a-zA-Z+-]+|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?\s+(?<!\\)(alpha|beta|gamma|phi|omega)\b/gi,
    "$1 \\$2",
  );

  // Convert Greek variable names in explanation contexts: "- omega is", "where lambda is", "omega = "
  result = result.replace(
    /(^|[-*•]\s+|\b(?:where|and|with)\s+)(?<!\\)(alpha|beta|gamma|delta|epsilon|zeta|eta|lambda|mu|nu|xi|rho|sigma|tau|phi|psi|omega)\s+(is|=|represents)\b/gi,
    (_m, prefix, greek, verb) => `${prefix}\\${greek} ${verb}`,
  );

  // Convert unit vector tokens in plain text: i_hat, j_hat, k_hat, r_hat, n_hat, etc. to LaTeX \hat{i}
  result = result.replace(/\b([ijkrugnvabcxyeIJK])(?:_hat|_cap|\s+hat|\s+cap)\b/gi, (_m, letter) => {
    return `\\hat{${letter.toLowerCase()}}`;
  });

  // Dotless and bold unit vector LaTeX variants: \hat{\imath} -> \hat{i}, \hat{\mathbf{i}} -> \hat{i}
  result = result.replace(/\\hat\s*\{\\?(?:imath|mathbf\{i\}|mathbf\{imath\}|text\{i\}|bm\{i\})\}/gi, "\\hat{i}");
  result = result.replace(/\\hat\s*\{\\?(?:jmath|mathbf\{j\}|mathbf\{jmath\}|text\{j\}|bm\{j\})\}/gi, "\\hat{j}");
  result = result.replace(/\\hat\s*\{\\?(?:mathbf\{k\}|text\{k\}|bm\{k\})\}/gi, "\\hat{k}");
  result = result.replace(/\\hat\s*\\imath\b/gi, "\\hat{i}");
  result = result.replace(/\\hat\s*\\jmath\b/gi, "\\hat{j}");

  // Convert 'pi' in math contexts to π
  result = result.replace(/(?<=[0-9\s+\-*/=()^]|^)pi(?=[0-9\s+\-*/=()^]|$|_[0-9a-zA-Z]|_\{[^}]+\})/g, "π");
  result = result.replace(/(?<![a-zA-Z])\\?(?:pi|varpi)(?![a-zA-Z])/g, "π");
  result = result.replace(/(?<![a-zA-Z])\\?Pi(?![a-zA-Z])/g, "Π");

  // Convert LaTeX \theta and plain 'theta' / 'Theta' in math contexts to Greek θ and Θ
  result = result.replace(/(?<![a-zA-Z])\\?(?:theta|vartheta)(?![a-zA-Z])/gi, "θ");
  result = result.replace(/(?<![a-zA-Z])\\?Theta(?![a-zA-Z])/g, "Θ");
  result = result.replace(/(?<![a-zA-Z])THETA(?![a-zA-Z])/g, "Θ");
  result = result.replace(/(?<![a-zA-Z])\\?θ(?![a-zA-Z])/g, "θ");
  result = result.replace(/(?<![a-zA-Z])\\?Θ(?![a-zA-Z])/g, "Θ");

  // Convert LaTeX \epsilon, \varepsilon and plain 'epsilon' / 'varepsilon' to Greek ε
  result = result.replace(/(?<![a-zA-Z])\\?(?:epsilon|varepsilon)(?![a-zA-Z])/gi, "ε");
  result = result.replace(/(?<![a-zA-Z])\\?ε(?![a-zA-Z])/g, "ε");

  // Convert LaTeX \rho, \varrho and plain 'rho' / 'varrho' to Greek ρ
  result = result.replace(/(?<![a-zA-Z])\\?(?:rho|varrho)(?![a-zA-Z])/gi, "ρ");
  result = result.replace(/(?<![a-zA-Z])\\?ρ(?![a-zA-Z])/g, "ρ");

  // Convert LaTeX \lambda / \Lambda and plain 'lambda' / 'Lambda' to Greek λ / Λ
  result = result.replace(/(?<![a-zA-Z])\\?Lambda(?![a-zA-Z])/g, "Λ");
  result = result.replace(/(?<![a-zA-Z])\\?lambda(?![a-zA-Z])/gi, "λ");
  result = result.replace(/(?<![a-zA-Z])\\?λ(?![a-zA-Z])/g, "λ");
  result = result.replace(/(?<![a-zA-Z])\\?Λ(?![a-zA-Z])/g, "Λ");

  // Convert LaTeX \omega / \Omega and plain 'omega' / 'Omega' to Greek ω / Ω
  result = result.replace(/(?<![a-zA-Z])\\?Omega(?![a-zA-Z])/g, "Ω");
  result = result.replace(/(?<![a-zA-Z])\\?omega(?![a-zA-Z])/gi, "ω");
  result = result.replace(/(?<![a-zA-Z])\\?ω(?![a-zA-Z])/g, "ω");
  result = result.replace(/(?<![a-zA-Z])\\?Ω(?![a-zA-Z])/g, "Ω");

  // Convert LaTeX \mu and plain 'mu' to Greek μ
  result = result.replace(/(?<![a-zA-Z])\\?mu(?![a-zA-Z])/gi, "μ");
  result = result.replace(/(?<![a-zA-Z])\\?μ(?![a-zA-Z])/g, "μ");

  // Convert LaTeX \sigma / \Sigma and plain 'sigma' / 'Sigma' to Greek σ / Σ
  result = result.replace(/(?<![a-zA-Z])\\?Sigma(?![a-zA-Z])/g, "Σ");
  result = result.replace(/(?<![a-zA-Z])\\?(?:sigma|varsigma)(?![a-zA-Z])/gi, "σ");
  result = result.replace(/(?<![a-zA-Z])\\?σ(?![a-zA-Z])/g, "σ");
  result = result.replace(/(?<![a-zA-Z])\\?Σ(?![a-zA-Z])/g, "Σ");

  // Convert LaTeX \phi / \Phi and plain 'phi' / 'Phi' to Greek φ / Φ
  result = result.replace(/(?<![a-zA-Z])\\?Phi(?![a-zA-Z])/g, "Φ");
  result = result.replace(/(?<![a-zA-Z])\\?(?:phi|varphi)(?![a-zA-Z])/gi, "φ");
  result = result.replace(/(?<![a-zA-Z])\\?φ(?![a-zA-Z])/g, "φ");
  result = result.replace(/(?<![a-zA-Z])\\?Φ(?![a-zA-Z])/g, "Φ");

  // Convert LaTeX \psi / \Psi and plain 'psi' / 'Psi' to Greek ψ / Ψ
  result = result.replace(/(?<![a-zA-Z])\\?Psi(?![a-zA-Z])/g, "Ψ");
  result = result.replace(/(?<![a-zA-Z])\\?psi(?![a-zA-Z])/gi, "ψ");
  result = result.replace(/(?<![a-zA-Z])\\?ψ(?![a-zA-Z])/g, "ψ");
  result = result.replace(/(?<![a-zA-Z])\\?Ψ(?![a-zA-Z])/g, "Ψ");

  // Collapse accidental newline between number and unit/variable (e.g. 1.5\n• C -> 1.5 C)
  result = result.replace(/(?<=\b\d+(?:\.\d+)?)\s*(?:\\n|\n)\s*([•*·]?\s*[a-zA-ZΩμ])/g, " $1");
  // Normalize '* C' or '• C' after a number to ' C' (e.g. 1.5 * C -> 1.5 C)
  result = result.replace(/(?<=\b\d+(?:\.\d+)?)\s*[*•·]\s*([A-ZΩμ]\b)/g, " $1");

  // Convert '*' in math expressions to ' × '
  result = result.replace(/(?<=[a-zA-Z0-9α-ωΑ-Ωπθ)\]}!|₂₁₀-₉])\s*\*\s*(?=10(?:\^|<sup>|\{))/g, " × ");
  result = result.replace(/(?<=[a-zA-Z0-9α-ωΑ-Ωπθ)\]}!|₂₁₀-₉])\s*\*\s*(?=[a-zA-Z0-9α-ωΑ-Ωπθ(\[{+\-√!])/g, " × ");

  // Normalize +/- and -+ to ± and ∓
  result = result.replace(/\+\/-/g, "±").replace(/-\+\//g, "∓");

  // Normalize sqrt(...) to √(...)
  result = result.replace(/sqrt\s*\(([^)]+)\)/g, "√($1)");
  result = result.replace(/sqrt\s*([a-zA-Z0-9]+)/g, "√$1");

  // LaTeX radical with index: \sqrt[n]{x} or \sqrt[n]x
  result = result.replace(
    /\\sqrt\[([^\]]+)\]\s*\{([^}]+)\}/g,
    (_m, index, inner) => `${buildRadicalHTML(index, inner)}`,
  );
  result = result.replace(
    /\\sqrt\[([^\]]+)\]\s*(\d+|\w)/g,
    (_m, index, inner) => `${buildRadicalHTML(index, inner)}`,
  );

  // 4. Blackboard Bold Sets: \mathbb{N} -> ℕ, \mathbb{Z} -> ℤ, \mathbb{Q} -> ℚ, etc.
  result = result.replace(/\\mathbb\s*\{([A-Za-z])\}/g, (_, ch) => buildBlackboardBoldHTML(ch));
  result = result.replace(/\\mathbb\s*([A-Za-z])\b/g, (_, ch) => buildBlackboardBoldHTML(ch));

  // 5. Degree symbol: 100^\circ, 90^{\circ}, 60^\degree, \angle 45^\circ, 90^\circ, etc.
  result = result
    .replace(/\^\s*\{?\\circ\}?/g, "°")
    .replace(/\^\s*\{?\\degree\}?/g, "°")
    .replace(/\\circ\b/g, "°")
    .replace(/\\degree\b/g, "°")
    .replace(/&deg;/gi, "°");

  // 6. Standard math & trig functions (remove leading backslash while preserving exponents/arguments)
  result = result.replace(
    /\\(sin|cos|tan|sec|csc|cosec|cot|cotan|log|ln|lg|exp|arcsin|arccos|arctan|sinh|cosh|tanh|coth|sech|csch|det|gcd|lcm|max|min)\b\s*/g,
    "$1 "
  );
  result = result.replace(
    /\b(sin|cos|tan|sec|csc|cosec|cot|cotan|log|ln|lg|exp|arcsin|arccos|arctan|sinh|cosh|tanh|coth|sech|csch|det|gcd|lcm|max|min)\s+(\^|<sup>|\()/g,
    "$1$2"
  );

  // 7. Common LaTeX math, geometry, and logic symbols
  result = result
    .replace(/\\triangle\b|\\bigtriangleup\b/g, "△")
    .replace(/\\cong\b/g, "≅")
    .replace(/\\sim\b/g, "~")
    .replace(/\\perp\b/g, "⊥")
    .replace(/\\parallel\b/g, "∥")
    .replace(/\\nparallel\b/g, "∦")
    .replace(/\\parallelogram\b/g, "▱")
    .replace(/\\checkmark\b/g, "✓")
    .replace(/\\equiv\b/g, "≡")
    .replace(/\\propto\b/g, "∝")
    .replace(/\\AA\b|\\angstrom\b/g, "Å")
    .replace(/\\ell\b/g, "ℓ")
    .replace(/\\hbar\b/g, "ℏ")
    .replace(/\\oint\b/g, "∮")
    .replace(/\\gg\b/g, "≫")
    .replace(/\\ll\b/g, "≪")
    .replace(/\\langle\b/g, "⟨")
    .replace(/\\rangle\b/g, "⟩")
    // Extensible arrows with optional arguments \xrightarrow[below]{above}, \xrightleftharpoons[below]{above}
    .replace(/\\xrightleftharpoons\s*(?:\[[^\]]*\])?\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})?/g, " ⇌ ")
    .replace(/\\xrightarrow\s*(?:\[[^\]]*\])?\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})?/g, " → ")
    .replace(/\\xleftarrow\s*(?:\[[^\]]*\])?\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})?/g, " ← ")
    // Fixed chemistry & math equilibrium arrows
    .replace(/\\(?:rightleftharpoons|leftrightharpoons|rightleftarrows|leftrightarrows)\b/g, " ⇌ ")
    .replace(/\\downarrow\b/g, "↓")
    .replace(/\\uparrow\b/g, "↑")
    .replace(/\\angle\s*\{([^{}]+)\}/gi, "∠$1")
    .replace(/\\angle\s*([a-zA-Z0-9θ]+)/gi, "∠$1")
    .replace(/\\angle\b/gi, "∠")
    .replace(/\\measuredangle\b/gi, "∠")
    .replace(/\\widehat\s*\{([^{}]+)\}/g, "⌒$1")
    .replace(/\\cup\b|\\bigcup\b/g, "∪")
    .replace(/\\cap\b|\\bigcap\b/g, "∩")
    .replace(/\\subset\b/g, "⊂")
    .replace(/\\subseteq\b/g, "⊆")
    .replace(/\\supset\b/g, "⊃")
    .replace(/\\supseteq\b/g, "⊇")
    .replace(/\\in\b/g, "∈")
    .replace(/\\notin\b/g, "∉")
    .replace(/\\ni\b/g, "∋")
    .replace(/\\emptyset\b|\\varnothing\b/g, "∅")
    .replace(/(?<=[=∈⊆⊂∪∩\\{\s(\-]|^)\\phi\b/g, "∅")
    .replace(/\\phi\b(?=[=∈⊆⊂∪∩\\}\s',)]|$)/g, "∅")
    .replace(/\\phi\b|\\varphi\b/g, "ϕ")
    .replace(/\\forall\b/g, "∀")
    .replace(/\\exists\b/g, "∃")
    .replace(/\\nexists\b/g, "∄")
    .replace(/\\neg\b/g, "¬")
    .replace(/\\lor\b|\\vee\b/g, "∨")
    .replace(/\\land\b|\\wedge\b/g, "∧")
    .replace(/\\mid\b/g, " | ")
    .replace(/\s*(?:\\setminus\b|\\smallsetminus\b|∖)\s*/g, " - ")
    .replace(/\\minus\b/g, "-")
    .replace(/\\prime\b/g, "′")
    .replace(/\\sum(?![a-zA-Z])/g, "Σ")
    .replace(/\\prod(?![a-zA-Z])/g, "Π")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\(?:l|c|v|d)?dots(?![a-zA-Z])/g, "…")
    .replace(/\\therefore\b/g, "∴")
    .replace(/\\because\b/g, "∵")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\neq?\b|\\ne\b/g, "≠")
    .replace(/\\leq?\b|\\le\b/g, "≤")
    .replace(/\\geq?\b|\\ge\b/g, "≥")
    .replace(/\\pm\b/g, "±")
    .replace(/\\mp\b/g, "∓")
    .replace(/\\times\b/g, "×")
    .replace(/\\div\b/g, "÷")
    .replace(/\\cdot(?![a-zA-Z])/g, "·")
    .replace(/\\bullet\b/g, "•")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/\\nabla\b/g, "∇")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\Gamma\b/g, "Γ")
    .replace(/\\delta\b/g, "δ")
    .replace(/\\epsilon\b|\\varepsilon\b/g, "ε")
    .replace(/\\zeta\b/g, "ζ")
    .replace(/\\eta\b/g, "η")
    .replace(/\\theta\b|\\vartheta\b/g, "θ")
    .replace(/\\Theta\b/g, "Θ")
    .replace(/\\iota\b/g, "ι")
    .replace(/\\kappa\b/g, "κ")
    .replace(/\\lambda\b/g, "λ")
    .replace(/\\Lambda\b/g, "Λ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\nu\b/g, "ν")
    .replace(/\\xi\b/g, "ξ")
    .replace(/\\Xi\b/g, "Ξ")
    .replace(/\\pi\b|\\varpi\b/g, "π")
    .replace(/\\Pi\b/g, "Π")
    .replace(/\\rho\b|\\varrho\b/g, "ρ")
    .replace(/\\sigma\b|\\varsigma\b/g, "σ")
    .replace(/\\Sigma\b/g, "Σ")
    .replace(/\\tau\b/g, "τ")
    .replace(/\\upsilon\b/g, "υ")
    .replace(/\\Upsilon\b/g, "Υ")
    .replace(/\\phi\b|\\varphi\b/g, "φ")
    .replace(/\\Phi\b/g, "Φ")
    .replace(/\\chi\b/g, "χ")
    .replace(/\\psi\b/g, "ψ")
    .replace(/\\Psi\b/g, "Ψ")
    .replace(/\\omega\b/g, "ω")
    .replace(/\\Omega\b/g, "Ω");

  // 8. Arrows & Logic
  result = result
    .replace(/\\implies\b|\\Longrightarrow\b|\\Rightarrow\b/g, " ⟹ ")
    .replace(/\\Leftarrow\b|\\Longleftarrow\b/g, " ⇐ ")
    .replace(/\\iff\b|\\Longleftrightarrow\b|\\Leftrightarrow\b/g, " ⟺ ")
    .replace(/\\to\b|\\rightarrow\b|\\longrightarrow\b/g, " → ")
    .replace(/\\leftarrow\b|\\longleftarrow\b/g, " ← ")
    .replace(/\\leftrightarrow\b/g, " ↔ ");

  // 9. Text styling & environments
  result = result
    .replace(/\\(?:textsuperscript)\s*\{([^}]+)\}/g, "<sup>$1</sup>")
    .replace(/\\(?:textsubscript)\s*\{([^}]+)\}/g, "<sub>$1</sub>")
    .replace(/\\(?:textquotedblleft|textquotedblright)/g, '"')
    .replace(/\\(?:textquoteright|textquoteleft)/g, "'")
    .replace(/\\(?:hspace|vspace)\s*\{[^}]*\}/g, " ")
    .replace(/\\(?:begin|end)\{(?:itemize|enumerate|center|flushleft|flushright)\}/gi, "")
    .replace(/\\item\b/g, "• ")
    .replace(/\\(?:left|right)\./g, "")
    .replace(/\\(?:Big|big|Bigg|bigg)[()\[\]{}|]/g, (m) => m.slice(-1))
    .replace(/\\(?:left|right)(?=[()\[\]{}|])/g, "")
    .replace(/\\(?:displaystyle|textstyle|scriptstyle|scriptscriptstyle)\b/g, "")
    .replace(/\\(?:cancel|sout)\s*\{([^}]+)\}/g, "<s>$1</s>")
    .replace(/\\(?:log|ln|lg)\b/g, (m) => m.slice(1) + " ")
    .replace(/\\(?:derivative|diff)\b/g, "d")
    .replace(/\\partial\b/g, "∂")
    .replace(/\\textbf\s*\{([^}]+)\}/g, "<b>$1</b>")
    .replace(/\\mathbf\s*\{([^}]+)\}/g, "<b>$1</b>")
    .replace(/\\boldsymbol\s*\{([^}]+)\}/g, "<b>$1</b>")
    .replace(/\\textit\s*\{([^}]+)\}/g, "<i>$1</i>")
    .replace(/\\mathit\s*\{([^}]+)\}/g, "<i>$1</i>")
    .replace(/\\mathcal\s*\{([^}]+)\}/g, "<i>$1</i>")
    .replace(/\\mathscr\s*\{([^}]+)\}/g, "<i>$1</i>")
    .replace(/\\text\s*\{([^}]+)\}/g, "$1")
    .replace(/\\mathrm\s*\{([^}]+)\}/g, "$1")
    .replace(/\\operatorname\s*\{([^}]+)\}/g, "$1")
    .replace(/\\underline\s*\{([^}]+)\}/g, "<u>$1</u>")
    .replace(/\\boxed\s*\{([^}]+)\}/g, "$1")
    .replace(/\\(?:vphantom|hphantom|phantom)\s*\{[^}]*\}/g, "")
    .replace(/\\hline\b/g, "")
    .replace(/\\Re\b/g, "Re")
    .replace(/\\Im\b/g, "Im")
    .replace(/\\cdot(?![a-zA-Z])/g, "·")
    .replace(/\\(?:l|c|v|d)?dots(?![a-zA-Z])/g, "…")
    .replace(/\\quad\b/g, " ")
    .replace(/\\qquad\b/g, "   ")
    .replace(/\\([,:;~ ])/g, " ")
    .replace(/\\!/g, "")
    .replace(/\\left\(/g, "(")
    .replace(/\\right\)/g, ")")
    .replace(/\\left\[/g, "[")
    .replace(/\\right\]/g, "]")
    .replace(/\\left\\\{/g, "{")
    .replace(/\\right\\\}/g, "}")
    .replace(/\\left\|/g, "|")
    .replace(/\\right\|/g, "|")
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}");

  // 10. Remove/unwrap LaTeX math delimiters: \[...\], \(...\), $$...$$ and $...$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => inner.trim());
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => inner.trim());
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => inner.trim());
  result = result.replace(/\$([^\$\n]+?)\$/g, (_match, inner) => inner.trim());
  result = result.replace(/\${1,2}/g, "");

  return result;
}

/**
 * Convert mathematical notation to HTML with proper superscripts
 */
export function convertMathToHTML(text: string): string {
  if (!text) return text;

  // 0. Extract raw Venn diagram blocks, SVG blocks, code blocks (```...```, #include programs, and inline code `...`) before math preprocessing
  const preservedBlocks: string[] = [];
  let processed = text;

  // Match full Venn diagram container blocks (both grid wrapper and standalone cards)
  processed = processed.replace(
    /<div\b[^>]*data-venn-(?:diagram|card)[^>]*>[\s\S]*?<\/svg>(?:[\s\S]*?<\/div>)+/gi,
    (match) => {
      preservedBlocks.push(match);
      return `\uE002${preservedBlocks.length - 1}\uE003`;
    },
  );

  // Match full standalone <svg>...</svg> blocks
  processed = processed.replace(/<svg\b[\s\S]*?<\/svg>/gi, (match) => {
    preservedBlocks.push(match);
    return `\uE002${preservedBlocks.length - 1}\uE003`;
  });

  const codeBlocks: string[] = [];

  // Match ```lang ... ``` or ``` ... ```
  processed = processed.replace(
    /```(?:[a-zA-Z0-9_+\-#]+)?\s*([\s\S]*?)\s*```/g,
    (_match, code) => {
      codeBlocks.push(buildCodeBlockHTML(code));
      return `§CODE${codeBlocks.length - 1}§`;
    },
  );

  // Match un-fenced C/C++ programs like #include <iostream> ... } or #include <stdio.h> ... }
  processed = processed.replace(
    /(#include\s*<[^>]+>[\s\S]*?(?:return\s+0\s*;\s*\}|\}\s*\}))/g,
    (_match, code) => {
      codeBlocks.push(buildCodeBlockHTML(code));
      return `§CODE${codeBlocks.length - 1}§`;
    },
  );

  // Match inline `code`
  processed = processed.replace(/`([^`\n]+)`/g, (_match, code) => {
    codeBlocks.push(buildInlineCodeHTML(code));
    return `§CODE${codeBlocks.length - 1}§`;
  });

  // Convert markdown bold (***...***, **...**) and italic (*...*) formatting before math preprocessing
  // so markdown asterisks are converted to <b> and <i> tags rather than treated as math multiplication
  processed = convertMarkdownFormatting(processed);

  // Pre-process any LaTeX math formulas/delimiters
  const preprocessed = preprocessLaTeX(escapeMathSource(processed));

  // 1. Pull matrix & determinant literals out first into placeholders
  const matrices: string[] = [];
  let result = preprocessed.replace(determinantPattern, (match, innerRows) => {
    const rowSource: string = innerRows || match;
    const rows: string[][] = Array.from(rowSource.matchAll(/\[([^[\]]*)\]/g)).map((m: any) =>
      (m[1] as string).split(",").map((cell: string) => cell.trim()),
    );
    if (rows.length === 0 || rows.some((row: string[]) => row.length === 0 || row.some((cell: string) => !cell))) {
      return match;
    }
    matrices.push(buildDeterminantHTML(rows));
    return `§MAT${matrices.length - 1}§`;
  });

  result = result.replace(pmatrixPattern, (match, innerRows) => {
    const rowSource: string = innerRows || match;
    const rows: string[][] = Array.from(rowSource.matchAll(/\[([^[\]]*)\]/g)).map((m: any) =>
      (m[1] as string).split(",").map((cell: string) => cell.trim()),
    );
    if (rows.length === 0 || rows.some((row: string[]) => row.length === 0 || row.some((cell: string) => !cell))) {
      return match;
    }
    matrices.push(buildParenthesizedMatrixHTML(rows));
    return `§MAT${matrices.length - 1}§`;
  });

  result = result.replace(matrixPattern, (match) => {
    const rows: string[][] = Array.from(match.matchAll(/\[([^[\]]*)\]/g)).map((m: any) =>
      (m[1] as string).split(",").map((cell: string) => cell.trim()),
    );
    if (rows.length === 0 || rows.some((row: string[]) => row.length === 0 || row.some((cell: string) => !cell))) {
      return match;
    }
    matrices.push(buildMatrixHTML(rows));
    return `§MAT${matrices.length - 1}§`;
  });

  // Convert any bracketed matrix enclosed in pipes e.g. | §MAT0§ | or |MATRIX0| into a determinant
  result = result.replace(/\|\s*(?:§MAT|MATRIX)(\d+)§?\s*\|/g, (_m, idx) => {
    const i = Number(idx);
    if (matrices[i]) {
      matrices[i] = matrices[i]
        .replace(/border-top:2px solid currentColor;border-bottom:2px solid currentColor;border-left:2px solid currentColor;border-radius:2px 0 0 2px;width:5px;/g, "border-left:2px solid currentColor;width:2px;margin-right:2px;")
        .replace(/border-top:2px solid currentColor;border-bottom:2px solid currentColor;border-right:2px solid currentColor;border-radius:0 2px 2px 0;width:5px;/g, "border-right:2px solid currentColor;width:2px;margin-left:2px;");
    }
    return `§MAT${i}§`;
  });

  // Wrap any matrix placeholder enclosed in parentheses e.g. ( §MAT0§ ) or (MATRIX0) with full-height round brackets
  result = result.replace(/\(\s*(?:§MAT|MATRIX)(\d+)§?\s*\)/g, (_m, idx) => {
    return wrapWithTallParentheses(`§MAT${idx}§`);
  });

  // 2. Inverted fraction OCR artifacts: (subscript=D)N -> N/D
  result = result.replace(
    /(?<!log\s*)\(subscript=(\d+)\)(\d+)/g,
    (_m, den, num) => buildFractionHTML(num, den),
  );

  // 3. Radical index with (stacked=sup:N)√ -> N√
  result = result.replace(
    /\(stacked=sup:([^,)]+)\)\s*√/g,
    (_m, index) => buildRadicalHTML(index),
  );

  // Unicode indexed radicals produced by OCR, e.g. ³√((x + 3) / 3).
  result = convertIndexedRadicals(result);

  // 4. Universal (stacked=...) pattern
  result = result.replace(/\(stacked=([^)]+)\)/g, (_match, content) => {
    const parts = content.split(",").map((p: string) => p.trim());
    const entries: Array<{ type: string; val: string }> = parts.map((p: string) => {
      const idx = p.indexOf(":");
      if (idx !== -1) {
        return { type: p.slice(0, idx).trim(), val: p.slice(idx + 1).trim() };
      }
      return { type: "sup", val: p };
    });

    const supEntries = entries.filter((entry) => entry.type === "sup" && entry.val);
    const subEntries = entries.filter((entry) => entry.type === "sub" && entry.val);

    if (supEntries.length > 0 && subEntries.length === 0) {
      return `<sup>${supEntries.map((entry) => entry.val).join(", ")}</sup>`;
    }
    if (subEntries.length > 0 && supEntries.length === 0) {
      return `<sub>${subEntries.map((entry) => entry.val).join(", ")}</sub>`;
    }
    if (entries.length === 2 && supEntries.length === 1 && subEntries.length === 1) {
      return `<span style="display: inline-flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; vertical-align: middle; line-height: 1; font-size: 0.58em; margin: 0 0.12em;">
        <span style="margin-bottom: 0.15em; text-align: center;">${supEntries[0].val}</span>
        <span style="margin-top: 0.15em; text-align: center;">${subEntries[0].val}</span>
      </span>`;
    }
    return `<span style="display: inline-flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; vertical-align: middle; line-height: 1; font-size: 0.65em; text-align: center; margin: 0 1.5px;">
      ${entries.filter((entry) => entry.val).map((entry) => `<span style="text-align: center;">${entry.val}</span>`).join("")}
    </span>`;
  });

  // 5. Replace explicit (superscript=...) and (subscript=...) patterns BEFORE fractions
  // This prevents fractions from mistakenly consuming (superscript=n) as a fraction numerator!
  const explicitSuperscriptPattern =
    /\(superscript=((?:[^()]+|\([^()]*\))+)\)/g;
  result = result.replace(explicitSuperscriptPattern, (_match, content) => {
    return `<sup>${content}</sup>`;
  });

  const explicitSubscriptPattern = /\(subscript=((?:[^()]+|\([^()]*\))+)\)/g;
  result = result.replace(explicitSubscriptPattern, (_match, content) => {
    return `<sub>${content}</sub>`;
  });

  // 6. Convert fractions (A) / (B), A / (B), and A/B into vertical fractions with horizontal fraction bar
  result = convertFractionsToHTML(result);

  // Give square-root radicands a proper vinculum (roof), after fractions have
  // been grouped so expressions such as √3/2 render as a rooted numerator.
  result = convertSquareRadicals(result);

  // Convert vectors with arrow on top (\vec{MN}, MN→) and unit vectors with hat on top (\hat{i}, i^, j^, k^)
  result = convertVectorsToHTML(result);

  // 7. Replace exponent patterns with HTML sup tags: ^{...} or ^...
  result = result.replace(/\\\^/g, "^");
  result = result.replace(/\s*\^\{([^}]+)\}/g, "<sup>$1</sup>");
  result = result.replace(/\s*\^\(([a-zA-Z0-9+\-*/=]+)\)/g, "<sup>$1</sup>");
  const exponentPattern = /(?<=[a-zA-Z0-9α-ωΑ-Ω\)\>\]§\}\|])\s*\^(-?\d+(?:\.\d+)?|[a-zA-Zα-ωΑ-Ω+-]+)/g;
  result = result.replace(exponentPattern, (_match, exponent) => {
    return `<sup>${exponent}</sup>`;
  });

  // 8. Replace subscript patterns with HTML sub tags: _{...} or _...
  result = result.replace(/\s*_\{([^}]+)\}/g, "<sub>$1</sub>");
  result = result.replace(/\s*_\(([a-zA-Z0-9+\-*/=]+)\)/g, "<sub>$1</sub>");
  result = result.replace(/(?<=[a-zA-Z0-9α-ωΑ-Ω\)\>\]§\}\|∫])\s*_(\d+)/g, "<sub>$1</sub>");
  result = result.replace(/(?<=[a-zA-Z0-9α-ωΑ-Ω\)\>\]§\}\|∫])\s*_([a-zA-Zα-ωΑ-Ω0-9]{1,8})(?![a-zA-Z0-9_])/g, (match, sub) => {
    if (sub.toLowerCase() === "hat" || sub.toLowerCase() === "cap") return match;
    if (/^(?:max|min|avg|rms|in|out|net|total|eff|eq|initial|final|peak|ref|res|ind|cap|cell|rad|rel|cm|ext|int|th|emf|src|load|sat|crit|kin|pot|rest|loss|gain|opt|dir|elec|mag|grav|orbit|escape|trans|rot|vib|stp|std|vap|fus|sub|auto|air|water|ice|earth|sun|moon|\d+|[a-zA-Z]{1,2})$/i.test(sub)) {
      return `<sub>${sub}</sub>`;
    }
    return match;
  });

  // 9. Clean up any remaining unparenthesized superscript=/subscript= text leakage
  result = result.replace(/\bsuperscript=([a-zA-Z0-9+\-]+)/g, "<sup>$1</sup>");
  result = result.replace(/\bsubscript=([a-zA-Z0-9+\-]+)/g, "<sub>$1</sub>");

  // Unwrap extraneous outer parentheses around superscript and subscript tags: (<sup>2</sup>) -> <sup>2</sup>
  result = result.replace(/\(\s*<sup>([^<]+)<\/sup>\s*\)/g, "<sup>$1</sup>");
  result = result.replace(/\(\s*<sub>([^<]+)<\/sub>\s*\)/g, "<sub>$1</sub>");

  // 10. Replace chemical reaction, logic, and math arrows with crisp vector SVG icons
  // 1. Long double bidirectional (iff): <==>, &lt;==&gt;
  result = result.replace(/\s*(?:&lt;==&gt;|<==>)\s*/g, ` ${buildIffArrowHTML()} `);

  // 2. Reversible / chemical equilibrium reaction arrows: <=>, &lt;=&gt;, ⇌, ⇄, &rlhar;
  result = result.replace(/\s*(?:&lt;=&gt;|<=>|&rlhar;|⇌|⇄)\s*/g, ` ${buildEquilibriumArrowHTML()} `);

  // 3. Bidirectional logic / resonance arrows: <--> , <->, &lt;--&gt;, &lt;-&gt;
  result = result.replace(/\s*(?:&lt;--&gt;|<-->|&lt;-&gt;|<->)\s*/g, ` ${buildBidirArrowHTML()} `);

  // 4. Implies: ==>, ==&gt;, =>, =&gt;
  result = result.replace(/\s*(?:==&gt;|==>)\s*/g, ` ${buildImpliesArrowHTML()} `);
  result = result.replace(/\s*(?:=&gt;|=>)\s*/g, ` ${buildImpliesArrowHTML()} `);

  // 5. Right reaction / mapping arrows: -->, --&gt;, ->, -&gt;
  result = result.replace(/\s*(?:--&gt;|-->|-&gt;|->)\s*/g, ` ${buildRightArrowHTML()} `);

  // 6. Left arrows: <--, &lt;--, <-, &lt;-
  result = result.replace(/\s*(?:&lt;--|<--|&lt;-|<-)\s*/g, ` ${buildLeftArrowHTML()} `);

  // Stack the approach expression directly beneath lim.
  result = result.replace(/\(limit=([^)]+)\)/g, (_match, approach) =>
    buildLimitHTML(approach),
  );

  // Render definite integrals with upper limit directly aligned on top of lower limit
  result = result.replace(
    /\(integral=lower:([^,)]+),\s*upper:([^)]+)\)/g,
    (_match, lower, upper) => buildIntegralHTML(lower, upper),
  );
  result = result.replace(
    /\(integral=upper:([^,)]+),\s*lower:([^)]+)\)/g,
    (_match, upper, lower) => buildIntegralHTML(lower, upper),
  );
  result = result.replace(
    /∫\s*<sub>\s*([^<]+)\s*<\/sub>\s*<sup>\s*([^<]+)\s*<\/sup>/g,
    (_match, lower, upper) => buildIntegralHTML(lower, upper),
  );
  result = result.replace(
    /∫\s*<sup>\s*([^<]+)\s*<\/sup>\s*<sub>\s*([^<]+)\s*<\/sub>/g,
    (_match, upper, lower) => buildIntegralHTML(lower, upper),
  );

  // Convert isotope / nuclide notations (e.g. <sup>63.5</sup><sub>29</sub>Cu) into vertically stacked mass & atomic numbers
  result = convertNuclidesToHTML(result);

  // 11. Dynamically add line breaks before Roman Numerals (I., II., III., i., ii., etc.), Alphabetical sub-points (a., b., etc.), and Bullet points (*, •, ●, ○, -)
  // Add line breaks before bullet points (•, ●, ○) only after sentence-ending punctuation and multi-letter words
  result = result.replace(/(?<=[.;:?!])\s+([•●○])\s+(?=[A-Z][a-z]{2,}|\b(?:The|An?|In|For|At|If|All|None|True|False)\b)/g, "<br /><br />$1 ");
  result = result.replace(/(?<=[.;:?!]|\n)\s*-\s+(?=[A-Z][a-z]{2,}|\b(?:The|An?|In|For|At|If|All|None|True|False)\b)/g, "<br /><br />- ");

  const hasRomanList = /(?:\bI\.\s+|\(I\)\s+|\bi\.\s+|\(i\)\s+|\[I\]\s+|\[i\]\s+)/.test(result);
  if (hasRomanList && /(?<!\b(?:and|or|&|to|both|between|diagram|diagrams|figure|figures|phase|phases|stage|stages|type|types|part|parts|section|sections|with|of|in|for|from|as|vs|versus)\s+)(?:(?:I|II|III|IV|V|VI|VII|VIII|IX|X|ii|iii|iv|v|vi|vii|viii|ix|x)\.|\((?:I|II|III|IV|V|VI|VII|VIII|IX|X|ii|iii|iv|v|vi|vii|viii|ix|x)\)|\[(?:I|II|III|IV|V|VI|VII|VIII|IX|X|ii|iii|iv|v|vi|vii|viii|ix|x)\])/.test(result)) {
    result = result.replace(
      /(?<!^|[*\-•\s]|\b(?:and|or|&|to|both|between|diagram|diagrams|figure|figures|phase|phases|stage|stages|type|types|part|parts|section|sections|with|of|in|for|from|as|vs|versus)\b\s*)(?:;|,)?\s+(?=(?:I|i)\.\s+|\((?:I|i)\)\s+|\[(?:I|i)\]\s+)/g,
      "<br /><br />",
    );
    result = result.replace(
      /(?<!^|[*\-•\s]|\b(?:and|or|&|to|both|between|diagram|diagrams|figure|figures|phase|phases|stage|stages|type|types|part|parts|section|sections|with|of|in|for|from|as|vs|versus)\b\s*)(?:;|,)?\s+(?=(?:II|III|IV|VI{0,3}|IX|X|ii|iii|iv|vi{0,3}|ix|x)\.\s+|\((?:II|III|IV|VI{0,3}|IX|X|ii|iii|iv|vi{0,3}|ix|x)\)\s+|\[(?:II|III|IV|VI{0,3}|IX|X|ii|iii|iv|vi{0,3}|ix|x)\]\s+)/g,
      "<br /><br />",
    );
    // Break before trailing question conclusion after list items (e.g. 'III. ... The revenue expenditure...' or 'IV. ... The tasks performed...' or '* ... The class of compounds...')
    result = result.replace(
      /(?<=(?:[.;!?]|\)|\b[a-zA-Z0-9_]+)\s*)\s+(?=(?:The\s+(?:class|type|part|general|amount|network|option|options|tasks?|statements?|correct|following|above|given|revenue|expenditure|hormone|formula|structure)|Based\s+on|Which|What|How|If\s+[a-z0-9_]+\s*=|According|Find|Calculate|Determine|Select|Identify)\b[^\n?]+(?:\?|is\s*\/\s*are|are|is|will\s+be|would\s+be)\b)/g,
      "<br /><br />",
    );
  } else {
    // Break before trailing question conclusion after bullet items
    result = result.replace(
      /(?<=(?:[.;!?]|\)|\b[a-zA-Z0-9_]+)\s*)\s+(?=(?:The\s+(?:class|type|part|general|amount|network|option|options|tasks?|statements?|correct|following|above|given|revenue|expenditure|hormone|formula|structure)|Based\s+on|Which|What|How|If\s+[a-z0-9_]+\s*=|According|Find|Calculate|Determine|Select|Identify)\b[^\n?]+(?:\?|is\s*\/\s*are|are|is|will\s+be|would\s+be)\b)/g,
      "<br /><br />",
    );
    result = result.replace(
      /(?<=\n|^|:\s+)\s*(?!(?:part|step|element|version|table|figure)\s+)(([ivx]+|[a-e])[.)]\s+)/gi,
      "<br /><br />$1",
    );
  }

  // 12. Convert complex conjugates (e.g. conj(z₁ + z₂), \overline{...}, \bar{...}) into horizontal overline bars
  result = convertConjugatesToHTML(result);

  // Convert literal \n (e.g. multiline options "5\n14" or "-5\n-14" or \nVelocity) and newlines outside code blocks to <br />
  result = result.replace(/\\n/g, "<br />");
  result = result.replace(/\n/g, "<br />");

  // 13. Swap the matrix & determinant placeholders back in for their rendered HTML
  if (matrices.length > 0) {
    result = result.replace(/§MAT(\d+)§/g, (_match, i) => matrices[Number(i)]);
    result = result.replace(/\s*MATRIX(\d+)\s*/g, (_match, i) => matrices[Number(i)]);
  }

  // 14. Convert angle symbols (∠, ∡, ∢) into scaled, weighted HTML spans matching letter height & font weight
  result = convertAngleSymbols(result);

  // 15. Convert union (∪) and intersection (∩) symbols into thick, crisp SVG geometry
  result = convertUnionSymbols(result);
  result = convertIntersectionSymbols(result);

  // 16. Convert blackboard bold mathematical set symbols (𝕎, ℤ, ℕ, ℚ, ℝ, ℂ, ℙ, 𝔼, 𝕆, etc.) into bold, high-contrast typography
  result = convertBlackboardBoldSymbols(result);

  // 17. Convert mathematical arrows (→, ⟹, ←, ↔, ⟺, ->, =>) into crisp vector icons
  result = convertArrowSymbols(result);

  // 18. Convert empty / null set symbols (∅) into crisp, rotated vector icons
  result = convertEmptySetSymbols(result);

  // 19. Convert symmetric difference / delta / triangle symbols (Δ, △) into thick, equilateral vector icons
  result = convertDeltaSymbols(result);

  // 19. Convert markdown list markers (- or • or ● or ○) into clean bullet symbols (•) with gray styling on dark mode
  result = result.replace(/(?<=\n|^|<br\s*\/?>)\s*([•●○]|\-(?=\s+[A-Za-z]{3,}\b))\s+(?=[^\s])/g, `<span class="math-bullet inline-block text-primary dark:text-emerald-400 font-bold mr-2">•</span>`);

  // 20. Convert Markdown bold (**...**) and italic (*...*) formatting
  result = convertMarkdownFormatting(result);

  // Clean up any remaining stray unhandled backslashes before plain words/letters (e.g. \Since, \Let, \From, \Where, \x, \y, \a, \b)
  result = result.replace(/\\([a-zA-Z]+)/g, "$1");

  // Restore code blocks with line breaks
  result = result.replace(
    /(§CODE\d+§)\s*(?=(?:The|Which|What|How|If|Based|According|In|On)\b)/gi,
    "$1<br /><br />",
  );
  if (codeBlocks.length > 0) {
    result = result.replace(/§CODE(\d+)§/g, (_match, i) => codeBlocks[Number(i)]);
  }

  // 17. Format Urdu & mixed BiDi text (leading numbers, parenthesized English)
  if (isUrduText(result)) {
    // If string starts with digits/numbers (e.g. 1939 میں...), prefix with invisible Unicode Right-to-Left Mark (\u200F)
    // so the BiDi layout engine strictly anchors the number to the right side of the sentence.
    if (/^\s*\d+/.test(result) && !result.startsWith("\u200F")) {
      result = "\u200F" + result;
    }

    // Wrap parenthesized English/Latin text inside Urdu strings (e.g. (Day of Deliverance))
    // in an isolated LTR span so that neutral parentheses do not attach to Arabic characters
    // or flip into the wrong visual order.
    result = result.replace(/\(([A-Za-z0-9\s\-_.,/&'+]+)\)/g, (match, inner) => {
      if (/[a-zA-Z]/.test(inner)) {
        return `<span dir="ltr" class="inline-block mx-1 font-sans text-[0.92em]">(${inner})</span>`;
      }
      return match;
    });
  }

function formatSvgDiagram(svg: string): string {
  if (!svg || !svg.includes("<svg")) return svg;

  let result = svg;

  // 1. Gather all circles
  interface CircleInfo {
    cx: number;
    cy: number;
    r: number;
  }
  const circles: CircleInfo[] = [];
  const circleRegex = /<circle\b([^>]*)\/?>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = circleRegex.exec(result)) !== null) {
    const attrs = cm[1];
    const cxMatch = attrs.match(/\bcx=["']?([0-9.]+)/i);
    const cyMatch = attrs.match(/\bcy=["']?([0-9.]+)/i);
    const rMatch = attrs.match(/\br=["']?([0-9.]+)/i);
    if (cxMatch && cyMatch && rMatch) {
      circles.push({
        cx: parseFloat(cxMatch[1]),
        cy: parseFloat(cyMatch[1]),
        r: parseFloat(rMatch[1]),
      });
    }
  }

  // 2. Gather all rects
  interface RectInfo {
    cx: number;
    cy: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }
  const rects: RectInfo[] = [];
  const rectRegex = /<rect\b([^>]*)\/?>/gi;
  let rm: RegExpExecArray | null;
  while ((rm = rectRegex.exec(result)) !== null) {
    const attrs = rm[1];
    const xMatch = attrs.match(/\bx=["']?([0-9.]+)/i);
    const yMatch = attrs.match(/\by=["']?([0-9.]+)/i);
    const wMatch = attrs.match(/\bwidth=["']?([0-9.]+)/i);
    const hMatch = attrs.match(/\bheight=["']?([0-9.]+)/i);
    if (xMatch && yMatch && wMatch && hMatch) {
      const rx = parseFloat(xMatch[1]);
      const ry = parseFloat(yMatch[1]);
      const rw = parseFloat(wMatch[1]);
      const rh = parseFloat(hMatch[1]);
      rects.push({
        x: rx,
        y: ry,
        w: rw,
        h: rh,
        cx: rx + rw / 2,
        cy: ry + rh / 2,
      });
    }
  }

  // 3. Ensure component circles and rects have card background fill so underlying wires are hidden
  result = result.replace(/<circle\b([^>]*?)fill=["'](?:none|white|#fff(?:fff)?)["']([^>]*?)>/gi, '<circle $1fill="var(--color-card, var(--card, #ffffff))"$2>');
  result = result.replace(/<circle\b((?:(?!fill=)[^>])*)>/gi, '<circle fill="var(--color-card, var(--card, #ffffff))"$1>');
  result = result.replace(/<rect\b([^>]*?)fill=["'](?:none|white|#fff(?:fff)?)["']([^>]*?)>/gi, '<rect $1fill="var(--color-card, var(--card, #ffffff))"$2>');
  result = result.replace(/<rect\b((?:(?!fill=)[^>])*)>/gi, '<rect fill="var(--color-card, var(--card, #ffffff))"$1>');

  // 4. Subscript / symbol normalization map
  const subMap: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
    "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ",
    "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
    "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ",
    "v": "ᵥ", "x": "ₓ",
  };
  const toSub = (str: string) => str.split("").map((c) => subMap[c] ?? c).join("");

  // 5. Process each <text> element
  result = result.replace(/(<text\b[^>]*>)([\s\S]*?)(<\/text>)/gi, (_match: string, openTag: string, textContent: string, closeTag: string) => {
    let newOpen = openTag;

    const xMatch = newOpen.match(/\bx=["']?([0-9.]+)/i);
    const yMatch = newOpen.match(/\by=["']?([0-9.]+)/i);
    const fsMatch = newOpen.match(/\bfont-size=["']?([0-9.]+)/i);
    const tx = xMatch ? parseFloat(xMatch[1]) : null;
    const ty = yMatch ? parseFloat(yMatch[1]) : null;
    const fs = fsMatch ? parseFloat(fsMatch[1]) : 12;

    // Check if text is inside or belongs to a circle
    let matchedCircle: CircleInfo | null = null;
    if (tx !== null && ty !== null) {
      for (const c of circles) {
        const dist = Math.hypot(tx - c.cx, ty - c.cy);
        if (dist <= Math.max(c.r * 1.35, c.r + 6)) {
          matchedCircle = c;
          break;
        }
      }
    }

    // Check if text is inside a rect
    let matchedRect: RectInfo | null = null;
    if (!matchedCircle && tx !== null && ty !== null) {
      for (const r of rects) {
        if (tx >= r.x - 6 && tx <= r.x + r.w + 6 && ty >= r.y - 6 && ty <= r.y + r.h + 6) {
          matchedRect = r;
          break;
        }
      }
    }

    if (matchedCircle) {
      // Snap directly to circle center
      if (/\bx=["'][^"']*["']/i.test(newOpen)) {
        newOpen = newOpen.replace(/\bx=["'][^"']*["']/i, `x="${matchedCircle.cx}"`);
      } else {
        newOpen = newOpen.replace(/<text\b/i, `<text x="${matchedCircle.cx}"`);
      }

      if (/\by=["'][^"']*["']/i.test(newOpen)) {
        newOpen = newOpen.replace(/\by=["'][^"']*["']/i, `y="${matchedCircle.cy}"`);
      } else {
        newOpen = newOpen.replace(/<text\b/i, `<text y="${matchedCircle.cy}"`);
      }

      // Ensure middle and central alignment
      if (/text-anchor=["'][^"']*["']/i.test(newOpen)) {
        newOpen = newOpen.replace(/text-anchor=["'][^"']*["']/i, 'text-anchor="middle"');
      } else {
        newOpen = newOpen.replace(/<text\b/i, '<text text-anchor="middle"');
      }

      if (/dominant-baseline=["'][^"']*["']/i.test(newOpen)) {
        newOpen = newOpen.replace(/dominant-baseline=["'][^"']*["']/i, 'dominant-baseline="central"');
      } else {
        newOpen = newOpen.replace(/<text\b/i, '<text dominant-baseline="central"');
      }

      // Scale font-size so it never touches or overflows the circle boundary
      const maxFs = Math.max(9, Math.round(matchedCircle.r * 0.85));
      const targetFs = Math.min(fs, maxFs);
      if (fsMatch) {
        newOpen = newOpen.replace(/font-size=["'][^"']*["']/i, `font-size="${targetFs}"`);
      } else {
        newOpen = newOpen.replace(/<text\b/i, `<text font-size="${targetFs}"`);
      }

      // Remove any stroke halo inside circles so the circle border is never erased
      newOpen = newOpen.replace(/\s*paint-order=["'][^"']*["']/gi, "");
      newOpen = newOpen.replace(/\s*stroke-width=["'][^"']*["']/gi, "");
      newOpen = newOpen.replace(/\s*stroke-linejoin=["'][^"']*["']/gi, "");
      newOpen = newOpen.replace(/\s*stroke=["'](?:var\(--[^)]+\)|#[a-f0-9]+|white)["']/gi, "");
    } else if (matchedRect) {
      // Snap to rect center
      if (/\bx=["'][^"']*["']/i.test(newOpen)) {
        newOpen = newOpen.replace(/\bx=["'][^"']*["']/i, `x="${matchedRect.cx}"`);
      } else {
        newOpen = newOpen.replace(/<text\b/i, `<text x="${matchedRect.cx}"`);
      }

      if (/\by=["'][^"']*["']/i.test(newOpen)) {
        newOpen = newOpen.replace(/\by=["'][^"']*["']/i, `y="${matchedRect.cy}"`);
      } else {
        newOpen = newOpen.replace(/<text\b/i, `<text y="${matchedRect.cy}"`);
      }

      if (/text-anchor=["'][^"']*["']/i.test(newOpen)) {
        newOpen = newOpen.replace(/text-anchor=["'][^"']*["']/i, 'text-anchor="middle"');
      } else {
        newOpen = newOpen.replace(/<text\b/i, '<text text-anchor="middle"');
      }

      if (/dominant-baseline=["'][^"']*["']/i.test(newOpen)) {
        newOpen = newOpen.replace(/dominant-baseline=["'][^"']*["']/i, 'dominant-baseline="central"');
      } else {
        newOpen = newOpen.replace(/<text\b/i, '<text dominant-baseline="central"');
      }

      const maxFs = Math.max(9, Math.round(Math.min(matchedRect.w, matchedRect.h) * 0.45));
      const targetFs = Math.min(fs, maxFs);
      if (fsMatch) {
        newOpen = newOpen.replace(/font-size=["'][^"']*["']/i, `font-size="${targetFs}"`);
      } else {
        newOpen = newOpen.replace(/<text\b/i, `<text font-size="${targetFs}"`);
      }

      newOpen = newOpen.replace(/\s*paint-order=["'][^"']*["']/gi, "");
      newOpen = newOpen.replace(/\s*stroke-width=["'][^"']*["']/gi, "");
      newOpen = newOpen.replace(/\s*stroke-linejoin=["'][^"']*["']/gi, "");
      newOpen = newOpen.replace(/\s*stroke=["'](?:var\(--[^)]+\)|#[a-f0-9]+|white)["']/gi, "");
    } else {
      // Outside shapes: strip any heavy destructive stroke
      newOpen = newOpen.replace(/\s*stroke-width=["']3\.5px["']/gi, 'stroke-width="1.5px"');
      newOpen = newOpen.replace(/\s*paint-order=["'][^"']*["']/gi, "");
      newOpen = newOpen.replace(/\s*stroke=["'](?:var\(--[^)]+\)|#[a-f0-9]+|white)["']/gi, "");
    }

    // Convert subscripts and Greek symbols in textContent
    let cleanContent = textContent
      .replace(/_\{([^}]+)\}/g, (_: string, inner: string) => toSub(inner))
      .replace(/_([0-9a-zA-Z+-]+)/g, (_: string, inner: string) => toSub(inner))
      .replace(/\b([A-Za-z])(\d+)\b/g, (_: string, l: string, n: string) => `${l}${toSub(n)}`)
      .replace(/\\mu\b/g, "μ")
      .replace(/\\Omega\b/g, "Ω")
      .replace(/\\theta\b/g, "θ")
      .replace(/\\pi\b/g, "π")
      .replace(/\\Delta\b/g, "Δ")
      .replace(/\\epsilon\b|\\varepsilon\b/g, "ε")
      .replace(/\bepsilon\b|\bvarepsilon\b/gi, "ε")
      .replace(/\\sigma\b/g, "σ")
      .replace(/\\lambda\b/g, "λ")
      .replace(/\\alpha\b/g, "α")
      .replace(/\\beta\b/g, "β")
      .replace(/\\gamma\b/g, "γ")
      .replace(/\\phi\b/g, "φ");

    return `${newOpen}${cleanContent}${closeTag}`;
  });

  return result;
}

function formatPreservedBlockText(html: string): string {
  if (!html) return html;
  if (html.includes("<svg")) {
    return formatSvgDiagram(html);
  }
  return html
    .replace(/\\cup\b|\\bigcup\b/g, "∪")
    .replace(/\\cap\b|\\bigcap\b/g, "∩")
    .replace(/\\emptyset\b|\\varnothing\b/g, "∅")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/\\epsilon\b|\\varepsilon\b/g, "ε")
    .replace(/\bepsilon\b|\bvarepsilon\b/gi, "ε")
    .replace(/\\subseteq\b/g, "⊆")
    .replace(/\\subset\b/g, "⊂")
    .replace(/\\supset\b/g, "⊃")
    .replace(/\\supseteq\b/g, "⊇")
    .replace(/\\in\b/g, "∈")
    .replace(/\\notin\b/g, "∉")
    .replace(/\\mathbf\{([^}]+)\}/g, "<b>$1</b>")
    .replace(/\\textbf\{([^}]+)\}/g, "<b>$1</b>")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\dots\b/g, "…");
}

  // Restore source blocks before sanitizing; nothing bypasses the final parser.
  return sanitizeRenderedMath(
    result.replace(/\uE002(\d+)\uE003/g, (_m, idx) => formatPreservedBlockText(preservedBlocks[Number(idx)])),
  );
}

/**
 * Convert mathematical expressions and LaTeX notation into clean plain text
 * with Unicode symbols (e.g. superscripts ², ³, ±, √, ≤, ≥, ≠).
 * Ideal for textareas, input fields, and plain text contexts.
 */
export function formatMathToUnicode(text: string): string {
  if (!text) return text;
  let result = text;

  // 0. Normalize double/multiple escaped backslashes before LaTeX macros or symbols
  result = result.replace(/\\\\+([a-zA-Z]+|[{}_\^])/g, "\\$1");

  // 1. Unwrap LaTeX delimiters: \[...\], \(...\), $$...$$ and $...$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, "$1");
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, "$1");
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  result = result.replace(/\$([^\$\n]+?)\$/g, "$1");
  result = result.replace(/\${1,2}/g, "");
  result = result.replace(/\\ce\s*\{([^}]+)\}/g, "$1");

  // 2. Blackboard bold
  result = result.replace(/\\mathbb\s*\{([A-Za-z])\}/g, (_, ch) => BLACKBOARD_BOLD_MAP[ch] || ch);
  result = result.replace(/\\mathbb\s*([A-Za-z])\b/g, (_, ch) => BLACKBOARD_BOLD_MAP[ch] || ch);

  // 3. Degrees
  result = result
    .replace(/\^\s*\{?\\circ\}?/g, "°")
    .replace(/\^\s*\{?\\degree\}?/g, "°")
    .replace(/\\circ\b/g, "°")
    .replace(/\\degree\b/g, "°")
    .replace(/&deg;/gi, "°");

  // 4. Common LaTeX symbols and arrows
  result = result
    .replace(/\\xrightleftharpoons\b(?:\s*\[[^\]]*\])?(?:\s*\{[^}]*\})?/g, " ⇌ ")
    .replace(/\\(?:rightleftharpoons|leftrightharpoons|rightleftarrows|leftrightarrows)\b/g, " ⇌ ")
    .replace(/\\pm\b/g, "±")
    .replace(/\\mp\b/g, "∓")
    .replace(/\\times\b/g, "×")
    .replace(/\\div\b/g, "÷")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\bullet\b/g, "•")
    .replace(/\\implies\b|\\Longrightarrow\b|\\Rightarrow\b/g, " ⟹ ")
    .replace(/\\Leftarrow\b|\\Longleftarrow\b/g, " ⇐ ")
    .replace(/\\iff\b|\\Longleftrightarrow\b|\\Leftrightarrow\b/g, " ⟺ ")
    .replace(/\\to\b|\\rightarrow\b|\\longrightarrow\b|\\xrightarrow\b(?:\s*\[[^\]]*\])?(?:\s*\{[^}]*\})?/g, " → ")
    .replace(/\\leftarrow\b|\\longleftarrow\b|\\xleftarrow\b(?:\s*\[[^\]]*\])?(?:\s*\{[^}]*\})?/g, " ← ")
    .replace(/\\leftrightarrow\b/g, " ↔ ")
    .replace(/\\uparrow\b/g, " ↑ ")
    .replace(/\\downarrow\b/g, " ↓ ")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\neq?\b/g, "≠")
    .replace(/\\leq?\b/g, "≤")
    .replace(/\\geq?\b/g, "≥")
    .replace(/\\triangle\b|\\bigtriangleup\b/g, "△")
    .replace(/\\cong\b/g, "≅")
    .replace(/\\sim\b/g, "~")
    .replace(/\\perp\b/g, "⊥")
    .replace(/\\parallel\b/g, "∥")
    .replace(/\\nparallel\b/g, "∦")
    .replace(/\\cup\b|\\bigcup\b/g, "∪")
    .replace(/\\cap\b|\\bigcap\b/g, "∩")
    .replace(/\\subset\b/g, "⊂")
    .replace(/\\subseteq\b/g, "⊆")
    .replace(/\\supset\b/g, "⊃")
    .replace(/\\supseteq\b/g, "⊇")
    .replace(/\\in\b/g, "∈")
    .replace(/\\notin\b/g, "∉")
    .replace(/\\ni\b/g, "∋")
    .replace(/\\emptyset\b|\\varnothing\b/g, "∅")
    .replace(/\\forall\b/g, "∀")
    .replace(/\\exists\b/g, "∃")
    .replace(/\\nexists\b/g, "∄")
    .replace(/\\neg\b/g, "¬")
    .replace(/\\lor\b|\\vee\b/g, "∨")
    .replace(/\\land\b|\\wedge\b/g, "∧")
    .replace(/\\mid\b/g, " | ")
    .replace(/\s*(?:\\setminus\b|\\smallsetminus\b|∖)\s*/g, " - ")
    .replace(/\\minus\b/g, "-")
    .replace(/\\prime\b/g, "′")
    .replace(/\\sum\b/g, "Σ")
    .replace(/\\prod\b/g, "Π")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\therefore\b/g, "∴")
    .replace(/\\because\b/g, "∵")
    .replace(/\\quad\b/g, " ")
    .replace(/\\qquad\b/g, "   ")
    .replace(/\\([,:;~ ])/g, " ")
    .replace(/\\!/g, "")
    .replace(/\\text\s*\{([^}]+)\}/g, "$1")
    .replace(/\\mathrm\s*\{([^}]+)\}/g, "$1")
    .replace(/\\mathbf\s*\{([^}]+)\}/g, "$1")
    .replace(/\\textbf\s*\{([^}]+)\}/g, "$1")
    .replace(/\\mathit\s*\{([^}]+)\}/g, "$1")
    .replace(/\\textit\s*\{([^}]+)\}/g, "$1")
    .replace(/\\sqrt\s*\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt\s*(\d+|\w)/g, "√$1")
    .replace(/\\left\(/g, "(")
    .replace(/\\right\)/g, ")")
    .replace(/\\left\[/g, "[")
    .replace(/\\right\]/g, "]")
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\Gamma\b/g, "Γ")
    .replace(/\\delta\b/g, "δ")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/(?<![a-zA-Z])\\?(?:epsilon|varepsilon)(?![a-zA-Z])/gi, "ε")
    .replace(/(?<![a-zA-Z])\\?ε(?![a-zA-Z])/g, "ε")
    .replace(/\\zeta\b/g, "ζ")
    .replace(/\\eta\b/g, "η")
    .replace(/(?<![a-zA-Z])\\?(?:theta|vartheta)(?![a-zA-Z])/gi, "θ")
    .replace(/(?<![a-zA-Z])\\?Theta(?![a-zA-Z])/g, "Θ")
    .replace(/(?<![a-zA-Z])\bTHETA\b/g, "Θ")
    .replace(/\\θ/g, "θ")
    .replace(/\\Θ/g, "Θ")
    .replace(/\\iota\b/g, "ι")
    .replace(/\\kappa\b/g, "κ")
    .replace(/(?<![a-zA-Z])\\?Lambda(?![a-zA-Z])/g, "Λ")
    .replace(/(?<![a-zA-Z])\\?lambda(?![a-zA-Z])/gi, "λ")
    .replace(/\\λ/g, "λ")
    .replace(/\\Λ/g, "Λ")
    .replace(/(?<![a-zA-Z])\\?mu(?![a-zA-Z])/gi, "μ")
    .replace(/\\μ/g, "μ")
    .replace(/\\nu\b/g, "ν")
    .replace(/\\xi\b/g, "ξ")
    .replace(/\\Xi\b/g, "Ξ")
    .replace(/\\pi\b|\\varpi\b/g, "π")
    .replace(/\\Pi\b/g, "Π")
    .replace(/(?<=[0-9\s+\-*/=()^]|^)pi(?=[0-9\s+\-*/=()^]|$|_[0-9a-zA-Z]|_\{[^}]+\})/g, "π")
    .replace(/(?<![a-zA-Z])\\?(?:pi|varpi)(?![a-zA-Z])/g, "π")
    .replace(/(?<![a-zA-Z])\\?(?:rho|varrho)(?![a-zA-Z])/gi, "ρ")
    .replace(/\\ρ/g, "ρ")
    .replace(/(?<![a-zA-Z])\\?Sigma(?![a-zA-Z])/g, "Σ")
    .replace(/(?<![a-zA-Z])\\?(?:sigma|varsigma)(?![a-zA-Z])/gi, "σ")
    .replace(/\\σ/g, "σ")
    .replace(/\\Σ/g, "Σ")
    .replace(/(?<![a-zA-Z])\\?tau(?![a-zA-Z])/gi, "τ")
    .replace(/\\upsilon\b/g, "υ")
    .replace(/\\Upsilon\b/g, "Υ")
    .replace(/(?<![a-zA-Z])\\?Phi(?![a-zA-Z])/g, "Φ")
    .replace(/(?<![a-zA-Z])\\?(?:phi|varphi)(?![a-zA-Z])/gi, "φ")
    .replace(/\\φ/g, "φ")
    .replace(/\\Φ/g, "Φ")
    .replace(/\\chi\b/g, "χ")
    .replace(/(?<![a-zA-Z])\\?Psi(?![a-zA-Z])/g, "Ψ")
    .replace(/(?<![a-zA-Z])\\?psi(?![a-zA-Z])/gi, "ψ")
    .replace(/\\ψ/g, "ψ")
    .replace(/\\Ψ/g, "Ψ")
    .replace(/(?<![a-zA-Z])\\?Omega(?![a-zA-Z])/g, "Ω")
    .replace(/(?<![a-zA-Z])\\?omega(?![a-zA-Z])/gi, "ω")
    .replace(/\\ω/g, "ω")
    .replace(/\\Ω/g, "Ω")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/\\nabla\b/g, "∇")
    .replace(/\\angle\s*\{([^{}]+)\}/gi, "∠$1")
    .replace(/\\angle\s*([a-zA-Z0-9θ]+)/gi, "∠$1")
    .replace(/\\angle\b/gi, "∠")
    .replace(/\\measuredangle\b/gi, "∠")
    .replace(/\\widehat\s*\{([^{}]+)\}/g, "⌒$1")
    .replace(/\\int\b/g, "∫")
    .replace(/\\lim\b/g, "lim")
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\(?:vec|overrightarrow)\s*\{([^{}]+)\}/g, "$1⃗")
    .replace(/\\(?:vec|overrightarrow)\s*([a-zA-Z]{1,3})/g, "$1⃗")
    .replace(/\((?:vector|vec)=([^)]+)\)/gi, "$1⃗")
    .replace(/\\hat\s*\{([^{}]+)\}/g, "$1̂")
    .replace(/\\hat\s*([a-zA-Z])/g, "$1̂")
    .replace(/\((?:hat|cap|unit|unit_vector)=([^)]+)\)/gi, "$1̂")
    .replace(/(?<![a-zA-Z])([ijkrugnvabcxyeIJK])\^(?![a-zA-Z0-9+\-({])/g, (_m, l) => {
      if (l === "i") return "î";
      if (l === "j") return "ĵ";
      return `${l}̂`;
    });

  // Remove trig/log function backslashes in plain text
  result = result.replace(
    /\\(sin|cos|tan|sec|csc|cosec|cot|cotan|log|ln|lg|exp|arcsin|arccos|arctan|sinh|cosh|tanh|coth|sech|csch|det|gcd|lcm|max|min)\b/g,
    "$1"
  );

  // Matrices and determinants in Unicode plain text
  result = result.replace(/\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}/gi, (_m, body) => {
    const rows = body
      .trim()
      .split(/\\\\|\n/)
      .map((row: string) => `[${row.split(/&amp;|&/i).map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim()).filter(Boolean).join(", ")}]`);
    return `|${rows.join(", ")}|`;
  });

  result = result.replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/gi, (_m, body) => {
    const rows = body
      .trim()
      .split(/\\\\|\n/)
      .map((row: string) => `[${row.split(/&amp;|&/i).map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim()).filter(Boolean).join(", ")}]`);
    return `(${rows.join(", ")})`;
  });

  result = result.replace(/\\begin\{(?:bmatrix|matrix|smallmatrix)\}([\s\S]*?)\\end\{(?:bmatrix|matrix|smallmatrix)\}/gi, (_m, body) => {
    const rows = body
      .trim()
      .split(/\\\\|\n/)
      .map((row: string) => `[${row.split(/&amp;|&/i).map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim()).filter(Boolean).join(", ")}]`);
    return `[${rows.join(", ")}]`;
  });

  // Clean raw matrix brackets in plain text e.g. [ 1 amp; 5 amp; 8 ]
  result = result.replace(/\[\s*([^[\]]+?(?:&amp;|&|\bamp;)[^[\]]+?)\s*\]/gi, (match, body) => {
    const cells = body
      .split(/&amp;|&|\bamp;|,/i)
      .map((c: string) => c.replace(/&amp;/gi, "").replace(/\bamp;/gi, "").trim())
      .filter(Boolean);
    if (cells.length > 1) {
      return `[[${cells.join(", ")}]]`;
    }
    return match;
  });

  result = result.replace(/\\overline\s*\{([^{}]+)\}/g, "conj($1)");
  result = result.replace(/\\bar\s*\{([^{}]+)\}/g, "conj($1)");
  result = result.replace(/\\bar\s*([a-zA-Z0-9_]+)/g, "conj($1)");

  // 5. Superscript map
  const supMap: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
    "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ",
    "f": "ᶠ", "g": "ᵍ", "h": "ʰ", "i": "ⁱ", "j": "ʲ",
    "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "n": "ⁿ", "o": "ᵒ",
    "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ",
    "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ"
  };

  const toSup = (str: string) => str.split("").map(c => supMap[c] ?? c).join("");

  result = result.replace(/\^\{([^}]+)\}/g, (_, inner) => toSup(inner));
  result = result.replace(/\^(-?\d+(?:\.\d+)?|[a-zA-Zα-ωΑ-Ω])/g, (_, inner) => toSup(inner));
  result = result.replace(/\(superscript=([^)]+)\)/g, (_, inner) => toSup(inner));
  result = result.replace(/\bsuperscript=([a-zA-Z0-9+\-]+)/g, (_, inner) => toSup(inner));

  // 6. Subscript map
  const subMap: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
    "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ",
    "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
    "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ",
    "v": "ᵥ", "x": "ₓ"
  };

  const toSub = (str: string) => str.split("").map(c => subMap[c] ?? c).join("");

  result = result.replace(/_\{([^}]+)\}/g, (_, inner) => toSub(inner));
  result = result.replace(/_([0-9a-zA-Z+-]+)/g, (_, inner) => toSub(inner));
  result = result.replace(/\(subscript=([^)]+)\)/g, (_, inner) => toSub(inner));
  result = result.replace(/\bsubscript=([a-zA-Z0-9+\-]+)/g, (_, inner) => toSub(inner));

  // 7. Inverted fractions and stacked notation in plain text
  result = result.replace(/(?<!log\s*)\(subscript=(\d+)\)(\d+)/g, "$2/$1");
  result = result.replace(/\(stacked=sup:([^,)]+)\)\s*√/g, (_, n) => `${toSup(n)}√`);
  result = result.replace(/\(stacked=sup:([^,)]+),sub:([^)]*)\)/g, (_, sup, sub) => `${toSup(sup)}${toSub(sub)}`);
  result = result.replace(/\(stacked=sup:([^)]+)\)/g, (_, sup) => toSup(sup));
  result = result.replace(/\(stacked=sub:([^)]+)\)/g, (_, sub) => toSub(sub));

  return result;
}

/**
 * Convert mathematical notation to string with Unicode superscripts
 * This is simpler and works better for rendering in React components
 * Returns a string with superscripts converted to Unicode characters
 */
export function convertMathToJSX(text: string): string {
  if (!text) return text;
  return convertMathToHTML(text);
}
