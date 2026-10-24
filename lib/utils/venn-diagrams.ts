/**
 * Dynamic SVG Venn Diagram Generator for ExBoardAI Solved Notes
 * Produces crisp, beautiful, responsive textbook-quality Venn diagrams in both Dark and Light modes.
 */

let diagramCounter = 0;

function getUniqueId(prefix = "venn"): string {
  diagramCounter++;
  return `${prefix}_${diagramCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

function parseElementList(items?: string[]): string[] {
  if (!items || !items.length) return [];
  return items.flatMap((item) => {
    if (typeof item !== "string") return [];
    if (item.includes(",")) {
      return item.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const trimmed = item.trim();
    return trimmed ? [trimmed] : [];
  });
}

export function drawVennGrid(cards: string[]): string {
  if (cards.length === 1) {
    return `<div data-venn-diagram="true" class="w-full flex justify-center my-4">${cards[0]}</div>`;
  }
  const gridClass = cards.length <= 2 
    ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-4 max-w-2xl mx-auto"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4";
  return `<div data-venn-diagram="true" class="${gridClass}">${cards.join("")}</div>`;
}

interface VennCardProps {
  title: string;
  svgContent: string;
  caption?: string;
}

function formatCardText(text?: string): string {
  if (!text) return "";
  return text
    .replace(/∪|\\cup\b/g, `<svg class="inline-block" viewBox="0 0 16 16" width="0.86em" height="0.86em" style="vertical-align:-0.07em;margin:0 0.12em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-label="∪"><path d="M 3.2 3.2 L 3.2 9.6 A 4.8 4.8 0 0 0 12.8 9.6 L 12.8 3.2" /></svg>`)
    .replace(/∩|\\cap\b/g, `<svg class="inline-block" viewBox="0 0 16 16" width="0.86em" height="0.86em" style="vertical-align:-0.07em;margin:0 0.12em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-label="∩"><path d="M 3.2 12.8 L 3.2 6.4 A 4.8 4.8 0 0 1 12.8 6.4 L 12.8 12.8" /></svg>`)
    .replace(/∅|\\emptyset\b|\\varnothing\b|\\phi\b/g, `<svg class="inline-block" viewBox="0 0 16 16" width="1.05em" height="1.05em" style="vertical-align:-0.15em;margin:0 0.1em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="∅"><circle cx="8" cy="8" r="5.3" /><line x1="2" y1="14" x2="14" y2="2" /></svg>`)
    .replace(/Δ|△|\\Delta\b|\\triangle\b/g, `<svg class="inline-block" viewBox="0 0 16 16" width="0.92em" height="0.92em" style="vertical-align:-0.09em;margin:0 0.12em;overflow:visible;" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-label="Δ"><polygon points="8,2.2 14.6,13.6 1.4,13.6" /></svg>`);
}

function renderVennCard({ title, svgContent, caption }: VennCardProps): string {
  return `<div data-venn-card="true" class="flex flex-col items-center justify-between rounded-xl border border-border/70 bg-card p-3 shadow-2xs hover:border-primary/40 transition-all text-card-foreground">
  <div class="w-full text-center text-xs font-bold uppercase tracking-wider text-foreground mb-2 pb-1.5 border-b border-border/40">
    ${formatCardText(title)}
  </div>
  <div class="w-full flex justify-center py-1">
    ${svgContent}
  </div>
  ${caption ? `<div class="text-[11px] font-medium text-muted-foreground text-center mt-2 px-1 leading-snug">${formatCardText(caption)}</div>` : ""}
</div>`.trim();
}

/**
 * 1. Disjoint Sets (A ∩ B = ∅)
 */
