const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3002";
const OUT = path.join(__dirname, "../public/landing");
const EMAIL = "mtahatalib110+8@gmail.com";
const PASSWORD = "Test@123";

const PAGES = [
  { name: "dashboard", path: "/student/dashboard", waitMs: 3000 },
  { name: "past-papers", path: "/student/past-papers-1", waitMs: 3000 },
  { name: "leaderboard", path: "/student/leaderboard", waitMs: 3000 },
  { name: "nova", path: "/student/nova", waitMs: 3000 },
  { name: "generate", path: "/student/generate", waitMs: 3000 },
  { name: "history", path: "/student/history", waitMs: 3000 },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

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
  if (!token || !user) {
    throw new Error(`Missing token/user: ${JSON.stringify(loginJson)}`);
  }
  console.log("API login ok as", user.email || user.name, user.role);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  await context.addCookies([
    {
      name: "exboard_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem("exboard_token", token);
      localStorage.setItem("exboard_user", JSON.stringify(user));
    },
    { token, user },
  );

  for (const item of PAGES) {
    const file = path.join(OUT, `${item.name}.png`);
    console.log(`Capturing ${item.name}...`);
    await page.goto(`${BASE}${item.path}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(item.waitMs);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`Saved ${file}`);
  }

  await browser.close();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
