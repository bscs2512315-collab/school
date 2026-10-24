import axios from "axios";
import fs from "fs";
import path from "path";

async function checkPostHasImages(url: string): Promise<{ valid: boolean; imgCount: number; title: string }> {
  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      timeout: 8000,
    });
    const html = res.data as string;
    if (html.includes("Page Not Found") || html.includes("404 Not Found") || html.includes("The page you were looking for does not exist")) {
      return { valid: false, imgCount: 0, title: "" };
    }
    const postBodyMatch = html.match(/<div class=["\x27]post-body[\s\S]*?<\/div>\s*<div class=["\x27]post-footer/i);
    const body = postBodyMatch ? postBodyMatch[0] : html;
    const imgs = [...body.matchAll(/<img[^>]+src=["\x27]([^"\x27]+)["\x27]/gi)].map((m) => m[1]);
    const validImgs = imgs.filter(
      (u) => !u.includes("Fill In The Blanks") && !u.includes("button") && !u.includes("badge") && !u.includes("ads") && !u.includes("icon")
    );
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace("Adamjee Coaching:", "").trim() : "";
    return { valid: validImgs.length > 0, imgCount: validImgs.length, title };
  } catch {
    return { valid: false, imgCount: 0, title: "" };
  }
}

async function findSubjectUrls(grade: "IX" | "XII", subject: string, aliases: string[]) {
  console.log(`\n🔍 Searching Past Papers for [Class ${grade} - ${subject}]...`);
  const results: { year: number; postUrl: string; imgCount: number; title: string }[] = [];
  const years = [2025, 2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015, 2014];

  for (const year of years) {
    const candidateUrls: string[] = [];
    for (const a of aliases) {
      if (grade === "XII") {
        // 2025
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2026/04/${a}-12th-past-year-paper-2025.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2026/04/${a}-past-year-paper-2025-for-class-12th.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2026/04/${a}-xii-past-year-paper-2025.html`);
        // 2024
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2025/04/${a}-12th-past-year-paper-2024.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2024/12/${a}-12th-past-year-paper-2024.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2024/12/${a}-xii-past-year-paper-2024.html`);
        // 2023
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2025/02/${a}-12th-past-year-paper-2023.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2023/12/${a}-12th-past-year-paper-2023.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2023/08/${a}-12th-past-year-paper-2023.html`);
        // 2022
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2025/02/${a}-12th-past-year-paper-2022.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2022/08/${a}-12th-past-year-paper-2022.html`);
        // 2021
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2025/02/${a}-12th-past-year-paper-2021.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2021/08/${a}-12th-past-year-paper-2021.html`);
        // 2019
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2019/08/12th-${a}-past-year-paper-2019.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2019/08/xii-${a}-past-year-paper-2019.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2019/09/xii-${a}-past-year-paper-2019.html`);
        // 2018
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2018/08/12th-${a}-past-year-paper-2018.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2018/08/xii-${a}-past-year-paper-2018.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2018/09/xii-${a}-past-year-paper-2018.html`);
        // 2017
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2017/09/xii-${a}-past-year-paper-2017.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2017/08/xii-${a}-past-year-paper-2017.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2017/10/xii-${a}-past-year-paper-2017.html`);
        // 2016
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2016/10/xii-${a}-past-year-paper-2016.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2016/09/xii-${a}-past-year-paper-2016.html`);
        // 2015
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2015/09/xii-${a}-past-year-paper-2015.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2015/10/xii-${a}-past-year-paper-2015.html`);
        // 2014
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2015/09/xii-${a}-past-year-paper-2014.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2014/09/xii-${a}-past-year-paper-2014.html`);
      } else if (grade === "IX") {
        // 2025
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2026/02/${a}-9th-past-year-paper-2025.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2026/03/${a}-9th-past-year-paper-2025.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2026/04/${a}-9th-past-year-paper-2025.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2026/02/${a}-past-year-paper-2025-for-class-9th.html`);
        // 2024
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2024/12/${a}-9th-past-year-paper-2024.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2024/11/${a}-9th-past-year-paper-2024.html`);
        // 2019
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2019/08/9th-${a}-past-year-paper-2019.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2019/08/ix-${a}-past-year-paper-2019.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2019/09/ix-${a}-past-year-paper-2019.html`);
        // 2018
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2018/08/9th-${a}-past-year-paper-2018.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2018/08/ix-${a}-past-year-paper-2018.html`);
        // 2017
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2017/08/ix-${a}-past-year-paper-2017.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2017/09/ix-${a}-past-year-paper-2017.html`);
        // 2016
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2016/09/ix-${a}-past-year-paper-2016.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2016/10/ix-${a}-past-year-paper-2016.html`);
        // 2015
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2015/09/ix-${a}-past-year-paper-2015.html`);
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2015/10/ix-${a}-past-year-paper-2015.html`);
        // 2014
        candidateUrls.push(`https://adamjeecoaching.blogspot.com/2015/09/ix-${a}-past-year-paper-2014.html`);
      }
    }

    const matchedForYear = candidateUrls.filter((u) => u.includes(String(year)));
    for (const url of matchedForYear) {
      const check = await checkPostHasImages(url);
      if (check.valid) {
        console.log(`   ✅ [${year}] Found (${check.imgCount} images): ${url}`);
        results.push({ year, postUrl: url, imgCount: check.imgCount, title: check.title });
        break;
      }
    }
  }

  return results;
}

