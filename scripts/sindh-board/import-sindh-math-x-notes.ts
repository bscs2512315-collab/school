import "dotenv/config";
import axios from "axios";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

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

async function ensureSindhCurriculumAndChapters(): Promise<{
  curriculumId: string;
  chapterMap: Map<number, string>; // chapterNumber -> chapterId
}> {
  console.log("📚 Checking Sindh Board Class X Mathematics curriculum...");
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

  const chapterMap = new Map<number, string>();

  // Ensure all chapters exist
  for (const ch of SINDH_MATH_X_CHAPTERS) {
    const { rows: existingCh } = await db.query(
      `SELECT id FROM chapters WHERE curriculum_id = $1 AND chapter_number = $2`,
      [curriculumId, ch.number]
    );

    let chapterId: string;
    if (existingCh.length > 0) {
      chapterId = existingCh[0].id;
    } else {
      chapterId = randomUUID();
      await db.query(
        `INSERT INTO chapters (id, curriculum_id, chapter_number, chapter_name, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [chapterId, curriculumId, ch.number, ch.name, `Sindh Board Class X Mathematics Chapter ${ch.number}: ${ch.name}`]
      );
    }
    chapterMap.set(ch.number, chapterId);
  }

  return { curriculumId, chapterMap };
}

function parseExerciseMetadata(title: string): {
  chapterNumber: number;
  exerciseNumber: string;
  cleanedTitle: string;
} {
  // Examples:
  // "Sets and Functions - Exercise 17.1 - Mathematics 10th"
  // "Partial Fractions - Review Exercise 21 - Mathematics 10th"
  // "Variations - Review Exercise 18 - Mathematics 10th"
  // "Introduction to Trigonometry - Exercise 30.5 - Mathematics 10th"

  let chapterNumber = 17;
  let exerciseNumber = "17.1";

  // Check for Exercise XX.Y
  const exMatch = title.match(/Exercise\s+([0-9]+(?:\.[0-9]+)?)/i);
  const revMatch = title.match(/Review\s+Exercise\s+([0-9]+)/i);

  if (revMatch) {
    chapterNumber = parseInt(revMatch[1], 10);
    exerciseNumber = `Review Exercise ${chapterNumber}`;
  } else if (exMatch) {
    exerciseNumber = `Exercise ${exMatch[1]}`;
    const prefix = exMatch[1].split(".")[0];
    chapterNumber = parseInt(prefix, 10);
  } else {
    // Fallback: check chapter mentions
    for (const ch of SINDH_MATH_X_CHAPTERS) {
      if (title.toLowerCase().includes(ch.name.toLowerCase())) {
        chapterNumber = ch.number;
        exerciseNumber = `Exercise ${ch.number}`;
        break;
      }
    }
  }

  const cleanedTitle = title
    .replace(/\s*-\s*Mathematics\s*10th/i, "")
    .replace(/\s*-\s*Maths\s*Class\s*10th/i, "")
    .trim();

  return { chapterNumber, exerciseNumber, cleanedTitle };
}

async function importAllMathNotes() {
  try {
    const { curriculumId, chapterMap } = await ensureSindhCurriculumAndChapters();

    const feedUrl = "https://adamjeecoaching.blogspot.com/feeds/posts/default/-/Mathematics%20Notes%2010th?alt=json&max-results=150";
    console.log(`🌐 Fetching Adamjee Class 10 Math posts feed...`);
    const res = await axios.get(feedUrl);
    const entries = res.data.feed.entry || [];
    console.log(`📥 Found ${entries.length} total posts in feed.`);

    let importedCount = 0;

    for (const entry of entries) {
      const rawTitle = entry.title.$t;
      const content = entry.content?.$t || "";
      const postUrl = entry.link?.find((l: any) => l.rel === "alternate")?.href || "";

      const { chapterNumber, exerciseNumber, cleanedTitle } = parseExerciseMetadata(rawTitle);
      const chapterId = chapterMap.get(chapterNumber) || null;

      // Extract high-res image URLs
      const imgMatches = content.matchAll(/src=["'](https:\/\/blogger\.googleusercontent\.com\/img\/b\/[a-zA-Z0-9_\-]+\/[^"']+)["']/gi);
      const images: string[] = [];

      for (const m of imgMatches) {
        let url = m[1];
        if (!url.includes("Fill In The Blanks") && !url.includes("s100/") && !url.includes("w1200-h630")) {
          url = url.replace(/\/s\d+\//, "/s1600/");
          if (!images.includes(url)) images.push(url);
        }
      }

      if (images.length === 0) {
        console.log(`⚠️ No images found for post: "${rawTitle}" (${postUrl})`);
        continue;
      }

      const thumbnailUrl = images[0];

      // Upsert into solved_exercises
      await db.query(
        `INSERT INTO solved_exercises (
          id, chapter_id, curriculum_id, board, class, subject,
          chapter_number, exercise_number, title, page_count,
          image_urls, thumbnail_url, source_credit, is_published, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, true, NOW(), NOW()
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
          "Sindh Board",
          "X",
          "Mathematics",
          chapterNumber,
          exerciseNumber,
          cleanedTitle,
          images.length,
          images,
          thumbnailUrl,
          "Adamjee Coaching / Sindh Textbook Board"
        ]
      );

      importedCount++;
      console.log(`✅ [${importedCount}/${entries.length}] Ingested Chapter ${chapterNumber} -> ${exerciseNumber}: "${cleanedTitle}" (${images.length} pages)`);
    }

    console.log(`\n🎉 Successfully imported ${importedCount} solved exercises for Sindh Board Class X Mathematics!`);
  } catch (err) {
    console.error("❌ Failed to import math notes:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

importAllMathNotes();
