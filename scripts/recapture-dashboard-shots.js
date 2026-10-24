const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { SignJWT } = require("jose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const BASE = "http://localhost:3002";
const OUT = path.join(__dirname, "../public/landing");

const TEST_USER = {
  id: "e21b23ae-3ae1-4ccd-b8da-5934994c7fa3",
  email: "mtahatalib110+3@gmail.com",
  name: "Muhammad Taha Talib",
  role: "STUDENT",
  is_verified: true,
  class: "IX",
  board: "AKUEB",
};

async function createToken(user) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key");
  const token = await new SignJWT({
    userId: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    class: user.class,
    board: user.board,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  return token;
}

async function capture() {
  fs.mkdirSync(OUT, { recursive: true });
  const token = await createToken(TEST_USER);
  console.log("Created token for:", TEST_USER.name);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  // 1. Desktop Light
  console.log("Capturing Desktop Light Dashboard...");
  const desktopCtxLight = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: "light",
  });
  await desktopCtxLight.addCookies([
    { name: "exboard_token", value: token, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  const desktopPageLight = await desktopCtxLight.newPage();
  await desktopPageLight.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await desktopPageLight.evaluate(({ token, user }) => {
    localStorage.setItem("exboard_token", token);
    localStorage.setItem("exboard_user", JSON.stringify(user));
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, { token, user: TEST_USER });
  await desktopPageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await desktopPageLight.waitForTimeout(3000);
  const deskLightFile = path.join(OUT, "student-dashboard.png");
  await desktopPageLight.screenshot({ path: deskLightFile, fullPage: false });
  fs.copyFileSync(deskLightFile, path.join(OUT, "dashboard.png"));
  console.log("Saved Desktop Light:", deskLightFile);
  await desktopCtxLight.close();

  // 2. Mobile Light
  console.log("Capturing Mobile Light Dashboard...");
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
  await mobilePageLight.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await mobilePageLight.evaluate(({ token, user }) => {
    localStorage.setItem("exboard_token", token);
    localStorage.setItem("exboard_user", JSON.stringify(user));
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, { token, user: TEST_USER });
  await mobilePageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await mobilePageLight.waitForTimeout(3000);
  const mobileLightFile = path.join(OUT, "mobile-dashboard.png");
  await mobilePageLight.screenshot({ path: mobileLightFile, fullPage: false });
  console.log("Saved Mobile Light:", mobileLightFile);
  await mobileCtxLight.close();

  // 3. Desktop Dark
  console.log("Capturing Desktop Dark Dashboard...");
  const desktopCtxDark = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: "dark",
  });
  await desktopCtxDark.addCookies([
    { name: "exboard_token", value: token, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  const desktopPageDark = await desktopCtxDark.newPage();
  await desktopPageDark.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await desktopPageDark.evaluate(({ token, user }) => {
    localStorage.setItem("exboard_token", token);
    localStorage.setItem("exboard_user", JSON.stringify(user));
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, { token, user: TEST_USER });
  await desktopPageDark.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await desktopPageDark.waitForTimeout(3000);
  const deskDarkFile = path.join(OUT, "student-dashboard-dark-v2.png");
  await desktopPageDark.screenshot({ path: deskDarkFile, fullPage: false });
  fs.copyFileSync(deskDarkFile, path.join(OUT, "dashboard-dark-v2.png"));
  console.log("Saved Desktop Dark:", deskDarkFile);
  await desktopCtxDark.close();

  // 4. Mobile Dark
  console.log("Capturing Mobile Dark Dashboard...");
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
  await mobilePageDark.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await mobilePageDark.evaluate(({ token, user }) => {
    localStorage.setItem("exboard_token", token);
    localStorage.setItem("exboard_user", JSON.stringify(user));
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, { token, user: TEST_USER });
  await mobilePageDark.goto(`${BASE}/student/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
  await mobilePageDark.waitForTimeout(3000);
  const mobileDarkFile = path.join(OUT, "mobile-dashboard-dark.png");
  await mobilePageDark.screenshot({ path: mobileDarkFile, fullPage: false });
  console.log("Saved Mobile Dark:", mobileDarkFile);
  await mobileCtxDark.close();

  await browser.close();
  console.log("All dashboard screenshots successfully captured!");
}

capture().catch((err) => {
  console.error("Capture error:", err);
  process.exit(1);
});
