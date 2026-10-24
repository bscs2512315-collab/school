import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

type ClassVal = "X" | "XII" | "IX" | "XI";

interface TargetSubject {
  classVal: ClassVal;
  subject: string;
  urlPath: string;
  folder: string;
  variant?: "english" | "urdu";
}

const TARGET_SUBJECTS: TargetSubject[] = [
  // Class IX (SSC-I)
  { classVal: "IX", subject: "Mathematics", urlPath: "https://akuebresources.com/past-papers/ssc-i/mathematics", folder: "pastpapers/ClassIX_P2/Mathematics" },
  { classVal: "IX", subject: "Chemistry", urlPath: "https://akuebresources.com/past-papers/ssc-i/chemistry", folder: "pastpapers/ClassIX_P2/Chemistry" },
  { classVal: "IX", subject: "Physics", urlPath: "https://akuebresources.com/past-papers/ssc-i/physics", folder: "pastpapers/ClassIX_P2/Physics" },
  { classVal: "IX", subject: "Biology", urlPath: "https://akuebresources.com/past-papers/ssc-i/biology", folder: "pastpapers/ClassIX_P2/Biology" },
  { classVal: "IX", subject: "Computer Science", urlPath: "https://akuebresources.com/past-papers/ssc-i/computer-science", folder: "pastpapers/ClassIX_P2/Computer" },
  { classVal: "IX", subject: "English", urlPath: "https://akuebresources.com/past-papers/ssc-i/english", folder: "pastpapers/ClassIX_P2/English" },
  { classVal: "IX", subject: "General Mathematics", urlPath: "https://akuebresources.com/past-papers/ssc-i/general-mathematics", folder: "pastpapers/ClassIX_P2/GeneralMathematics" },
  { classVal: "IX", subject: "Islamiat", urlPath: "https://akuebresources.com/past-papers/ssc-i/islamiyat", folder: "pastpapers/ClassIX_P2/Islamiat", variant: "english" },
  { classVal: "IX", subject: "Islamiat (Urdu)", urlPath: "https://akuebresources.com/past-papers/ssc-i/islamiyat", folder: "pastpapers/ClassIX_P2/IslamiatUrdu", variant: "urdu" },
  { classVal: "IX", subject: "Pakistan Studies", urlPath: "https://akuebresources.com/past-papers/ssc-i/pakistan-studies", folder: "pastpapers/ClassIX_P2/PakistanStudies", variant: "english" },
  { classVal: "IX", subject: "Pakistan Studies (Urdu)", urlPath: "https://akuebresources.com/past-papers/ssc-i/pakistan-studies", folder: "pastpapers/ClassIX_P2/PakistanStudiesUrdu", variant: "urdu" },
  { classVal: "IX", subject: "Urdu", urlPath: "https://akuebresources.com/past-papers/ssc-i/urdu", folder: "pastpapers/ClassIX_P2/Urdu" },
  { classVal: "IX", subject: "Business Studies", urlPath: "https://akuebresources.com/past-papers/ssc-i/business-studies", folder: "pastpapers/ClassIX_P2/BusinessStudies" },
  { classVal: "IX", subject: "Civics", urlPath: "https://akuebresources.com/past-papers/ssc-i/civics", folder: "pastpapers/ClassIX_P2/Civics" },
  { classVal: "IX", subject: "Principles of Accounting", urlPath: "https://akuebresources.com/past-papers/ssc-i/principles-of-accounting", folder: "pastpapers/ClassIX_P2/PrinciplesOfAccounting" },

  // Class X (SSC-II)
  { classVal: "X", subject: "Mathematics", urlPath: "https://akuebresources.com/past-papers/ssc-ii/mathematics", folder: "pastpapers/ClassX_P2/Mathematics" },
  { classVal: "X", subject: "Chemistry", urlPath: "https://akuebresources.com/past-papers/ssc-ii/chemistry", folder: "pastpapers/ClassX_P2/Chemistry" },
  { classVal: "X", subject: "Physics", urlPath: "https://akuebresources.com/past-papers/ssc-ii/physics", folder: "pastpapers/ClassX_P2/Physics" },
  { classVal: "X", subject: "Biology", urlPath: "https://akuebresources.com/past-papers/ssc-ii/biology", folder: "pastpapers/ClassX_P2/Biology" },
  { classVal: "X", subject: "Computer Science", urlPath: "https://akuebresources.com/past-papers/ssc-ii/computer-science", folder: "pastpapers/ClassX_P2/Computer" },
  { classVal: "X", subject: "English", urlPath: "https://akuebresources.com/past-papers/ssc-ii/english", folder: "pastpapers/ClassX_P2/English" },
  { classVal: "X", subject: "General Mathematics", urlPath: "https://akuebresources.com/past-papers/ssc-ii/general-mathematics", folder: "pastpapers/ClassX_P2/GeneralMathematics" },
  { classVal: "X", subject: "Islamiat", urlPath: "https://akuebresources.com/past-papers/ssc-ii/islamiyat", folder: "pastpapers/ClassX_P2/Islamiat", variant: "english" },
  { classVal: "X", subject: "Islamiat (Urdu)", urlPath: "https://akuebresources.com/past-papers/ssc-ii/islamiyat", folder: "pastpapers/ClassX_P2/IslamiatUrdu", variant: "urdu" },
  { classVal: "X", subject: "Pakistan Studies", urlPath: "https://akuebresources.com/past-papers/ssc-ii/pakistan-studies", folder: "pastpapers/ClassX_P2/PakistanStudies", variant: "english" },
  { classVal: "X", subject: "Pakistan Studies (Urdu)", urlPath: "https://akuebresources.com/past-papers/ssc-ii/pakistan-studies", folder: "pastpapers/ClassX_P2/PakistanStudiesUrdu", variant: "urdu" },
  { classVal: "X", subject: "Urdu", urlPath: "https://akuebresources.com/past-papers/ssc-ii/urdu", folder: "pastpapers/ClassX_P2/Urdu" },
  { classVal: "X", subject: "Business Studies", urlPath: "https://akuebresources.com/past-papers/ssc-ii/business-studies", folder: "pastpapers/ClassX_P2/BusinessStudies" },
  { classVal: "X", subject: "Principles of Accounting", urlPath: "https://akuebresources.com/past-papers/ssc-ii/principles-of-accounting", folder: "pastpapers/ClassX_P2/PrinciplesOfAccounting" },

  // Class XI (HSSC-I)
  { classVal: "XI", subject: "Mathematics", urlPath: "https://akuebresources.com/past-papers/hssc-i/mathematics", folder: "pastpapers/ClassXI_P2/Mathematics" },
  { classVal: "XI", subject: "Chemistry", urlPath: "https://akuebresources.com/past-papers/hssc-i/chemistry", folder: "pastpapers/ClassXI_P2/Chemistry" },
  { classVal: "XI", subject: "Physics", urlPath: "https://akuebresources.com/past-papers/hssc-i/physics", folder: "pastpapers/ClassXI_P2/Physics" },
  { classVal: "XI", subject: "Biology", urlPath: "https://akuebresources.com/past-papers/hssc-i/biology", folder: "pastpapers/ClassXI_P2/Biology" },
  { classVal: "XI", subject: "Computer Science", urlPath: "https://akuebresources.com/past-papers/hssc-i/computer-science", folder: "pastpapers/ClassXI_P2/Computer" },
  { classVal: "XI", subject: "English", urlPath: "https://akuebresources.com/past-papers/hssc-i/english", folder: "pastpapers/ClassXI_P2/English" },
  { classVal: "XI", subject: "Business Mathematics", urlPath: "https://akuebresources.com/past-papers/hssc-i/business-mathematics", folder: "pastpapers/ClassXI_P2/BusinessMathematics" },
  { classVal: "XI", subject: "Principles of Accounting", urlPath: "https://akuebresources.com/past-papers/hssc-i/principles-of-accounting", folder: "pastpapers/ClassXI_P2/PrinciplesOfAccounting" },
  { classVal: "XI", subject: "Principles of Commerce", urlPath: "https://akuebresources.com/past-papers/hssc-i/principles-of-commerce", folder: "pastpapers/ClassXI_P2/PrinciplesOfCommerce" },
  { classVal: "XI", subject: "Principles of Economics", urlPath: "https://akuebresources.com/past-papers/hssc-i/principles-of-economics", folder: "pastpapers/ClassXI_P2/PrinciplesOfEconomics" },
  { classVal: "XI", subject: "Urdu", urlPath: "https://akuebresources.com/past-papers/hssc-i/urdu", folder: "pastpapers/ClassXI_P2/Urdu" },

  // Class XII (HSSC-II)
  { classVal: "XII", subject: "Chemistry", urlPath: "https://akuebresources.com/past-papers/hssc-ii/chemistry", folder: "pastpapers/ClassXII_P2/Chemistry" },
  { classVal: "XII", subject: "Physics", urlPath: "https://akuebresources.com/past-papers/hssc-ii/physics", folder: "pastpapers/ClassXII_P2/Physics" },
  { classVal: "XII", subject: "Biology", urlPath: "https://akuebresources.com/past-papers/hssc-ii/biology", folder: "pastpapers/ClassXII_P2/Biology" },
  { classVal: "XII", subject: "Computer Science", urlPath: "https://akuebresources.com/past-papers/hssc-ii/computer-science", folder: "pastpapers/ClassXII_P2/Computer" },
  { classVal: "XII", subject: "Mathematics", urlPath: "https://akuebresources.com/past-papers/hssc-ii/mathematics", folder: "pastpapers/ClassXII_P2/Mathematics" },
  { classVal: "XII", subject: "English", urlPath: "https://akuebresources.com/past-papers/hssc-ii/english", folder: "pastpapers/ClassXII_P2/English" },
  { classVal: "XII", subject: "Islamiat", urlPath: "https://akuebresources.com/past-papers/hssc-ii/islamiyat", folder: "pastpapers/ClassXII_P2/Islamiat", variant: "english" },
  { classVal: "XII", subject: "Islamiat (Urdu)", urlPath: "https://akuebresources.com/past-papers/hssc-ii/islamiyat", folder: "pastpapers/ClassXII_P2/IslamiatUrdu", variant: "urdu" },
  { classVal: "XII", subject: "Pakistan Studies", urlPath: "https://akuebresources.com/past-papers/hssc-ii/pakistan-studies", folder: "pastpapers/ClassXII_P2/PakistanStudies", variant: "english" },
  { classVal: "XII", subject: "Pakistan Studies (Urdu)", urlPath: "https://akuebresources.com/past-papers/hssc-ii/pakistan-studies", folder: "pastpapers/ClassXII_P2/PakistanStudiesUrdu", variant: "urdu" },
  { classVal: "XII", subject: "Urdu", urlPath: "https://akuebresources.com/past-papers/hssc-ii/urdu", folder: "pastpapers/ClassXII_P2/Urdu" },
  { classVal: "XII", subject: "Banking", urlPath: "https://akuebresources.com/past-papers/hssc-ii/banking", folder: "pastpapers/ClassXII_P2/Banking" },
  { classVal: "XII", subject: "Business Statistics", urlPath: "https://akuebresources.com/past-papers/hssc-ii/business-statistics", folder: "pastpapers/ClassXII_P2/BusinessStatistics" },
  { classVal: "XII", subject: "Commercial Geography", urlPath: "https://akuebresources.com/past-papers/hssc-ii/commercial-geography", folder: "pastpapers/ClassXII_P2/CommercialGeography" },
  { classVal: "XII", subject: "Ethics", urlPath: "https://akuebresources.com/past-papers/hssc-ii/ethics", folder: "pastpapers/ClassXII_P2/Ethics" },
  { classVal: "XII", subject: "Principles of Accounting", urlPath: "https://akuebresources.com/past-papers/hssc-ii/principles-of-accounting", folder: "pastpapers/ClassXII_P2/PrinciplesOfAccounting" },
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
        if (
          (res.statusCode === 301 || res.statusCode === 302) &&
          res.headers.location &&
          redirects < 5
        ) {
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
    const client = url.startsWith("https") ? https : http;

    client
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
  const manifestOut = flags.manifest || "pastpapers/paper2_manifest.json";
  const years = parseYearCsv(flags.years) || TARGET_YEARS;

  console.log("=================================================================");
  console.log("📥 Scraping & Downloading Paper II & E-Marking Notes (2021-2025)");
  console.log("=================================================================\n");

  const manifest: Array<{
    class: string;
    subject: string;
    year: number;
    paperPdf?: string;
    markingPdf?: string;
    annualExamPdf?: string;
  }> = [];

  const subjects =
    classesFilter && classesFilter.length
      ? TARGET_SUBJECTS.filter((s) => classesFilter.includes(s.classVal))
      : TARGET_SUBJECTS;

  for (const item of subjects) {
    console.log(`\n🔍 Checking ${item.classVal} · ${item.subject}...`);
    const fullFolder = path.resolve(process.cwd(), item.folder);
    if (!fs.existsSync(fullFolder)) {
      fs.mkdirSync(fullFolder, { recursive: true });
    }

    try {
      const html = await fetchHtml(item.urlPath);
      const pdfRegex = /https?:\/\/files\.akuebresources\.com\/[^\s"'<>]+\.pdf/g;
      const allLinks = Array.from(new Set(html.match(pdfRegex) || []));

      for (const year of years) {
        // Find Paper II PDF (year matched against the filename, not the URL folder)
        const paperIICandidates = allLinks.filter((l) => {
          const lower = l.toLowerCase();
          if (!(lower.includes("paper-ii") || lower.includes("paper-2"))) return false;
          if (item.variant) {
            const base = path.basename(l).toLowerCase();
            return base.includes("-" + item.variant);
          }
          return true;
        });
        const paperIILink = paperIICandidates.find((l) => {
          const base = path.basename(l).toLowerCase();
          if (!base.includes(String(year))) return false;
          return !base.includes("model") && !base.includes("key");
        });

        // Find E-marking Notes PDF (year matched against the filename, not the URL folder)
        const emarkingCandidates = allLinks.filter((l) => {
          const lower = l.toLowerCase();
          if (!(lower.includes("e-marking") || lower.includes("emarking"))) return false;
          if (lower.includes("model")) return false;
          if (item.variant) {
            const base = path.basename(l).toLowerCase();
            return base.includes("-" + item.variant);
          }
          return true;
        });
        const emarkingLink =
          emarkingCandidates.find((l) =>
            path.basename(l).toLowerCase().includes(`-${String(year)}`),
          ) ||
          emarkingCandidates.find((l) =>
            path.basename(l).toLowerCase().includes(String(year)),
          ) ||
          (year === 2023
            ? emarkingCandidates.find((l) => {
                const base = path.basename(l).toLowerCase();
                // Generic yearless file (e.g. E-marking-Notes-Chemistry-XI.pdf for 2023)
                return !/\d{4}/.test(base);
              })
            : undefined);

        // Find Annual Exam PDF (used in 2021-2022 if separate Paper II isn't labeled)
        const annualExamLink = allLinks.find((l) => {
          const lower = l.toLowerCase();
          const base = path.basename(l).toLowerCase();
          return (
            lower.includes("annual-exam") &&
            base.includes(String(year)) &&
            !base.includes("key") &&
            !base.includes("model")
          );
        });

        let paperPdfPath: string | undefined;
        let markingPdfPath: string | undefined;
        let annualPdfPath: string | undefined;

        if (paperIILink) {
          const filename = path.basename(paperIILink);
          const dest = path.join(fullFolder, filename);
          console.log(`  📥 Paper II (${year}): ${filename}`);
          try {
            await downloadFile(paperIILink, dest);
            paperPdfPath = dest;
          } catch (e: any) {
            console.warn(`    ⚠️ Failed downloading Paper II: ${e.message}`);
          }
        }

        if (emarkingLink) {
          const filename = path.basename(emarkingLink);
          const dest = path.join(fullFolder, filename);
          console.log(`  📥 E-Marking Notes (${year}): ${filename}`);
          try {
            await downloadFile(emarkingLink, dest);
            markingPdfPath = dest;
          } catch (e: any) {
            console.warn(`    ⚠️ Failed downloading E-marking: ${e.message}`);
          }
        }

        if (annualExamLink && !paperIILink) {
          const filename = path.basename(annualExamLink);
          const dest = path.join(fullFolder, filename);
          console.log(`  📥 Annual Exam (${year}): ${filename}`);
          try {
            await downloadFile(annualExamLink, dest);
            annualPdfPath = dest;
          } catch (e: any) {
            console.warn(`    ⚠️ Failed downloading Annual Exam: ${e.message}`);
          }
        }

        manifest.push({
          class: item.classVal,
          subject: item.subject,
          year,
          paperPdf: paperPdfPath,
          markingPdf: markingPdfPath,
          annualExamPdf: annualPdfPath,
        });
      }
    } catch (e: any) {
      console.error(`Error processing ${item.subject}:`, e.message);
    }
  }

  const manifestPath = path.resolve(process.cwd(), manifestOut);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`\n🎉 Manifest written to: ${manifestPath}`);
}

main().catch(console.error);
