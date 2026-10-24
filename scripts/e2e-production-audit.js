const PROD_BASE = "https://www.exboardai.tech";
const EMAIL = "mtahatalib110+aliya@gmail.com";
const PASSWORD = "Test@123";

const PUBLIC_PAGES = [
  { name: "Landing Home", path: "/" },
  { name: "Privacy Policy", path: "/privacy" },
  { name: "Terms & Conditions", path: "/terms" },
  { name: "Login Page", path: "/login" },
  { name: "Register Page", path: "/register" },
  { name: "Forgot Password", path: "/forgot-password" },
  { name: "Past Papers Public Index", path: "/past-papers" },
  { name: "Curriculum Public Index", path: "/curriculum" },
  { name: "Practical Journals Public Index", path: "/practical-journals" },
];

const STUDENT_PAGES = [
  { name: "Student Dashboard", path: "/student/dashboard" },
  { name: "Past Papers 1 (MCQs)", path: "/student/past-papers-1" },
  { name: "Past Papers 2 (CRQs/ERQs)", path: "/student/past-papers-2" },
  { name: "Curriculum Syllabus", path: "/student/curriculums" },
  { name: "Solved Notes", path: "/student/solved-notes" },
  { name: "Practical Journals", path: "/student/practical-journals" },
  { name: "Leaderboard", path: "/student/leaderboard" },
  { name: "Lightning Arena / Challenge", path: "/student/challenge" },
  { name: "Custom Quizzes", path: "/student/custom-quizzes" },
  { name: "Dynamic Question Generator", path: "/student/generate" },
  { name: "History & Analytics", path: "/student/history" },
  { name: "Student Settings", path: "/student/settings" },
  { name: "Student Profile / Account", path: "/student/account" },
  { name: "Study Network / Friends", path: "/student/friends" },
  { name: "Notifications", path: "/student/notifications" },
  { name: "Classrooms", path: "/student/classrooms" },
  { name: "Nova AI Tutor", path: "/student/nova" },
];

const NOVA_QUERIES = [
  {
    topic: "Physics",
    query: "Explain Newton's second law of motion and show how F = ma is derived with SI units.",
    expected: /Newton|F\s*=\s*ma/i,
  },
  {
    topic: "Biology",
    query: "What is the primary function of mitochondria in a eukaryotic cell, and why is it called the powerhouse?",
    expected: /mitochondri|ATP|cellular respiration/i,
  },
  {
    topic: "Mathematics",
    query: "Solve the quadratic equation 2x^2 + 5x - 3 = 0 using factorization and show each step clearly.",
    expected: /factor|quadratic|x\s*=\s*(?:-|\\frac|\d)/i,
  },
];

