import "dotenv/config";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { db } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";

const execFileAsync = promisify(execFile);

const SUBJECT_TOKENS: Record<string, string[]> = {
  "computer science": ["computer-science", "-computer-"],
  "principles of accounting": ["principles-of-accounting", "priciples-of-accounting", "-accounting-"],
  "principles of commerce": ["principles-of-commerce", "commerce"],
  "principles of economics": ["principles-of-economics", "economics"],
  "general mathematics": ["general-mathematics"],
  "business mathematics": ["business-mathematics"],
  "business statistics": ["business-statistics"],
  "business studies": ["business-studies", "-business-"],
  "commercial geography": ["commercial-geography", "geography"],
  "pakistan studies": ["pakistan-studies"],
  isl: ["islamiyat", "islamiat"],
  islamiat: ["islamiyat", "islamiat"],
  islamiyat: ["islamiyat", "islamiat"],
  urdu: ["urdu"],
  english: ["english"],
  mathematics: ["mathematics", "maths", "-math-"],
  physics: ["physics"],
  chemistry: ["chemistry"],
  biology: ["biology"],
  banking: ["banking"],
  ethics: ["ethics"],
  civics: ["civics"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function subjectBase(subject: string): string {
  return subject.replace(/\s*\(.*\)\s*/, "").toLowerCase().trim();
}

function tokensMatch(nameNorm: string, patterns: string[]): boolean {
  return patterns.some(p => {
    if (p.startsWith("-") && p.endsWith("-")) return nameNorm.includes(p);
    return nameNorm.includes(p);
  });
}

interface PaperRow {
  id: string;
  subject: string;
  class: string;
  year: number;
  paper_number: number;
}

interface QuestionRow {
  id: string;
  question_number: number;
  question_part: string | null;
  question_text: string;
  image_url: string | null;
}

// English + Urdu figure-reference cues. Urdu question text references diagrams with words
// like تصویری خاکہ (pictorial sketch), شکل (figure), نقشہ (map), نمودار (graph).
// Broad enough to catch histogram/table/bridge/flowchart/truth-table style references so we
// never remove a needed diagram, while figure-less questions still get their stray crop removed.
const FIGURE_REF_RE = /figure|fig\.?\s*\d|diagram|graph|chart|given above|as shown|shown below|illustrate|drawn|curve|circuit|map|image|picture|sketch|refer to|histogram|table|truth table|bridge|flow ?chart|flowchart|structure|polygon|frequency|bar chart|distribution|concave|convex|wavelength|in the given|labelled|label|encircle|combination of|dot and cross|تصویر|خاکه|خاکہ|شکل|نقشه|نقشہ|نمودار|جدول|گراف|منظر/i;

function referencesFigure(text: string): boolean {
  return FIGURE_REF_RE.test(text || "");
}

function cropKeyFromUrl(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/diagram_p(\d+)_q(\d+)\.png/);
  return m ? `p${m[1]}-q${m[2]}` : null;
}

function cropPageFromFileName(fileName: string): number | null {
  const m = fileName.match(/p(\d+)_q(\d+)/);
  return m ? Number(m[1]) : null;
}

const CLASS_PATTERNS: Record<string, RegExp> = {
  IX: /(^|-)(ix)(-|$)/,
  X: /(^|-)x(-|$)/,
  XI: /(^|-)(xi)(-|$)/,
  XII: /(^|-)(xii)(-|$)/,
};

function matchPdf(pdfs: string[], paper: PaperRow): string | null {
  const isUrdu = /\(urdu\)/i.test(paper.subject);
  const isEnglish = /\(english\)/i.test(paper.subject);
  const subj = subjectBase(paper.subject);
  const patterns = SUBJECT_TOKENS[subj] ?? [normalize(subj)];
  const wantClass = paper.class.toUpperCase();
  const wantYear = String(paper.year);
  const wantPaper = paper.paper_number;
  const dirContainsUrdu = (dirName: string, nameNorm: string) => dirName.includes("urdu") || nameNorm.includes("urdu");

  let best: { path: string; score: number } | null = null;

  for (const p of pdfs) {
    const bn = path.basename(p);
    const bnL = bn.toLowerCase();
    const nameNorm = normalize(bn.replace(/\.pdf$/, ""));
    const dirName = normalize(path.basename(path.dirname(p)));

    if (/keys|marking|emar|resume|answer-sheet/g.test(bnL) && !nameNorm.includes("paper")) continue;
    if (bnL === "c.pdf" || bnL === "cv.pdf") continue;

    // explicit rejects for common non-paper files
    if (nameNorm.includes("e-marking") || nameNorm.includes("e_marking")) continue;

    // Cross-subject exclusions: a file whose core subject token is a DIFFERENT subject
    // is a foreign medium copy (e.g. Islamiyat-Urdu is Islamiat, not the Urdu subject).
    const FOREIGN_SUBJECT_TOKENS = /islamiyat|islamiat|pakistan-studies|principles-of|business-|commercial-|general-math|computer-science/;
    if (["urdu", "english"].includes(subj) && FOREIGN_SUBJECT_TOKENS.test(nameNorm)) continue;

    // Subject match (name or dir)
    const nameSubj = tokensMatch(nameNorm, patterns);
    const dirSubj = tokensMatch(dirName, patterns);
    if (!nameSubj && !dirSubj) continue;

    // Leading-token bonus: prefer files whose FIRST meaningful token is the subject itself
    // (e.g. "urdu-compulsory-..." over "islamiyat-urdu-...").
    const leading = nameNorm.split("-")[0];
    const leadingBonus = leading === normalize(subj) ? 5 : patterns.some(p => leading.startsWith(p.replace(/^-|-$/g, ""))) ? 4 : 0;

    // Language variant
    const nameLang = "urdu-english";
    const langPlaceholder = dirContainsUrdu(dirName, nameNorm);
    if (isUrdu) {
      if (nameNorm.includes("english") && !nameNorm.includes("urdu")) continue;
      if (!nameNorm.includes("urdu") && !dirName.includes("urdu")) continue;
    } else if (isEnglish) {
      if (nameNorm.includes("urdu")) continue;
    } else if (["isl", "islamiat", "islamiyat", "pakistan studies"].includes(subj)) {
      if (nameNorm.includes("urdu") && !nameNorm.includes("english")) continue;
      if (dirName.includes("urdu") && !nameNorm.includes("english")) continue;
    }
    void nameLang; void langPlaceholder;

    // Class
    const classRe = CLASS_PATTERNS[wantClass];
    const nameClassOk = classRe.test(nameNorm);
    const dirClassOk = dirName.includes(wantClass.toLowerCase()) && (dirName.includes("class") || dirName.includes(wantClass.toLowerCase()));

    if (!nameClassOk && !dirClassOk) continue;

    // Year
    if (!nameNorm.includes(wantYear) && !dirName.includes(wantYear)) continue;

    // Paper number
    const paperOneRe = /paper-(?:i|1)(?:-|$)/;
    const paperTwoRe = /paper-(?:ii|2)(?:-|$)/;
    let paperOk = false;
    let paperScore = 0;
    if (wantPaper === 1 && paperOneRe.test(nameNorm)) { paperOk = true; paperScore = 8; }
    else if (wantPaper === 2 && paperTwoRe.test(nameNorm)) { paperOk = true; paperScore = 8; }
    else if (wantPaper === 1 && nameNorm.includes("annual-exam-paper")) { paperOk = true; paperScore = 6; }
    else if (dirName.endsWith(`p${wantPaper}`) || dirName.includes(`p${wantPaper}`)) { paperOk = true; paperScore = 5; }
    else if (wantPaper === 2 && nameNorm.includes("annual-exam-paper") && !paperOneRe.test(nameNorm)) { paperOk = true; paperScore = 2; }
    if (!paperOk) continue;

    let score = 10 + (nameSubj ? 4 : 0) + (dirSubj ? 3 : 0) + (nameClassOk ? 2 : 0) + (dirClassOk ? 1 : 0) + paperScore + leadingBonus;

    if (!best || score > best.score) best = { path: p, score };
  }

  return best ? best.path : null;
}

interface ProcessorDiagram {
  questionNumber: number | null;
  fileName: string;
  imagePath: string;
}

const pdfsCache = new Map<string, ProcessorDiagram[]>();

async function runProcessor(pdfPath: string): Promise<ProcessorDiagram[]> {
  if (pdfsCache.has(pdfPath)) return pdfsCache.get(pdfPath)!;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "verify-img-"));
  const scriptPath = path.resolve(process.cwd(), "scripts/pdf_past_paper_processor.py");
  try {
    const { stdout } = await execFileAsync(
      "python3",
      [scriptPath, pdfPath, "--out-dir", tmpDir],
      { maxBuffer: 20 * 1024 * 1024 },
    );
    const jsonStart = stdout.indexOf("{");
    const jsonEnd = stdout.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return [];
    const result = JSON.parse(stdout.substring(jsonStart, jsonEnd + 1));
    const diagrams: ProcessorDiagram[] = (result.diagrams || []).map((d: any) => ({
      questionNumber: d.questionNumber,
      fileName: d.fileName,
      imagePath: d.imagePath,
    }));
    pdfsCache.set(pdfPath, diagrams);
    return diagrams;
  } catch (err) {
    console.error("❌ Processor failed for", pdfPath, err);
    return [];
  } finally {
    const t = setTimeout(() => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }, 120000);
    t.unref();
  }
}

