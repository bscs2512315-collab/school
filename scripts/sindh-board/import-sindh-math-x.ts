import "dotenv/config";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { extractSindhPaper1MCQs, extractSindhPaper2Theory } from "./extract-sindh-paper";

interface MathPostSource {
  year: number;
  postUrl: string;
}

const CLASS_X_MATH_POSTS: MathPostSource[] = [
  {
    year: 2025,
    postUrl: "https://adamjeecoaching.blogspot.com/2026/02/mathematics-10th-past-year-paper-2025.html"
  },
  {
    year: 2024,
    postUrl: "https://adamjeecoaching.blogspot.com/2024/12/mathematics-10th-past-year-paper-2024.html"
  },
  {
    year: 2019,
    postUrl: "https://adamjeecoaching.blogspot.com/2019/08/10th-mathematics-past-year-paper-2019.html"
  },
  {
    year: 2018,
    postUrl: "https://adamjeecoaching.blogspot.com/2018/08/10th-mathematics-past-year-paper-2018.html"
  },
  {
    year: 2017,
    postUrl: "https://adamjeecoaching.blogspot.com/2017/08/x-mathematics-past-year-paper-2017.html"
  },
  {
    year: 2016,
    postUrl: "https://adamjeecoaching.blogspot.com/2016/09/x-mathematics-past-year-paper-2016.html"
  },
  {
    year: 2015,
    postUrl: "https://adamjeecoaching.blogspot.com/2015/09/x-mathematics-past-year-paper-2015.html"
  }
];

const SINDH_MATH_X_CHAPTERS = [
  { number: 17, name: "Sets and Functions" },
  { number: 18, name: "Variations" },
  { number: 19, name: "Matrices and Determinants" },
  { number: 20, name: "Theory of Quadratic Equations" },
  { number: 21, name: "Partial Fractions" },
  { number: 22, name: "Basic Statistics" },
  { number: 23, name: "Pythagoras Theorem and its Applications" },
  { number: 24, name: "Ratio and Proportion" },
  { number: 25, name: "Chords of a Circle and Tangents to a Circle" },
  { number: 26, name: "Chords and Arcs" },
  { number: 27, name: "Angle in a Segment of a Circle" },
  { number: 28, name: "Tangent to a Circle" },
  { number: 29, name: "Practical Geometry - Circles" },
  { number: 30, name: "Introduction to Trigonometry" }
];

async function ensureSindhCurriculumAndChapters(): Promise<{ curriculumId: string; chapters: Array<{ id: string; chapter_name: string; chapter_number: number }> }> {
  console.log("📚 Checking Sindh Board Class X Mathematics curriculum in DB...");
  const { rows: existing } = await db.query(
    `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3 LIMIT 1`,
    ["X", "Sindh Board", "Mathematics"]
  );

  let curriculumId: string;
  if (existing.length > 0) {
    curriculumId = existing[0].id;
    console.log(`✅ Found existing Sindh Board curriculum ID: ${curriculumId}`);
  } else {
    curriculumId = randomUUID();
    await db.query(
      `INSERT INTO curriculums (id, class, board, subject, file_url, file_name, analyzed_content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        curriculumId,
        "X",
        "Sindh Board",
        "Mathematics",
        "",
        "Sindh-Textbook-Board-Class-X-Mathematics.pdf",
        JSON.stringify({ totalChapters: SINDH_MATH_X_CHAPTERS.length, board: "Sindh Board" })
      ]
    );
    console.log(`✨ Created new Sindh Board curriculum ID: ${curriculumId}`);
  }

  // Ensure all chapters exist
  for (const ch of SINDH_MATH_X_CHAPTERS) {
    const { rows: existingCh } = await db.query(
      `SELECT id FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2`,
      [curriculumId, ch.number]
    );
    if (existingCh.length === 0) {
      await db.query(
        `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [randomUUID(), curriculumId, ch.number, ch.name, `Sindh Board Class X Mathematics Chapter ${ch.number}: ${ch.name}`]
      );
    }
  }

  const { rows: allChapters } = await db.query(
    `SELECT id, chapter_name, chapter_number FROM chapters WHERE curriculum_id = $1 ORDER BY chapter_number ASC`,
    [curriculumId]
  );
  console.log(`✅ Sindh Board Chapters verified (${allChapters.length} chapters ready).\n`);
  return { curriculumId, chapters: allChapters as any };
}

