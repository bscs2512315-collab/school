/**
 * sync-akueb-syllabi.ts
 *
 * Automated runner to synchronize all AKUEB Syllabi with updated cognitive levels:
 * - R = Remember
 * - U = Understand
 * - A = Application and beyond [Apply, Analyse, Evaluate, Create]
 * - FA = Formative Assessment (not to be assessed under examination conditions)
 *
 * Fetches latest syllabus metadata from AKUEB learning-materials API or runs catalogue.
 *
 * Usage:
 *   npx tsx scripts/sync-akueb-syllabi.ts [--subject="Mathematics|Physics"] [--force]
 */

import "dotenv/config";
import { importSyllabus } from "./auto-import-syllabus";

export interface SyllabusSource {
  subject: string;
  grade?: string;
  url: string;
  classHint?: string;
}

export const OFFICIAL_SYLLABI_CATALOG: SyllabusSource[] = [
  // 1. Mathematics (Science Group) SSC & HSSC
  {
    subject: "Mathematics",
    url: "https://a.storyblok.com/f/289824724335130/2147680/34f89c63bd/mathematics-science-group-ssc-syllabus-final.pdf",
  },
  {
    subject: "Mathematics",
    grade: "XI",
    classHint: "XI",
    url: "https://a.storyblok.com/f/289824724335130/2581295/11a0640045/mathematics-hssc-i-syllabus-2025.pdf",
  },
  {
    subject: "Mathematics",
    grade: "XII",
    classHint: "XII",
    url: "https://a.storyblok.com/f/289824724335130/2581295/3c44b01bec/mathematics-hssc-syllabus-final.pdf",
  },

  // 2. Physics SSC & HSSC
  {
    subject: "Physics",
    url: "https://a.storyblok.com/f/289824724335130/2971112/e7f1daf6c0/physics-ssc-syllabus-final.pdf",
  },
  {
    subject: "Physics",
    grade: "XI",
    classHint: "XI",
    url: "https://a.storyblok.com/f/289824724335130/2818255/dc52d6927c/physics-hssc-i-syllabus-2025.pdf",
  },
  {
    subject: "Physics",
    grade: "XII",
    classHint: "XII",
    url: "https://a.storyblok.com/f/289824724335130/2818255/f25c1c94a0/physics-hssc-syllabus-final.pdf",
  },

  // 3. Chemistry SSC & HSSC
  {
    subject: "Chemistry",
    url: "https://a.storyblok.com/f/289824724335130/1976940/1450647104/chemistry-ix-x-syllabus-2022.pdf",
  },
  {
    subject: "Chemistry",
    url: "https://a.storyblok.com/f/289824724335130/2759931/e1ae5f50c7/chemistry-xi-xii-syllabus-2022.pdf",
  },

  // 4. Biology SSC & HSSC
  {
    subject: "Biology",
    url: "https://a.storyblok.com/f/289824724335130/2450503/a5c660af07/biology-ix-x-syllabus-2022.pdf",
  },
  {
    subject: "Biology",
    url: "https://a.storyblok.com/f/289824724335130/3096330/82d69e4003/biology-xi-xii-syllabus-2022.pdf",
  },

  // 5. Computer Science SSC & HSSC
  {
    subject: "Computer Science",
    url: "https://a.storyblok.com/f/289824724335130/2145912/cedba0404d/computer-science-ix-x-syllabus-2023.pdf",
  },
  {
    subject: "Computer Science",
    url: "https://a.storyblok.com/f/289824724335130/2093863/03c6ae8a6b/computer-science-xi-xi-syllabus-2023.pdf",
  },

  // 6. English Compulsory SSC & HSSC
  {
    subject: "English",
    url: "https://a.storyblok.com/f/289824724335130/2021666/f201089204/english-compulsory-ssc-syllabus-final.pdf",
  },
  {
    subject: "English",
    url: "https://a.storyblok.com/f/289824724335130/1628178/17db912165/english-compulsory-hssc-syllabus-final.pdf",
  },

  // 7. Urdu Compulsory SSC & HSSC
  {
    subject: "Urdu",
    url: "https://a.storyblok.com/f/289824724335130/9404983/c75ad8dc13/urdu-compulsory-ssc-syllabus-final.pdf",
  },
  {
    subject: "Urdu",
    url: "https://a.storyblok.com/f/289824724335130/9467526/fe7c6e84aa/urdu-compulsory-hssc-syllabus-final.pdf",
  },

  // 8. Pakistan Studies SSC & HSSC
  {
    subject: "Pakistan Studies",
    grade: "X",
    classHint: "X",
    url: "https://a.storyblok.com/f/289824724335130/1466586/480acfc0c5/pakistan-studies-ssc-syllabus-2025.pdf",
  },
  {
    subject: "Pakistan Studies",
    grade: "XII",
    classHint: "XII",
    url: "https://a.storyblok.com/f/289824724335130/1370932/92064b19c2/pakistan-studies-hssc-syllabus-2025.pdf",
  },

  // 9. Islamiyat SSC & HSSC
  {
    subject: "Islamiat",
    url: "https://a.storyblok.com/f/289824724335130/2834157/39eff1641f/islamiyat-ssc-english-syllabus-2025.pdf",
  },
  {
    subject: "Islamiat",
    grade: "XII",
    classHint: "XII",
    url: "https://a.storyblok.com/f/289824724335130/3088047/511182f4ce/islamiyat-english-hssc-syllabus-2025.pdf",
  },

  // 10. General Mathematics & General Science
  {
    subject: "General Mathematics",
    url: "https://a.storyblok.com/f/289824724335130/2044899/a771fc5c24/mathematics-humanities-group-ssc-syllabus-final.pdf",
  },
];

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
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
  const filter = flags.subject ? new RegExp(flags.subject, "i") : null;
  const force = flags.force === "true";

  const tasks = filter
    ? OFFICIAL_SYLLABI_CATALOG.filter((t) => filter.test(t.subject) || filter.test(t.url))
    : OFFICIAL_SYLLABI_CATALOG;

  console.log(`\n======================================================`);
  console.log(`📚 Starting AKUEB Syllabus Synchronization`);
  console.log(`Cognitive Levels: R (Remember), U (Understand), A (Application & Beyond), FA (Formative Assessment)`);
  console.log(`Total Targets: ${tasks.length}`);
  console.log(`======================================================\n`);

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`\n[${i + 1}/${tasks.length}] 📥 Syncing: ${task.subject} (${task.grade || "All Grades"})`);
    try {
      const results = await importSyllabus({
        pdfInput: task.url,
        subject: task.subject,
        classLevelHint: task.classHint,
        force,
      });
      if (results.some((r) => r.totalSLOsCount > 0 || r.isNew)) {
        successCount++;
        console.log(`✅ Ingested: ${task.subject}`);
      } else {
        skippedCount++;
        console.log(`ℹ️ Already up-to-date: ${task.subject}`);
      }
    } catch (err) {
      failCount++;
      console.error(`❌ Failed: ${task.subject}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 Synchronization Complete: ${successCount} updated, ${skippedCount} skipped, ${failCount} failed.`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