export function drawVennDisjoint({
  title,
  setA = "A",
  setB = "B",
  elementsA = [],
  elementsB = [],
  shaded = "none",
  caption,
}: {
  title: string;
  setA?: string;
  setB?: string;
  elementsA?: string[];
  elementsB?: string[];
  shaded: "union" | "intersection" | "symDiff" | "diffAB" | "diffBA" | "none";
  caption?: string;
}): string {
  const id = getUniqueId("disjoint");
  const shadeA = shaded === "union" || shaded === "symDiff" || shaded === "diffAB";
  const shadeB = shaded === "union" || shaded === "symDiff" || shaded === "diffBA";

  const parsedA = parseElementList(elementsA);
  const parsedB = parseElementList(elementsB);

  const renderElemGroup = (items: string[], x: number, startY: number, stepY = 15) => {
    if (!items.length) return "";
    return items
      .map((item, idx) => {
        const y = startY + (idx - (items.length - 1) / 2) * stepY;
        return `<text x="${x}" y="${y}" font-size="11.5" font-weight="600" text-anchor="middle" fill="currentColor" opacity="0.95">${item}</text>`;
      })
      .join("\n");
  };

  const svgContent = `
<svg viewBox="0 0 280 160" class="w-full max-w-[260px] h-auto overflow-visible select-none text-foreground font-sans">
  <defs>
    <pattern id="${id}_pat" width="7" height="7" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.6" />
    </pattern>
  </defs>

  <!-- Universal Rectangle U -->
  <rect x="15" y="15" width="250" height="130" rx="6" stroke="currentColor" stroke-width="1.6" fill="none" opacity="0.6" />
  <text x="28" y="34" font-weight="bold" font-size="14" fill="currentColor">U</text>

  <!-- Circle A -->
  ${shadeA ? `<circle cx="85" cy="85" r="42" fill="#10b981" fill-opacity="0.22" />` : ""}
  ${shadeA ? `<circle cx="85" cy="85" r="42" fill="url(#${id}_pat)" />` : ""}
  <circle cx="85" cy="85" r="42" stroke="currentColor" stroke-width="1.8" fill="none" />
  <text x="85" y="38" font-weight="bold" font-size="14" text-anchor="middle" fill="currentColor">${setA}</text>
  ${renderElemGroup(parsedA, 85, 88)}

  <!-- Circle B -->
  ${shadeB ? `<circle cx="195" cy="85" r="42" fill="#10b981" fill-opacity="0.22" />` : ""}
  ${shadeB ? `<circle cx="195" cy="85" r="42" fill="url(#${id}_pat)" />` : ""}
  <circle cx="195" cy="85" r="42" stroke="currentColor" stroke-width="1.8" fill="none" />
  <text x="195" y="38" font-weight="bold" font-size="14" text-anchor="middle" fill="currentColor">${setB}</text>
  ${renderElemGroup(parsedB, 195, 88)}
</svg>`.trim();

  return renderVennCard({ title, svgContent, caption });
}

/**
 * 2. Overlapping Sets (A and B intersect)
 */
