/**
 * batch-import-syllabi.ts
 *
 * Batch runner to download and ingest all AKUEB official Syllabi:
 * - Mathematics (Science Group) SSC (Class IX & X)
 * - Mathematics HSSC I (Class XI)
 * - Mathematics HSSC II (Class XII)
 * - Pakistan Studies SSC (Class IX & X)
 * - Pakistan Studies HSSC (Class XI & XII)
 * - English Compulsory SSC (Class IX & X)
 * - English Compulsory HSSC (Class XI & XII)
 * - Urdu Compulsory SSC (Class IX & X)
 * - Urdu Compulsory HSSC (Class XI & XII)
 * - Computer Science SSC (Class IX & X)
 * - Computer Science HSSC (Class XI & XII)
 * - Islamiyat SSC (Class IX & X)
 *
 * Usage:
 *   npx tsx scripts/batch-import-syllabi.ts [--filter="Mathematics|Pakistan Studies"] [--delay=5000]
 */

import "dotenv/config";
import { execSync } from "child_process";
import path from "path";

interface SyllabusTask {
  subject: string;
  url: string;
  classHint?: string;
  board?: string;
}

const SYLLABI_CATALOG: SyllabusTask[] = [
  {
    subject: "Mathematics",
    url: "https://a.storyblok.com/f/289824724335130/2147680/34f89c63bd/mathematics-science-group-ssc-syllabus-final.pdf",
  },
  {
    subject: "Mathematics",
    url: "https://a.storyblok.com/f/289824724335130/2581295/11a0640045/mathematics-hssc-i-syllabus-2025.pdf",
    classHint: "XI",
  },
  {
    subject: "Mathematics",
    url: "https://a.storyblok.com/f/289824724335130/2581295/3c44b01bec/mathematics-hssc-syllabus-final.pdf",
    classHint: "XII",
  },
  {
    subject: "Pakistan Studies",
    url: "https://a.storyblok.com/f/289824724335130/1466586/480acfc0c5/pakistan-studies-ssc-syllabus-2025.pdf",
    classHint: "X",
  },
  {
    subject: "Pakistan Studies",
    url: "https://a.storyblok.com/f/289824724335130/1370932/92064b19c2/pakistan-studies-hssc-syllabus-2025.pdf",
    classHint: "XII",
  },
  {
    subject: "English",
    url: "https://a.storyblok.com/f/289824724335130/2021666/f201089204/english-compulsory-ssc-syllabus-final.pdf",
  },
  {
    subject: "English",
    url: "https://a.storyblok.com/f/289824724335130/1628178/17db912165/english-compulsory-hssc-syllabus-final.pdf",
  },
  {
    subject: "Urdu",
    url: "https://a.storyblok.com/f/289824724335130/9404983/c75ad8dc13/urdu-compulsory-ssc-syllabus-final.pdf",
  },
  {
    subject: "Urdu",
    url: "https://a.storyblok.com/f/289824724335130/9467526/fe7c6e84aa/urdu-compulsory-hssc-syllabus-final.pdf",
  },
  {
    subject: "Physics",
    url: "https://a.storyblok.com/f/289824724335130/2971112/e7f1daf6c0/physics-ssc-syllabus-final.pdf",
  },
  {
    subject: "Physics",
    url: "https://a.storyblok.com/f/289824724335130/2818255/f25c1c94a0/physics-hssc-syllabus-final.pdf",
  },
  {
    subject: "Computer Science",
    url: "https://a.storyblok.com/f/289824724335130/2145912/cedba0404d/computer-science-ix-x-syllabus-2023.pdf",
  },
  {
    subject: "Computer Science",
    url: "https://a.storyblok.com/f/289824724335130/2093863/03c6ae8a6b/computer-science-xi-xi-syllabus-2023.pdf",
  },
  {
    subject: "Islamiat",
    url: "https://a.storyblok.com/f/289824724335130/2834157/39eff1641f/islamiyat-ssc-english-syllabus-2025.pdf",
  },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        flags[key] = arg.slice(eqIdx + 1);
      } else {
        const key = arg.slice(2);
        if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
          flags[key] = argv[++i];
        } else {
          flags[key] = "true";
        }
      }
    }
  }
  return flags;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const filter = flags.filter ? new RegExp(flags.filter, "i") : null;
  const delayMs = parseInt(flags.delay || "4000", 10);

  const tasks = filter
    ? SYLLABI_CATALOG.filter((t) => filter.test(t.subject) || filter.test(t.url))
    : SYLLABI_CATALOG;

  console.log(`\n======================================================`);
  console.log(`📚 Starting Batch Syllabus Ingestion (${tasks.length} syllabus PDFs)...`);
  console.log(`======================================================\n`);

  const autoImportScript = path.resolve(process.cwd(), "scripts/auto-import-syllabus.ts");

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`\n[${i + 1}/${tasks.length}] 📥 Processing: ${task.subject} (${task.classHint || "All Grades"})`);
    console.log(`URL: ${task.url}`);

    const args = [
      `--pdf "${task.url}"`,
      `--subject "${task.subject}"`,
      task.classHint ? `--class "${task.classHint}"` : "",
      task.board ? `--board "${task.board}"` : "",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      execSync(`npx tsx "${autoImportScript}" ${args}`, {
        stdio: "inherit",
        maxBuffer: 50 * 1024 * 1024,
      });
      successful++;
      console.log(`✅ [${i + 1}/${tasks.length}] Successfully imported ${task.subject}!`);
    } catch (err) {
      failed++;
      console.error(`❌ [${i + 1}/${tasks.length}] Failed to import ${task.subject}:`, err);
    }

    if (i < tasks.length - 1 && delayMs > 0) {
      console.log(`⏳ Waiting ${delayMs / 1000}s before next syllabus...`);
      await sleep(delayMs);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🏁 Batch Ingestion Finished! Success: ${successful}, Failed: ${failed}`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