async function run() {
  console.log("==========================================================================");
  console.log("🔍 DISCOVERING ALL VALID PAST PAPER URLS FOR CLASS XII & IX");
  console.log("==========================================================================");

  const xiiConfigs = [
    { subject: "Mathematics", aliases: ["mathematics", "maths"] },
    { subject: "Physics", aliases: ["physics"] },
    { subject: "Chemistry", aliases: ["chemistry"] },
    { subject: "Botany", aliases: ["botany", "biology"] },
    { subject: "Zoology", aliases: ["zoology", "biology"] },
    { subject: "Computer Science", aliases: ["computer-science", "computer"] },
    { subject: "English", aliases: ["english", "english-normal", "english-compulsory"] },
    { subject: "Pakistan Studies", aliases: ["pakistan-studies", "pak-studies"] },
    { subject: "Urdu", aliases: ["urdu", "urdu-normal", "urdu-compulsory"] },
    { subject: "Principles of Accounting", aliases: ["accounting", "principles-of-accounting"] },
    { subject: "Commercial Geography", aliases: ["commercial-geography"] },
    { subject: "Banking", aliases: ["banking"] },
    { subject: "Business Statistics", aliases: ["statistics", "business-statistics"] },
  ];

  const ixConfigs = [
    { subject: "Mathematics", aliases: ["mathematics", "maths", "general-math"] },
    { subject: "Physics", aliases: ["physics"] },
    { subject: "Chemistry", aliases: ["chemistry"] },
    { subject: "Biology", aliases: ["biology"] },
    { subject: "Computer Science", aliases: ["computer-science", "computer"] },
    { subject: "English", aliases: ["english", "english-compulsory"] },
    { subject: "Islamiat", aliases: ["islamiat", "islamic-studies", "islamiyat"] },
    { subject: "Urdu", aliases: ["urdu", "urdu-compulsory", "urdu-salees"] },
    { subject: "Sindhi", aliases: ["sindhi", "sindhi-salees"] },
    { subject: "Pakistan Studies", aliases: ["pakistan-studies", "pak-studies"] },
  ];

  const fullReport: any = { xii: {}, ix: {} };

  for (const s of xiiConfigs) {
    fullReport.xii[s.subject] = await findSubjectUrls("XII", s.subject, s.aliases);
  }

  for (const s of ixConfigs) {
    fullReport.ix[s.subject] = await findSubjectUrls("IX", s.subject, s.aliases);
  }

  fs.writeFileSync(
    path.join(__dirname, "verified_urls.json"),
    JSON.stringify(fullReport, null, 2)
  );

  console.log("\n==========================================================================");
  console.log("🎉 DISCOVERY COMPLETE! Summary saved to verified_urls.json");
  console.log("==========================================================================");
}

run();
