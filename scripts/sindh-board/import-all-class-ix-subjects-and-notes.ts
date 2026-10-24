import "dotenv/config";
import axios from "axios";
import { randomUUID } from "crypto";
import { db } from "../../lib/db";

interface SubjectConfig {
  subject: string;
  pdfFileName: string;
  chapters: Array<{ number: number; name: string }>;
  feedLabels: string[];
}

export const CLASS_IX_SINDH_SUBJECTS: SubjectConfig[] = [
  // 1. MATHEMATICS
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
    feedLabels: ["Mathematics Notes 9th"],
  },

  // 2. PHYSICS
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
    feedLabels: ["Physics Notes 9th"],
  },

  // 3. CHEMISTRY
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
    feedLabels: ["Chemistry Notes 9th", "Chemistry Notes IX"],
  },

  // 4. BIOLOGY
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
    feedLabels: ["Biology Notes 9th", "Biology Notes IX"],
  },

  // 5. COMPUTER SCIENCE
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
    feedLabels: ["Computer Notes 9th", "Computer Notes IX"],
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
    feedLabels: ["English Notes 9th", "English Notes IX"],
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
    feedLabels: ["Pakistan Studies Notes IX", "Pakistan Studies Urdu Notes IX"],
  },

  // 8. SINDHI
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
    feedLabels: ["Sindhi Notes IX"],
  },

  // 9. ISLAMIAT
  {
    subject: "Islamiat",
    pdfFileName: "Sindh-Textbook-Board-Class-IX-Islamiat.pdf",
    chapters: [
      { number: 1, name: "القرآن الکریم (سورۃ الانفال)" },
      { number: 2, name: "الحدیث النبوی الشریف" },
      { number: 3, name: "ایمانیات و عبادات" },
      { number: 4, name: "سیرت النبی ﷺ اور اخلاقیات" },
    ],
    feedLabels: ["Islamiat Notes 10th"], // Often shared in matric feed
  },

  // 10. URDU
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
    feedLabels: ["Urdu Notes 10th"],
  },
];

export async function ensureSindhCurriculumAndChaptersIX(subjectConfig: SubjectConfig): Promise<{
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
          `Sindh Board Class IX ${subjectConfig.subject} Chapter ${ch.number}: ${ch.name}`,
        ]
      );
    }
  }

  const { rows: allChapters } = await db.query(
    `SELECT id, chapter_name, chapter_number FROM chapters WHERE curriculum_id = $1 ORDER BY chapter_number ASC`,
    [curriculumId]
  );
  console.log(`✅ Sindh Board Class IX ${subjectConfig.subject} chapters verified (${allChapters.length} chapters ready).\n`);
  return { curriculumId, chapters: allChapters as any };
}

