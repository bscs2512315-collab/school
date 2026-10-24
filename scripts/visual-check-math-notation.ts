import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { convertMathToHTML } from "../lib/utils/math-notation";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 560 }, deviceScaleFactor: 2 });
    const examples = [
      "If \\frac{X}{Y} = \\frac{a}{2} and \\bar{X} = \\frac{a}{2}, then the value of \\bar{Y} is equal to",
      "&radic;((x-4)(x+4)(x<sup>2</sup>-16)) is equal to",
      "&radic;(x - (1)/(4)) = (1)/(2)",
      "³√((x + 3) / 3)",
    ];
    await page.setContent(`<!doctype html><html><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; font-size: 30px; color: #111827; padding: 20px; }
      .example { margin: 0 0 48px; }
    </style>${examples.map((value) => `<div class="example">${convertMathToHTML(value)}</div>`).join("")}</html>`);
    await mkdir("tmp/pdfs/class-x-math/2021", { recursive: true });
    await page.screenshot({ path: "tmp/pdfs/class-x-math/2021/math-render.png", fullPage: true });
    console.log("tmp/pdfs/class-x-math/2021/math-render.png");
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