interface RowAction {
  question: QuestionRow;
  action: "KEEP" | "ADD" | "REMOVE" | "REPLACE";
  fromCrop?: string | null;
  toCrop?: string | null;
  toFilePath?: string | null;
  reason: string;
}

interface PaperReport {
  paper: PaperRow;
  pdf: string | null;
  diagramsDetected: number;
  actions: RowAction[];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--apply");
  const onlyPaper = args.find(a => a.startsWith("--paper="))?.split("=")[1];
  const onlySubject = args.find(a => a.startsWith("--subject="))?.split("=")[1];

  console.log("==================================================================");
  console.log(dryRun ? "🔍 DRY RUN — image verification report (no DB changes)" : "🛠️ APPLY — applying image fixes");
  console.log("==================================================================\n");

  const papersRes = await db.query<PaperRow>(
    `SELECT DISTINCT p.id, p.subject, p.class, p.year, p.paper_number
     FROM past_papers p JOIN questions q ON q.past_paper_id = p.id
     WHERE p.board = 'AKUEB' AND q.image_url IS NOT NULL AND q.image_url != ''
     ORDER BY p.subject, p.year, p.class, p.paper_number`,
  );
  const papers = papersRes.rows;
  console.log(`Papers with image-bearing questions: ${papers.length}\n`);

