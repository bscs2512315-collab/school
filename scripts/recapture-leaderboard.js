const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3002";
const OUT = path.join(__dirname, "../public/landing");
const EMAIL = "mtahatalib110+aliya@gmail.com";
const PASSWORD = "Test@123";

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginJson = await loginRes.json();
  const user = loginJson.data?.user;
  console.log("Logged in:", user?.name);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  async function captureLeaderboard(isDark) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
      colorScheme: isDark ? "dark" : "light",
    });

    const page = await context.newPage();
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

    await page.goto(`${BASE}/student/leaderboard`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(4000);

    const fileName = isDark ? "leaderboard-dark-v2.png" : "leaderboard.png";
    const dest = path.join(OUT, fileName);
    await page.screenshot({ path: dest, fullPage: false });
    if (isDark) {
      fs.copyFileSync(dest, path.join(OUT, "leaderboard-dark.png"));
    }
    console.log(`Saved ${fileName} -> ${dest}`);
    await context.close();
  }

  async function captureMobileLeaderboard(isDark) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: isDark ? "dark" : "light",
    });

    const page = await context.newPage();
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

    await page.goto(`${BASE}/student/leaderboard`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(4000);

    const fileName = isDark ? "mobile-leaderboard-dark.png" : "mobile-leaderboard.png";
    const dest = path.join(OUT, fileName);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`Saved ${fileName} -> ${dest}`);
    await context.close();
  }

  console.log("Capturing latest Leaderboard screenshots...");
  await captureLeaderboard(false);
  await captureLeaderboard(true);
  await captureMobileLeaderboard(false);
  await captureMobileLeaderboard(true);

  await browser.close();
  console.log("Done updating Leaderboard screenshots!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