export function drawVennOverlapping({
  title,
  setA = "A",
  setB = "B",
  elementsA = [],
  elementsAB = [],
  elementsB = [],
  elementsU = [],
  shaded = "none",
  caption,
}: {
  title: string;
  setA?: string;
  setB?: string;
  elementsA?: string[];
  elementsAB?: string[];
  elementsB?: string[];
  elementsU?: string[];
  shaded: "union" | "intersection" | "symDiff" | "diffAB" | "diffBA" | "compUnion" | "compInter" | "none";
  caption?: string;
}): string {
  const id = getUniqueId("overlap");

  const parsedA = parseElementList(elementsA);
  const parsedAB = parseElementList(elementsAB);
  const parsedB = parseElementList(elementsB);
  const parsedU = parseElementList(elementsU);

  // Format elements text vertically stacked
  const renderElemGroup = (items: string[], x: number, startY: number, stepY = 15) => {
    if (!items.length) return "";
    return items
      .map((item, idx) => {
        const y = startY + (idx - (items.length - 1) / 2) * stepY;
        return `<text x="${x}" y="${y}" font-size="11.5" font-weight="600" text-anchor="middle" fill="currentColor" opacity="0.95">${item}</text>`;
      })
      .join("\n");
  };

  const svgContent = `
<svg viewBox="0 0 280 160" class="w-full max-w-[260px] h-auto overflow-visible select-none text-foreground font-sans">
  <defs>
    <pattern id="${id}_pat" width="7" height="7" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.6" />
    </pattern>
    <clipPath id="${id}_clipB">
      <circle cx="175" cy="85" r="46" />
    </clipPath>
    <clipPath id="${id}_clipA">
      <circle cx="105" cy="85" r="46" />
    </clipPath>
    <mask id="${id}_maskA">
      <rect width="280" height="160" fill="white" />
      <circle cx="175" cy="85" r="46" fill="black" />
    </mask>
    <mask id="${id}_maskB">
      <rect width="280" height="160" fill="white" />
      <circle cx="105" cy="85" r="46" fill="black" />
    </mask>
    <mask id="${id}_maskCompUnion">
      <rect width="280" height="160" fill="white" />
      <circle cx="105" cy="85" r="46" fill="black" />
      <circle cx="175" cy="85" r="46" fill="black" />
    </mask>
    <mask id="${id}_maskCompInter">
      <rect width="280" height="160" fill="white" />
      <circle cx="105" cy="85" r="46" clip-path="url(#${id}_clipB)" fill="black" />
    </mask>
  </defs>

  <!-- Universal Rectangle U -->
  <rect x="15" y="15" width="250" height="130" rx="6" stroke="currentColor" stroke-width="1.6" fill="none" opacity="0.6" />
  <text x="28" y="34" font-weight="bold" font-size="14" fill="currentColor">U</text>

  <!-- Shaded Regions -->
  ${shaded === "union" ? `
  <g opacity="0.22">
    <circle cx="105" cy="85" r="46" fill="#10b981" />
    <circle cx="175" cy="85" r="46" fill="#10b981" />
  </g>
  <g fill="url(#${id}_pat)">
    <circle cx="105" cy="85" r="46" />
    <circle cx="175" cy="85" r="46" />
  </g>
  ` : shaded === "intersection" ? `
  <circle cx="105" cy="85" r="46" clip-path="url(#${id}_clipB)" fill="#10b981" fill-opacity="0.22" />
  <circle cx="105" cy="85" r="46" clip-path="url(#${id}_clipB)" fill="url(#${id}_pat)" />
  ` : shaded === "diffAB" ? `
  <circle cx="105" cy="85" r="46" mask="url(#${id}_maskA)" fill="#10b981" fill-opacity="0.22" />
  <circle cx="105" cy="85" r="46" mask="url(#${id}_maskA)" fill="url(#${id}_pat)" />
  ` : shaded === "diffBA" ? `
  <circle cx="175" cy="85" r="46" mask="url(#${id}_maskB)" fill="#10b981" fill-opacity="0.22" />
  <circle cx="175" cy="85" r="46" mask="url(#${id}_maskB)" fill="url(#${id}_pat)" />
  ` : shaded === "symDiff" ? `
  <circle cx="105" cy="85" r="46" mask="url(#${id}_maskA)" fill="#10b981" fill-opacity="0.22" />
  <circle cx="105" cy="85" r="46" mask="url(#${id}_maskA)" fill="url(#${id}_pat)" />
  <circle cx="175" cy="85" r="46" mask="url(#${id}_maskB)" fill="#10b981" fill-opacity="0.22" />
  <circle cx="175" cy="85" r="46" mask="url(#${id}_maskB)" fill="url(#${id}_pat)" />
  ` : shaded === "compUnion" ? `
  <rect x="15" y="15" width="250" height="130" rx="6" mask="url(#${id}_maskCompUnion)" fill="#10b981" fill-opacity="0.22" />
  <rect x="15" y="15" width="250" height="130" rx="6" mask="url(#${id}_maskCompUnion)" fill="url(#${id}_pat)" />
  ` : shaded === "compInter" ? `
  <rect x="15" y="15" width="250" height="130" rx="6" mask="url(#${id}_maskCompInter)" fill="#10b981" fill-opacity="0.22" />
  <rect x="15" y="15" width="250" height="130" rx="6" mask="url(#${id}_maskCompInter)" fill="url(#${id}_pat)" />
  ` : ""}

  <!-- Circle Outlines -->
  <circle cx="105" cy="85" r="46" stroke="currentColor" stroke-width="1.8" fill="none" />
  <circle cx="175" cy="85" r="46" stroke="currentColor" stroke-width="1.8" fill="none" />

  <!-- Set Labels -->
  <text x="75" y="36" font-weight="bold" font-size="14" text-anchor="middle" fill="currentColor">${setA}</text>
  <text x="205" y="36" font-weight="bold" font-size="14" text-anchor="middle" fill="currentColor">${setB}</text>

  <!-- Elements inside regions -->
  ${renderElemGroup(parsedA, 78, 88)}
  ${renderElemGroup(parsedAB, 140, 88)}
  ${renderElemGroup(parsedB, 202, 88)}
  ${parsedU.length >= 1 ? `<text x="46" y="130" font-size="11.5" font-weight="600" text-anchor="middle" fill="currentColor">${parsedU.slice(0, 2).join(", ")}</text>` : ""}
  ${parsedU.length >= 3 ? `<text x="234" y="130" font-size="11.5" font-weight="600" text-anchor="middle" fill="currentColor">${parsedU.slice(2).join(", ")}</text>` : ""}
</svg>`.trim();

  return renderVennCard({ title, svgContent, caption });
}

