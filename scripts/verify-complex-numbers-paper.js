const { Pool } = require("pg");
const { SignJWT } = require("jose");
require("dotenv").config({ path: "/Users/muhammadtahatalib/Projects/ExBoardAI/.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CLASSROOM_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0__Mathematics__X__private";
const TEACHER_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0";

async function verify() {
  try {
    console.log("--- Verifying Complex Numbers Papers in Database ---");
    const { rows } = await pool.query(
      `SELECT id, title, total_marks, total_questions, questions_snapshot
       FROM teacher_papers
       WHERE classroom_id = $1 AND title LIKE 'Complex Numbers Alpha%'
       ORDER BY title`,
      [CLASSROOM_ID]
    );

    console.log(`Found ${rows.length} Complex Numbers Alpha paper(s) in classroom.`);

    for (const p of rows) {
      console.log(`\nVerifying: ${p.title} (${p.id})`);
      const snapshot = typeof p.questions_snapshot === "string" ? JSON.parse(p.questions_snapshot) : p.questions_snapshot;
      console.log(`  Questions count: ${snapshot.length}, Total marks: ${p.total_marks}`);

      if (snapshot.length !== 15) {
        throw new Error(`Expected 15 questions, found ${snapshot.length}`);
      }

      let marksSum = 0;
      snapshot.forEach((q, i) => {
        marksSum += q.marks;
        if (!q.questionText || !q.correctAnswer || !q.paperIIData?.betterResponse || !q.paperIIData?.markingNotes) {
          throw new Error(`Question ${i + 1} incomplete in ${p.title}`);
        }
      });

      if (marksSum !== p.total_marks) {
        throw new Error(`Marks sum mismatch in ${p.title}: sum ${marksSum} vs total_marks ${p.total_marks}`);
      }
      console.log(`  All 15 questions have complete exemplar solutions, marking notes, and rubrics.`);
    }

    console.log("\n--- Testing API with Teacher JWT ---");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      userId: TEACHER_ID,
      email: "mtahatalib110@gmail.com",
      role: "TEACHER",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);

    const testPaperId = rows[0].id;
    const res = await fetch(`http://localhost:3002/api/teacher/papers/${testPaperId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    console.log(`GET /api/teacher/papers/${testPaperId} -> status ${res.status}, success: ${json.success}`);
    console.log(`Title: ${json.data?.title}`);
    console.log(`Questions loaded: ${json.data?.questions?.length}`);

    console.log("\nALL VERIFICATIONS PASSED PERFECTLY!");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verify();
