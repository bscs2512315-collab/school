const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3002";
const OUT = path.join(__dirname, "../public/landing");
const EMAIL = "mtahatalib110+aliya@gmail.com";
const PASSWORD = "Test@123";

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // 1. Authenticate to get real JWT token and user profile
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginJson = await loginRes.json();
  if (!loginRes.ok || !loginJson?.success) {
    throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
  }

  const token = loginJson.data?.token;
  const user = loginJson.data?.user;
  console.log("Logged in successfully as:", user.name, `(${user.email})`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  // ==========================================
  // 1. DESKTOP LIGHT MODE
  // ==========================================
  console.log("1. Capturing Desktop Light Dashboard (Aliya Batool)...");
  const deskCtxLight = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: "light",
  });
  await deskCtxLight.addCookies([
    { name: "exboard_token", value: token, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  const deskPageLight = await deskCtxLight.newPage();
  await deskPageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "commit" });
  await deskPageLight.evaluate(({ token, user }) => {
    localStorage.setItem("exboard_token", token);
    localStorage.setItem("exboard_user", JSON.stringify(user));
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, { token, user });
  await deskPageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await deskPageLight.waitForTimeout(4000);
  const deskLightPath = path.join(OUT, "student-dashboard.png");
  await deskPageLight.screenshot({ path: deskLightPath, fullPage: false });
  fs.copyFileSync(deskLightPath, path.join(OUT, "dashboard.png"));
  console.log("Saved Desktop Light ->", deskLightPath);
  await deskCtxLight.close();

  // ==========================================
  // 2. MOBILE LIGHT MODE (Full mobile viewport with header and bottom navbar)
  // ==========================================
  console.log("2. Capturing Mobile Light Dashboard (Aliya Batool)...");
  const mobileCtxLight = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "light",
  });
  await mobileCtxLight.addCookies([
    { name: "exboard_token", value: token, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  const mobilePageLight = await mobileCtxLight.newPage();
  await mobilePageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "commit" });
  await mobilePageLight.evaluate(({ token, user }) => {
    localStorage.setItem("exboard_token", token);
    localStorage.setItem("exboard_user", JSON.stringify(user));
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, { token, user });
  await mobilePageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await mobilePageLight.waitForTimeout(4000);
  const mobileLightPath = path.join(OUT, "mobile-dashboard.png");
  await mobilePageLight.screenshot({ path: mobileLightPath, fullPage: false });
  console.log("Saved Mobile Light ->", mobileLightPath);
  await mobileCtxLight.close();

  // ==========================================
  // 3. DESKTOP DARK MODE
  // ==========================================
  console.log("3. Capturing Desktop Dark Dashboard (Aliya Batool)...");
  const deskCtxDark = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: "dark",
  });
  await deskCtxDark.addCookies([
    { name: "exboard_token", value: token, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  const deskPageDark = await deskCtxDark.newPage();
  await deskPageDark.goto(`${BASE}/student/dashboard`, { waitUntil: "commit" });
  await deskPageDark.evaluate(({ token, user }) => {
    localStorage.setItem("exboard_token", token);
    localStorage.setItem("exboard_user", JSON.stringify(user));
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, { token, user });
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
  console.log("4. Capturing Mobile Dark Dashboard (Aliya Batool)...");
  const mobileCtxDark = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });
  await mobileCtxDark.addCookies([
    { name: "exboard_token", value: token, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  const mobilePageDark = await mobileCtxDark.newPage();
  await mobilePageDark.goto(`${BASE}/student/dashboard`, { waitUntil: "commit" });
  await mobilePageDark.evaluate(({ token, user }) => {
    localStorage.setItem("exboard_token", token);
    localStorage.setItem("exboard_user", JSON.stringify(user));
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, { token, user });
  await mobilePageDark.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await mobilePageDark.waitForTimeout(4000);
  const mobileDarkPath = path.join(OUT, "mobile-dashboard-dark.png");
  await mobilePageDark.screenshot({ path: mobileDarkPath, fullPage: false });
  console.log("Saved Mobile Dark ->", mobileDarkPath);
  await mobileCtxDark.close();

  await browser.close();
  console.log("All 4 Hero dashboard screenshots for Aliya Batool successfully captured!");
}

main().catch((err) => {
  console.error("Capture script error:", err);
  process.exit(1);
});