function matchChapterForNotesIX(
  title: string,
  chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>
): { chapterId: string | null; chapterNumber: number; exerciseNumber: string; cleanedTitle: string } {
  const lower = title.toLowerCase();

  let matchedChapter = chapters.find((ch) => lower.includes(ch.chapter_name.toLowerCase()));

  if (!matchedChapter) {
    for (const ch of chapters) {
      const words = ch.chapter_name.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      if (words.some((w) => lower.includes(w))) {
        matchedChapter = ch;
        break;
      }
    }
  }

  let exerciseNumber = "Exercise 1";
  const exMatch = title.match(/(?:Exercise|Unit|Chapter|Section)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (exMatch) {
    exerciseNumber = `Exercise ${exMatch[1]}`;
    if (!matchedChapter) {
      const chNum = parseInt(exMatch[1].split(".")[0], 10);
      matchedChapter = chapters.find((ch) => ch.chapter_number === chNum);
    }
  } else if (lower.includes("solved textbook exercise") || lower.includes("solution of book exercise")) {
    exerciseNumber = "Textbook Exercise";
  } else if (lower.includes("short and detailed question answers") || lower.includes("question answers")) {
    exerciseNumber = "Question Answers";
  } else if (lower.includes("multiple choice questions") || lower.includes("mcqs")) {
    exerciseNumber = "MCQs";
  } else if (lower.includes("numericals")) {
    exerciseNumber = "Numericals";
  } else if (lower.includes("fill in the blanks")) {
    exerciseNumber = "Fill in the Blanks";
  } else {
    const shortTitle = title.split("-")[0]?.trim() || "Notes";
    exerciseNumber = shortTitle.slice(0, 30);
  }

  const chapterNumber = matchedChapter?.chapter_number || 1;
  const chapterId = matchedChapter?.id || (chapters.length > 0 ? chapters[0].id : null);

  const cleanedTitle = title
    .replace(/\s*-\s*(?:Physics|Chemistry|Biology|Computer Science|English|Pakistan Studies|Islamiat|Sindhi|Urdu|Maths?|Mathematics)\s*(?:Class\s*)?(?:9th|IX)/i, "")
    .trim();

  return {
    chapterId,
    chapterNumber,
    exerciseNumber,
    cleanedTitle,
  };
}

export async function importNotesForSubjectIX(subjectConfig: SubjectConfig) {
  console.log(`\n==========================================================================`);
  console.log(`📚 INGESTING SOLVED NOTES: Sindh Board Class IX ${subjectConfig.subject}`);
  console.log(`==========================================================================\n`);

  const { curriculumId, chapters } = await ensureSindhCurriculumAndChaptersIX(subjectConfig);

  let totalImported = 0;

  for (const label of subjectConfig.feedLabels) {
    const feedUrl = `https://adamjeecoaching.blogspot.com/feeds/posts/default/-/${encodeURIComponent(label)}?alt=json&max-results=150`;
    console.log(`🌐 Fetching Adamjee feed for "${label}"...`);

    let entries: any[] = [];
    try {
      const res = await axios.get(feedUrl);
      entries = res.data.feed.entry || [];
      console.log(`📥 Found ${entries.length} posts for "${label}".`);
    } catch (err: any) {
      console.warn(`⚠️ Failed to fetch feed for "${label}":`, err.message);
      continue;
    }

    for (const entry of entries) {
      const rawTitle = entry.title.$t;
      const content = entry.content?.$t || "";

      const { chapterId, chapterNumber, exerciseNumber, cleanedTitle } = matchChapterForNotesIX(rawTitle, chapters);

      const imgMatches = content.matchAll(/src=["'](https:\/\/blogger\.googleusercontent\.com\/img\/b\/[a-zA-Z0-9_\-]+\/[^"']+)["']/gi);
      const images: string[] = [];

      for (const m of imgMatches) {
        let url = m[1];
        if (!url.includes("s100/") && !url.includes("w1200-h630") && !url.includes("button") && !url.includes("badge")) {
          url = url.replace(/\/s\d+\//, "/s1600/");
          if (!images.includes(url)) images.push(url);
        }
      }

      if (images.length === 0) continue;

      const thumbnailUrl = images[0];

      await db.query(
        `INSERT INTO solved_exercises (
          id, chapter_id, curriculum_id, board, class, subject,
          chapter_number, exercise_number, title, page_count,
          image_urls, thumbnail_url, source_credit, is_published, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'Sindh Board', 'IX', $3,
          $4, $5, $6, $7,
          $8, $9, 'Adamjee Coaching / Sindh Textbook Board', true, NOW(), NOW()
        )
        ON CONFLICT (curriculum_id, chapter_number, exercise_number)
        DO UPDATE SET
          title = EXCLUDED.title,
          page_count = EXCLUDED.page_count,
          image_urls = EXCLUDED.image_urls,
          thumbnail_url = EXCLUDED.thumbnail_url,
          chapter_id = EXCLUDED.chapter_id,
          updated_at = NOW()`,
        [
          chapterId,
          curriculumId,
          subjectConfig.subject,
          chapterNumber,
          exerciseNumber,
          cleanedTitle,
          images.length,
          images,
          thumbnailUrl,
        ]
      );

      totalImported++;
      console.log(`✅ [${totalImported}] Chapter ${chapterNumber} -> ${exerciseNumber}: "${cleanedTitle}" (${images.length} pages)`);
    }
  }

  console.log(`\n🎉 Ingested ${totalImported} solved notes for Class IX ${subjectConfig.subject}!`);
}

export async function importAllClassIX() {
  console.log("==========================================================================");
  console.log("🚀 STARTING BATCH IMPORT OF ALL SINDH BOARD CLASS IX SYLLABUS & SOLVED NOTES");
  console.log("==========================================================================\n");

  for (const config of CLASS_IX_SINDH_SUBJECTS) {
    await importNotesForSubjectIX(config);
    console.log(`\n⏳ Cooling down for 2s before next subject...\n`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("==========================================================================");
  console.log("🎉 COMPLETED IMPORT OF ALL CLASS IX SYLLABUS & SOLVED NOTES!");
  console.log("==========================================================================");
}

if (require.main === module) {
  importAllClassIX()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Fatal error importing Class IX:", err);
      process.exit(1);
    });
}
