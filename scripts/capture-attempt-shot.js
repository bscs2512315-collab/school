const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { SignJWT } = require("jose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const BASE = "http://localhost:3002";
const OUT = path.join(__dirname, "../public/landing");
const PAPER_ID = "7befed4e-866d-4bfe-b6cf-35c01fdd5eef";

const TEST_USER = {
  id: "e21b23ae-3ae1-4ccd-b8da-5934994c7fa3",
  email: "mtahatalib110+aliya@gmail.com",
  name: "Aliya Batool",
  role: "STUDENT",
  is_verified: true,
  class: "XI",
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

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  // 1. Light mode capture
  const ctxLight = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  await ctxLight.addCookies([
    { name: "exboard_token", value: token, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  const pageLight = await ctxLight.newPage();

  // Set auth in storage
  await pageLight.goto(`${BASE}/student/dashboard`, { waitUntil: "domcontentloaded" });
  await pageLight.evaluate(
    ({ token, user }) => {
      localStorage.setItem("exboard_token", token);
      localStorage.setItem("exboard_user", JSON.stringify(user));
      localStorage.setItem("theme", "light");
    },
    { token, user: TEST_USER }
  );

  console.log("Navigating to paper attempt light...");
  await pageLight.goto(`${BASE}/student/past-paper/${PAPER_ID}/attempt`, { waitUntil: "networkidle", timeout: 60000 });
  await pageLight.waitForTimeout(3000);

  const lightOut = path.join(OUT, "paper-attempt-shot.png");
  await pageLight.screenshot({ path: lightOut, fullPage: false });
  console.log("Saved light screenshot:", lightOut);

  // 2. Dark mode capture
  const ctxDark = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  await ctxDark.addCookies([
    { name: "exboard_token", value: token, domain: "localhost", path: "/", sameSite: "Lax" },
  ]);
  const pageDark = await ctxDark.newPage();

  await pageDark.goto(`${BASE}/student/dashboard`, { waitUntil: "domcontentloaded" });
  await pageDark.evaluate(
    ({ token, user }) => {
      localStorage.setItem("exboard_token", token);
      localStorage.setItem("exboard_user", JSON.stringify(user));
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    },
    { token, user: TEST_USER }
  );

  console.log("Navigating to paper attempt dark...");
  await pageDark.goto(`${BASE}/student/past-paper/${PAPER_ID}/attempt`, { waitUntil: "networkidle", timeout: 60000 });
  await pageDark.waitForTimeout(3000);

  const darkOut = path.join(OUT, "paper-attempt-shot-dark.png");
  await pageDark.screenshot({ path: darkOut, fullPage: false });
  console.log("Saved dark screenshot:", darkOut);

  await browser.close();
}

capture().catch(console.error);
