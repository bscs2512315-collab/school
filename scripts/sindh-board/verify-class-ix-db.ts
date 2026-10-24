import "dotenv/config";
import { db } from "../../lib/db";

async function verifyClassIX() {
  console.log("==========================================================================");
  console.log("📊 SINDH BOARD CLASS IX - DATABASE VERIFICATION & AUDIT");
  console.log("==========================================================================\n");

  const { rows: curriculums } = await db.query(
    `SELECT c.id, c.subject, c.board, c.class,
            (SELECT COUNT(*) FROM chapters ch WHERE ch.curriculum_id = c.id) as chapter_count,
            (SELECT COUNT(*) FROM solved_exercises se WHERE se.curriculum_id = c.id) as notes_count,
            (SELECT COALESCE(SUM(se.page_count), 0) FROM solved_exercises se WHERE se.curriculum_id = c.id) as total_pages
     FROM curriculums c
     WHERE c.class = 'IX' AND c.board = 'Sindh Board'
     ORDER BY c.subject ASC`
  );

  console.table(
    curriculums.map((c) => ({
      Subject: c.subject,
      Board: c.board,
      Class: c.class,
      Chapters: Number(c.chapter_count),
      "Solved Notes": Number(c.notes_count),
      "Total Pages": Number(c.total_pages),
    }))
  );

  const totalChapters = curriculums.reduce((sum, c) => sum + Number(c.chapter_count), 0);
  const totalNotes = curriculums.reduce((sum, c) => sum + Number(c.notes_count), 0);
  const totalPages = curriculums.reduce((sum, c) => sum + Number(c.total_pages), 0);

  console.log("\n--------------------------------------------------------------------------");
  console.log(`🎯 TOTALS FOR CLASS IX:`);
  console.log(`   📚 Subjects:     ${curriculums.length}`);
  console.log(`   📖 Chapters:     ${totalChapters}`);
  console.log(`   📝 Solved Notes: ${totalNotes} sets`);
  console.log(`   📄 Digitized Pages: ${totalPages.toLocaleString()} pages`);
  console.log("--------------------------------------------------------------------------\n");
}

verifyClassIX()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
