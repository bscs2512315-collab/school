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

export const CLASS_XII_SINDH_SUBJECTS: SubjectConfig[] = [
  // 1. MATHEMATICS
  {
    subject: "Mathematics",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Mathematics.pdf",
    chapters: [
      { number: 1, name: "Functions and Limits" },
      { number: 2, name: "The Derivative / Differentiation" },
      { number: 3, name: "Higher Order Derivatives and Applications" },
      { number: 4, name: "Differentiation of Vector Functions" },
      { number: 5, name: "Integration / Indefinite and Definite Integrals" },
      { number: 6, name: "Plane Analytic Geometry - Straight Line" },
      { number: 7, name: "The Circle" },
      { number: 8, name: "Parabola, Ellipse and Hyperbola (Conics)" },
      { number: 9, name: "Vectors and Coordinate Geometry in 3D" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/mathematics-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/mathematics-12th-past-year-paper-2024.html" },
      { year: 2023, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/mathematics-12th-past-year-paper-2023.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-mathematics-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-mathematics-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-mathematics-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-mathematics-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-mathematics-past-year-paper-2015.html" },
    ],
  },

  // 2. PHYSICS
  {
    subject: "Physics",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Physics.pdf",
    chapters: [
      { number: 1, name: "Heat and Thermodynamics" },
      { number: 2, name: "Electrostatics" },
      { number: 3, name: "Current Electricity" },
      { number: 4, name: "Magnetism and Electromagnetism" },
      { number: 5, name: "Electrical Measuring Instruments" },
      { number: 6, name: "Electromagnetic Waves and Electronics" },
      { number: 7, name: "Advent of Modern Physics" },
      { number: 8, name: "The Atomic Spectra" },
      { number: 9, name: "The Atomic Nucleus" },
      { number: 10, name: "Nuclear Radiations" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/physics-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/physics-12th-past-year-paper-2024.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-physics-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-physics-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-physics-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-physics-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-physics-past-year-paper-2015.html" },
    ],
  },

  // 3. CHEMISTRY
  {
    subject: "Chemistry",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Chemistry.pdf",
    chapters: [
      { number: 1, name: "Periodic Classification of Elements and Periodicity" },
      { number: 2, name: "Hydrogen Chemistry" },
      { number: 3, name: "S-Block Elements" },
      { number: 4, name: "P-Block Elements" },
      { number: 5, name: "D-Block Elements (Transition Elements)" },
      { number: 6, name: "Introduction to Organic Chemistry" },
      { number: 7, name: "Chemistry of Hydrocarbons" },
      { number: 8, name: "Alkyl Halides" },
      { number: 9, name: "Carbon Compounds With Oxygen Containing Functional Groups" },
      { number: 10, name: "Chemistry of Life (Biochemistry)" },
      { number: 11, name: "Chemical Industries in Pakistan" },
      { number: 12, name: "Environmental Chemistry & Scientific Reasons" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/chemistry-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/chemistry-12th-past-year-paper-2024.html" },
      { year: 2023, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/chemistry-12th-past-year-paper-2023.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-chemistry-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-chemistry-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-chemistry-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-chemistry-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-chemistry-past-year-paper-2015.html" },
    ],
  },

  // 4. BOTANY
  {
    subject: "Botany",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Botany.pdf",
    chapters: [
      { number: 1, name: "Homeostasis in Plants" },
      { number: 2, name: "Support and Movement in Plants" },
      { number: 3, name: "Coordination and Control in Plants" },
      { number: 4, name: "Reproduction in Plants" },
      { number: 5, name: "Growth and Development in Plants" },
      { number: 6, name: "Chromosomes and DNA" },
      { number: 7, name: "Biotechnology & Genetic Engineering" },
      { number: 8, name: "Ecosystems and Environmental Biology" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/botany-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/botany-12th-past-year-paper-2024.html" },
      { year: 2023, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/botany-12th-past-year-paper-2023.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-botany-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-botany-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-botany-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-botany-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-botany-past-year-paper-2015.html" },
    ],
  },

  // 5. ZOOLOGY
  {
    subject: "Zoology",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Zoology.pdf",
    chapters: [
      { number: 1, name: "Homeostasis (Osmoregulation & Excretion)" },
      { number: 2, name: "Support and Movement" },
      { number: 3, name: "Nervous and Chemical Coordination" },
      { number: 4, name: "Animal Reproduction" },
      { number: 5, name: "Development and Aging" },
      { number: 6, name: "Chromosomes, Genes and Inheritance" },
      { number: 7, name: "Evolution" },
      { number: 8, name: "Man and His Environment" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/zoology-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/zoology-12th-past-year-paper-2024.html" },
      { year: 2023, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/zoology-12th-past-year-paper-2023.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-zoology-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-zoology-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-zoology-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-zoology-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-zoology-past-year-paper-2015.html" },
    ],
  },

  // 6. COMPUTER SCIENCE
  {
    subject: "Computer Science",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Computer-Science.pdf",
    chapters: [
      { number: 1, name: "Overview of Operating Systems" },
      { number: 2, name: "Programming Concepts & C Language Basics" },
      { number: 3, name: "Control Structures in C (Conditionals & Loops)" },
      { number: 4, name: "Functions & Modular Programming" },
      { number: 5, name: "Arrays and Strings in C" },
      { number: 6, name: "Structures and Unions" },
      { number: 7, name: "Pointers and File Handling in C" },
      { number: 8, name: "Introduction to Object Oriented Programming" },
      { number: 9, name: "Database Management Systems (DBMS) & SQL" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/computer-science-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/computer-science-12th-past-year-paper-2024.html" },
      { year: 2023, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/computer-science-12th-past-year-paper-2023.html" },
      { year: 2022, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/computer-science-12th-past-year-paper-2022.html" },
      { year: 2021, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/computer-science-12th-past-year-paper-2021.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-computer-science-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-computer-science-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-computer-science-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-computer-science-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-computer-science-past-year-paper-2015.html" },
    ],
  },

  // 7. ENGLISH
  {
    subject: "English",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-English.pdf",
    chapters: [
      { number: 1, name: "Twenty Minutes with Mrs. Oakentubb" },
      { number: 2, name: "Reflections on the Re-Awakening of the East" },
      { number: 3, name: "The Day the Dam Broke" },
      { number: 4, name: "Pakistan and the Modern World" },
      { number: 5, name: "Act III of the Silver Box" },
      { number: 6, name: "The World As I See It" },
      { number: 7, name: "The Devoted Friend" },
      { number: 8, name: "Selections from English Verse (Poems)" },
      { number: 9, name: "The Prisoner of Zenda (Novel & Characters)" },
      { number: 10, name: "Grammar, Composition, Essays and Letters" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/english-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/english-12th-past-year-paper-2024.html" },
      { year: 2023, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/english-12th-past-year-paper-2023.html" },
      { year: 2022, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/english-12th-past-year-paper-2022.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-english-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-english-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-english-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-english-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-english-past-year-paper-2015.html" },
    ],
  },

  // 8. PAKISTAN STUDIES
  {
    subject: "Pakistan Studies",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Pakistan-Studies.pdf",
    chapters: [
      { number: 1, name: "Ideological Basis of Pakistan (نظریہ پاکستان کی اساس)" },
      { number: 2, name: "Making of Pakistan & Early Problems (قیام پاکستان)" },
      { number: 3, name: "Constitutional Development (آئینی ارتقاء)" },
      { number: 4, name: "Land, Climate and Resources of Pakistan (زمین، موسم اور وسائل)" },
      { number: 5, name: "Economic and Industrial Development (معاشی ترقی)" },
      { number: 6, name: "Culture and Society of Pakistan (پاکستانی ثقافت)" },
      { number: 7, name: "Foreign Policy and International Relations (خارجہ پالیسی)" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/pakistan-studies-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/pakistan-studies-12th-past-year-paper-2024.html" },
      { year: 2023, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/pakistan-studies-12th-past-year-paper-2023.html" },
      { year: 2022, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/pakistan-studies-12th-past-year-paper-2022.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-pakistan-studies-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-pakistan-studies-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-pakistan-studies-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-pakistan-studies-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-pakistan-studies-past-year-paper-2015.html" },
    ],
  },

  // 9. URDU
  {
    subject: "Urdu",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Urdu.pdf",
    chapters: [
      { number: 1, name: "حصہ نثر (اسباق، مضامین اور مقالات)" },
      { number: 2, name: "حصہ نظم (حمد، نعت، نظمیں اور مثنوی)" },
      { number: 3, name: "حصہ غزل (کلاسیکی و جدید اردو غزلیں)" },
      { number: 4, name: "قواعد و انشاء، اصناف ادب اور تلخیص" },
      { number: 5, name: "خطوط نویسی اور مضمون نگاری" },
    ],
    posts: [
      { year: 2025, postUrl: "https://adamjeecoaching.blogspot.com/2026/04/urdu-12th-past-year-paper-2025.html" },
      { year: 2024, postUrl: "https://adamjeecoaching.blogspot.com/2025/04/urdu-12th-past-year-paper-2024.html" },
      { year: 2023, postUrl: "https://adamjeecoaching.blogspot.com/2025/02/urdu-12th-past-year-paper-2023.html" },
      { year: 2019, postUrl: "https://adamjeecoaching.blogspot.com/2019/08/12th-urdu-past-year-paper-2019.html" },
      { year: 2018, postUrl: "https://adamjeecoaching.blogspot.com/2018/08/12th-urdu-past-year-paper-2018.html" },
      { year: 2017, postUrl: "https://adamjeecoaching.blogspot.com/2017/09/xii-urdu-past-year-paper-2017.html" },
      { year: 2016, postUrl: "https://adamjeecoaching.blogspot.com/2016/10/xii-urdu-past-year-paper-2016.html" },
      { year: 2015, postUrl: "https://adamjeecoaching.blogspot.com/2015/09/xii-urdu-past-year-paper-2015.html" },
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
  console.log(`📚 Checking Sindh Board Class XII ${subjectConfig.subject} curriculum in DB...`);
  const { rows: existing } = await db.query(
    `SELECT id FROM curriculums WHERE class = $1 AND board = $2 AND subject = $3 LIMIT 1`,
    ["XII", "Sindh Board", subjectConfig.subject]
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
        "XII",
        "Sindh Board",
        subjectConfig.subject,
        "",
        subjectConfig.pdfFileName,
        JSON.stringify({ totalChapters: subjectConfig.chapters.length, board: "Sindh Board" }),
      ]
    );
    console.log(`✨ Created new Sindh Board Class XII curriculum ID: ${curriculumId}`);
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
          `Sindh Board Class XII ${subjectConfig.subject} Chapter ${ch.number}: ${ch.name}`,
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

export async function importSubjectXII(subjectName: string, options: { force?: boolean; yearFilter?: number }) {
  const subjectConfig = CLASS_XII_SINDH_SUBJECTS.find((s) => s.subject.toLowerCase() === subjectName.toLowerCase());
  if (!subjectConfig) {
    console.error(`❌ Subject "${subjectName}" not found in Class XII configuration.`);
    return;
  }

  console.log(`\n==========================================================================`);
  console.log(`🚀 INGESTING SINDH BOARD CLASS XII ${subjectConfig.subject.toUpperCase()}`);
  console.log(`==========================================================================\n`);

  const { chapters } = await ensureSindhCurriculumAndChapters(subjectConfig);

  const { rows: adminRows } = await db.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
  const adminId = adminRows.length > 0 ? adminRows[0].id : null;

  const targetPosts = options.yearFilter
    ? subjectConfig.posts.filter((p) => p.year === options.yearFilter)
    : subjectConfig.posts;

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
      "Class_XII",
      subjectConfig.subject.replace(/\s+/g, "_"),
      String(year)
    );

    // Check if already processed
    const { rows: p1Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp
       LEFT JOIN questions q ON q.past_paper_id = pp.id
       WHERE pp.class = 'XII' AND pp.board = 'Sindh Board' AND pp.subject = $1 AND pp.year = $2 AND pp.paper_number = 1
       GROUP BY pp.id`,
      [subjectConfig.subject, year]
    );
    const { rows: p2Check } = await db.query(
      `SELECT pp.id, COUNT(q.id) as qcount FROM past_papers pp
       LEFT JOIN questions q ON q.past_paper_id = pp.id
       WHERE pp.class = 'XII' AND pp.board = 'Sindh Board' AND pp.subject = $1 AND pp.year = $2 AND pp.paper_number = 2
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
        classVal: "XII",
        subject: subjectConfig.subject,
        year,
      });
      console.log(`✅ Extracted ${mcqs.length} MCQs for ${year} Paper 1.`);

      const { rows: existingP1 } = await db.query(
        `SELECT id FROM past_papers WHERE class = 'XII' AND board = 'Sindh Board' AND subject = $1 AND year = $2 AND paper_number = 1`,
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
           VALUES ($1, 'XII', 'Sindh Board', $2, $3, 1, '', $4, $5, 'COMPLETED', $6, NOW(), NOW())`,
          [p1Id, subjectConfig.subject, year, `SindhBoard-XII-${subjectConfig.subject}-${year}-Paper1`, mcqs.length, adminId]
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
          classVal: "XII",
          subject: subjectConfig.subject,
          year,
        });
        console.log(`✅ Extracted ${theoryQuestions.length} Theory questions for ${year} Paper 2.`);

        const { rows: existingP2 } = await db.query(
          `SELECT id FROM past_papers WHERE class = 'XII' AND board = 'Sindh Board' AND subject = $1 AND year = $2 AND paper_number = 2`,
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
             VALUES ($1, 'XII', 'Sindh Board', $2, $3, 2, '', $4, $5, 'COMPLETED', $6, NOW(), NOW())`,
            [p2Id, subjectConfig.subject, year, `SindhBoard-XII-${subjectConfig.subject}-${year}-Paper2`, theoryQuestions.length, adminId]
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

  console.log(`\n🏁 Completed processing Class XII ${subjectConfig.subject}!`);
}

async function main() {
  const args = process.argv.slice(2);
  const subjectArg = args.find((a) => a.startsWith("--subject="))?.split("=")[1] || (args.includes("--all") ? "all" : "Physics");
  const force = args.includes("--force");
  const yearFilter = parseInt(args.find((a) => a.startsWith("--year="))?.split("=")[1] || "0", 10) || undefined;

  if (subjectArg === "all") {
    for (const sub of CLASS_XII_SINDH_SUBJECTS) {
      await importSubjectXII(sub.subject, { force, yearFilter });
      console.log(`\n⏳ Cooling down for 6s before next subject...\n`);
      await new Promise((r) => setTimeout(r, 6000));
    }
  } else {
    await importSubjectXII(subjectArg, { force, yearFilter });
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✨ Done with Class XII past papers!");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