/**
 * 3. Subset / Concentric Sets (A ⊆ B or Q ⊆ P)
 */
export function drawVennSubset({
  title,
  outerSet = "B",
  innerSet = "A",
  elementsInner = [],
  elementsOuter = [],
  shaded = "none",
  caption,
}: {
  title: string;
  outerSet?: string;
  innerSet?: string;
  elementsInner?: string[];
  elementsOuter?: string[];
  shaded: "union" | "intersection" | "innerOnly" | "annular" | "none";
  caption?: string;
}): string {
  const id = getUniqueId("subset");

  const parsedInner = parseElementList(elementsInner);
  const parsedOuter = parseElementList(elementsOuter);

  // Outer circle: (140, 84, r=58)
  // Inner circle: (140, 78, r=30)
  const renderInnerElements = () => {
    if (!parsedInner.length) return "";
    if (parsedInner.length <= 3) {
      return `<text x="140" y="86" font-size="11" font-weight="600" text-anchor="middle" fill="currentColor">${parsedInner.join(", ")}</text>`;
    }
    const line1 = parsedInner.slice(0, 3).join(", ");
    const line2 = parsedInner.slice(3).join(", ");
    return `
      <text x="140" y="80" font-size="10.5" font-weight="600" text-anchor="middle" fill="currentColor">${line1}</text>
      <text x="140" y="94" font-size="10.5" font-weight="600" text-anchor="middle" fill="currentColor">${line2}</text>
    `;
  };

  const renderOuterElements = () => {
    if (!parsedOuter.length) return "";
    if (parsedOuter.length <= 3) {
      return `<text x="140" y="125" font-size="11" font-weight="600" text-anchor="middle" fill="currentColor">${parsedOuter.join(", ")}</text>`;
    }
    const line1 = parsedOuter.slice(0, 3).join(", ");
    const line2 = parsedOuter.slice(3).join(", ");
    return `
      <text x="140" y="120" font-size="10.5" font-weight="600" text-anchor="middle" fill="currentColor">${line1}</text>
      <text x="140" y="133" font-size="10.5" font-weight="600" text-anchor="middle" fill="currentColor">${line2}</text>
    `;
  };

  const svgContent = `
<svg viewBox="0 0 280 160" class="w-full max-w-[260px] h-auto overflow-visible select-none text-foreground font-sans">
  <defs>
    <pattern id="${id}_pat" width="7" height="7" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.6" />
    </pattern>
    <mask id="${id}_maskAnnular">
      <rect width="280" height="160" fill="white" />
      <circle cx="140" cy="78" r="30" fill="black" />
    </mask>
  </defs>

  <!-- Universal Rectangle U -->
  <rect x="15" y="15" width="250" height="130" rx="6" stroke="currentColor" stroke-width="1.6" fill="none" opacity="0.6" />
  <text x="28" y="34" font-weight="bold" font-size="14" fill="currentColor">U</text>

  <!-- Outer Circle B / P -->
  ${shaded === "union" ? `
  <circle cx="140" cy="84" r="58" fill="#10b981" fill-opacity="0.22" />
  <circle cx="140" cy="84" r="58" fill="url(#${id}_pat)" />
  ` : shaded === "annular" ? `
  <circle cx="140" cy="84" r="58" mask="url(#${id}_maskAnnular)" fill="#10b981" fill-opacity="0.22" />
  <circle cx="140" cy="84" r="58" mask="url(#${id}_maskAnnular)" fill="url(#${id}_pat)" />
  ` : ""}
  <circle cx="140" cy="84" r="58" stroke="currentColor" stroke-width="1.8" fill="none" />
  <text x="192" y="44" font-weight="bold" font-size="14" fill="currentColor">${outerSet}</text>

  <!-- Inner Circle A / Q -->
  ${(shaded === "intersection" || shaded === "innerOnly") ? `
  <circle cx="140" cy="78" r="30" fill="#10b981" fill-opacity="0.22" />
  <circle cx="140" cy="78" r="30" fill="url(#${id}_pat)" />
  ` : ""}
  <circle cx="140" cy="78" r="30" stroke="currentColor" stroke-width="1.8" fill="none" />
  <text x="140" y="63" font-weight="bold" font-size="12" text-anchor="middle" fill="currentColor">${innerSet}</text>

  <!-- Elements -->
  ${renderInnerElements()}
  ${renderOuterElements()}
</svg>`.trim();

  return renderVennCard({ title, svgContent, caption });
}

