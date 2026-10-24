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
    feedLabels: ["Mathematics Notes 12th"],
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
    feedLabels: ["Physics Notes XII", "Physics Mcqs Karachi Board XII"],
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
    feedLabels: ["Chemistry Notes XII", "Chemistry Mcqs XII"],
  },

  // 4. BOTANY
  {
    subject: "Botany",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Botany.pdf",
    chapters: [
      { number: 1, name: "Homeostasis in Plants" },
      { number: 2, name: "Support and Movement in Plants" },
      { number: 3, name: "Coordination and Control in Plants (Phytohormones)" },
      { number: 4, name: "Reproduction in Plants" },
      { number: 5, name: "Growth and Development in Plants" },
      { number: 6, name: "Chromosomes and DNA" },
      { number: 7, name: "Biotechnology & Genetic Engineering" },
      { number: 8, name: "Ecosystems and Environmental Biology" },
    ],
    feedLabels: ["Biology Mcqs XII"],
  },

  // 5. ZOOLOGY
  {
    subject: "Zoology",
    pdfFileName: "Sindh-Textbook-Board-Class-XII-Zoology.pdf",
    chapters: [
      { number: 1, name: "Homeostasis (Osmoregulation, Excretion & Thermoregulation)" },
      { number: 2, name: "Support and Movement (Skeletal & Muscular System)" },
      { number: 3, name: "Nervous and Chemical Coordination" },
      { number: 4, name: "Animal Reproduction" },
      { number: 5, name: "Development and Aging" },
      { number: 6, name: "Chromosomes, Genes and Inheritance" },
      { number: 7, name: "Evolution" },
      { number: 8, name: "Man and His Environment" },
    ],
    feedLabels: ["Biology Mcqs XII"],
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
    feedLabels: ["PYP 12th Computer Science"],
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
    feedLabels: ["English Notes XII", "English Mcqs XII"],
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
    feedLabels: ["PYP 12th Pakistan Studies (Urdu)", "PYP 12th Pakistan Studies"],
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
    feedLabels: ["Urdu Mcqs XII"],
  },
];

export async function ensureSindhCurriculumAndChaptersXII(subjectConfig: SubjectConfig): Promise<{
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
    console.log(`✅ Found existing Sindh Board Class XII curriculum ID: ${curriculumId}`);
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
  console.log(`✅ Sindh Board Class XII ${subjectConfig.subject} chapters verified (${allChapters.length} chapters ready).\n`);
  return { curriculumId, chapters: allChapters as any };
}

