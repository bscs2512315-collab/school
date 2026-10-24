import "dotenv/config";
import axios from "axios";
import { randomUUID } from "crypto";
import { db } from "../../lib/db";

interface SubjectNotesFeed {
  subject: string;
  labels: string[];
}

const CLASS_XI_FEEDS: SubjectNotesFeed[] = [
  { subject: "Mathematics", labels: ["Mathematics Notes 11th New", "Mathematics Notes 11th"] },
  { subject: "Physics", labels: ["Physics Notes Karachi Board XI"] },
  { subject: "Chemistry", labels: ["Chemistry Notes 11th"] },
  { subject: "Botany", labels: ["Biology Notes 11th"] },
  { subject: "Zoology", labels: ["Biology Notes 11th"] },
  { subject: "English", labels: ["English Notes XI", "English Mcqs XI"] },
  { subject: "Islamiat", labels: ["Islamiat Notes XI"] },
  { subject: "Urdu", labels: ["Urdu Notes for Class XI"] },
];

function matchChapterForNotesXI(
  title: string,
  subject: string,
  chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>
): { chapterId: string | null; chapterNumber: number; exerciseNumber: string; cleanedTitle: string } {
  const lower = title.toLowerCase();

  let matchedChapter: { id: string; chapter_name: string; chapter_number: number } | undefined = undefined;

  // Try chapter match by name
  matchedChapter = chapters.find((ch) => lower.includes(ch.chapter_name.toLowerCase()));

  // Try by word tokens
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
  } else if (lower.includes("solved exercise") || lower.includes("solution of book exercise")) {
    exerciseNumber = "Solved Exercise";
  } else if (lower.includes("theory notes")) {
    exerciseNumber = "Theory Notes";
  } else if (lower.includes("question answers") || lower.includes("question answer")) {
    exerciseNumber = "Question Answers";
  } else if (lower.includes("mcqs") || lower.includes("mcq")) {
    exerciseNumber = "MCQs";
  } else if (lower.includes("numericals")) {
    exerciseNumber = "Numericals";
  } else if (lower.includes("scientific reasons")) {
    exerciseNumber = "Scientific Reasons";
  } else if (lower.includes("translation") || lower.includes("tarjuma")) {
    exerciseNumber = "Translation";
  } else {
    const shortTitle = title.split("-")[0]?.trim() || "Notes";
    exerciseNumber = shortTitle.slice(0, 30);
  }

  const chapterNumber = matchedChapter?.chapter_number || 1;
  const chapterId = matchedChapter?.id || (chapters.length > 0 ? chapters[0].id : null);

  const cleanedTitle = title
    .replace(/\s*-\s*(?:Physics|Chemistry|Botany|Zoology|Biology|Computer Science|English|Islamiat|Urdu|Maths?|Mathematics)\s*(?:Class\s*)?(?:11th|XI)/i, "")
    .replace(/\s*-\s*Physics XI/i, "")
    .replace(/\s*-\s*Chemistry XI/i, "")
    .replace(/\s*-\s*English XI/i, "")
    .replace(/\s*-\s*Mathematics 11th/i, "")
    .trim();

  return {
    chapterId,
    chapterNumber,
    exerciseNumber,
    cleanedTitle,
  };
}

export async function importNotesForClassXI() {
  console.log("==========================================================================");
  console.log("🚀 STARTING IMPORT OF SINDH BOARD CLASS XI SOLVED NOTES");
  console.log("==========================================================================\n");

  for (const feedConfig of CLASS_XI_FEEDS) {
    const { rows: currRows } = await db.query(
      `SELECT id FROM curriculums WHERE class = 'XI' AND board = 'Sindh Board' AND subject = $1 LIMIT 1`,
      [feedConfig.subject]
    );

    if (currRows.length === 0) {
      console.warn(`⚠️ Curriculum not found for Class XI ${feedConfig.subject}`);
      continue;
    }

    const curriculumId = currRows[0].id;
    const { rows: chapters } = await db.query(
      `SELECT id, chapter_name, chapter_number FROM chapters WHERE curriculum_id = $1 ORDER BY chapter_number ASC`,
      [curriculumId]
    );

    console.log(`\n📚 Ingesting Class XI ${feedConfig.subject} (${chapters.length} chapters)...`);
    let totalImported = 0;

    for (const label of feedConfig.labels) {
      const feedUrl = `https://adamjeecoaching.blogspot.com/feeds/posts/default/-/${encodeURIComponent(label)}?alt=json&max-results=150`;
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

        const { chapterId, chapterNumber, exerciseNumber, cleanedTitle } = matchChapterForNotesXI(
          rawTitle,
          feedConfig.subject,
          chapters as any
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
            gen_random_uuid(), $1, $2, 'Sindh Board', 'XI', $3,
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
            feedConfig.subject,
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

    console.log(`🎉 Ingested ${totalImported} solved notes for Class XI ${feedConfig.subject}!`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n==========================================================================");
  console.log("🎉 COMPLETED IMPORT OF ALL CLASS XI SOLVED NOTES!");
  console.log("==========================================================================");
}

if (require.main === module) {
  importNotesForClassXI()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Fatal error importing Class XI notes:", err);
      process.exit(1);
    });
}
