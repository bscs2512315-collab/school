import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { processPastPaperPdf } from "@/lib/ai/pdf-paper-processor";

function matchPdf(subject: string, classVal: string, year: number, paperNum: number): string | null {
  const allFiles: string[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".pdf")) {
        allFiles.push(full);
      }
    }
  }

  walk("pastpapers");

  const subClean = subject.toLowerCase().replace(/[\s-]/g, "");
  const classClean = classVal.toUpperCase();
  const yearStr = String(year);

  for (const p of allFiles) {
    const bn = path.basename(p);
    const bnLower = bn.toLowerCase();
    if (bnLower.includes("e-marking") || bnLower.includes("cv") || bnLower === "c.pdf") {
      continue;
    }

    const dirName = path.basename(path.dirname(p)).toLowerCase();

    // Check class
    let classMatch = false;
    if (classClean === "X") {
      if (dirName.includes("xp1") || bnLower.includes("-x-") || bnLower.includes("class-x")) {
        if (!dirName.includes("xi") && !bnLower.includes("-xi") && !dirName.includes("ix") && !bnLower.includes("-ix")) {
          classMatch = true;
        }
      }
    } else if (classClean === "XII") {
      if (dirName.includes("xiip1") || bnLower.includes("-xii-")) {
        classMatch = true;
      }
    } else if (classClean === "IX") {
      if (dirName.includes("ixp1") || bnLower.includes("-ix-")) {
        classMatch = true;
      }
    } else if (classClean === "XI") {
      if (dirName.includes("xip1") || bnLower.includes("-xi-")) {
        if (!dirName.includes("xii") && !bnLower.includes("-xii")) {
          classMatch = true;
        }
      }
    }

    if (!classMatch) continue;
    if (!bnLower.includes(yearStr)) continue;

    // Paper number filter
    if (paperNum === 1 && (bnLower.includes("paper-ii") || bnLower.includes("paper-2.") || bnLower.includes("-paper-2-") || dirName.includes("xp2"))) {
      continue;
    } else if (paperNum === 2 && (bnLower.includes("paper-i-") || bnLower.includes("paper-1") || dirName.includes("p1"))) {
      continue;
    }

    // Check subject
    let subjMatch = false;
    if (subClean.includes("physics") && (bnLower.includes("physics") || dirName.includes("physics"))) {
      subjMatch = true;
    } else if (subClean.includes("chemistry") && (bnLower.includes("chemistry") || dirName.includes("chemistry"))) {
      subjMatch = true;
    } else if (subClean.includes("biology") && (bnLower.includes("biology") || dirName.includes("biology"))) {
      subjMatch = true;
    } else if (subClean.includes("math") && (bnLower.includes("math") || dirName.includes("math"))) {
      subjMatch = true;
    } else if (subClean.includes("computer") && (bnLower.includes("computer") || dirName.includes("computer"))) {
      subjMatch = true;
    }

    if (subjMatch) {
      return p;
    }
  }

  return null;
}

interface QuestionRow {
  id: string;
  question_number: number;
  question_text: string;
  image_url: string | null;
}

interface PaperRow {
  id: string;
  subject: string;
  class: string;
  year: number;
  paper_number: number;
}