function matchChapterForNotesXII(
  title: string,
  subject: string,
  chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>
): { chapterId: string | null; chapterNumber: number; exerciseNumber: string; cleanedTitle: string } {
  const lower = title.toLowerCase();

  let matchedChapter: { id: string; chapter_name: string; chapter_number: number } | undefined = undefined;

  // Specific subject rules
  if (subject === "Mathematics") {
    // Check specific unit names
    if (lower.includes("parabola") || lower.includes("ellipse") || lower.includes("hyperbola")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 8);
    } else if (lower.includes("circle")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 7);
    } else if (lower.includes("straight line") || lower.includes("plane analytic geometry")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 6);
    } else if (lower.includes("integration")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 5);
    } else if (lower.includes("vector functions")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 4);
    } else if (lower.includes("higher order derivatives")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 3);
    } else if (lower.includes("differentiation")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 2);
    } else if (lower.includes("functions and limits") || lower.includes("functions & limits")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 1);
    }
  } else if (subject === "English") {
    if (lower.includes("zenda") || lower.includes("rassendyll") || lower.includes("flavia") || lower.includes("micheal") || lower.includes("sapt") || lower.includes("elphberg") || lower.includes("mauban")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 9);
    } else if (lower.includes("poem") || lower.includes("elegy") || lower.includes("ulysses") || lower.includes("endymion") || lower.includes("reaper") || lower.includes("samson") || lower.includes("essay on man") || lower.includes("upright") || lower.includes("seven ages") || lower.includes("soft voices")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 8);
    } else if (lower.includes("oakentubb")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 1);
    } else if (lower.includes("re-awak") || lower.includes("re awaking") || lower.includes("re-awaking")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 2);
    } else if (lower.includes("dam broke")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 3);
    } else if (lower.includes("modern world")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 4);
    } else if (lower.includes("silver box")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 5);
    } else if (lower.includes("world as i see it")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 6);
    } else if (lower.includes("devoted friend")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 7);
    }
  } else if (subject === "Urdu") {
    if (lower.includes("nasar") || lower.includes("prose")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 1);
    } else if (lower.includes("nazam") || lower.includes("poem")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 2);
    } else if (lower.includes("ghazal")) {
      matchedChapter = chapters.find((c) => c.chapter_number === 3);
    }
  }

  // Fallback chapter match by name
  if (!matchedChapter) {
    matchedChapter = chapters.find((ch) => lower.includes(ch.chapter_name.toLowerCase()));
  }

  // Fallback by word tokens
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
  } else if (lower.includes("solved exercise") || lower.includes("solution of book exercise")) {
    exerciseNumber = "Solved Exercise";
  } else if (lower.includes("theory notes")) {
    exerciseNumber = "Theory Notes";
  } else if (lower.includes("question answers")) {
    exerciseNumber = "Question Answers";
  } else if (lower.includes("mcqs") || lower.includes("mcq")) {
    exerciseNumber = "MCQs";
  } else if (lower.includes("numericals")) {
    exerciseNumber = "Numericals";
  } else if (lower.includes("scientific reasons")) {
    exerciseNumber = "Scientific Reasons";
  } else if (lower.includes("characters sketch") || lower.includes("character sketch")) {
    exerciseNumber = "Character Sketch";
  } else {
    const shortTitle = title.split("-")[0]?.trim() || "Notes";
    exerciseNumber = shortTitle.slice(0, 30);
  }

  const chapterNumber = matchedChapter?.chapter_number || 1;
  const chapterId = matchedChapter?.id || (chapters.length > 0 ? chapters[0].id : null);

  const cleanedTitle = title
    .replace(/\s*-\s*(?:Physics|Chemistry|Botany|Zoology|Biology|Computer Science|English|Pakistan Studies|Urdu|Maths?|Mathematics)\s*(?:Class\s*)?(?:12th|XII)/i, "")
    .replace(/\s*-\s*Physics XII/i, "")
    .replace(/\s*-\s*Chemistry XII/i, "")
    .replace(/\s*-\s*English XII/i, "")
    .replace(/\s*-\s*Mathematics 12th/i, "")
    .trim();

  return {
    chapterId,
    chapterNumber,
    exerciseNumber,
    cleanedTitle,
  };
}

export async function importNotesForSubjectXII(subjectConfig: SubjectConfig) {
  console.log(`\n==========================================================================`);
  console.log(`📚 INGESTING SOLVED NOTES: Sindh Board Class XII ${subjectConfig.subject}`);
  console.log(`==========================================================================\n`);

  const { curriculumId, chapters } = await ensureSindhCurriculumAndChaptersXII(subjectConfig);

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

      const { chapterId, chapterNumber, exerciseNumber, cleanedTitle } = matchChapterForNotesXII(
        rawTitle,
        subjectConfig.subject,
        chapters
      );

      const imgMatches = content.matchAll(
        /src=["'](https:\/\/blogger\.googleusercontent\.com\/img\/b\/[a-zA-Z0-9_\-]+\/[^"']+)["']/gi
      );
      const images: string[] = [];

      for (const m of imgMatches) {
        let url = m[1];
        if (
          !url.includes("s100/") &&
          !url.includes("w1200-h630") &&
          !url.includes("button") &&
          !url.includes("badge")
        ) {
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
          gen_random_uuid(), $1, $2, 'Sindh Board', 'XII', $3,
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

  console.log(`\n🎉 Ingested ${totalImported} solved notes for Class XII ${subjectConfig.subject}!`);
}

export async function importAllClassXII() {
  console.log("==========================================================================");
  console.log("🚀 STARTING BATCH IMPORT OF ALL SINDH BOARD CLASS XII SYLLABUS & SOLVED NOTES");
  console.log("==========================================================================\n");

  for (const config of CLASS_XII_SINDH_SUBJECTS) {
    await importNotesForSubjectXII(config);
    console.log(`\n⏳ Cooling down for 2s before next subject...\n`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("==========================================================================");
  console.log("🎉 COMPLETED IMPORT OF ALL CLASS XII SYLLABUS & SOLVED NOTES!");
  console.log("==========================================================================");
}

if (require.main === module) {
  importAllClassXII()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Fatal error importing Class XII:", err);
      process.exit(1);
    });
}