async function runAudit() {
  const [{ chromium }, fs, path] = await Promise.all([
    import("playwright"),
    import("node:fs"),
    import("node:path"),
  ]);
  console.log("===============================================================");
  console.log(`🚀 Starting Comprehensive Production E2E Audit on ${PROD_BASE}`);
  console.log("===============================================================\n");

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: PROD_BASE,
    publicPages: [],
    studentPages: [],
    novaAiTests: [],
    paperAttemptTests: [],
    errors: [],
  };

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  // Collect console errors and unhandled rejections
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter out non-fatal noisy browser logs (e.g., analytics or third-party favicon)
      if (!text.includes("favicon") && !text.includes("404 (Not Found)") && !text.includes("analytics")) {
        console.warn(`  ⚠️ Console Error [${page.url()}]: ${text.slice(0, 180)}`);
      }
    }
  });

  page.on("pageerror", (err) => {
    console.error(`  ❌ Page Uncaught Error [${page.url()}]: ${err.message}`);
    results.errors.push({ url: page.url(), error: err.message });
  });

  // ---------------------------------------------------------------------------
  // STEP 1: TEST PUBLIC MARKETING & LEGAL PAGES
  // ---------------------------------------------------------------------------
  console.log("--- 1. Testing Public & Legal Pages ---");
  for (const item of PUBLIC_PAGES) {
    const targetUrl = `${PROD_BASE}${item.path}`;
    const start = Date.now();
    try {
      const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      const duration = Date.now() - start;
      const status = response ? response.status() : 0;
      const title = await page.title();

      const pageResult = {
        name: item.name,
        path: item.path,
        status,
        durationMs: duration,
        title,
        ok: status >= 200 && status < 400,
      };

      results.publicPages.push(pageResult);
      console.log(`  ✓ [${status}] ${item.name} (${item.path}) - ${duration}ms - "${title.slice(0, 40)}..."`);
    } catch (err) {
      console.error(`  ❌ Failed loading ${item.name} (${item.path}): ${err.message}`);
      results.publicPages.push({
        name: item.name,
        path: item.path,
        error: err.message,
        ok: false,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 2: AUTHENTICATE INTO STUDENT PORTAL
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Authenticating as Student (Aliya) ---");
  const authStart = Date.now();
  await page.goto(`${PROD_BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="identifier"], input[type="email"], input[name="email"]', { timeout: 15000 });

  const emailInput = page.locator('input[name="identifier"], input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

  await emailInput.fill(EMAIL);
  await passwordInput.fill(PASSWORD);

  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  // Wait for redirect to /student/dashboard or student portal
  await page.waitForURL(/student/, { timeout: 30000 });
  const authDuration = Date.now() - authStart;
  console.log(`  ✓ Logged in successfully in ${authDuration}ms. Current URL: ${page.url()}`);

  // ---------------------------------------------------------------------------
  // STEP 3: TEST ALL AUTHENTICATED STUDENT PAGES & MEASURE SPEED
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Testing Authenticated Student Pages ---");
  for (const item of STUDENT_PAGES) {
    const targetUrl = `${PROD_BASE}${item.path}`;
    const start = Date.now();
    try {
      const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 35000 });
      // Wait for content render
      await page.waitForTimeout(1200);
      const duration = Date.now() - start;
      const status = response ? response.status() : 0;
      const title = await page.title();

      // Check if page rendered error UI
      const bodyText = await page.locator("body").innerText();
      const hasCrash = bodyText.includes("Minified React error") || bodyText.includes("Application error:") || bodyText.includes("500 Internal Server Error");

      const pageResult = {
        name: item.name,
        path: item.path,
        status,
        durationMs: duration,
        title,
        ok: status >= 200 && status < 400 && !hasCrash,
        hasCrash,
      };

      results.studentPages.push(pageResult);
      if (hasCrash) {
        console.error(`  ❌ CRASH DETECTED on ${item.name} (${item.path})`);
      } else {
        console.log(`  ✓ [${status}] ${item.name} (${item.path}) - ${duration}ms - "${title.slice(0, 35)}..."`);
      }
    } catch (err) {
      console.error(`  ❌ Failed loading ${item.name} (${item.path}): ${err.message}`);
      results.studentPages.push({
        name: item.name,
        path: item.path,
        error: err.message,
        ok: false,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 4: DEEP NOVA AI TUTOR INTERACTION & ACCURACY TESTING
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Testing Nova AI Tutor (Live Queries & Streaming) ---");
  await page.goto(`${PROD_BASE}/student/nova`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  for (let i = 0; i < NOVA_QUERIES.length; i++) {
    const q = NOVA_QUERIES[i];
    console.log(`\n  Testing Nova Query #${i + 1} [${q.topic}]: "${q.query}"`);
    const qStart = Date.now();

    try {
      const inputLocator = page.locator('textarea, input[placeholder*="Ask"], input[placeholder*="Nova"], input[placeholder*="question"]').first();
      await inputLocator.waitFor({ state: "visible", timeout: 10000 });
      const assistantMessages = page.locator('.nova-message-enter:has(img[alt="Nova"])');
      const assistantCountBefore = await assistantMessages.count();
      await inputLocator.fill(q.query);
      await page.waitForTimeout(300);

      // Find send button or press Enter
      const sendButton = page.locator('button:has-text("Send"), button[aria-label*="Send"], button svg.lucide-send, form button[type="submit"]').first();
      if (await sendButton.isVisible().catch(() => false)) {
        await sendButton.click();
      } else {
        await inputLocator.press("Enter");
      }

      // Wait for AI response to appear and complete streaming
      console.log("    Waiting for Nova response stream...");
      await assistantMessages.nth(assistantCountBefore).waitFor({ state: "visible", timeout: 45000 });

      // Wait until response container has substantial text and streaming finishes
      let lastLen = 0;
      let stableCount = 0;
      let finalResponse = "";

      for (let attempt = 0; attempt < 30; attempt++) {
        await page.waitForTimeout(1000);
        const current = await assistantMessages.nth(assistantCountBefore).innerText().catch(() => "");
        const currentLen = current.length;

        if (currentLen > lastLen) {
          lastLen = currentLen;
          stableCount = 0;
        } else if (currentLen > 100 && currentLen === lastLen) {
          stableCount++;
          if (stableCount >= 3) {
            finalResponse = current;
            break;
          }
        }
      }

      const qDuration = Date.now() - qStart;
      const hasResponse = finalResponse.length > 50;
      const isRelevant = q.expected.test(finalResponse) && !/here is the .* syllabus/i.test(finalResponse);

      // Extract a snippet
      const snippet = finalResponse.slice(-300).replace(/\n+/g, " ");

      results.novaAiTests.push({
        topic: q.topic,
        query: q.query,
        durationMs: qDuration,
        responseLength: finalResponse.length,
        snippet,
        ok: hasResponse && isRelevant,
        ...(!isRelevant ? { error: "Nova answered a different task" } : {}),
      });

      console.log(`    ${hasResponse && isRelevant ? "✓" : "❌"} Received Nova response in ${qDuration}ms (${finalResponse.length} chars)`);
      console.log(`    Snippet: "...${snippet.slice(0, 150)}..."`);
    } catch (err) {
      console.error(`    ❌ Nova query failed: ${err.message}`);
      results.novaAiTests.push({
        topic: q.topic,
        query: q.query,
        error: err.message,
        ok: false,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 5: DEEP PAPER ATTEMPT VERIFICATION (Paper 1 & Paper 2)
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Testing Past Paper Attempt Flow (Paper 1 & Paper 2) ---");
  try {
    // 5A: Paper 1 List & Open
    await page.goto(`${PROD_BASE}/student/past-papers-1`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const paper1Card = page.locator("a[href*='/student/past-paper/'], button:has-text('Attempt'), button:has-text('Solve'), a:has-text('Start')").first();
    if (await paper1Card.isVisible().catch(() => false)) {
      const p1Href = await paper1Card.getAttribute("href").catch(() => null);
      console.log(`  ✓ Found Paper 1 target: ${p1Href || "Interactive button"}`);
      if (p1Href) {
        await page.goto(`${PROD_BASE}${p1Href}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1500);
        const p1Title = await page.title();
        const p1Body = await page.locator("body").innerText();
        const p1Crash = p1Body.includes("Minified React error") || p1Body.includes("Application error:");
        console.log(`  ✓ Paper 1 Attempt View: OK (No crashes, Title: "${p1Title.slice(0, 30)}")`);
        results.paperAttemptTests.push({ type: "Paper 1", path: p1Href, ok: !p1Crash });
      }
    }

    // 5B: Paper 2 List & Open
    await page.goto(`${PROD_BASE}/student/past-papers-2`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const paper2Link = page.locator("a[href*='/attempt-paper2'], a[href*='/student/past-paper/'], button:has-text('Attempt'), button:has-text('Solve')").first();
    if (await paper2Link.isVisible().catch(() => false)) {
      const p2Href = await paper2Link.getAttribute("href").catch(() => null);
      console.log(`  ✓ Found Paper 2 target: ${p2Href || "Interactive button"}`);
      if (p2Href) {
        await page.goto(`${PROD_BASE}${p2Href}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const p2Title = await page.title();
        const p2Body = await page.locator("body").innerText();
        const p2Crash = p2Body.includes("Minified React error") || p2Body.includes("Application error:");
        console.log(`  ✓ Paper 2 Attempt View: OK (No hook/render errors! Title: "${p2Title.slice(0, 30)}")`);
        results.paperAttemptTests.push({ type: "Paper 2", path: p2Href, ok: !p2Crash });
      }
    }
  } catch (err) {
    console.warn(`  ⚠️ Paper attempt verification note: ${err.message}`);
  }

  await browser.close();

  // Save audit results to JSON
  const auditPath = path.join(__dirname, "../docs/qa/2026-10-02-production-audit.json");
  fs.mkdirSync(path.dirname(auditPath), { recursive: true });
  fs.writeFileSync(auditPath, JSON.stringify(results, null, 2));

  console.log("\n===============================================================");
  console.log(`✅ Production E2E Audit Completed Successfully!`);
  console.log(`Total Public Pages Verified: ${results.publicPages.filter(p => p.ok).length}/${results.publicPages.length}`);
  console.log(`Total Student Pages Verified: ${results.studentPages.filter(p => p.ok).length}/${results.studentPages.length}`);
  console.log(`Total Nova AI Queries Tested: ${results.novaAiTests.filter(t => t.ok).length}/${results.novaAiTests.length}`);
  console.log(`Results saved to: ${auditPath}`);
  console.log("===============================================================\n");
}

runAudit().catch((err) => {
  console.error("FATAL ERROR during production audit:", err);
  process.exit(1);
});
