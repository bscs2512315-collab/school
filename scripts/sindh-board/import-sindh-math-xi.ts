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

const CLASS_XI_MATH_POSTS: MathPostSource[] = [
  {
    year: 2025,
    postUrl: "https://adamjeecoaching.blogspot.com/2026/04/mathematics-past-year-paper-2025-for-class-11th.html",
  },
  {
    year: 2024,
    postUrl: "https://adamjeecoaching.blogspot.com/2024/12/mathematics-11th-past-year-paper-2024.html",
  },
  {
    year: 2019,
    postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-mathematics-past-year-paper-2019.html",
  },
  {
    year: 2018,
    postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-mathematics-past-year-paper-2018.html",
  },
  {
    year: 2017,
    postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-mathematics-past-year-paper-2017.html",
  },
  {
    year: 2016,
    postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-mathematics-past-year-paper-2016.html",
  },
  {
    year: 2015,
    postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-mathematics-past-year-paper-2015.html",
  },
  {
    year: 2014,
    postUrl: "https://adamjeecoaching.blogspot.com/2014/11/mathematics-2014-past-year-paper-class-xi.html",
  },
];

const SINDH_MATH_XI_CHAPTERS = [
  { number: 1, name: "Complex Numbers" },
  { number: 2, name: "Matrices and Determinants" },
  { number: 3, name: "Vectors" },
  { number: 4, name: "Sequences and Series" },
  { number: 5, name: "Miscellaneous Series" },
  { number: 6, name: "Permutation, Combination and Probability" },
  { number: 7, name: "Mathematical Induction and Binomial Theorem" },
  { number: 8, name: "Functions and Graphs" },
  { number: 9, name: "Linear Programming" },
  { number: 10, name: "Trigonometric Identities of Sum and Difference of Angles" },
  { number: 11, name: "Application of Trigonometry" },
  { number: 12, name: "Graphs of Trigonometric and Inverse Trigonometric Functions and Solution of Trigonometric Equations" },
];