  const pdfs: string[] = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(".pdf")) pdfs.push(full);
    }
  }
  walk("pastpapers");
  console.log(`Indexed ${pdfs.length} PDFs on disk.\n`);

  const reports: PaperReport[] = [];
  const unmatched: string[] = [];

  for (const paper of papers) {
    if (onlyPaper && `${paper.class} ${paper.subject} ${paper.year} P${paper.paper_number}` !== onlyPaper) continue;
    if (onlySubject && !paper.subject.toLowerCase().includes(onlySubject.toLowerCase())) continue;

    const pdfPath = matchPdf(pdfs, paper);
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      unmatched.push(`${paper.subject} Class ${paper.class} ${paper.year} P${paper.paper_number}`);
      continue;
    }

    const diagrams = await runProcessor(pdfPath);

    const qRes = await db.query<QuestionRow>(
      `SELECT id, question_number, question_part, question_text, image_url
       FROM questions WHERE past_paper_id = $1 ORDER BY question_number, question_part`,
      [paper.id],
    );
    const questions = qRes.rows;
    const actions: RowAction[] = [];

    // Group sub-parts by question number
    const groups = new Map<number, QuestionRow[]>();
    for (const q of questions) {
      const arr = groups.get(q.question_number) || [];
      arr.push(q);
      groups.set(q.question_number, arr);
    }

    for (const [qnum, qlist] of groups) {
      const candidates = diagrams.filter(d => d.questionNumber === qnum);
      const verifiedCrops = new Set<string>();
      for (const c of candidates) {
        const page = cropPageFromFileName(c.fileName);
        if (page !== null) verifiedCrops.add(`p${page}-q${qnum}`);
      }
      const refRows = qlist.filter(q => referencesFigure(q.question_text));
      // Rows sharing the same crop within this question → duplication signature (ingestion bug).
      const cropGroups = new Map<string, QuestionRow[]>();
      for (const q of qlist) {
        const key = cropKeyFromUrl(q.image_url);
        if (!key) continue;
        const arr = cropGroups.get(key) || [];
        arr.push(q);
        cropGroups.set(key, arr);
      }

      for (const q of qlist) {
        const currentKey = cropKeyFromUrl(q.image_url);
        const needsFig = referencesFigure(q.question_text);
        const isAutoCrop = currentKey !== null; // diagram_p*-style url

        if (!q.image_url) {
          // No image: add only when there is exactly ONE candidate crop and the text references a figure.
          if (candidates.length === 1 && needsFig) {
            actions.push({ question: q, action: "ADD", toCrop: candidates[0].fileName, toFilePath: candidates[0].imagePath, reason: "text references figure; single verified crop exists" });
          }
          continue;
        }

        // Foreign image (e.g. Q3.jpg hand-verified, site image, etc.) — never auto-managed.
        if (!isAutoCrop) {
          actions.push({ question: q, action: "KEEP", fromCrop: null, reason: "foreign image, not an auto-crop; keeping as verified" });
          continue;
        }

        // Same crop on multiple sub-parts of this question → duplication bug: keep it on the
        // figure-referencing row(s) or the first row (stem), drop the rest. This is the primary fix
        // and does not depend on processor re-verification.
        const shared = (cropGroups.get(currentKey) || []).length;
        if (shared > 1) {
          const isKeeper = needsFig || (cropGroups.get(currentKey)![0] === q && refRows.length === 0);
          if (isKeeper) {
            const v = candidates.find(c => `p${cropPageFromFileName(c.fileName)}-q${qnum}` === currentKey);
            actions.push({ question: q, action: "KEEP", fromCrop: currentKey, toCrop: v?.fileName, reason: "shared crop; kept on stem/figure-referencing row" });
          } else {
            actions.push({ question: q, action: "REMOVE", fromCrop: currentKey, reason: "duplicate shared crop on sub-part with no figure reference" });
          }
          continue;
        }

        if (verifiedCrops.has(currentKey)) {
          // DB crop is one of the verified candidates for this question.
          const v = candidates.find(c => `p${cropPageFromFileName(c.fileName)}-q${qnum}` === currentKey);
          actions.push({ question: q, action: "KEEP", fromCrop: currentKey, toCrop: v?.fileName, reason: "crop is a verified candidate for this question" });
        } else if (candidates.length === 1 && needsFig) {
          // Exactly one candidate and text references figure — replace with the verified crop.
          const v = candidates[0];
          actions.push({ question: q, action: "REPLACE", fromCrop: currentKey, toCrop: v.fileName, toFilePath: v.imagePath, reason: "wrong crop; question references figure; replacing with verified candidate" });
        } else {
          // Cannot reliably establish this image is wrong. Processor re-assignment and PDF
          // version differences mean a missing/mismatched candidate is NOT proof of a wrong
          // crop; many questions need figures that their text never cues (metre scale,
          // circle diagrams, Carnot/PV cycles, circuit schematics, apparatus, number lines).
          // Shared-crop duplication (above) is the only DB-internal evidence we trust.
          actions.push({ question: q, action: "KEEP", fromCrop: currentKey, toCrop: null, reason: "unverified via processor re-run; keeping image (no reliable wrong-image evidence)" });
        }
      }
    }

    reports.push({ paper, pdf: pdfPath, diagramsDetected: diagrams.length, actions });
  }

  // ---------- REPORT ----------
  let tAdd = 0, tRemove = 0, tReplace = 0, tKeep = 0;
  for (const r of reports) {
    tAdd += r.actions.filter(a => a.action === "ADD").length;
    tRemove += r.actions.filter(a => a.action === "REMOVE").length;
    tReplace += r.actions.filter(a => a.action === "REPLACE").length;
    tKeep += r.actions.filter(a => a.action === "KEEP").length;
  }

  console.log("==================================================================");
  console.log(`📋 Image fix report (${reports.length} papers, diagrams detected across papers)`);
  console.log("==================================================================");
  console.log(`ADD: ${tAdd} | REMOVE: ${tRemove} | REPLACE: ${tReplace} | KEEP: ${tKeep}`);
  console.log(`Unmatched papers (no PDF found): ${unmatched.length}`);

  if (dryRun) {
    console.log("\n--------------- PER-PAPER ACTIONS (excluding KEEP) ---------------");
    for (const r of reports) {
      const nonKeep = r.actions.filter(a => a.action !== "KEEP");
      if (nonKeep.length === 0) continue;
      console.log(`\n📄 ${r.paper.subject} ${r.paper.class} ${r.paper.year} P${r.paper.paper_number} (${r.diagramsDetected} diagrams) → ${r.pdf}`);
      for (const a of nonKeep) {
        console.log(`  [${a.action}] Q${a.question.question_number}${a.question.question_part ? "(" + a.question.question_part + ")" : ""} ${a.fromCrop || "-"}→${a.toCrop || "-"} ${a.reason}`);
      }
    }

    console.log("\n--------------- UNMATCHED PAPERS ---------------");
    for (const u of unmatched) console.log(`  - ${u}`);

    // ---------- VERIFICATION SUMMARY ----------
    let verified = 0, unverified = 0, keptShared = 0, keptForeign = 0;
    const unverifiedByPaper = new Map<string, number>();
    for (const r of reports) {
      let paperUnv = 0;
      for (const a of r.actions) {
        if (a.action !== "KEEP") continue;
        if (/crop is a verified candidate/.test(a.reason)) { verified++; continue; }
        if (/shared crop; kept on stem/.test(a.reason)) { keptShared++; continue; }
        if (/foreign image/.test(a.reason)) { keptForeign++; continue; }
        paperUnv++; // unverifiable via processor re-run
      }
      if (paperUnv) {
        unverified += paperUnv;
        unverifiedByPaper.set(`${r.paper.subject} ${r.paper.class} ${r.paper.year} P${r.paper.paper_number}`, paperUnv);
      }
    }
    console.log("\n--------------- VERIFICATION SUMMARY ---------------");
    console.log(`Images CONFIRMED against the PDF (processor verified): ${verified}`);
    console.log(`Images kept as stem/shared-crop keepers: ${keptShared}`);
    console.log(`Foreign images kept as-is: ${keptForeign}`);
    console.log(`Images UNVERIFIED (processor couldn't confirm page↔question, KEPT defensively): ${unverified}`);
    if (unverifiedByPaper.size) {
      console.log("\nPapers with unverified images (worst offenders):");
      const sorted = [...unverifiedByPaper.entries()].sort((a, b) => b[1] - a[1]);
      for (const [paper, n] of sorted.slice(0, 15)) console.log(`  ${String(n).padStart(3)}  ${paper}`);
    }
    console.log("\nRun with `--apply` to apply fixes, `--subject='...'` / `--paper='XII Biology 2023 P2'` to limit scope.");
  } else {
    console.log("\nApplying fixes...\n");
    let applied = 0;
    for (const r of reports) {
      for (const a of r.actions) {
        if (a.action === "KEEP") continue;
        if (a.action === "REMOVE") {
          if (a.question.image_url) {
            await db.query(`UPDATE questions SET image_url = NULL WHERE id = $1`, [a.question.id]);
            applied++;
            console.log(`  🧹 REMOVE  Q${a.question.question_number}${a.question.question_part ? "(" + a.question.question_part + ")" : ""} ${r.paper.subject} ${r.paper.class} ${r.paper.year} P${r.paper.paper_number}`);
          }
        } else if (a.toFilePath && fs.existsSync(a.toFilePath)) {
          const buf = fs.readFileSync(a.toFilePath);
          const up = await uploadToCloudinary(buf, a.toCrop!, "questions");
          await db.query(`UPDATE questions SET image_url = $1 WHERE id = $2`, [up.url, a.question.id]);
          applied++;
          console.log(`  ${a.action === "ADD" ? "➕ ADD" : "🔄 REPLACE"}  Q${a.question.question_number}${a.question.question_part ? "(" + a.question.question_part + ")" : ""} ${r.paper.subject} ${r.paper.class} ${r.paper.year} P${r.paper.paper_number} → ${a.toCrop}`);
        } else {
          console.warn(`  ⚠️ no crop file for ${a.action} Q${a.question.question_number}: ${a.toFilePath}`);
        }
      }
    }
    console.log(`\n✅ Applied ${applied} image updates.`);
  }

  await db.pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});