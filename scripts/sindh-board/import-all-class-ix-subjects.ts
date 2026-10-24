import "dotenv/config";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db } from "../../lib/db";
import { extractSindhPaper1MCQs, extractSindhPaper2Theory } from "./extract-sindh-paper";

interface SubjectConfig {
  subject: string;
  pdfFileName: string;
  chapters: Array<{ number: number; name: string }>;
  posts: Array<{ year: number; postUrl: string }>;
}

export const CLASS_IX_SINDH_SUBJECTS: SubjectConfig[] = [
  // 1. PHYSICS
  {
    subject: "Physics",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Physics.pdf",
    chapters: [
      { number: 1, name: "Physical Quantities and Measurement" },
      { number: 2, name: "Kinematics" },
      { number: 3, name: "Dynamics" },
      { number: 4, name: "Turning Effect of Forces" },
      { number: 5, name: "Forces and Matter" },
      { number: 6, name: "Gravitation" },
      { number: 7, name: "Properties of Matter" },
      { number: 8, name: "Thermal Properties of Matter" },
      { number: 9, name: "Transfer of Heat" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/physics-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/physics-9th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/9th-physics-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/9th-physics-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/08/ix-physics-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/09/ix-physics-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/ix-physics-past-year-paper-2015.html" },
    ],
  },

  // 2. CHEMISTRY
  {
    subject: "Chemistry",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Chemistry.pdf",
    chapters: [
      { number: 1, name: "Fundamentals of Chemistry" },
      { number: 2, name: "Atomic Structure" },
      { number: 3, name: "Periodic Table and Periodicity of Properties" },
      { number: 4, name: "Structure of Molecules" },
      { number: 5, name: "Physical States of Matter" },
      { number: 6, name: "Solutions" },
      { number: 7, name: "Electrochemistry" },
      { number: 8, name: "Chemical Reactivity" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/chemistry-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/chemistry-9th-past-year-paper-2024.html" },
    ],
  },

  // 3. BIOLOGY
  {
    subject: "Biology",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Biology.pdf",
    chapters: [
      { number: 1, name: "Introduction to Biology" },
      { number: 2, name: "Solving a Biological Problem" },
      { number: 3, name: "Biodiversity" },
      { number: 4, name: "Cells and Tissues" },
      { number: 5, name: "Cell Cycle" },
      { number: 6, name: "Enzymes" },
      { number: 7, name: "Bioenergetics" },
      { number: 8, name: "Nutrition" },
      { number: 9, name: "Transport" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/biology-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/biology-9th-past-year-paper-2024.html" },
    ],
  },

  // 4. COMPUTER SCIENCE
  {
    subject: "Computer Science",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Computer-Science.pdf",
    chapters: [
      { number: 1, name: "Fundamentals of Computer" },
      { number: 2, name: "Fundamentals of Operating System" },
      { number: 3, name: "Office Automation" },
      { number: 4, name: "Data Communication and Computer Networks" },
      { number: 5, name: "Computer Security and Ethics" },
      { number: 6, name: "Web Development" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/computer-science-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/computer-science-9th-past-year-paper-2024.html" },
    ],
  },

  // 5. MATHEMATICS
  {
    subject: "Mathematics",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Mathematics.pdf",
    chapters: [
      { number: 1, name: "Real and Complex Numbers" },
      { number: 2, name: "Logarithms" },
      { number: 3, name: "Algebraic Expressions and Formulas" },
      { number: 4, name: "Factorization" },
      { number: 5, name: "Algebraic Manipulation" },
      { number: 6, name: "Linear Equations and Inequalities" },
      { number: 7, name: "Linear Graphs and their Applications" },
      { number: 8, name: "Quadratic Equations" },
      { number: 9, name: "Congruent Triangles" },
      { number: 10, name: "Parallelograms and Triangles" },
      { number: 11, name: "Line Bisectors and Angle Bisectors" },
      { number: 12, name: "Sides and Angles of a Triangle" },
      { number: 13, name: "Practical Geometry - Triangles" },
      { number: 14, name: "Theorems Related with Area" },
      { number: 15, name: "Projection of a Side of a Triangle" },
      { number: 16, name: "Introduction to Coordinate Geometry" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/mathematics-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/mathematics-9th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/9th-mathematics-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/9th-mathematics-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/08/ix-mathematics-past-year-paper-2017.html" },
    ],
  },

  // 6. ENGLISH
  {
    subject: "English",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-English.pdf",
    chapters: [
      { number: 1, name: "The Last Sermon of the Holy Prophet (SAW)" },
      { number: 2, name: "Shah Abdul Latif Bhittai" },
      { number: 3, name: "The Neem Tree" },
      { number: 4, name: "Moen-jo-Daro" },
      { number: 5, name: "Helen Keller" },
      { number: 6, name: "The Daffodils" },
      { number: 7, name: "The Village Life" },
      { number: 8, name: "The Great Visionary - Quaid-e-Azam" },
      { number: 9, name: "Allama Iqbal" },
      { number: 10, name: "Grammar, Composition and Summary Writing" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/english-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/english-9th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/9th-english-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/9th-english-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/08/ix-english-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/09/ix-english-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/ix-english-past-year-paper-2015.html" },
    ],
  },

  // 7. PAKISTAN STUDIES
  {
    subject: "Pakistan Studies",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Pakistan-Studies.pdf",
    chapters: [
      { number: 1, name: "Ideological Basis of Pakistan" },
      { number: 2, name: "Making of Pakistan" },
      { number: 3, name: "Land and Climate of Pakistan" },
      { number: 4, name: "Resources of Pakistan" },
      { number: 5, name: "Industrial Development in Pakistan" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/pakistan-studies-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/pakistan-studies-9th-past-year-paper-2024.html" },
    ],
  },

  // 8. ISLAMIAT
  {
    subject: "Islamiat",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Islamiat.pdf",
    chapters: [
      { number: 1, name: "القرآن الکریم (سورۃ الانفال)" },
      { number: 2, name: "الحدیث النبوی الشریف" },
      { number: 3, name: "ایمانیات و عبادات" },
      { number: 4, name: "سیرت النبی ﷺ اور اخلاقیات" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/islamiat-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/islamiat-9th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/9th-islamiat-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/9th-islamiat-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/08/ix-islamiat-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/09/ix-islamiat-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/ix-islamiat-past-year-paper-2015.html" },
    ],
  },

  // 9. URDU
  {
    subject: "Urdu",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Urdu.pdf",
    chapters: [
      { number: 1, name: "حصہ نثر (اسباق و مقالات)" },
      { number: 2, name: "حصہ نظم (حمد، نعت اور نظمیں)" },
      { number: 3, name: "حصہ غزل" },
      { number: 4, name: "قواعد و انشاء" },
      { number: 5, name: "خطوط، کہانیاں اور مضامین" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/urdu-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/urdu-9th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/9th-urdu-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/9th-urdu-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/08/ix-urdu-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/09/ix-urdu-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/ix-urdu-past-year-paper-2015.html" },
    ],
  },

  // 10. SINDHI
  {
    subject: "Sindhi",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Sindhi.pdf",
    chapters: [
      { number: 1, name: "حمد، نعت ۽ مذهبي مضمون" },
      { number: 2, name: "قومي ۽ ادبي شخصيتون" },
      { number: 3, name: "سنڌي ٻولي ۽ تاريخ" },
      { number: 4, name: "نظم ۽ شاعري" },
      { number: 5, name: "سنڌي گرامر ۽ مضمون نگاري" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/02/sindhi-9th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/sindhi-9th-past-year-paper-2024.html" },
    ],
  },
];

function parseMarks(raw: any, defaultMarks: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(1, Math.round(raw));
  }
  if (typeof raw === "string") {
    const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(num)) {
      return Math.max(1, Math.round(num));
    }
  }
  return defaultMarks;
}

async function ensureSindhCurriculumAndChapters(subjectConfig: SubjectConfig): Promise<{
  curriculumId: string;
  chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>;
}> {
  console.log(`📚 Checking Sindh Board Class IX ${subjectConfig.subject} curriculum in DB...`);
  const { rows: existing } = await db.query(
    `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3 LIMIT 1`,
    ["IX", "Sindh Board", subjectConfig.subject]
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
        "IX",
        "Sindh Board",
        subjectConfig.subject,
        "",
        subjectConfig.pdfFileName,
        JSON.stringify({ totalChapters: subjectConfig.chapters.length, board: "Sindh Board" }),
      ]
    );
    console.log(`✨ Created new Sindh Board Class IX curriculum ID: ${curriculumId}`);
  }

  // Ensure all chapters exist
  for (const ch of subjectConfig.chapters) {
    const { rows: existingCh } = await db.query(
      `SELECT id FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2`,
      [curriculumId, ch.number]
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
          `Sindh Board Class IX ${subjectConfig.subject} Chapter ${ch.number}: ${ch.name}`,
        ]
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
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  const html = await res.text();
  const postBodyMatch = html.match(/<div class=["\x27]post-body[\s\S]*?<\/div>\s*<div class=["\x27]post-footer/i);
  const body = postBodyMatch ? postBodyMatch[0] : html;
  const imgs = [...body.matchAll(/<img[^>]+src=["\x27]([^"\x27]+)["\x27]/gi)].map((m) => m[1]);
  return [...new Set(imgs.map((u) => u.replace(/\/s\d+(-[a-z0-9]+)?\//i, "/s1600/")))].filter(
    (u) => !u.includes("Fill In The Blanks") && !u.includes("button") && !u.includes("badge") && !u.includes("ads")
  );
}

async function fetchImageBuffer(url: string, localCachePath: string): Promise<Buffer> {
  if (fs.existsSync(localCachePath)) {
    return fs.readFileSync(localCachePath);
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch image: ${url} (HTTP ${res.status})`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(localCachePath), { recursive: true });
      fs.writeFileSync(localCachePath, buf);
      return buf;
    } catch (err: any) {
      if (attempt === 3) throw err;
      console.warn(`⚠️ Fetch attempt ${attempt} failed for ${url}: ${err.message}. Retrying...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw new Error(`Failed to fetch image after 3 attempts: ${url}`);
}

function matchChapter(
  suggestedChapter: string | undefined,
  chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>
): { id: string | null; name: string | null } {
  if (!suggestedChapter) {
    return chapters.length > 0 ? { id: chapters[0].id, name: chapters[0].chapter_name } : { id: null, name: null };
  }
  const lower = suggestedChapter.toLowerCase();

  const match = chapters.find(
    (ch) =>
      ch.chapter_name.toLowerCase() === lower ||
      ch.chapter_name.toLowerCase().includes(lower) ||
      lower.includes(ch.chapter_name.toLowerCase())
  );
  if (match) return { id: match.id, name: match.chapter_name };

  const words = lower.split(/\s+/).filter((w) => w.length > 3);
  for (const w of words) {
    const wordMatch = chapters.find((ch) => ch.chapter_name.toLowerCase().includes(w));
    if (wordMatch) return { id: wordMatch.id, name: wordMatch.chapter_name };
  }

  return chapters.length > 0 ? { id: chapters[0].id, name: chapters[0].chapter_name } : { id: null, name: suggestedChapter };
}

export async function importSubjectIX(subjectName: string, options: { force?: boolean; yearFilter?: number }) {
  const subjectConfig = CLASS_IX_SINDH_SUBJECTS.find((s) => s.subject.toLowerCase() === subjectName.toLowerCase());
  if (!subjectConfig) {
    console.error(`❌ Subject "${subjectName}" not found in Class IX configuration.`);
    return;
  }

  console.log(`\n==========================================================================`);
  console.log(`🚀 INGESTING SINDH BOARD CLASS IX ${subjectConfig.subject.toUpperCase()}`);
  console.log(`==========================================================================\n`);

  const { chapters } = await ensureSindhCurriculumAndChapters(subjectConfig);

  const { rows: adminRows } = await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
  const adminId = adminRows.length > 0 ? adminRows[0].id : null;

  let posts = subjectConfig.posts || [];
  try {
    const verifiedPath = path.join(__dirname, "verified_urls.json");
    if (fs.existsSync(verifiedPath)) {
      const verified = JSON.parse(fs.readFileSync(verifiedPath, "utf8"));
      if (verified.ix && verified.ix[subjectConfig.subject] && verified.ix[subjectConfig.subject].length > 0) {
        posts = verified.ix[subjectConfig.subject];
      }
    }
  } catch {}

  const targetPosts = options.yearFilter
    ? posts.filter((p: any) => p.year === options.yearFilter)
    : posts;

  console.log(`Found ${targetPosts.length} papers to process for ${subjectConfig.subject}.\n`);

  for (let idx = 0; idx < targetPosts.length; idx++) {
    const post = targetPosts[idx];
    const year = post.year;
    console.log(`--------------------------------------------------------------------------`);
    console.log(`📄 [${idx + 1}/${targetPosts.length}] Processing ${subjectConfig.subject} - Year ${year}`);
    console.log(`--------------------------------------------------------------------------`);

    const cacheDir = path.join(
      process.cwd(),
      "pastpapers",
      "sindh_board",
      "Class_IX",
      subjectConfig.subject.replace(/\s+/g, "_"),
      String(year)
    );

    // Check if already processed
    const { rows: p1Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp
       LEFT JOIN questions q ON q.past_paper_id = pp.id
       WHERE pp.class = 'IX' AND pp.board = 'Sindh Board' AND pp.subject = $1 AND pp.year = $2 AND pp.paper_number = 1
       GROUP BY pp.id`,
      [subjectConfig.subject, year]
    );
    const { rows: p2Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp
       LEFT JOIN questions q ON q.past_paper_id = pp.id
       WHERE pp.class = 'IX' AND pp.board = 'Sindh Board' AND pp.subject = $1 AND pp.year = $2 AND pp.paper_number = 2
       GROUP BY pp.id`,
      [subjectConfig.subject, year]
    );

    const p1Done = p1Check.length > 0 && Number(p1Check[0].qcount) > 0;
    const p2Done = p2Check.length > 0 && Number(p2Check[0].qcount) > 0;

    if (p1Done && p2Done && !options.force) {
      console.log(`⏩ Year ${year} (Paper 1: ${p1Check[0].qcount} Qs, Paper 2: ${p2Check[0].qcount} Qs) already complete in DB. Skipping.`);
      continue;
    }

    console.log(`🌐 Fetching images from: ${post.postUrl}...`);
    let imageUrls: string[] = [];
    try {
      imageUrls = await getPostImages(post.postUrl);
      console.log(`   Found ${imageUrls.length} page images for ${year}.`);
    } catch (e: any) {
      console.error(`❌ Failed to fetch page: ${e.message}`);
      continue;
    }

    if (imageUrls.length === 0) {
      console.warn(`⚠️ No images found for ${year}. Skipping.`);
      continue;
    }

    // ==========================================
    // 1. PAPER 1 (SECTION A - MCQs)
    // ==========================================
    try {
      console.log(`📥 Downloading Section A (MCQs) image...`);
      const mcqBuf = await fetchImageBuffer(imageUrls[0], path.join(cacheDir, `mcq_1.png`));

      console.log(`🔍 Extracting Paper 1 MCQs with Gemini Vision...`);
      const mcqs = await extractSindhPaper1MCQs([mcqBuf], {
        classVal: "IX",
        subject: subjectConfig.subject,
        year,
      });
      console.log(`✅ Extracted ${mcqs.length} MCQs for ${year} Paper 1.`);

      const { rows: existingP1 } = await db.query(
        `SELECT id FROM past_papers WHERE class = 'IX' AND board = 'Sindh Board' AND subject = $1 AND year = $2 AND paper_number = 1`,
        [subjectConfig.subject, year]
      );

      let p1Id = existingP1[0]?.id;
      if (existingP1.length > 0) {
        console.log(`   - Updating existing Paper 1 record: ${p1Id}`);
        await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [p1Id]);
        await db.query(`UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`, [
          mcqs.length,
          p1Id,
        ]);
      } else {
        p1Id = randomUUID();
        await db.query(
          `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by, created_at, updated_at)
           VALUES ($1, 'IX', 'Sindh Board', $2, $3, 1, '', $4, $5, 'COMPLETED', $6, NOW(), NOW())`,
          [p1Id, subjectConfig.subject, year, `SindhBoard-IX-${subjectConfig.subject}-${year}-Paper1`, mcqs.length, adminId]
        );
        console.log(`   - Created new Paper 1 record: ${p1Id}`);
      }

      // Insert MCQs
      for (const q of mcqs) {
        const qId = randomUUID();
        const ch = matchChapter(q.suggestedChapter, chapters);
        const mcqData = JSON.stringify({
          options: q.mcqOptions,
          correctAnswer: q.correctAnswer,
        });
        const qText = (q.questionText || (q as any).text || (q as any).question || "").trim() || `Question ${q.questionNumber || "N/A"}`;

        await db.query(
          `INSERT INTO questions (
            id, past_paper_id, question_number, question_part, question_text,
            question_type, chapter_id, chapter_name, marks, is_verified, verified_by, mcq_data
          ) VALUES ($1, $2, $3, NULL, $4, 'MCQ', $5, $6, $7, true, $8, $9)`,
          [
            qId,
            p1Id,
            q.questionNumber,
            qText,
            ch.id,
            ch.name,
            parseMarks(q.marks, 1),
            adminId,
            mcqData,
          ]
        );
      }
      console.log(`💾 Saved ${mcqs.length} MCQs to database for Paper 1 (${year}).`);
    } catch (err: any) {
      console.error(`❌ Failed to extract/save Paper 1 for ${year}:`, err.message || err);
    }

    // Cooldown before Theory extraction
    await new Promise((r) => setTimeout(r, 4000));

    // ==========================================
    // 2. PAPER 2 (SECTION B & SECTION C - THEORY)
    // ==========================================
    const theoryUrls = imageUrls.length > 1 ? imageUrls.slice(1) : imageUrls;
    if (theoryUrls.length > 0) {
      try {
        console.log(`\n📥 Downloading Section B & C (${theoryUrls.length} Theory images)...`);
        const theoryBuffers: Buffer[] = [];
        for (let i = 0; i < theoryUrls.length; i++) {
          theoryBuffers.push(await fetchImageBuffer(theoryUrls[i], path.join(cacheDir, `theory_${i + 1}.png`)));
        }

        console.log(`🔍 Extracting Paper 2 (Short QnA & Long QnA) with Gemini Vision...`);
        const theoryQuestions = await extractSindhPaper2Theory(theoryBuffers, {
          classVal: "IX",
          subject: subjectConfig.subject,
          year,
        });
        console.log(`✅ Extracted ${theoryQuestions.length} Theory questions for ${year} Paper 2.`);

        const { rows: existingP2 } = await db.query(
          `SELECT id FROM past_papers WHERE class = 'IX' AND board = 'Sindh Board' AND subject = $1 AND year = $2 AND paper_number = 2`,
          [subjectConfig.subject, year]
        );

        let p2Id = existingP2[0]?.id;
        if (existingP2.length > 0) {
          console.log(`   - Updating existing Paper 2 record: ${p2Id}`);
          await db.query(`DELETE FROM questions WHERE past_paper_id = $1`, [p2Id]);
          await db.query(`UPDATE past_papers SET total_questions = $1, status = 'COMPLETED', updated_at = NOW() WHERE id = $2`, [
            theoryQuestions.length,
            p2Id,
          ]);
        } else {
          p2Id = randomUUID();
          await db.query(
            `INSERT INTO past_papers (id, class, board, subject, year, paper_number, file_url, file_name, total_questions, status, uploaded_by, created_at, updated_at)
             VALUES ($1, 'IX', 'Sindh Board', $2, $3, 2, '', $4, $5, 'COMPLETED', $6, NOW(), NOW())`,
            [p2Id, subjectConfig.subject, year, `SindhBoard-IX-${subjectConfig.subject}-${year}-Paper2`, theoryQuestions.length, adminId]
          );
          console.log(`   - Created new Paper 2 record: ${p2Id}`);
        }

        // Insert Theory Questions
        for (const q of theoryQuestions) {
          const qId = randomUUID();
          const ch = matchChapter(q.suggestedChapter, chapters);
          const qText = (q.questionText || (q as any).text || (q as any).question || "").trim() || `Question ${q.questionNumber || "N/A"}`;

          await db.query(
            `INSERT INTO questions (
              id, past_paper_id, question_number, question_part, question_text,
              question_type, chapter_id, chapter_name, marks, is_verified, verified_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)`,
            [
              qId,
              p2Id,
              q.questionNumber,
              q.questionPart || null,
              qText,
              q.questionType || "CRQ",
              ch.id,
              ch.name,
              parseMarks(q.marks, q.questionType === "ERQ" ? 8 : 4),
              adminId,
            ]
          );
        }
        console.log(`💾 Saved ${theoryQuestions.length} Theory questions to database for Paper 2 (${year}).`);
      } catch (err: any) {
        console.error(`❌ Failed to extract/save Paper 2 for ${year}:`, err.message || err);
      }
    }

    // Cooldown between years
    if (idx < targetPosts.length - 1) {
      console.log(`\n⏳ Cooling down for 4s before next year...`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  console.log(`\n🏁 Completed processing Class IX ${subjectConfig.subject}!`);
}

async function main() {
  const args = process.argv.slice(2);
  const subjectArg = args.find((a) => a.startsWith("--subject="))?.split("=")[1] || (args.includes("--all") ? "all" : "Physics");
  const force = args.includes("--force");
  const yearFilter = parseInt(args.find((a) => a.startsWith("--year="))?.split("=")[1] || "0", 10) || undefined;

  if (subjectArg === "all") {
    for (const sub of CLASS_IX_SINDH_SUBJECTS) {
      await importSubjectIX(sub.subject, { force, yearFilter });
      console.log(`\n⏳ Cooling down for 6s before next subject...\n`);
      await new Promise((r) => setTimeout(r, 6000));
    }
  } else {
    await importSubjectIX(subjectArg, { force, yearFilter });
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✨ Done with Class IX past papers!");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
