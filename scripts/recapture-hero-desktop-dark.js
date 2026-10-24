const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const PROD_BASE = "https://www.exboardai.tech";
const OUT = path.join(__dirname, "../public/landing");
const EMAIL = "mtahatalib110+aliya@gmail.com";
const PASSWORD = "Test@123";

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  // =========================================================================
  // 1. DESKTOP HERO CAPTURES (LIGHT & DARK)
  // =========================================================================
  console.log("=== Capturing Desktop Dashboard (1440x900) ===");
  const deskCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const deskPage = await deskCtx.newPage();
  deskPage.setDefaultTimeout(60000);

  console.log("Desktop: Navigating to login...");
  await deskPage.goto(`${PROD_BASE}/login`, { waitUntil: "domcontentloaded" });
  await deskPage.waitForTimeout(2000);

  await deskPage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await deskPage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await deskPage.waitForTimeout(500);
  await deskPage.locator('button[type="submit"], button:has-text("Sign In")').click();

  console.log("Desktop: Waiting for dashboard redirect...");
  await deskPage.waitForURL("**/student/dashboard**", { timeout: 60000 });
  // Wait generously for all API calls (user, leaderboard, top performers, past papers) to resolve
  console.log("Desktop: Waiting 8s for full dashboard queries to settle...");
  await deskPage.waitForTimeout(8000);

  // A. Desktop Dark Mode
  console.log("Desktop: Applying Dark Mode...");
  await deskPage.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  });
  await deskPage.waitForTimeout(4000);

  const darkPath = path.join(OUT, "student-dashboard-dark-v2.png");
  await deskPage.screenshot({ path: darkPath, fullPage: false });
  fs.copyFileSync(darkPath, path.join(OUT, "dashboard-dark-v2.png"));
  fs.copyFileSync(darkPath, path.join(OUT, "dashboard-dark.png"));
  console.log("✓ Saved Desktop Dark Dashboard ->", darkPath);

  // B. Desktop Light Mode
  console.log("Desktop: Applying Light Mode...");
  await deskPage.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  });
  await deskPage.waitForTimeout(4000);

  const lightPath = path.join(OUT, "student-dashboard.png");
  await deskPage.screenshot({ path: lightPath, fullPage: false });
  fs.copyFileSync(lightPath, path.join(OUT, "dashboard.png"));
  console.log("✓ Saved Desktop Light Dashboard ->", lightPath);

  await deskCtx.close();

  // =========================================================================
  // 2. MOBILE HERO CAPTURES (LIGHT & DARK)
  // =========================================================================
  console.log("=== Capturing Mobile Dashboard (390x844) ===");
  const mobCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const mobPage = await mobCtx.newPage();
  mobPage.setDefaultTimeout(60000);

  console.log("Mobile: Navigating to login...");
  await mobPage.goto(`${PROD_BASE}/login`, { waitUntil: "domcontentloaded" });
  await mobPage.waitForTimeout(2000);

  await mobPage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await mobPage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await mobPage.waitForTimeout(500);
  await mobPage.locator('button[type="submit"], button:has-text("Sign In")').click();

  console.log("Mobile: Waiting for dashboard redirect...");
  await mobPage.waitForURL("**/student/dashboard**", { timeout: 60000 });
  console.log("Mobile: Waiting 8s for full queries to settle...");
  await mobPage.waitForTimeout(8000);

  // A. Mobile Dark Mode
  console.log("Mobile: Applying Dark Mode...");
  await mobPage.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  });
  await mobPage.waitForTimeout(4000);

  const mobDarkPath = path.join(OUT, "mobile-dashboard-dark.png");
  await mobPage.screenshot({ path: mobDarkPath, fullPage: false });
  console.log("✓ Saved Mobile Dark Dashboard ->", mobDarkPath);

  // B. Mobile Light Mode
  console.log("Mobile: Applying Light Mode...");
  await mobPage.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  });
  await mobPage.waitForTimeout(4000);

  const mobLightPath = path.join(OUT, "mobile-dashboard.png");
  await mobPage.screenshot({ path: mobLightPath, fullPage: false });
  console.log("✓ Saved Mobile Light Dashboard ->", mobLightPath);

  await mobCtx.close();
  await browser.close();

  console.log("🎉 All Hero screenshots successfully recaptured with fully rendered Top Performers cards!");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
