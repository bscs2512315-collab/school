const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3002";
const OUT = path.join(__dirname, "../public/guide-shots");
const EMAIL = "mtahatalib110+aliya@gmail.com";
const PASSWORD = "Test@123";

const PAGES_TO_CAPTURE = [
  { id: "dashboard", path: "/student/dashboard" },
  { id: "past-papers-1", path: "/student/past-papers-1" },
  { id: "past-paper-1-attempt", path: "/student/past-paper/7befed4e-866d-4bfe-b6cf-35c01fdd5eef/attempt" },
  { id: "past-papers-2", path: "/student/past-papers-2" },
  { id: "lab-game", path: "/student/lab-game" },
  { id: "leaderboard", path: "/student/leaderboard" },
  { id: "nova", path: "/student/nova" },
  { id: "generate", path: "/student/generate" },
  { id: "solved-notes", path: "/student/solved-notes" },
  { id: "practical-journals", path: "/student/practical-journals" },
  { id: "curriculum", path: "/student/curriculum" },
  { id: "challenge", path: "/student/challenge" },
  { id: "classrooms", path: "/student/classrooms" },
];

async function captureAll() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  // 1. Desktop Session
  console.log("Starting Desktop Login...");
  const deskCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const deskPage = await deskCtx.newPage();

  await deskPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await deskPage.waitForTimeout(1000);
  await deskPage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await deskPage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await deskPage.locator('button[type="submit"], button:has-text("Sign In")').click();
  await deskPage.waitForURL("**/student/dashboard**", { timeout: 30000 });
  await deskPage.waitForTimeout(3000);

  for (const item of PAGES_TO_CAPTURE) {
    console.log(`Desktop Capturing: ${item.id}...`);
    try {
      await deskPage.goto(`${BASE}${item.path}`, { waitUntil: "networkidle", timeout: 30000 });
      await deskPage.waitForTimeout(3000);
      const deskFile = path.join(OUT, `desk-${item.id}.png`);
      await deskPage.screenshot({ path: deskFile, fullPage: false });
      console.log(`Saved: desk-${item.id}.png`);
    } catch (e) {
      console.log(`Warning desk on ${item.id}:`, e.message);
    }
  }

  // 2. Mobile Session
  console.log("Starting Mobile Login...");
  const mobCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "light",
  });
  const mobPage = await mobCtx.newPage();

  await mobPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await mobPage.waitForTimeout(1000);
  await mobPage.locator('input[type="email"], input[name="email"]').fill(EMAIL);
  await mobPage.locator('input[type="password"], input[name="password"]').fill(PASSWORD);
  await mobPage.locator('button[type="submit"], button:has-text("Sign In")').click();
  await mobPage.waitForURL("**/student/dashboard**", { timeout: 30000 });
  await mobPage.waitForTimeout(3000);

  for (const item of PAGES_TO_CAPTURE) {
    console.log(`Mobile Capturing: ${item.id}...`);
    try {
      await mobPage.goto(`${BASE}${item.path}`, { waitUntil: "networkidle", timeout: 30000 });
      await mobPage.waitForTimeout(3000);
      const mobFile = path.join(OUT, `mob-${item.id}.png`);
      await mobPage.screenshot({ path: mobFile, fullPage: false });
      console.log(`Saved: mob-${item.id}.png`);
    } catch (e) {
      console.log(`Warning mob on ${item.id}:`, e.message);
    }
  }

  // Capture register page unauthenticated
  const regCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const regPage = await regCtx.newPage();
  await regPage.goto(`${BASE}/register`, { waitUntil: "networkidle", timeout: 30000 });
  await regPage.waitForTimeout(2000);
  await regPage.screenshot({ path: path.join(OUT, "desk-register.png"), fullPage: false });

  const mobRegCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobRegPage = await mobRegCtx.newPage();
  await mobRegPage.goto(`${BASE}/register`, { waitUntil: "networkidle", timeout: 30000 });
  await mobRegPage.waitForTimeout(2000);
  await mobRegPage.screenshot({ path: path.join(OUT, "mob-register.png"), fullPage: false });

  await browser.close();
  console.log("All real screenshots re-captured with live UI!");
}

captureAll().catch(console.error);
