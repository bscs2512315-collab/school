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

export const CLASS_XI_SINDH_SUBJECTS: SubjectConfig[] = [
  // 1. PHYSICS
  {
    subject: "Physics",
    pdfFileName: "Sindh-Textbook-Board-Class-XI-Physics.pdf",
    chapters: [
      { number: 1, name: "Measurements" },
      { number: 2, name: "Vectors and Equilibrium" },
      { number: 3, name: "Motion and Force" },
      { number: 4, name: "Work, Energy and Power" },
      { number: 5, name: "Circular Motion" },
      { number: 6, name: "Fluid Dynamics" },
      { number: 7, name: "Oscillations" },
      { number: 8, name: "Waves" },
      { number: 9, name: "Physical Optics" },
      { number: 10, name: "Thermodynamics" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/physics-past-year-paper-2025-for-class-11th.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/physics-11th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-physics-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-physics-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-physics-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-physics-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-physics-past-year-paper-2015.html" },
    ],
  },

  // 2. CHEMISTRY
  {
    subject: "Chemistry",
    pdfFileName: "Sindh-Textbook-Board-Class-XI-Chemistry.pdf",
    chapters: [
      { number: 1, name: "Introduction to Fundamental Concepts of Chemistry" },
      { number: 2, name: "Atomic Structure" },
      { number: 3, name: "Theories of Covalent Bonding and Shapes of Molecules" },
      { number: 4, name: "States of Matter I: Gases" },
      { number: 5, name: "States of Matter II: Liquids" },
      { number: 6, name: "States of Matter III: Solids" },
      { number: 7, name: "Chemical Equilibrium" },
      { number: 8, name: "Acids, Bases and Salts" },
      { number: 9, name: "Chemical Kinetics" },
      { number: 10, name: "Solutions and Colloids" },
      { number: 11, name: "Thermochemistry" },
      { number: 12, name: "Electrochemistry" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/chemistry-past-year-paper-2025-for-class-11th.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/chemistry-11th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-chemistry-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-chemistry-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-chemistry-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-chemistry-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-chemistry-past-year-paper-2015.html" },
    ],
  },

  // 3. COMPUTER SCIENCE
  {
    subject: "Computer Science",
    pdfFileName: "Sindh-Textbook-Board-Class-XI-Computer-Science.pdf",
    chapters: [
      { number: 1, name: "Basics of Information Technology" },
      { number: 2, name: "Information Networks" },
      { number: 3, name: "Data Communication" },
      { number: 4, name: "Applications and Uses of Computers" },
      { number: 5, name: "Computer Architecture & Logic Gates" },
      { number: 6, name: "Security, Copyright and the Law" },
      { number: 7, name: "Windows & Operating Systems" },
      { number: 8, name: "Word Processing & Spreadsheets" },
      { number: 9, name: "Fundamentals of the Internet" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/computer-science-past-year-paper-2025-for-class-11th.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/computer-science-11th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-computer-science-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-computer-science-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-computer-science-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-computer-science-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-computer-science-past-year-paper-2015.html" },
    ],
  },

  // 4. BOTANY (BIOLOGY)
  {
    subject: "Botany",
    pdfFileName: "Sindh-Textbook-Board-Class-XI-Botany.pdf",
    chapters: [
      { number: 1, name: "Cell Structure and Function" },
      { number: 2, name: "Biological Molecules" },
      { number: 3, name: "Enzymes" },
      { number: 4, name: "Bioenergetics" },
      { number: 5, name: "Acellular Life (Viruses)" },
      { number: 6, name: "Prokaryotes (Bacteria)" },
      { number: 7, name: "Diversity of Plants (Kingdom Plantae)" },
      { number: 8, name: "Forms and Functions in Plants" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/botany-past-year-paper-2025-for-class-11th.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/botany-11th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-botany-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-botany-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-botany-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-botany-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-botany-past-year-paper-2015.html" },
    ],
  },

  // 5. ZOOLOGY (BIOLOGY)
  {
    subject: "Zoology",
    pdfFileName: "Sindh-Textbook-Board-Class-XI-Zoology.pdf",
    chapters: [
      { number: 1, name: "Kingdom Animalia (Invertebrates & Chordates)" },
      { number: 2, name: "Nutrition and Digestion" },
      { number: 3, name: "Gas Exchange and Respiration" },
      { number: 4, name: "Transport and Circulation" },
      { number: 5, name: "Immunity and Disease Defense" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/zoology-past-year-paper-2025-for-class-11th.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/zoology-11th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-zoology-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-zoology-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-zoology-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-zoology-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-zoology-past-year-paper-2015.html" },
    ],
  },

  // 6. ENGLISH
  {
    subject: "English",
    pdfFileName: "Sindh-Textbook-Board-Class-XI-English.pdf",
    chapters: [
      { number: 1, name: "Reading Comprehension & Prose Lessons" },
      { number: 2, name: "Poetry & Literary Appreciation" },
      { number: 3, name: "Grammar, Tenses & Vocabulary" },
      { number: 4, name: "Essay, Letters & Formal Composition" },
      { number: 5, name: "Summary Writing & Translation" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/english-past-year-paper-2025-for-class-11th.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/english-11th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-english-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-english-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-english-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-english-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-english-past-year-paper-2015.html" },
    ],
  },

  // 7. ISLAMIAT
  {
    subject: "Islamiat",
    pdfFileName: "Sindh-Textbook-Board-Class-XI-Islamiat.pdf",
    chapters: [
      { number: 1, name: "Al-Quran & Surahs" },
      { number: 2, name: "Hadith-e-Nabvi (SAW)" },
      { number: 3, name: "Basic Beliefs and Worships (Aqaid-o-Ibadat)" },
      { number: 4, name: "Uswa-e-Hasana (Life of Holy Prophet SAW)" },
      { number: 5, name: "Islamic Culture, Values & Human Rights" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/islamiat-urdu-past-year-paper-2025-for-class-11th.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/islamiat-urdu-11th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-islamiat-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-islamiat-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-islamiat-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-islamiat-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-islamiat-past-year-paper-2015.html" },
    ],
  },

  // 8. URDU
  {
    subject: "Urdu",
    pdfFileName: "Sindh-Textbook-Board-Class-XI-Urdu.pdf",
    chapters: [
      { number: 1, name: "Hissa-e-Nasar (Prose)" },
      { number: 2, name: "Hissa-e-Nazm (Poetry)" },
      { number: 3, name: "Hissa-e-Ghazal (Ghazaliat)" },
      { number: 4, name: "Urdu Qawaid (Grammar & Rhetoric)" },
      { number: 5, name: "Mazmoon Nigari, Khatoot & Khulasa Nigari" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/urdu-past-year-paper-2025-for-class-11th.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2024/12/urdu-11th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/11th-urdu-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/11th-urdu-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xi-urdu-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xi-urdu-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xi-urdu-past-year-paper-2015.html" },
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
  console.log(`📚 Checking Sindh Board Class XI ${subjectConfig.subject} curriculum in DB...`);
  const { rows: existing } = await db.query(
    `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3 LIMIT 1`,
    ["XI", "Sindh Board", subjectConfig.subject]
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
        subjectConfig.subject,
        "",
        subjectConfig.pdfFileName,
        JSON.stringify({ totalChapters: subjectConfig.chapters.length, board: "Sindh Board" }),
      ]
    );
    console.log(`✨ Created new Sindh Board curriculum ID: ${curriculumId}`);
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
          `Sindh Board Class XI ${subjectConfig.subject} Chapter ${ch.number}: ${ch.name}`,
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

export async function importSubjectXI(subjectName: string, options: { force?: boolean; yearFilter?: number }) {
  const subjectConfig = CLASS_XI_SINDH_SUBJECTS.find((s) => s.subject.toLowerCase() === subjectName.toLowerCase());
  if (!subjectConfig) {
    console.error(`❌ Subject "${subjectName}" not found in Class XI configuration.`);
    return;
  }

  console.log(`\n==========================================================================`);
  console.log(`🚀 INGESTING SINDH BOARD CLASS XI ${subjectConfig.subject.toUpperCase()}`);
  console.log(`==========================================================================\n`);

  const { chapters } = await ensureSindhCurriculumAndChapters(subjectConfig);

  const { rows: adminRows } = await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
  const adminId = adminRows[0]?.id || null;

  const targetPosts = options.yearFilter
    ? subjectConfig.posts.filter((p) => p.year === options.yearFilter)
    : subjectConfig.posts;

  for (let idx = 0; idx < targetPosts.length; idx++) {
    const post = targetPosts[idx];
    const year = post.year;
    console.log(`\n--------------------------------------------------------------------------`);
    console.log(`▶️  [${idx + 1}/${targetPosts.length}] Processing Class XI ${subjectConfig.subject} (${year})`);
    console.log(`--------------------------------------------------------------------------`);

    const cacheDir = path.resolve(process.cwd(), `pastpapers/sindh_board/XI/${subjectConfig.subject}/${year}`);

    // Check if both Paper 1 & Paper 2 already exist with questions
    const { rows: p1Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp 
       LEFT JOIN questions q ON q.past_paper_id = pp.id 
       WHERE pp.class = 'XI' AND pp.board = 'Sindh Board' AND pp.subject = $1 AND pp.year = $2 AND pp.paper_number = 1
       GROUP BY pp.id`,
      [subjectConfig.subject, year]
    );
    const { rows: p2Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp 
       LEFT JOIN questions q ON q.past_paper_id = pp.id 
       WHERE pp.class = 'XI' AND pp.board = 'Sindh Board' AND pp.subject = $1 AND pp.year = $2 AND pp.paper_number = 2
       GROUP BY pp.id`,
      [subjectConfig.subject, year]
    );

    const p1Done = p1Check.length > 0 && parseInt(p1Check[0].qcount, 10) > 0;
    const p2Done = p2Check.length > 0 && parseInt(p2Check[0].qcount, 10) > 0;

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
        classVal: "XI",
        subject: subjectConfig.subject,
        year,
      });
      console.log(`✅ Extracted ${mcqs.length} MCQs for ${year} Paper 1.`);

      const { rows: existingP1 } = await db.query(
        `SELECT id FROM past_papers WHERE class = 'XI' AND board = 'Sindh Board' AND subject = $1 AND year = $2 AND paper_number = 1`,
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
           VALUES ($1, 'XI', 'Sindh Board', $2, $3, 1, '', $4, $5, 'COMPLETED', $6, NOW(), NOW())`,
          [p1Id, subjectConfig.subject, year, `SindhBoard-XI-${subjectConfig.subject}-${year}-Paper1`, mcqs.length, adminId]
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
          [qId, p1Id, q.questionNumber, qText, ch.id, ch.name, parseMarks(q.marks, 1), adminId, mcqData]
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
          classVal: "XI",
          subject: subjectConfig.subject,
          year,
        });
        console.log(`✅ Extracted ${theoryQuestions.length} Theory questions for ${year} Paper 2.`);

        const { rows: existingP2 } = await db.query(
          `SELECT id FROM past_papers WHERE class = 'XI' AND board = 'Sindh Board' AND subject = $1 AND year = $2 AND paper_number = 2`,
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
             VALUES ($1, 'XI', 'Sindh Board', $2, $3, 2, '', $4, $5, 'COMPLETED', $6, NOW(), NOW())`,
            [p2Id, subjectConfig.subject, year, `SindhBoard-XI-${subjectConfig.subject}-${year}-Paper2`, theoryQuestions.length, adminId]
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

  console.log(`\n🏁 Completed processing Class XI ${subjectConfig.subject}!`);
}

async function main() {
  const args = process.argv.slice(2);
  const subjectArg = args.find((a) => a.startsWith("--subject="))?.split("=")[1] || (args.includes("--all") ? "all" : "Physics");
  const force = args.includes("--force");
  const yearFilter = parseInt(args.find((a) => a.startsWith("--year="))?.split("=")[1] || "0", 10) || undefined;

  if (subjectArg === "all") {
    for (const sub of CLASS_XI_SINDH_SUBJECTS) {
      await importSubjectXI(sub.subject, { force, yearFilter });
      console.log(`\n⏳ Cooling down for 6s before next subject...\n`);
      await new Promise((r) => setTimeout(r, 6000));
    }
  } else {
    await importSubjectXI(subjectArg, { force, yearFilter });
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal import error:", err);
    process.exit(1);
  });
}
