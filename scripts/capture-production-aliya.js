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

  // ==========================================
  // 1. DESKTOP CAPTURES (LIGHT & DARK)
  // ==========================================
  console.log("=== Starting Desktop Captures (1440x900) ===");
  const deskContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const deskPage = await deskContext.newPage();
  deskPage.setDefaultTimeout(60000);

  console.log("Navigating to login page on production...");
  await deskPage.goto(`${PROD_BASE}/login`, { waitUntil: "networkidle" });
  await deskPage.waitForTimeout(2000);

  // Fill credentials and click Sign In
  console.log("Entering Aliya Batool credentials...");
  const emailInput = deskPage.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passInput = deskPage.locator('input[type="password"], input[name="password"]').first();
  await emailInput.fill(EMAIL);
  await passInput.fill(PASSWORD);
  await deskPage.waitForTimeout(500);

  const submitBtn = deskPage.locator('button[type="submit"], button:has-text("Sign In")').first();
  await submitBtn.click();

  console.log("Waiting for dashboard redirect...");
  await deskPage.waitForURL("**/student/dashboard**", { timeout: 45000 });
  await deskPage.waitForLoadState("networkidle");
  await deskPage.waitForTimeout(4000);

  // --- A. Desktop Light Screenshot ---
  console.log("Switching to Light Mode for Desktop...");
  await deskPage.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  });
  await deskPage.waitForTimeout(3000);

  const deskLightPath = path.join(OUT, "student-dashboard.png");
  await deskPage.screenshot({ path: deskLightPath, fullPage: false });
  fs.copyFileSync(deskLightPath, path.join(OUT, "dashboard.png"));
  console.log("✓ Saved Desktop Light Screenshot:", deskLightPath);

  // --- B. Desktop Dark Screenshot ---
  console.log("Switching to Dark Mode for Desktop...");
  await deskPage.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  });
  await deskPage.waitForTimeout(3000);

  const deskDarkPath = path.join(OUT, "student-dashboard-dark-v2.png");
  await deskPage.screenshot({ path: deskDarkPath, fullPage: false });
  fs.copyFileSync(deskDarkPath, path.join(OUT, "dashboard-dark-v2.png"));
  console.log("✓ Saved Desktop Dark Screenshot:", deskDarkPath);

  // Extract cookies from desktop session
  const cookies = await deskContext.cookies();
  await deskContext.close();

  // ==========================================
  // 2. MOBILE CAPTURES (LIGHT & DARK)
  // ==========================================
  console.log("=== Starting Mobile Captures (390x844) ===");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await mobileContext.addCookies(cookies);

  const mobilePage = await mobileContext.newPage();
  mobilePage.setDefaultTimeout(60000);

  console.log("Opening mobile dashboard on production...");
  await mobilePage.goto(`${PROD_BASE}/student/dashboard`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(4000);

  // --- A. Mobile Light Screenshot ---
  console.log("Switching to Light Mode for Mobile...");
  await mobilePage.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  });
  await mobilePage.waitForTimeout(3000);

  const mobileLightPath = path.join(OUT, "mobile-dashboard.png");
  await mobilePage.screenshot({ path: mobileLightPath, fullPage: false });
  console.log("✓ Saved Mobile Light Screenshot:", mobileLightPath);

  // --- B. Mobile Dark Screenshot ---
  console.log("Switching to Dark Mode for Mobile...");
  await mobilePage.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  });
  await mobilePage.waitForTimeout(3000);

  const mobileDarkPath = path.join(OUT, "mobile-dashboard-dark.png");
  await mobilePage.screenshot({ path: mobileDarkPath, fullPage: false });
  console.log("✓ Saved Mobile Dark Screenshot:", mobileDarkPath);

  await mobileContext.close();
  await browser.close();

  console.log("🎉 All 4 production screenshots for Aliya Batool successfully captured!");
}

main().catch((err) => {
  console.error("Error capturing production screenshots:", err);
  process.exit(1);
});
