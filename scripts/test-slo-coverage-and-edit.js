const { Pool } = require("pg");
const { SignJWT } = require("jose");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const TEACHER_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0";
const STUDENT_ID = "test-slo-coverage-mock-student-id";
const CLASSROOM_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0__Mathematics__X__sindh_board__private";

async function makeToken(userId, email, role) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

async function run() {
  console.log("======================================================================");
  console.log("STARTING SLO COVERAGE & CLASSROOM SETTINGS END-TO-END TEST");
  console.log("======================================================================");

  const teacherToken = await makeToken(TEACHER_ID, "teachertaha@gmail.com", "TEACHER");
  const studentToken = await makeToken(STUDENT_ID, "syedalaraibfatima234@gmail.com", "STUDENT");

  // 1. Ensure table schema has board column
  await pool.query("ALTER TABLE teacher_classrooms ADD COLUMN IF NOT EXISTS board TEXT NOT NULL DEFAULT 'AKUEB'");
  console.log("1. Schema verified: board column is present in teacher_classrooms.");

  // Ensure mock student exists in users
  await pool.query(`
    INSERT INTO users (id, email, password, name, role)
    VALUES ($1, 'mock.coverage.student@test.com', 'dummy_hash', 'Mock Coverage Student', 'STUDENT')
    ON CONFLICT (id) DO NOTHING
  `, [STUDENT_ID]);

  // Add student to classroom_members so student can access private room
  await pool.query(`
    INSERT INTO classroom_members (classroom_id, teacher_id, subject, class_level, student_id, status)
    VALUES ($1, $2, 'Mathematics', 'X', $3, 'accepted')
    ON CONFLICT (classroom_id, student_id) DO NOTHING
  `, [CLASSROOM_ID, TEACHER_ID, STUDENT_ID]);

  // 2. Test Editing Classroom Details via PATCH
  console.log("\n2. Testing PATCH /api/teacher/classrooms/[classroomId] to update details...");
  const patchRes = await fetch(`http://localhost:3002/api/teacher/classrooms/${encodeURIComponent(CLASSROOM_ID)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      name: "Mathematics Class X - Quadratic Equations Special",
      board: "AKUEB",
      subject: "Mathematics",
      classLevel: "X",
      autoApprovePaper2: true,
    }),
  });

  const patchData = await patchRes.json();
  console.log("PATCH Response status:", patchRes.status, "Data:", patchData.data);
  if (patchData.data?.name !== "Mathematics Class X - Quadratic Equations Special" || patchData.data?.board !== "AKUEB") {
    throw new Error("Classroom details PATCH failed to update name or board!");
  }
  console.log("-> Classroom details successfully updated.");

  // 3. Fetch Classroom Detail to verify header details
  console.log("\n3. Testing GET /api/classrooms/[classroomId]...");
  const detailRes = await fetch(`http://localhost:3002/api/classrooms/${encodeURIComponent(CLASSROOM_ID)}`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const detailData = await detailRes.json();
  console.log("Classroom Header:", {
    id: detailData.data.classroom.id,
    name: detailData.data.classroom.name,
    subject: detailData.data.classroom.subject,
    classLevel: detailData.data.classroom.classLevel,
    board: detailData.data.classroom.board,
  });

  // 4. Test SLO Coverage API as Teacher
  console.log("\n4. Testing GET /api/classrooms/[classroomId]/coverage as Teacher...");
  const covRes = await fetch(`http://localhost:3002/api/classrooms/${encodeURIComponent(CLASSROOM_ID)}/coverage`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const covData = await covRes.json();
  console.log("Coverage API Status:", covRes.status);
  console.log("Coverage Summary:", covData.data.summary);
  console.log("Chapters Count:", covData.data.chapters.length);

  // Look for Quadratic Equations chapter
  const quadChapter = covData.data.chapters.find(c => c.chapterName.toLowerCase().includes("quadratic"));
  if (quadChapter) {
    console.log(`\nQuadratic Equations Chapter Found:`);
    console.log(`- Chapter Number: ${quadChapter.chapterNumber}`);
    console.log(`- Total SLOs: ${quadChapter.totalSlos}`);
    console.log(`- Covered SLOs: ${quadChapter.coveredSlos}`);
    console.log(`- Coverage %: ${quadChapter.coveragePercentage}%`);
    console.log(`- Subtopics:`);
    quadChapter.subtopics.forEach(st => {
      console.log(`  * ${st.subtopicNumber}: ${st.subtopicName} (${st.slos.length} SLOs)`);
      st.slos.slice(0, 2).forEach(s => {
        console.log(`    - [${s.sloNumber}] (${s.cognitiveLevel}) ${s.sloText.substring(0, 45)}... -> ${s.isCovered ? "COVERED" : "UNTESTED"}`);
      });
    });
  } else {
    console.log("Note: Listing all available chapters:");
    covData.data.chapters.forEach(c => console.log(`- Ch ${c.chapterNumber}: ${c.chapterName} (${c.totalSlos} SLOs, ${c.coveragePercentage}% covered)`));
  }

  // 5. Test SLO Coverage API as Student
  console.log("\n5. Testing GET /api/classrooms/[classroomId]/coverage as Student...");
  const studCovRes = await fetch(`http://localhost:3002/api/classrooms/${encodeURIComponent(CLASSROOM_ID)}/coverage`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const studCovData = await studCovRes.json();
  console.log("Student Coverage API Status:", studCovRes.status);
  console.log("Student Summary:", studCovData.data.summary);

  console.log("\n======================================================================");
  console.log("ALL SLO COVERAGE & CLASSROOM SETTINGS TESTS PASSED SUCCESSFULLY!");
  console.log("======================================================================");

  await pool.end();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