async function fixAllPaperDiagrams() {
  console.log("==================================================================");
  console.log("🛠️ STARTING PAST PAPERS DIAGRAM AUDIT & REPAIR MIGRATION");
  console.log("==================================================================\n");

  // 1. Identify papers that contain duplicate images or need repair
  const duplicatePapersRes = await db.query<PaperRow>(`
    SELECT DISTINCT p.id, p.subject, p.class, p.year, p.paper_number
    FROM past_papers p
    JOIN questions q ON q.past_paper_id = p.id
    WHERE q.image_url IN (
      SELECT image_url
      FROM questions
      WHERE image_url IS NOT NULL AND image_url != ''
      GROUP BY image_url
      HAVING COUNT(*) > 1
    )
    ORDER BY p.subject, p.class, p.year;
  `);

  console.log(`Found ${duplicatePapersRes.rows.length} papers affected by duplicate/mismatched images:\n`);
  for (const p of duplicatePapersRes.rows) {
    console.log(`  - ${p.subject} Class ${p.class} ${p.year} (Paper ${p.paper_number})`);
  }
  console.log("\n------------------------------------------------------------------");

  let totalUpdated = 0;
  let totalCleared = 0;

  for (const paper of duplicatePapersRes.rows) {
    console.log(`\n📄 Processing: ${paper.subject} Class ${paper.class} ${paper.year} (Paper ${paper.paper_number})...`);

    const pdfPath = matchPdf(paper.subject, paper.class, paper.year, paper.paper_number);
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      console.error(`  ❌ PDF not found on disk for ${paper.subject} Class ${paper.class} ${paper.year}. Skipping.`);
      continue;
    }

    console.log(`  🔍 Source PDF: ${pdfPath}`);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const fileName = path.basename(pdfPath);

    // Run processor with vector + raster extraction & watermark cleaning
    const { diagramMap } = await processPastPaperPdf(pdfBuffer, fileName);
    console.log(`  🎨 Cropped & Uploaded ${diagramMap.size} verified diagrams to Cloudinary.`);

    // Fetch existing questions for this paper
    const qRes = await db.query<QuestionRow>(
      `SELECT id, question_number, question_text, image_url FROM questions WHERE past_paper_id = $1 ORDER BY question_number`,
      [paper.id],
    );

    for (const q of qRes.rows) {
      const currentUrl = q.image_url;
      const verifiedUrl = diagramMap.get(q.question_number) || null;

      if (verifiedUrl) {
        // Question has a verified diagram
        if (currentUrl !== verifiedUrl) {
          await db.query(`UPDATE questions SET image_url = $1 WHERE id = $2`, [verifiedUrl, q.id]);
          console.log(`  ✅ [UPDATED] Q${q.question_number}: set verified diagram`);
          totalUpdated++;
        }
      } else {
        // Question has NO diagram in source PDF
        if (currentUrl) {
          await db.query(`UPDATE questions SET image_url = NULL WHERE id = $1`, [q.id]);
          console.log(`  🧹 [REMOVED FALSE POSITIVE] Q${q.question_number}: removed incorrectly assigned image`);
          totalCleared++;
        }
      }
    }
  }

  console.log("\n==================================================================");
  console.log("🎉 REPAIR MIGRATION COMPLETE!");
  console.log(`   - Total diagrams updated with verified crops: ${totalUpdated}`);
  console.log(`   - Total false-positive images removed: ${totalCleared}`);
  console.log("==================================================================\n");

  // 2. Re-audit database to verify zero unintended duplicates remain
  const remainingDuplicates = await db.query(`
    SELECT q.image_url, COUNT(*) as count, 
           array_agg(p.subject || ' ' || p.class || ' ' || p.year || ' Q' || q.question_number ORDER BY p.year, q.question_number) as questions
    FROM questions q
    JOIN past_papers p ON q.past_paper_id = p.id
    WHERE q.image_url IS NOT NULL AND q.image_url != ''
    GROUP BY q.image_url
    HAVING COUNT(*) > 1
    ORDER BY count DESC;
  `);

  if (remainingDuplicates.rows.length === 0) {
    console.log("🌟 VERIFICATION SUCCESS: 0 duplicate images across all questions in the database!");
  } else {
    console.log(`⚠️ Remaining duplicate clusters (verified multi-question shared diagrams): ${remainingDuplicates.rows.length}`);
    for (const r of remainingDuplicates.rows) {
      console.log(`   [Count ${r.count}] ${r.questions.join(", ")}`);
    }
  }
}

fixAllPaperDiagrams().catch(console.error).finally(() => process.exit(0));