async function getPostImages(url: string): Promise<string[]> {
  const res = await fetch(url);
  const html = await res.text();
  const postBodyMatch = html.match(/<div class=["\x27]post-body[\s\S]*?<\/div>\s*<div class=["\x27]post-footer/i);
  const body = postBodyMatch ? postBodyMatch[0] : html;
  const imgs = [...body.matchAll(/<img[^>]+src=["\x27]([^"\x27]+)["\x27]/gi)].map(m => m[1]);
  return [...new Set(imgs.map(u => u.replace(/\/s\d+(-[a-z0-9]+)?\//i, "/s1600/")))].filter(
    u => !u.includes("Fill In The Blanks") && !u.includes("button") && !u.includes("badge")
  );
}

async function fetchImageBuffer(url: string, localCachePath: string): Promise<Buffer> {
  if (fs.existsSync(localCachePath)) {
    return fs.readFileSync(localCachePath);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (HTTP ${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(localCachePath), { recursive: true });
  fs.writeFileSync(localCachePath, buf);
  return buf;
}

function matchChapter(suggestedChapter: string | undefined, chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>): { id: string | null; name: string | null } {
  if (!suggestedChapter) return { id: null, name: null };
  const lower = suggestedChapter.toLowerCase();
  
  // Exact or partial match
  const match = chapters.find(
    ch => ch.chapter_name.toLowerCase() === lower ||
          ch.chapter_name.toLowerCase().includes(lower) ||
          lower.includes(ch.chapter_name.toLowerCase())
  );
  if (match) return { id: match.id, name: match.chapter_name };

  // Keyword heuristics
  if (lower.includes("set")) return chapters.find(c => c.chapter_number === 17) ? { id: chapters.find(c => c.chapter_number === 17)!.id, name: "Sets and Functions" } : { id: null, name: null };
  if (lower.includes("variation") || lower.includes("ratio") || lower.includes("proportion")) return chapters.find(c => c.chapter_number === 18) ? { id: chapters.find(c => c.chapter_number === 18)!.id, name: "Variations" } : { id: null, name: null };
  if (lower.includes("matri") || lower.includes("determinant") || lower.includes("cramer") || lower.includes("adjoint")) return chapters.find(c => c.chapter_number === 19) ? { id: chapters.find(c => c.chapter_number === 19)!.id, name: "Matrices and Determinants" } : { id: null, name: null };
  if (lower.includes("quadrat") || lower.includes("discriminant") || lower.includes("root")) return chapters.find(c => c.chapter_number === 20) ? { id: chapters.find(c => c.chapter_number === 20)!.id, name: "Theory of Quadratic Equations" } : { id: null, name: null };
  if (lower.includes("fraction")) return chapters.find(c => c.chapter_number === 21) ? { id: chapters.find(c => c.chapter_number === 21)!.id, name: "Partial Fractions" } : { id: null, name: null };
  if (lower.includes("statist") || lower.includes("mean") || lower.includes("median") || lower.includes("mode") || lower.includes("variance")) return chapters.find(c => c.chapter_number === 22) ? { id: chapters.find(c => c.chapter_number === 22)!.id, name: "Basic Statistics" } : { id: null, name: null };
  if (lower.includes("trig") || lower.includes("sin") || lower.includes("cos") || lower.includes("tan")) return chapters.find(c => c.chapter_number === 30) ? { id: chapters.find(c => c.chapter_number === 30)!.id, name: "Introduction to Trigonometry" } : { id: null, name: null };
  if (lower.includes("circle") || lower.includes("theorem") || lower.includes("chord") || lower.includes("tangent") || lower.includes("geometr")) return chapters.find(c => c.chapter_number === 25) ? { id: chapters.find(c => c.chapter_number === 25)!.id, name: "Chords of a Circle and Tangents to a Circle" } : { id: null, name: null };

  return { id: null, name: suggestedChapter };
}

async function main() {
  console.log("==========================================================================");
  console.log("🚀 STARTING SINDH BOARD CLASS X MATHEMATICS INGESTION PIPELINE");
  console.log("==========================================================================\n");

  const { chapters } = await ensureSindhCurriculumAndChapters();

  // Get admin user for authoring
  const { rows: adminRows } = await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
  const adminId = adminRows[0]?.id || null;

  for (let idx = 0; idx < CLASS_X_MATH_POSTS.length; idx++) {
    const post = CLASS_X_MATH_POSTS[idx];
    const year = post.year;
    console.log(`\n--------------------------------------------------------------------------`);
    console.log(`▶️  [${idx + 1}/${CLASS_X_MATH_POSTS.length}] Processing Sindh Board Class X Mathematics (${year})`);
    console.log(`--------------------------------------------------------------------------`);

    const cacheDir = path.resolve(process.cwd(), `pastpapers/sindh_board/X/Mathematics/${year}`);

    const force = process.argv.includes("--force");

    // Check if both Paper 1 & Paper 2 already exist with questions
    const { rows: p1Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp 
       LEFT JOIN questions q ON q.past_paper_id = pp.id 
       WHERE pp.class = 'X' AND pp.board = 'Sindh Board' AND pp.subject = 'Mathematics' AND pp.year = $1 AND pp.paper_number = 1
       GROUP BY pp.id`,
      [year]
    );
    const { rows: p2Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp 
       LEFT JOIN questions q ON q.past_paper_id = pp.id 
       WHERE pp.class = 'X' AND pp.board = 'Sindh Board' AND pp.subject = 'Mathematics' AND pp.year = $1 AND pp.paper_number = 2
       GROUP BY pp.id`,
      [year]
    );

    const p1Done = p1Check.length > 0 && parseInt(p1Check[0].qcount, 10) > 0;
    const p2Done = p2Check.length > 0 && parseInt(p2Check[0].qcount, 10) > 0;

    if (p1Done && p2Done && !force) {
      console.log(`⏩ Year ${year} (Paper 1: ${p1Check[0].qcount} Qs, Paper 2: ${p2Check[0].qcount} Qs) already complete in database. Skipping.`);
      continue;
    }

    console.log(`🌐 Fetching images from: ${post.postUrl}...`);
    const imageUrls = await getPostImages(post.postUrl);
    console.log(`   Found ${imageUrls.length} page images for ${year}.`);

    if (imageUrls.length === 0) {
      console.warn(`⚠️ No images found for ${year}. Skipping.`);
      continue;
    }

    // ==========================================
    // 1. PAPER 1 (SECTION A - MCQs)
    // ==========================================
    console.log(`📥 Downloading Section A (MCQs) image...`);
    const mcqBuf = await fetchImageBuffer(imageUrls[0], path.join(cacheDir, `mcq_1.png`));

    console.log(`🔍 Extracting Paper 1 MCQs with Gemini Vision...`);
    const mcqs = await extractSindhPaper1MCQs([mcqBuf], { classVal: "X", subject: "Mathematics", year });
    console.log(`✅ Extracted ${mcqs.length} MCQs for ${year} Paper 1.`);

    // Insert or update Paper 1 in DB
    const { rows: existingP1 } = await db.query(
      `SELECT id FROM past_papers WHERE class = 'X' AND board = 'Sindh Board' AND subject = 'Mathematics' AND year = $1 AND paper_number = 1`,
      [year]
    );

    let p1Id = existingP1[0]?.id;
    if (existingP1.length > 0) {
      console.log(`   - Updating existing Paper 1 record: ${p1Id}`);
      await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [p1Id]);
      await db.query(`UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`, [
        mcqs.length,
        p1Id
      ]);
    } else {
      p1Id = randomUUID();
      await db.query(
        `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by, created_at, updated_at)
         VALUES ($1, 'X', 'Sindh Board', 'Mathematics', $2, 1, '', $3, $4, 'COMPLETED', $5, NOW(), NOW())`,
        [p1Id, year, `SindhBoard-X-Mathematics-${year}-Paper1`, mcqs.length, adminId]
      );
      console.log(`   - Created new Paper 1 record: ${p1Id}`);
    }

    // Insert MCQs
    for (const q of mcqs) {
      const qId = randomUUID();
      const ch = matchChapter(q.suggestedChapter, chapters);
      const mcqData = JSON.stringify({
        options: q.mcqOptions,
        correctAnswer: q.correctAnswer
      });

      await db.query(
        `INSERT INTO questions (
          id, past_paper_id, question_number, question_part, question_text,
          question_type, chapter_id, chapter_name, marks, is_verified, verified_by, mcq_data
        ) VALUES ($1, $2, $3, NULL, $4, 'MCQ', $5, $6, $7, true, $8, $9)`,
        [qId, p1Id, q.questionNumber, q.questionText, ch.id, ch.name, q.marks || 1, adminId, mcqData]
      );
    }
    console.log(`💾 Saved ${mcqs.length} MCQs to database for Paper 1 (${year}).`);

    // Pause between Section A and Section B
    await new Promise(r => setTimeout(r, 6000));

    // ==========================================
    // 2. PAPER 2 (SECTION B & SECTION C - THEORY)
    // ==========================================
    const theoryUrls = imageUrls.slice(1);
    console.log(`\n📥 Downloading Section B & C (${theoryUrls.length} Theory images)...`);
    const theoryBuffers: Buffer[] = [];
    for (let i = 0; i < theoryUrls.length; i++) {
      theoryBuffers.push(await fetchImageBuffer(theoryUrls[i], path.join(cacheDir, `theory_${i + 1}.png`)));
    }

    console.log(`🔍 Extracting Paper 2 (Short QnA & Long QnA) with Gemini Vision...`);
    const theoryQuestions = await extractSindhPaper2Theory(theoryBuffers, { classVal: "X", subject: "Mathematics", year });
    console.log(`✅ Extracted ${theoryQuestions.length} Theory questions for ${year} Paper 2.`);

    // Insert or update Paper 2 in DB
    const { rows: existingP2 } = await db.query(
      `SELECT id FROM past_papers WHERE class = 'X' AND board = 'Sindh Board' AND subject = 'Mathematics' AND year = $1 AND paper_number = 2`,
      [year]
    );

    let p2Id = existingP2[0]?.id;
    if (existingP2.length > 0) {
      console.log(`   - Updating existing Paper 2 record: ${p2Id}`);
      await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [p2Id]);
      await db.query(`UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`, [
        theoryQuestions.length,
        p2Id
      ]);
    } else {
      p2Id = randomUUID();
      await db.query(
        `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by, created_at, updated_at)
         VALUES ($1, 'X', 'Sindh Board', 'Mathematics', $2, 2, '', $3, $4, 'COMPLETED', $5, NOW(), NOW())`,
        [p2Id, year, `SindhBoard-X-Mathematics-${year}-Paper2`, theoryQuestions.length, adminId]
      );
      console.log(`   - Created new Paper 2 record: ${p2Id}`);
    }

    // Insert Theory Questions
    for (const q of theoryQuestions) {
      const qId = randomUUID();
      const ch = matchChapter(q.suggestedChapter, chapters);
      const paperIIData = JSON.stringify({
        betterResponse: q.solutionOrRubric || "",
        weakerResponse: "",
        type: q.questionType
      });

      await db.query(
        `INSERT INTO questions (
          id, past_paper_id, question_number, question_part, question_text,
          question_type, chapter_id, chapter_name, marks, is_verified, verified_by, paper_ii_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11)`,
        [
          qId,
          p2Id,
          q.questionNumber,
          q.questionPart || null,
          q.questionText,
          q.questionType,
          ch.id,
          ch.name,
          q.marks || (q.questionType === "ERQ" ? 10 : 5),
          adminId,
          paperIIData
        ]
      );
    }
    console.log(`💾 Saved ${theoryQuestions.length} Short/Long questions to database for Paper 2 (${year}).`);

    // Brief pause between papers to prevent rate limit spikes
    console.log("⏳ Pausing 10s before next paper to keep Gemini API healthy...");
    await new Promise(r => setTimeout(r, 10000));
  }

  console.log("\n==========================================================================");
  console.log("🎉 SINDH BOARD CLASS X MATHEMATICS IMPORT COMPLETED SUCCESSFULLY!");
  console.log("==========================================================================");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Import error:", err);
  process.exit(1);
});