async function ensureSindhCurriculumAndChapters(): Promise<{
  curriculumId: string;
  chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>;
}> {
  console.log("📚 Checking Sindh Board Class XI Mathematics curriculum in DB...");
  const { rows: existing } = await db.query(
    `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3 LIMIT 1`,
    ["XI", "Sindh Board", "Mathematics"],
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
        "XI",
        "Sindh Board",
        "Mathematics",
        "",
        "Sindh-Textbook-Board-Class-XI-Mathematics.pdf",
        JSON.stringify({ totalChapters: SINDH_MATH_XI_CHAPTERS.length, board: "Sindh Board" }),
      ],
    );
    console.log(`✨ Created new Sindh Board curriculum ID: ${curriculumId}`);
  }

  // Ensure all chapters exist
  for (const ch of SINDH_MATH_XI_CHAPTERS) {
    const { rows: existingCh } = await db.query(
      `SELECT id FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2`,
      [curriculumId, ch.number],
    );
    if (existingCh.length === 0) {
      await db.query(
        `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          randomUUID(),
          curriculumId,
          ch.number,
          ch.name,
          `Sindh Board Class XI Mathematics Chapter ${ch.number}: ${ch.name}`,
        ],
      );
    }
  }

  const { rows: allChapters } = await db.query(
    `SELECT id, chapter_name, chapter_number FROM chapters WHERE curriculum_id = $1 ORDER BY chapter_number ASC`,
    [curriculumId],
  );
  console.log(`✅ Sindh Board Chapters verified (${allChapters.length} chapters ready).\n`);
  return { curriculumId, chapters: allChapters as any };
}

async function getPostImages(url: string): Promise<string[]> {
  const res = await fetch(url);
  const html = await res.text();
  const postBodyMatch = html.match(
    /<div class=["\x27]post-body[\s\S]*?<\/div>\s*<div class=["\x27]post-footer/i,
  );
  const body = postBodyMatch ? postBodyMatch[0] : html;
  const imgs = [...body.matchAll(/<img[^>]+src=["\x27]([^"\x27]+)["\x27]/gi)].map(
    (m) => m[1],
  );
  return [
    ...new Set(imgs.map((u) => u.replace(/\/s\d+(-[a-z0-9]+)?\//i, "/s1600/"))),
  ].filter(
    (u) =>
      !u.includes("Fill In The Blanks") &&
      !u.includes("button") &&
      !u.includes("badge") &&
      !u.includes("fav"),
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

function matchChapter(
  suggestedChapter: string | undefined,
  chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>,
): { id: string | null; name: string | null } {
  if (!suggestedChapter) return { id: null, name: null };
  const lower = suggestedChapter.toLowerCase();

  // Exact or partial match
  const match = chapters.find(
    (ch) =>
      ch.chapter_name.toLowerCase() === lower ||
      ch.chapter_name.toLowerCase().includes(lower) ||
      lower.includes(ch.chapter_name.toLowerCase()),
  );
  if (match) return { id: match.id, name: match.chapter_name };

  // Keyword heuristics for Class XI
  if (lower.includes("complex") || lower.includes("argand") || lower.includes("modulus") || lower.includes("conjugate")) {
    return chapters.find((c) => c.chapter_number === 1)
      ? { id: chapters.find((c) => c.chapter_number === 1)!.id, name: "Complex Numbers" }
      : { id: null, name: null };
  }
  if (lower.includes("matri") || lower.includes("determinant") || lower.includes("cramer") || lower.includes("adjoint") || lower.includes("echelon") || lower.includes("rank")) {
    return chapters.find((c) => c.chapter_number === 2)
      ? { id: chapters.find((c) => c.chapter_number === 2)!.id, name: "Matrices and Determinants" }
      : { id: null, name: null };
  }
  if (lower.includes("vector") || lower.includes("dot product") || lower.includes("cross product") || lower.includes("scalar triple") || lower.includes("position vector")) {
    return chapters.find((c) => c.chapter_number === 3)
      ? { id: chapters.find((c) => c.chapter_number === 3)!.id, name: "Vectors" }
      : { id: null, name: null };
  }
  if (lower.includes("sequence") || lower.includes("arithmetic") || lower.includes("geometric") || lower.includes("harmonic") || lower.includes("progression") || lower.includes("a.p.") || lower.includes("g.p.") || lower.includes("h.p.")) {
    return chapters.find((c) => c.chapter_number === 4)
      ? { id: chapters.find((c) => c.chapter_number === 4)!.id, name: "Sequences and Series" }
      : { id: null, name: null };
  }
  if (lower.includes("miscellaneous") || lower.includes("sum of series") || lower.includes("sigma") || lower.includes("arithmetico-geometric")) {
    return chapters.find((c) => c.chapter_number === 5)
      ? { id: chapters.find((c) => c.chapter_number === 5)!.id, name: "Miscellaneous Series" }
      : { id: null, name: null };
  }
  if (lower.includes("permut") || lower.includes("combin") || lower.includes("probabilit") || lower.includes("arrangement") || lower.includes("factorial")) {
    return chapters.find((c) => c.chapter_number === 6)
      ? { id: chapters.find((c) => c.chapter_number === 6)!.id, name: "Permutation, Combination and Probability" }
      : { id: null, name: null };
  }
  if (lower.includes("induction") || lower.includes("binomial") || lower.includes("expansion") || lower.includes("middle term") || lower.includes("independent term")) {
    return chapters.find((c) => c.chapter_number === 7)
      ? { id: chapters.find((c) => c.chapter_number === 7)!.id, name: "Mathematical Induction and Binomial Theorem" }
      : { id: null, name: null };
  }
  if (lower.includes("function") || lower.includes("domain") || lower.includes("range") || lower.includes("bijection") || lower.includes("one-one") || lower.includes("onto")) {
    return chapters.find((c) => c.chapter_number === 8)
      ? { id: chapters.find((c) => c.chapter_number === 8)!.id, name: "Functions and Graphs" }
      : { id: null, name: null };
  }
  if (lower.includes("linear programming") || lower.includes("feasible") || lower.includes("objective function") || lower.includes("corner point") || lower.includes("inequalit")) {
    return chapters.find((c) => c.chapter_number === 9)
      ? { id: chapters.find((c) => c.chapter_number === 9)!.id, name: "Linear Programming" }
      : { id: null, name: null };
  }
  if (lower.includes("identit") || lower.includes("sum and difference") || lower.includes("fundamental law") || lower.includes("sin(alpha") || lower.includes("cos(alpha")) {
    return chapters.find((c) => c.chapter_number === 10)
      ? { id: chapters.find((c) => c.chapter_number === 10)!.id, name: "Trigonometric Identities of Sum and Difference of Angles" }
      : { id: null, name: null };
  }
  if (lower.includes("application of trig") || lower.includes("triangle") || lower.includes("sine rule") || lower.includes("cosine rule") || lower.includes("hero") || lower.includes("in-circle") || lower.includes("circum-circle") || lower.includes("e-circle") || lower.includes("height") || lower.includes("elevation") || lower.includes("depression")) {
    return chapters.find((c) => c.chapter_number === 11)
      ? { id: chapters.find((c) => c.chapter_number === 11)!.id, name: "Application of Trigonometry" }
      : { id: null, name: null };
  }
  if (lower.includes("equation") || lower.includes("inverse trig") || lower.includes("arcsin") || lower.includes("arccos") || lower.includes("arctan") || lower.includes("general solution") || lower.includes("principal value")) {
    return chapters.find((c) => c.chapter_number === 12)
      ? { id: chapters.find((c) => c.chapter_number === 12)!.id, name: "Graphs of Trigonometric and Inverse Trigonometric Functions and Solution of Trigonometric Equations" }
      : { id: null, name: null };
  }

  return { id: null, name: suggestedChapter };
}

async function main() {
  console.log("==========================================================================");
  console.log("🚀 STARTING SINDH BOARD CLASS XI MATHEMATICS INGESTION PIPELINE");
  console.log("==========================================================================\n");

  const { chapters } = await ensureSindhCurriculumAndChapters();

  // Get admin user for authoring
  const { rows: adminRows } = await db.query(
    `SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`,
  );
  const adminId = adminRows[0]?.id || null;

  for (let idx = 0; idx < CLASS_XI_MATH_POSTS.length; idx++) {
    const post = CLASS_XI_MATH_POSTS[idx];
    const year = post.year;
    console.log(`\n--------------------------------------------------------------------------`);
    console.log(
      `▶️  [${idx + 1}/${CLASS_XI_MATH_POSTS.length}] Processing Sindh Board Class XI Mathematics (${year})`,
    );
    console.log(`--------------------------------------------------------------------------`);

    const cacheDir = path.resolve(
      process.cwd(),
      `pastpapers/sindh_board/XI/Mathematics/${year}`,
    );

    const force = process.argv.includes("--force");

    // Check if both Paper 1 & Paper 2 already exist with questions
    const { rows: p1Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp 
       LEFT JOIN questions q ON q.past_paper_id = pp.id 
       WHERE pp.class = 'XI' AND pp.board = 'Sindh Board' AND pp.subject = 'Mathematics' AND pp.year = $1 AND pp.paper_number = 1
       GROUP BY pp.id`,
      [year],
    );
    const { rows: p2Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp 
       LEFT JOIN questions q ON q.past_paper_id = pp.id 
       WHERE pp.class = 'XI' AND pp.board = 'Sindh Board' AND pp.subject = 'Mathematics' AND pp.year = $1 AND pp.paper_number = 2
       GROUP BY pp.id`,
      [year],
    );

    const p1Done = p1Check.length > 0 && parseInt(p1Check[0].qcount, 10) > 0;
    const p2Done = p2Check.length > 0 && parseInt(p2Check[0].qcount, 10) > 0;

    if (p1Done && p2Done && !force) {
      console.log(
        `⏩ Year ${year} (Paper 1: ${p1Check[0].qcount} Qs, Paper 2: ${p2Check[0].qcount} Qs) already complete in database. Skipping.`,
      );
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
    if (!p1Done || force) {
      console.log(`📥 Downloading Section A (MCQs) image...`);
      const mcqBuf = await fetchImageBuffer(
        imageUrls[0],
        path.join(cacheDir, `mcq_1.png`),
      );

      console.log(`🔍 Extracting Paper 1 MCQs with Gemini Vision...`);
      const mcqs = await extractSindhPaper1MCQs([mcqBuf], {
        classVal: "XI",
        subject: "Mathematics",
        year,
      });
      console.log(`✅ Extracted ${mcqs.length} MCQs for ${year} Paper 1.`);

      // Insert or update Paper 1 in DB
      const { rows: existingP1 } = await db.query(
        `SELECT id FROM past_papers WHERE class = 'XI' AND board = 'Sindh Board' AND subject = 'Mathematics' AND year = $1 AND paper_number = 1`,
        [year],
      );

      let p1Id = existingP1[0]?.id;
      if (existingP1.length > 0) {
        console.log(`   - Updating existing Paper 1 record: ${p1Id}`);
        await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [p1Id]);
        await db.query(
          `UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`,
          [mcqs.length, p1Id],
        );
      } else {
        p1Id = randomUUID();
        await db.query(
          `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by, created_at, updated_at)
           VALUES ($1, 'XI', 'Sindh Board', 'Mathematics', $2, 1, '', $3, $4, 'COMPLETED', $5, NOW(), NOW())`,
          [
            p1Id,
            year,
            `SindhBoard-XI-Mathematics-${year}-Paper1`,
            mcqs.length,
            adminId,
          ],
        );
        console.log(`   - Created new Paper 1 record: ${p1Id}`);
      }

      // Insert MCQs
      for (let i = 0; i < mcqs.length; i++) {
        const q = mcqs[i];
        const qId = randomUUID();
        const ch = matchChapter(q.suggestedChapter, chapters);
        const mcqData = JSON.stringify({
          options: q.mcqOptions,
          correctAnswer: q.correctAnswer,
        });

        await db.query(
          `INSERT INTO questions (
            id, past_paper_id, question_number, question_part, question_text,
            question_type, chapter_id, chapter_name, marks, is_verified, verified_by, mcq_data
          ) VALUES ($1, $2, $3, NULL, $4, 'MCQ', $5, $6, $7, true, $8, $9)`,
          [
            qId,
            p1Id,
            i + 1,
            q.questionText,
            ch.id,
            ch.name,
            q.marks || 1,
            adminId,
            mcqData,
          ],
        );
      }
      console.log(`💾 Saved ${mcqs.length} MCQs to Paper 1 (ID: ${p1Id}).`);
    } else {
      console.log(`⏩ Year ${year} Paper 1 already complete in database. Skipping.`);
    }

    // ==========================================
    // 2. PAPER 2 (SECTION B & SECTION C - THEORY)
    // ==========================================
    if ((!p2Done || force) && imageUrls.length > 1) {
      console.log(
        `📥 Downloading ${imageUrls.length - 1} Theory images (Section B & C)...`,
      );
      const theoryBufs = await Promise.all(
        imageUrls
          .slice(1)
          .map((u, i) =>
            fetchImageBuffer(u, path.join(cacheDir, `theory_${i + 1}.png`)),
          ),
      );

      console.log(`🔍 Extracting Paper 2 Theory with Gemini Vision...`);
      const theoryQuestions = await extractSindhPaper2Theory(theoryBufs, {
        classVal: "XI",
        subject: "Mathematics",
        year,
      });
      console.log(
        `✅ Extracted ${theoryQuestions.length} Theory Questions for ${year} Paper 2.`,
      );

      // Insert or update Paper 2 in DB
      const { rows: existingP2 } = await db.query(
        `SELECT id FROM past_papers WHERE class = 'XI' AND board = 'Sindh Board' AND subject = 'Mathematics' AND year = $1 AND paper_number = 2`,
        [year],
      );

      let p2Id = existingP2[0]?.id;
      if (existingP2.length > 0) {
        console.log(`   - Updating existing Paper 2 record: ${p2Id}`);
        await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [p2Id]);
        await db.query(
          `UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`,
          [theoryQuestions.length, p2Id],
        );
      } else {
        p2Id = randomUUID();
        await db.query(
          `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by, created_at, updated_at)
           VALUES ($1, 'XI', 'Sindh Board', 'Mathematics', $2, 2, '', $3, $4, 'COMPLETED', $5, NOW(), NOW())`,
          [
            p2Id,
            year,
            `SindhBoard-XI-Mathematics-${year}-Paper2`,
            theoryQuestions.length,
            adminId,
          ],
        );
        console.log(`   - Created new Paper 2 record: ${p2Id}`);
      }

      // Insert Theory Questions with clean sequential numbers starting from 1
      for (let i = 0; i < theoryQuestions.length; i++) {
        const q = theoryQuestions[i];
        const qId = randomUUID();
        const ch = matchChapter(q.suggestedChapter, chapters);
        const paperIIData = JSON.stringify({
          betterResponse: q.solutionOrRubric || "",
          weakerResponse: "",
          type: q.questionType,
        });

        const marksVal = Math.max(
          1,
          Math.round(
            Number(q.marks) || (q.questionType === "ERQ" ? 10 : 5),
          ),
        );

        await db.query(
          `INSERT INTO questions (
            id, past_paper_id, question_number, question_part, question_text,
            question_type, chapter_id, chapter_name, marks, is_verified, verified_by, paper_ii_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11)`,
          [
            qId,
            p2Id,
            i + 1, // Sequential question numbering starting from 1 for Sindh Board Paper 2
            q.questionPart || null,
            q.questionText,
            q.questionType || (marksVal > 5 ? "ERQ" : "CRQ"),
            ch.id,
            ch.name,
            marksVal,
            adminId,
            paperIIData,
          ],
        );
      }
      console.log(
        `💾 Saved ${theoryQuestions.length} Theory questions to Paper 2 (ID: ${p2Id}).`,
      );
    } else {
      console.warn(
        `⚠️ Only 1 image available for ${year}; theory (Paper 2) skipped.`,
      );
    }

    // Small delay between years to avoid aggressive rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(
    "\n==========================================================================",
  );
  console.log("🎉 ALL SINDH BOARD CLASS XI MATHEMATICS PAPERS INGESTED SUCCESSFULLY!");
  console.log(
    "==========================================================================\n",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Pipeline failed:", err);
  process.exit(1);
});
