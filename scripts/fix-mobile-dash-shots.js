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
  // 1. MOBILE CAPTURES: Light and Dark
  // =========================================================================
  console.log("=== Capturing Mobile Dashboard ===");
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const mobilePage = await mobileCtx.newPage();
  mobilePage.setDefaultTimeout(60000);

  console.log("Mobile: Navigating to login...");
  await mobilePage.goto(`${PROD_BASE}/login`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(2000);

  console.log("Mobile: Submitting login credentials...");
  await mobilePage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await mobilePage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await mobilePage.waitForTimeout(500);

  await mobilePage.locator('button[type="submit"], button:has-text("Sign In")').click();

  console.log("Mobile: Waiting for student dashboard redirect...");
  await mobilePage.waitForURL("**/student/dashboard**", { timeout: 60000 });
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.waitForTimeout(5000);

  // Safety check: ensure we are ON the dashboard and NOT login page
  const mobileUrl = mobilePage.url();
  console.log("Mobile verified URL:", mobileUrl);
  if (!mobileUrl.includes("/student/dashboard")) {
    throw new Error(`Mobile ended up at wrong URL: ${mobileUrl}`);
  }

  // A. Mobile Light Mode
  console.log("Mobile: Applying Light Theme...");
  await mobilePage.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  });
  await mobilePage.waitForTimeout(3000);

  const mobLightPath = path.join(OUT, "mobile-dashboard.png");
  await mobilePage.screenshot({ path: mobLightPath, fullPage: false });
  console.log("✓ Saved Mobile Light Dashboard ->", mobLightPath);

  // B. Mobile Dark Mode
  console.log("Mobile: Applying Dark Theme...");
  await mobilePage.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  });
  await mobilePage.waitForTimeout(3000);

  const mobDarkPath = path.join(OUT, "mobile-dashboard-dark.png");
  await mobilePage.screenshot({ path: mobDarkPath, fullPage: false });
  console.log("✓ Saved Mobile Dark Dashboard ->", mobDarkPath);

  await mobileCtx.close();

  // =========================================================================
  // 2. DESKTOP CAPTURES: Light and Dark
  // =========================================================================
  console.log("=== Capturing Desktop Dashboard ===");
  const deskCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const deskPage = await deskCtx.newPage();
  deskPage.setDefaultTimeout(60000);

  console.log("Desktop: Navigating to login...");
  await deskPage.goto(`${PROD_BASE}/login`, { waitUntil: "networkidle" });
  await deskPage.waitForTimeout(2000);

  console.log("Desktop: Submitting login credentials...");
  await deskPage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await deskPage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await deskPage.waitForTimeout(500);

  await deskPage.locator('button[type="submit"], button:has-text("Sign In")').click();

  console.log("Desktop: Waiting for student dashboard redirect...");
  await deskPage.waitForURL("**/student/dashboard**", { timeout: 60000 });
  await deskPage.waitForLoadState("networkidle");
  await deskPage.waitForTimeout(5000);

  // Safety check
  const deskUrl = deskPage.url();
  console.log("Desktop verified URL:", deskUrl);
  if (!deskUrl.includes("/student/dashboard")) {
    throw new Error(`Desktop ended up at wrong URL: ${deskUrl}`);
  }

  // A. Desktop Light Mode
  console.log("Desktop: Applying Light Theme...");
  await deskPage.evaluate(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  });
  await deskPage.waitForTimeout(3000);

  const deskLightPath = path.join(OUT, "student-dashboard.png");
  await deskPage.screenshot({ path: deskLightPath, fullPage: false });
  fs.copyFileSync(deskLightPath, path.join(OUT, "dashboard.png"));
  console.log("✓ Saved Desktop Light Dashboard ->", deskLightPath);

  // B. Desktop Dark Mode
  console.log("Desktop: Applying Dark Theme...");
  await deskPage.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  });
  await deskPage.waitForTimeout(3000);

  const deskDarkPath = path.join(OUT, "student-dashboard-dark-v2.png");
  await deskPage.screenshot({ path: deskDarkPath, fullPage: false });
  fs.copyFileSync(deskDarkPath, path.join(OUT, "dashboard-dark-v2.png"));
  console.log("✓ Saved Desktop Dark Dashboard ->", deskDarkPath);

  await deskCtx.close();
  await browser.close();

  console.log("🎉 All 4 screenshots guaranteed on student dashboard!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
