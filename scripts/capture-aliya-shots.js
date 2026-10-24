const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3002";
const OUT = path.join(__dirname, "../public/landing");
const EMAIL = "mtahatalib110+aliya@gmail.com";
const PASSWORD = "Test@123";

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // 1. Authenticate via local dev API
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginJson = await loginRes.json();
  if (!loginRes.ok || !loginJson?.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
  }

  const token = loginJson.data?.token || loginRes.headers.get("set-cookie");
  const user = loginJson.data?.user;
  console.log("Logged in as:", user.name, `(${user.email})`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  // Helper to setup page with auth and theme
  async function setupPage(context, isDark) {
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    // Seed localStorage via login page
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ user, isDark }) => {
      localStorage.setItem("exboard_user", JSON.stringify(user));
      localStorage.setItem("theme", isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }, { user, isDark });

    return page;
  }

  // ==========================================
  // 1. DESKTOP LIGHT MODE
  // ==========================================
  console.log("Capturing Desktop Light Dashboard for Aliya Batool...");
  const deskCtxLight = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: "light",
  });
  const deskPageLight = await setupPage(deskCtxLight, false);
  await deskPageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await deskPageLight.waitForTimeout(4000);
  const deskLightPath = path.join(OUT, "student-dashboard.png");
  await deskPageLight.screenshot({ path: deskLightPath, fullPage: false });
  fs.copyFileSync(deskLightPath, path.join(OUT, "dashboard.png"));
  console.log("Saved Desktop Light ->", deskLightPath);
  await deskCtxLight.close();

  // ==========================================
  // 2. MOBILE LIGHT MODE (Full mobile viewport with header and bottom navigation)
  // ==========================================
  console.log("Capturing Mobile Light Dashboard for Aliya Batool...");
  const mobileCtxLight = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "light",
  });
  const mobilePageLight = await setupPage(mobileCtxLight, false);
  await mobilePageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await mobilePageLight.waitForTimeout(4000);
  const mobileLightPath = path.join(OUT, "mobile-dashboard.png");
  await mobilePageLight.screenshot({ path: mobileLightPath, fullPage: false });
  console.log("Saved Mobile Light ->", mobileLightPath);
  await mobileCtxLight.close();

  // ==========================================
  // 3. DESKTOP DARK MODE
  // ==========================================
  console.log("Capturing Desktop Dark Dashboard for Aliya Batool...");
  const deskCtxDark = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: "dark",
  });
  const deskPageDark = await setupPage(deskCtxDark, true);
  await deskPageDark.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await deskPageDark.waitForTimeout(4000);
  const deskDarkPath = path.join(OUT, "student-dashboard-dark-v2.png");
  await deskPageDark.screenshot({ path: deskDarkPath, fullPage: false });
  fs.copyFileSync(deskDarkPath, path.join(OUT, "dashboard-dark-v2.png"));
  console.log("Saved Desktop Dark ->", deskDarkPath);
  await deskCtxDark.close();

  // ==========================================
  // 4. MOBILE DARK MODE
  // ==========================================
  console.log("Capturing Mobile Dark Dashboard for Aliya Batool...");
  const mobileCtxDark = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });
  const mobilePageDark = await setupPage(mobileCtxDark, true);
  await mobilePageDark.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await mobilePageDark.waitForTimeout(4000);
  const mobileDarkPath = path.join(OUT, "mobile-dashboard-dark.png");
  await mobilePageDark.screenshot({ path: mobileDarkPath, fullPage: false });
  console.log("Saved Mobile Dark ->", mobileDarkPath);
  await mobileCtxDark.close();

  await browser.close();
  console.log("All 4 screenshots for Aliya Batool completed successfully!");
}

main().catch((err) => {
  console.error("Capture error:", err);
  process.exit(1);
});
