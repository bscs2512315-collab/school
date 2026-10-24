import "dotenv/config";
import axios from "axios";
import { randomUUID } from "crypto";
import { db } from "../../lib/db";
import { CLASS_X_SINDH_SUBJECTS, ensureSindhCurriculumAndChapters } from "./import-all-class-x-subjects";

interface SubjectNotesFeed {
  subject: string;
  label: string;
}

const CLASS_X_NOTES_FEEDS: SubjectNotesFeed[] = [
  { subject: "Physics", label: "Physics Notes 10th" },
  { subject: "Chemistry", label: "Chemistry Notes 10th" },
  { subject: "Biology", label: "Biology Notes 10th" },
  { subject: "Computer Science", label: "Computer Notes 10th" },
  { subject: "English", label: "English Notes 10th" },
  { subject: "Pakistan Studies", label: "Pakistan Studies Notes 10th" },
  { subject: "Islamiat", label: "Islamiat Notes 10th" },
  { subject: "Sindhi", label: "Sindhi Notes 10th" },
  { subject: "Urdu", label: "Urdu Notes 10th" },
];

function matchChapterForNotes(
  title: string,
  chapters: Array<{ id: string; chapter_name: string; chapter_number: number }>
): { chapterId: string | null; chapterNumber: number; exerciseNumber: string; cleanedTitle: string } {
  const lower = title.toLowerCase();

  // Try to find chapter match by name
  let matchedChapter = chapters.find((ch) => lower.includes(ch.chapter_name.toLowerCase()));

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

  // Extract exercise or topic indicator
  let exerciseNumber = "Exercise 1";
  const exMatch = title.match(/(?:Exercise|Unit|Chapter|Section)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (exMatch) {
    exerciseNumber = `Exercise ${exMatch[1]}`;
  } else if (lower.includes("solved textbook exercise") || lower.includes("solution of book exercise")) {
    exerciseNumber = "Textbook Exercise";
  } else if (lower.includes("short and detailed question answers") || lower.includes("question answers")) {
    exerciseNumber = "Question Answers";
  } else if (lower.includes("multiple choice questions") || lower.includes("mcqs")) {
    exerciseNumber = "MCQs";
  } else if (lower.includes("numericals")) {
    exerciseNumber = "Numericals";
  } else if (lower.includes("grammar") || lower.includes("language practice")) {
    exerciseNumber = "Grammar & Practice";
  } else {
    // Generate a short slug from title
    const shortTitle = title.split("-")[0]?.trim() || "Notes";
    exerciseNumber = shortTitle.slice(0, 30);
  }

  const chapterNumber = matchedChapter?.chapter_number || 1;
  const chapterId = matchedChapter?.id || (chapters.length > 0 ? chapters[0].id : null);

  const cleanedTitle = title
    .replace(/\s*-\s*(?:Physics|Chemistry|Biology|Computer Science|English|Pakistan Studies|Islamiat|Sindhi|Urdu|Maths?)\s*(?:Class\s*)?10th/i, "")
    .trim();

  return {
    chapterId,
    chapterNumber,
    exerciseNumber,
    cleanedTitle,
  };
}

export async function importNotesForSubject(feedConfig: SubjectNotesFeed) {
  const subjectConfig = CLASS_X_SINDH_SUBJECTS.find((s) => s.subject.toLowerCase() === feedConfig.subject.toLowerCase());
  if (!subjectConfig) {
    console.warn(`⚠️ Subject config not found for ${feedConfig.subject}`);
    return;
  }

  console.log(`\n==========================================================================`);
  console.log(`📚 INGESTING SOLVED NOTES: Sindh Board Class X ${feedConfig.subject}`);
  console.log(`==========================================================================\n`);

  const { curriculumId, chapters } = await ensureSindhCurriculumAndChapters(subjectConfig);

  const feedUrl = `https://adamjeecoaching.blogspot.com/feeds/posts/default/-/${encodeURIComponent(feedConfig.label)}?alt=json&max-results=150`;
  console.log(`🌐 Fetching Adamjee feed for ${feedConfig.label}...`);

  let entries: any[] = [];
  try {
    const res = await axios.get(feedUrl);
    entries = res.data.feed.entry || [];
    console.log(`📥 Found ${entries.length} posts for ${feedConfig.subject}.`);
  } catch (err: any) {
    console.error(`❌ Failed to fetch feed for ${feedConfig.subject}:`, err.message);
    return;
  }

  let imported = 0;

  for (const entry of entries) {
    const rawTitle = entry.title.$t;
    const content = entry.content?.$t || "";
    const postUrl = entry.link?.find((l: any) => l.rel === "alternate")?.href || "";

    const { chapterId, chapterNumber, exerciseNumber, cleanedTitle } = matchChapterForNotes(rawTitle, chapters);

    // Extract high-res image URLs
    const imgMatches = content.matchAll(/src=["'](https:\/\/blogger\.googleusercontent\.com\/img\/b\/[a-zA-Z0-9_\-]+\/[^"']+)["']/gi);
    const images: string[] = [];

    for (const m of imgMatches) {
      let url = m[1];
      if (!url.includes("Fill In The Blanks") && !url.includes("s100/") && !url.includes("w1200-h630") && !url.includes("button") && !url.includes("badge")) {
        url = url.replace(/\/s\d+\//, "/s1600/");
        if (!images.includes(url)) images.push(url);
      }
    }

    if (images.length === 0) {
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
        gen_random_uuid(), $1, $2, 'Sindh Board', 'X', $3,
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

    imported++;
    console.log(`✅ [${imported}/${entries.length}] Chapter ${chapterNumber} -> ${exerciseNumber}: "${cleanedTitle}" (${images.length} pages)`);
  }

  console.log(`\n🎉 Ingested ${imported} solved notes for Class X ${feedConfig.subject}!`);
}

export async function importAllClassXNotes() {
  console.log("==========================================================================");
  console.log("🚀 STARTING BATCH IMPORT OF ALL SINDH BOARD CLASS X SOLVED NOTES");
  console.log("==========================================================================\n");

  for (const feed of CLASS_X_NOTES_FEEDS) {
    await importNotesForSubject(feed);
    console.log(`\n⏳ Cooling down for 2s before next subject...\n`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("==========================================================================");
  console.log("🎉 COMPLETED IMPORT OF ALL CLASS X SOLVED NOTES!");
  console.log("==========================================================================");
}

if (require.main === module) {
  importAllClassXNotes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Fatal error importing Class X notes:", err);
      process.exit(1);
    });
}
