const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const PROD_BASE = "https://www.exboardai.tech";
const OUT = path.join(__dirname, "../public/landing");
const EMAIL = "mtahatalib110+aliya@gmail.com";
const PASSWORD = "Test@123";

const SECTIONS = [
  { id: "dashboard", path: "/student/dashboard", readySelector: "text=Study Tools, text=Curriculum Syllabus" },
  { id: "past-papers", path: "/student/past-papers-1", readySelector: "text=Past Papers, text=Paper 1, text=Computer Science" },
  { id: "leaderboard", path: "/student/leaderboard", readySelector: "text=Leaderboard, text=Top Performers, text=Students" },
  { id: "nova", path: "/student/nova", readySelector: "text=Nova, textarea, input" },
  { id: "generate", path: "/student/generate", readySelector: "text=Generate, button" },
  { id: "history", path: "/student/history", readySelector: "text=History, text=Recent, table, div" },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  // =========================================================================
  // 1. DESKTOP CAPTURES (1440x900)
  // =========================================================================
  console.log("=== 1. Starting Desktop Captures (1440x900) ===");
  const deskCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const deskPage = await deskCtx.newPage();
  deskPage.setDefaultTimeout(60000);

  console.log("Desktop: Logging in...");
  await deskPage.goto(`${PROD_BASE}/login`, { waitUntil: "domcontentloaded" });
  await deskPage.waitForTimeout(2000);

  await deskPage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await deskPage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await deskPage.waitForTimeout(500);
  await deskPage.locator('button[type="submit"], button:has-text("Sign In")').click();

  console.log("Desktop: Waiting for dashboard URL...");
  await deskPage.waitForURL("**/student/dashboard**", { timeout: 60000 });
  await deskPage.waitForTimeout(5000);

  for (const section of SECTIONS) {
    console.log(`\n--- Desktop: Loading ${section.id} ---`);
    await deskPage.goto(`${PROD_BASE}${section.path}`, { waitUntil: "domcontentloaded" });
    await deskPage.waitForTimeout(4000);

    const curUrl = deskPage.url();
    if (curUrl.includes("/login")) {
      throw new Error(`Desktop redirected to login on ${section.id}: ${curUrl}`);
    }

    // A. Light Mode
    await deskPage.evaluate(() => {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    });
    await deskPage.waitForTimeout(3000);

    const lightFile = section.id === "dashboard" ? "student-dashboard.png" : `${section.id}.png`;
    const lightPath = path.join(OUT, lightFile);
    await deskPage.screenshot({ path: lightPath, fullPage: false });
    if (section.id === "dashboard") {
      fs.copyFileSync(lightPath, path.join(OUT, "dashboard.png"));
    }
    console.log(`✓ Saved Desktop Light ${section.id} -> ${lightFile}`);

    // B. Dark Mode
    await deskPage.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });
    await deskPage.waitForTimeout(3000);

    const darkFile = section.id === "dashboard" ? "student-dashboard-dark-v2.png" : `${section.id}-dark-v2.png`;
    const darkPath = path.join(OUT, darkFile);
    await deskPage.screenshot({ path: darkPath, fullPage: false });
    if (section.id === "dashboard") {
      fs.copyFileSync(darkPath, path.join(OUT, "dashboard-dark-v2.png"));
    }
    fs.copyFileSync(darkPath, path.join(OUT, `${section.id}-dark.png`));
    console.log(`✓ Saved Desktop Dark ${section.id} -> ${darkFile}`);
  }

  await deskCtx.close();

  // =========================================================================
  // 2. MOBILE CAPTURES (390x844)
  // =========================================================================
  console.log("\n=== 2. Starting Mobile Captures (390x844) ===");
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const mobilePage = await mobileCtx.newPage();
  mobilePage.setDefaultTimeout(60000);

  console.log("Mobile: Logging in...");
  await mobilePage.goto(`${PROD_BASE}/login`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(2000);

  await mobilePage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await mobilePage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await mobilePage.waitForTimeout(500);
  await mobilePage.locator('button[type="submit"], button:has-text("Sign In")').click();

  console.log("Mobile: Waiting for dashboard URL...");
  await mobilePage.waitForURL("**/student/dashboard**", { timeout: 60000 });
  await mobilePage.waitForTimeout(5000);

  for (const section of SECTIONS) {
    console.log(`\n--- Mobile: Loading ${section.id} ---`);
    await mobilePage.goto(`${PROD_BASE}${section.path}`, { waitUntil: "domcontentloaded" });
    await mobilePage.waitForTimeout(4000);

    const curUrl = mobilePage.url();
    if (curUrl.includes("/login")) {
      throw new Error(`Mobile redirected to login on ${section.id}: ${curUrl}`);
    }

    // A. Mobile Light Mode
    await mobilePage.evaluate(() => {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    });
    await mobilePage.waitForTimeout(3000);

    const mobLightFile = `mobile-${section.id}.png`;
    const mobLightPath = path.join(OUT, mobLightFile);
    await mobilePage.screenshot({ path: mobLightPath, fullPage: false });
    console.log(`✓ Saved Mobile Light ${section.id} -> ${mobLightFile}`);

    // B. Mobile Dark Mode
    await mobilePage.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });
    await mobilePage.waitForTimeout(3000);

    const mobDarkFile = `mobile-${section.id}-dark.png`;
    const mobDarkPath = path.join(OUT, mobDarkFile);
    await mobilePage.screenshot({ path: mobDarkPath, fullPage: false });
    console.log(`✓ Saved Mobile Dark ${section.id} -> ${mobDarkFile}`);
  }

  await mobileCtx.close();
  await browser.close();

  console.log("\n🎉 ALL 24 screenshots recaptured with full data loading, headers, and bottom nav!");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