/**
 * 4. 3 Sets (A, B, C)
 */
export function drawVenn3Sets({
  title,
  setA = "A",
  setB = "B",
  setC = "C",
  shaded = "unionAll",
  caption,
}: {
  title: string;
  setA?: string;
  setB?: string;
  setC?: string;
  shaded: "unionAll" | "interA_unionBC" | "interAB_union_interAC" | "none";
  caption?: string;
}): string {
  const id = getUniqueId("three_sets");

  const svgContent = `
<svg viewBox="0 0 280 180" class="w-full max-w-[260px] h-auto overflow-visible select-none text-foreground font-sans">
  <defs>
    <pattern id="${id}_pat" width="7" height="7" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.6" />
    </pattern>
    <clipPath id="${id}_clipA">
      <circle cx="116" cy="75" r="38" />
    </clipPath>
  </defs>

  <!-- Universal Rectangle U -->
  <rect x="12" y="12" width="256" height="156" rx="6" stroke="currentColor" stroke-width="1.6" fill="none" opacity="0.6" />
  <text x="24" y="32" font-weight="bold" font-size="14" fill="currentColor">U</text>

  <!-- Shading -->
  ${shaded === "unionAll" ? `
  <g opacity="0.22">
    <circle cx="116" cy="75" r="38" fill="#10b981" />
    <circle cx="164" cy="75" r="38" fill="#10b981" />
    <circle cx="140" cy="112" r="38" fill="#10b981" />
  </g>
  <g fill="url(#${id}_pat)">
    <circle cx="116" cy="75" r="38" />
    <circle cx="164" cy="75" r="38" />
    <circle cx="140" cy="112" r="38" />
  </g>
  ` : (shaded === "interA_unionBC" || shaded === "interAB_union_interAC") ? `
  <g clip-path="url(#${id}_clipA)">
    <g opacity="0.22">
      <circle cx="164" cy="75" r="38" fill="#10b981" />
      <circle cx="140" cy="112" r="38" fill="#10b981" />
    </g>
    <g fill="url(#${id}_pat)">
      <circle cx="164" cy="75" r="38" />
      <circle cx="140" cy="112" r="38" />
    </g>
  </g>
  ` : ""}

  <!-- Circle Outlines -->
  <circle cx="116" cy="75" r="38" stroke="currentColor" stroke-width="1.8" fill="none" />
  <circle cx="164" cy="75" r="38" stroke="currentColor" stroke-width="1.8" fill="none" />
  <circle cx="140" cy="112" r="38" stroke="currentColor" stroke-width="1.8" fill="none" />

  <!-- Set Labels - Placed cleanly outside circles -->
  <text x="84" y="40" font-weight="bold" font-size="14" text-anchor="middle" fill="currentColor">${setA}</text>
  <text x="196" y="40" font-weight="bold" font-size="14" text-anchor="middle" fill="currentColor">${setB}</text>
  <text x="140" y="164" font-weight="bold" font-size="14" text-anchor="middle" fill="currentColor">${setC}</text>
</svg>`.trim();

  return renderVennCard({ title, svgContent, caption });
}
