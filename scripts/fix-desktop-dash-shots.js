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

  console.log("=== Capturing Desktop Dashboard ===");
  const deskCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const deskPage = await deskCtx.newPage();
  deskPage.setDefaultTimeout(60000);

  console.log("Desktop: Navigating to login...");
  await deskPage.goto(`${PROD_BASE}/login`, { waitUntil: "domcontentloaded" });
  await deskPage.waitForTimeout(2000);

  console.log("Desktop: Submitting login credentials...");
  await deskPage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await deskPage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await deskPage.waitForTimeout(500);

  await deskPage.locator('button[type="submit"], button:has-text("Sign In")').click();

  console.log("Desktop: Waiting for student dashboard URL...");
  await deskPage.waitForURL("**/student/dashboard**", { timeout: 60000 });
  await deskPage.waitForTimeout(5000);

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

  console.log("🎉 Desktop screenshots successfully captured and verified on dashboard!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
