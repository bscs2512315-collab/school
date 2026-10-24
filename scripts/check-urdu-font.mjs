import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const fontRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("Noto+Nastaliq+Urdu")) fontRequests.push(request.url());
  });
  await page.goto("http://localhost:3004/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const before = fontRequests.length;
  await page.evaluate(() => {
    const element = document.createElement("span");
    element.className = "font-urdu";
    element.textContent = "اردو";
    document.body.appendChild(element);
  });
  await page.waitForTimeout(1500);
  console.log(JSON.stringify({ requestsBeforeUrdu: before, requestsAfterUrdu: fontRequests.length }));
} finally {
  await browser.close();
}
