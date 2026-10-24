/**
 * download-paper1-pdfs.ts
 *
 * Downloads missing Paper I (MCQ) PDFs + Keys for subjects not yet in the DB:
 * - IX Business Studies, IX Civics, IX Principles of Accounting, IX Urdu
 * - X Business Studies, X Principles of Accounting
 * - XII Ethics
 * Years 2021-2025 (only what exists on the site).
 *
 * Usage:
 *   npx tsx scripts/download-paper1-pdfs.ts [--classes IX] [--years 2021,2022]
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import https from "https";

interface SubjectDef {
  classVal: string;
  subject: string;
  urlPath: string;
  folder: string;
  variant?: string;
}

const TARGET_SUBJECTS: SubjectDef[] = [
  { classVal: "IX", subject: "Business Studies", urlPath: "https://akuebresources.com/past-papers/ssc-i/business-studies", folder: "pastpapers/downloads/RemainingP1/IX_BusinessStudies" },
  { classVal: "IX", subject: "Civics", urlPath: "https://akuebresources.com/past-papers/ssc-i/civics", folder: "pastpapers/downloads/RemainingP1/IX_Civics" },
  { classVal: "IX", subject: "Principles of Accounting", urlPath: "https://akuebresources.com/past-papers/ssc-i/principles-of-accounting", folder: "pastpapers/downloads/RemainingP1/IX_Accounting" },
  { classVal: "IX", subject: "Urdu", urlPath: "https://akuebresources.com/past-papers/ssc-i/urdu", folder: "pastpapers/downloads/RemainingP1/IX_Urdu" },
  { classVal: "X", subject: "Business Studies", urlPath: "https://akuebresources.com/past-papers/ssc-ii/business-studies", folder: "pastpapers/downloads/RemainingP1/X_BusinessStudies" },
  { classVal: "X", subject: "Principles of Accounting", urlPath: "https://akuebresources.com/past-papers/ssc-ii/principles-of-accounting", folder: "pastpapers/downloads/RemainingP1/X_Accounting" },
  { classVal: "XII", subject: "Ethics", urlPath: "https://akuebresources.com/past-papers/hssc-ii/ethics", folder: "pastpapers/downloads/RemainingP1/XII_Ethics", variant: "english" },
];

const TARGET_YEARS = [2021, 2022, 2023, 2024, 2025];

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        flags[key] = argv[++i];
      } else {
        flags[key] = "true";
      }
    }
  }
  return flags;
}

function parseYearCsv(value: string | undefined): number[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((y) => parseInt(y.trim(), 10))
    .filter((y) => !Number.isNaN(y));
}

function fetchHtml(url: string, redirects = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirects < 5) {
          const nextUrl = new URL(res.headers.location, url).toString();
          res.resume();
          return fetchHtml(nextUrl, redirects + 1).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url}: status ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.log(`  ⏩ Already exists: ${path.basename(destPath)}`);
      return resolve();
    }
    const file = fs.createWriteStream(destPath);
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(destPath);
            return downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          }
        }
        if (res.statusCode !== 200) {
          file.close();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          return reject(new Error(`Failed with status code: ${res.statusCode}`));
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`  ✅ Downloaded: ${path.basename(destPath)} (${fs.statSync(destPath).size} bytes)`);
          resolve();
        });
      })
      .on("error", (err) => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const classesFilter = flags.classes
    ? flags.classes.split(",").map((c) => c.trim().toUpperCase())
    : undefined;
  const years = parseYearCsv(flags.years) || TARGET_YEARS;

  const subjects = classesFilter?.length
    ? TARGET_SUBJECTS.filter((s) => classesFilter.includes(s.classVal))
    : TARGET_SUBJECTS;

  for (const item of subjects) {
    console.log(`\n🔍 ${item.classVal} · ${item.subject}...`);
    const fullFolder = path.resolve(process.cwd(), item.folder);
    if (!fs.existsSync(fullFolder)) fs.mkdirSync(fullFolder, { recursive: true });

    const html = await fetchHtml(item.urlPath);
    const pdfRegex = /https?:\/\/files\.akuebresources\.com\/[^\s"'<>]+\.pdf/g;
    const allLinks = Array.from(new Set(html.match(pdfRegex) || []));

    for (const year of years) {
      const paperICandidates = allLinks.filter((l) => {
        const lower = l.toLowerCase();
        const base = path.basename(l).toLowerCase();
        if (!lower.includes("paper-i")) return false;
        if (base.includes("model")) return false;
        if (base.includes("key")) return false;
        if (item.variant) {
          if (!base.includes(`-${item.variant}`) && !base.includes(`-${item.variant}-`)) return false;
          if (base.includes("-urdu")) return false;
        }
        return true;
      });
      const paperILink = paperICandidates.find((l) => path.basename(l).toLowerCase().includes(String(year)));

      const keyCandidates = allLinks.filter((l) => {
        const lower = l.toLowerCase();
        const base = path.basename(l).toLowerCase();
        if (!lower.includes("keys") && !lower.includes("key-scheme")) return false;
        if (lower.includes("marking")) return false;
        if (base.includes("model")) return false;
        return true;
      });
      const keyLink =
        keyCandidates.find((l) => path.basename(l).toLowerCase().includes(`-${String(year)}`)) ||
        keyCandidates.find((l) => path.basename(l).toLowerCase().includes(String(year)));

      if (paperILink) {
        try {
          await downloadFile(paperILink, path.join(fullFolder, path.basename(paperILink)));
        } catch (e: any) {
          console.warn(`    ⚠️ Failed Paper I (${year}): ${e.message}`);
        }
      } else {
        console.log(`  — No Paper I for ${year}`);
      }

      if (keyLink) {
        try {
          const keyDest = path.join(fullFolder, path.basename(keyLink));
          await downloadFile(keyLink, keyDest);
        } catch (e: any) {
          console.warn(`    ⚠️ Failed Keys (${year}): ${e.message}`);
        }
      }
    }
  }
  console.log("\n🎉 Paper I download complete.");
}

main().catch(console.error);