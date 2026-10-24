const { chromium } = require("playwright");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const PROD_BASE = "https://www.exboardai.tech";
const STUDENT_A_EMAIL = "mtahatalib110+aliya@gmail.com";
const STUDENT_A_PASS = "Test@123";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("================================================================================");
  console.log("📖 TESTING SOLVED NOTES RENDERING ACROSS SUBJECTS ON LIVE PRODUCTION");
  console.log("================================================================================\n");

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // Set Aliya to Sindh Board Class IX
  await pool.query("UPDATE users SET class = 'IX', board = 'Sindh Board' WHERE email = $1", [STUDENT_A_EMAIL]);

  // Login
  await page.goto(`${PROD_BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="identifier"], input[type="email"]', { timeout: 15000 });
  await page.locator('input[name="identifier"], input[type="email"]').first().fill(STUDENT_A_EMAIL);
  await page.locator('input[name="password"]').first().fill(STUDENT_A_PASS);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/student/, { timeout: 25000 });
  console.log("✓ Authenticated as Aliya (Sindh Board, Class IX)");

  // Query actual note IDs across subjects
  const sampleNotes = await pool.query(`
    SELECT DISTINCT ON (c.subject) se.id, se.title, c.subject, c.class
    FROM solved_exercises se
    JOIN curriculums c ON se.curriculum_id = c.id
    WHERE c.board = 'Sindh Board' AND c.class = 'IX'
    ORDER BY c.subject, se.id
  `);

  console.log(`Found ${sampleNotes.rows.length} subjects with solved notes in Class IX:`);
  console.table(sampleNotes.rows.map(r => ({ subject: r.subject, id: r.id, title: r.title.slice(0, 45) })));

  const screenshotsDir = path.join(__dirname, "../docs/qa/screenshots-audit");

  const results = [];

  for (const row of sampleNotes.rows) {
    const subjectSlug = encodeURIComponent(row.subject.toLowerCase());
    const noteUrl = `${PROD_BASE}/student/solved-notes/${subjectSlug}/${row.id}`;
    console.log(`\nTesting note for ${row.subject}: ${noteUrl}`);

    const start = Date.now();
    await page.goto(noteUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const latency = Date.now() - start;
    const bodyText = await page.locator("body").innerText();
    const hasError = bodyText.includes("Application error") || bodyText.includes("500") || bodyText.includes("Not Found");

    // KaTeX count
    const katexCount = await page.locator(".katex, [data-katex], .math").count();
    // Raw broken latex tags
    const hasRawFrac = bodyText.includes("\\frac{");
    const hasRawSqrt = bodyText.includes("\\sqrt{");
    const hasRawMathbf = bodyText.includes("\\mathbf{");
    const hasRawBroken = hasRawFrac || hasRawSqrt || hasRawMathbf;

    console.log(`  ✓ Loaded in ${latency}ms | Error: ${hasError ? "YES" : "NO"} | KaTeX tags: ${katexCount} | Raw broken latex: ${hasRawBroken ? "YES (Unparsed)" : "NONE (Clean HTML/KaTeX)"}`);

    const shotName = `note-${subjectSlug}.png`;
    await page.screenshot({ path: path.join(screenshotsDir, shotName) });

    results.push({
      subject: row.subject,
      title: row.title,
      url: noteUrl,
      latencyMs: latency,
      hasError,
      katexCount,
      cleanRendering: !hasRawBroken,
      screenshot: shotName,
    });
  }

  console.log("\n================================================================================");
  console.log("🏁 SOLVED NOTES AUDIT RESULTS SUMMARY:");
  console.table(results);
  console.log("================================================================================");

  // Reset back to AKUEB Class IX
  await pool.query("UPDATE users SET class = 'IX', board = 'AKUEB' WHERE email = $1", [STUDENT_A_EMAIL]);
  await browser.close();
  await pool.end();
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
