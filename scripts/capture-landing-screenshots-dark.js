const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3002";
const OUT = path.join(__dirname, "../public/landing");
const EMAIL = "mtahatalib110+3@gmail.com";
const PASSWORD = "Test@123";

const PAGES = [
  { name: "dashboard", path: "/student/dashboard" },
  { name: "past-papers", path: "/student/past-papers-1" },
  { name: "leaderboard", path: "/student/leaderboard" },
  { name: "nova", path: "/student/nova" },
  { name: "generate", path: "/student/generate" },
  { name: "history", path: "/student/history" },
];

async function applyDark(page) {
  await page.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  });
}

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

  const token = loginJson.data.token;
  const user = loginJson.data.user;
  console.log("Logged in as", user.email);

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    colorScheme: "dark",
  });
  await context.addCookies([
    {
      name: "exboard_token",
      value: token,
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  page.setDefaultTimeout(90000);

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem("exboard_token", token);
      localStorage.setItem("exboard_user", JSON.stringify(user));
      localStorage.setItem("theme", "dark");
    },
    { token, user },
  );

  for (const item of PAGES) {
    const file = path.join(OUT, `${item.name}-dark.png`);
    console.log(`Capturing dark ${item.name}...`);
    await page.goto(`${BASE}${item.path}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await applyDark(page);
    await page.waitForTimeout(3500);
    await page.screenshot({
      path: file,
      fullPage: false,
      timeout: 60000,
      animations: "disabled",
    });
    console.log(`Saved ${file}`);
  }

  await browser.close();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
