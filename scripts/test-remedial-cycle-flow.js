const { SignJWT } = require("jose");
const { Pool } = require("pg");
require("dotenv").config({ path: "/Users/muhammadtahatalib/Projects/ExBoardAI/.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CLASSROOM_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0__Mathematics__X__private";
const TEACHER_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0";
const STUDENT = {
  id: "test-remedial-mock-student-id",
  name: "Test Remedial Student",
  email: "test.remedial.student@example.com"
};

async function makeToken(userId, email, role) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
}

async function run() {
  try {
    console.log("==================================================");
    console.log("TESTING 3-ATTEMPT ADAPTIVE REMEDIAL PRACTICE CYCLE");
    console.log("==================================================");

    // Run schema migrations
    await pool.query(`ALTER TABLE teacher_papers ADD COLUMN IF NOT EXISTS is_remedial BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE teacher_papers ADD COLUMN IF NOT EXISTS remedial_student_id TEXT`);

    // Ensure test student exists in users table
    await pool.query(`
      INSERT INTO users (id, email, password, name, role)
      VALUES ($1, $2, 'dummy_hash', $3, 'STUDENT')
      ON CONFLICT (id) DO NOTHING
    `, [STUDENT.id, STUDENT.email, STUDENT.name]);

    // Ensure student is a member of the classroom
    await pool.query(`
      INSERT INTO classroom_members (classroom_id, teacher_id, subject, class_level, student_id, status)
      VALUES ($1, $2, 'Mathematics', 'X', $3, 'accepted')
      ON CONFLICT (classroom_id, student_id) DO NOTHING
    `, [CLASSROOM_ID, TEACHER_ID, STUDENT.id]);

    const studentToken = await makeToken(STUDENT.id, STUDENT.email, "STUDENT");
    const teacherToken = await makeToken(TEACHER_ID, "mtahatalib110@gmail.com", "TEACHER");

    // Clean up prior test attempts for clean isolation
    console.log("\n1. Cleaning up prior test attempts for student...");
    await pool.query(
      `DELETE FROM exam_attempts
       WHERE user_id = $1 AND teacher_paper_id IN (
         SELECT id FROM teacher_papers WHERE classroom_id = $2
       )`,
      [STUDENT.id, CLASSROOM_ID]
    );
    await pool.query(
      `DELETE FROM teacher_paper_progress
       WHERE user_id = $1`,
      [STUDENT.id]
    );
    await pool.query(
      `DELETE FROM teacher_papers
       WHERE classroom_id = $1 AND is_remedial = true AND remedial_student_id = $2`,
      [CLASSROOM_ID, STUDENT.id]
    );
    console.log("  Cleaned up prior attempts.");

    // Check initial state: 0 attempts -> button should say "Start Exam"
    console.log("\n2. Checking Initial Classroom View (Attempt 0)...");
    const initRes = await fetch(`http://localhost:3002/api/classrooms/${encodeURIComponent(CLASSROOM_ID)}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const initData = await initRes.json();
    if (!initData.success) throw new Error("Failed to fetch classroom: " + JSON.stringify(initData));

    const complexPaperCard = initData.data.papers.find(p => p.title.toLowerCase().includes("complex"));
    console.log(`  Visible Card Title: "${complexPaperCard.title}"`);
    console.log(`  Assigned Paper ID: ${complexPaperCard.id}`);
    console.log(`  Attempt Count: ${complexPaperCard.attemptCount || 0}`);
    console.log(`  Has Approved Attempt: ${complexPaperCard.hasApprovedAttempt}`);
    console.log(`  Is Remedial: ${complexPaperCard.isRemedial}`);

    if (complexPaperCard.hasApprovedAttempt) {
      throw new Error("Expected hasApprovedAttempt to be false on initial state");
    }

    // -------------------------------------------------------------
    // ATTEMPT 1: Student takes Set 1 (e.g. Set A)
    // -------------------------------------------------------------
    console.log("\n3. ATTEMPT 1: Fetching Paper & Submitting...");
    const p1Res = await fetch(`http://localhost:3002/api/student/teacher-papers/${complexPaperCard.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const p1Data = await p1Res.json();
    console.log(`  Exam Title: "${p1Data.data.title}" | Questions Count: ${p1Data.data.questions.length}`);
    const qList1 = p1Data.data.questions;

    // Simulate submission for Paper 2 with intentional low marks on Q1 (index 0) and Q3 (index 2)
    const answers1 = {};
    qList1.forEach(q => {
      answers1[q.id] = { text: "Student response" };
    });

    const sub1Res = await fetch(`http://localhost:3002/api/student/teacher-papers/${complexPaperCard.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ answers: answers1, timeTaken: 120 })
    });
    const sub1Data = await sub1Res.json();
    if (!sub1Data.success) throw new Error("Attempt 1 submission failed: " + JSON.stringify(sub1Data));
    console.log(`  Submitted Attempt 1 ID: ${sub1Data.data.attemptId}`);

    // Set to awaiting_approval so teacher can immediately approve
    await pool.query(`UPDATE exam_attempts SET grading_status = 'awaiting_approval' WHERE id = $1`, [sub1Data.data.attemptId]);

    // Teacher grades Attempt 1: Q1 gets 0/3, Q3 gets 1/4 (semi-correct), other questions get full marks
    const grades1 = {};
    qList1.forEach((q, idx) => {
      const maxMarks = q.marks || 3;
      if (idx === 0) {
        grades1[q.id] = { score: 0, feedback: "Incorrect powers calculation" };
      } else if (idx === 2) {
        grades1[q.id] = { score: 1, feedback: "Partial credit, arithmetic error" };
      } else {
        grades1[q.id] = { score: maxMarks, feedback: "Excellent" };
      }
    });

    const app1Res = await fetch(`http://localhost:3002/api/teacher/classrooms/${encodeURIComponent(CLASSROOM_ID)}/attempts/${sub1Data.data.attemptId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ grades: grades1, overallFeedback: "Good start, revise Q1 and Q3." })
    });
    const app1Data = await app1Res.json();
    if (!app1Data.success) throw new Error("Attempt 1 approval failed: " + JSON.stringify(app1Data));
    console.log(`  Teacher Approved Attempt 1: Score ${app1Data.data.totalScore}/${app1Data.data.totalMaxMarks} (${app1Data.data.percentage}%)`);

    // Check Classroom View after Attempt 1: Button must be "Re-Attempt"
    console.log("\n4. Verifying Classroom View After Attempt 1 Approved...");
    const postAtt1Res = await fetch(`http://localhost:3002/api/classrooms/${encodeURIComponent(CLASSROOM_ID)}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const postAtt1Data = await postAtt1Res.json();
    const cardAfter1 = postAtt1Data.data.papers.find(p => p.title.toLowerCase().includes("complex"));
    console.log(`  Card Title: "${cardAfter1.title}" | Attempt Count: ${cardAfter1.attemptCount}`);
    console.log(`  Has Approved Attempt: ${cardAfter1.hasApprovedAttempt} (UI will show 'Re-Attempt')`);
    console.log(`  Is Remedial: ${cardAfter1.isRemedial}`);

    if (!cardAfter1.hasApprovedAttempt || cardAfter1.attemptCount !== 1) {
      throw new Error(`Expected hasApprovedAttempt: true, attemptCount: 1. Got ${cardAfter1.attemptCount}`);
    }

    // -------------------------------------------------------------
    // ATTEMPT 2: Student re-attempts -> Gets a different standard set (e.g. Set C)
    // -------------------------------------------------------------
    console.log("\n5. ATTEMPT 2: Fetching Paper & Submitting...");
    const p2Res = await fetch(`http://localhost:3002/api/student/teacher-papers/${cardAfter1.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const p2Data = await p2Res.json();
    console.log(`  Exam Assigned Paper ID: ${p2Data.data.id} (Different from Attempt 1: ${p2Data.data.id !== complexPaperCard.id})`);
    if (p2Data.data.id === complexPaperCard.id) {
      throw new Error("Attempt 2 should be assigned a different set from Attempt 1!");
    }
    const qList2 = p2Data.data.questions;

    const answers2 = {};
    qList2.forEach(q => { answers2[q.id] = { text: "Student response 2" }; });

    const sub2Res = await fetch(`http://localhost:3002/api/student/teacher-papers/${cardAfter1.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ answers: answers2, timeTaken: 110 })
    });
    const sub2Data = await sub2Res.json();
    if (!sub2Data.success) throw new Error("Attempt 2 submission failed: " + JSON.stringify(sub2Data));
    console.log(`  Submitted Attempt 2 ID: ${sub2Data.data.attemptId}`);

    // Set to awaiting_approval so teacher can immediately approve
    await pool.query(`UPDATE exam_attempts SET grading_status = 'awaiting_approval' WHERE id = $1`, [sub2Data.data.attemptId]);

    // Teacher grades Attempt 2: Q3 (index 2) gets 1/4 (semi-correct again), Q6 (index 5) gets 0/4
    const grades2 = {};
    qList2.forEach((q, idx) => {
      const maxMarks = q.marks || 3;
      if (idx === 2) {
        grades2[q.id] = { score: 1, feedback: "Struggled on complex equality again" };
      } else if (idx === 5) {
        grades2[q.id] = { score: 0, feedback: "Division of complex numbers wrong" };
      } else {
        grades2[q.id] = { score: maxMarks, feedback: "Well done" };
      }
    });

    const app2Res = await fetch(`http://localhost:3002/api/teacher/classrooms/${encodeURIComponent(CLASSROOM_ID)}/attempts/${sub2Data.data.attemptId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ grades: grades2, overallFeedback: "Reviewed attempt 2" })
    });
    const app2Data = await app2Res.json();
    if (!app2Data.success) throw new Error("Attempt 2 approval failed: " + JSON.stringify(app2Data));
    console.log(`  Teacher Approved Attempt 2: Score ${app2Data.data.totalScore}/${app2Data.data.totalMaxMarks} (${app2Data.data.percentage}%)`);

    // -------------------------------------------------------------
    // ATTEMPT 3: RE-ATTEMPT -> Must be WEAK AREAS REMEDIAL TEST!
    // -------------------------------------------------------------
    console.log("\n6. ATTEMPT 3: Checking Classroom View for Remedial Test...");
    const postAtt2Res = await fetch(`http://localhost:3002/api/classrooms/${encodeURIComponent(CLASSROOM_ID)}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const postAtt2Data = await postAtt2Res.json();
    const cardAfter2 = postAtt2Data.data.papers.find(p => p.title.toLowerCase().includes("complex"));
    console.log(`  Card Title: "${cardAfter2.title}" | Attempt Count: ${cardAfter2.attemptCount}`);
    console.log(`  Is Remedial: ${cardAfter2.isRemedial} (Should be TRUE!)`);
    console.log(`  Step in Cycle: ${cardAfter2.stepInCycle} (Should be 3)`);

    if (!cardAfter2.isRemedial || cardAfter2.stepInCycle !== 3) {
      throw new Error("Attempt 3 MUST be a Remedial / Weak Areas Practice Test!");
    }

    console.log("\n7. Fetching Attempt 3 Exam Paper Content...");
    const p3Res = await fetch(`http://localhost:3002/api/student/teacher-papers/${cardAfter2.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const p3Data = await p3Res.json();
    console.log(`  Remedial Exam Title: "${p3Data.data.title}"`);
    console.log(`  Remedial Total Questions: ${p3Data.data.questions.length} (Expected 15)`);
    console.log(`  Remedial Total Marks: ${p3Data.data.totalMarks}`);

    if (p3Data.data.questions.length !== 15) {
      throw new Error(`Expected 15 questions in remedial paper, got ${p3Data.data.questions.length}`);
    }

    console.log("  Sample questions in Remedial paper:");
    p3Data.data.questions.slice(0, 4).forEach((q, i) => {
      console.log(`    Q${q.questionNumber} (${q.marks} marks): "${q.questionText.substring(0, 60)}..."`);
    });

    // Submit Attempt 3 (Remedial)
    const answers3 = {};
    p3Data.data.questions.forEach(q => { answers3[q.id] = { text: "Remedial practice answer" }; });
    const sub3Res = await fetch(`http://localhost:3002/api/student/teacher-papers/${cardAfter2.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ answers: answers3, timeTaken: 90 })
    });
    const sub3Data = await sub3Res.json();
    if (!sub3Data.success) throw new Error("Attempt 3 submission failed: " + JSON.stringify(sub3Data));
    console.log(`  Submitted Attempt 3 (Remedial) ID: ${sub3Data.data.attemptId}`);

    // Set to awaiting_approval so teacher can immediately approve
    await pool.query(`UPDATE exam_attempts SET grading_status = 'awaiting_approval' WHERE id = $1`, [sub3Data.data.attemptId]);

    // Teacher approves Attempt 3
    const grades3 = {};
    p3Data.data.questions.forEach(q => {
      grades3[q.id] = { score: q.marks || 3, feedback: "Great improvement on weak areas!" };
    });
    const app3Res = await fetch(`http://localhost:3002/api/teacher/classrooms/${encodeURIComponent(CLASSROOM_ID)}/attempts/${sub3Data.data.attemptId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ grades: grades3, overallFeedback: "Full mastery on weak areas." })
    });
    const app3Data = await app3Res.json();
    if (!app3Data.success) throw new Error("Attempt 3 approval failed: " + JSON.stringify(app3Data));
    console.log(`  Teacher Approved Attempt 3: Score ${app3Data.data.totalScore}/${app3Data.data.totalMaxMarks} (${app3Data.data.percentage}%)`);

    // -------------------------------------------------------------
    // ATTEMPT 4: CYCLE 2 STARTS! -> Should be Standard Set (e.g. Set B)
    // -------------------------------------------------------------
    console.log("\n8. ATTEMPT 4: Verifying Cycle 2 repeats standard set rotation...");
    const postAtt3Res = await fetch(`http://localhost:3002/api/classrooms/${encodeURIComponent(CLASSROOM_ID)}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const postAtt3Data = await postAtt3Res.json();
    const cardAfter3 = postAtt3Data.data.papers.find(p => p.title.toLowerCase().includes("complex"));
    console.log(`  Attempt 4 Card: Attempt Count = ${cardAfter3.attemptCount} | Is Remedial = ${cardAfter3.isRemedial} (Should be FALSE) | Step = ${cardAfter3.stepInCycle}`);

    if (cardAfter3.isRemedial || cardAfter3.stepInCycle !== 1) {
      throw new Error("Attempt 4 MUST be a standard set (Cycle 2, Step 1)!");
    }

    // Check student classroom attempts API returns sequential attemptNumber
    console.log("\n9. Verifying Classroom Attempts & Results API history...");
    const attHistoryRes = await fetch(`http://localhost:3002/api/student/classrooms/${encodeURIComponent(CLASSROOM_ID)}/attempts`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const attHistoryData = await attHistoryRes.json();
    console.log(`  Total student history attempts: ${attHistoryData.data.attempts.length}`);
    attHistoryData.data.attempts.forEach(a => {
      console.log(`  - ${a.attemptNumber} attempt: "${a.paperTitle}" | Score: ${a.score}/${a.totalMarks} (${a.percentage}%)`);
    });

    console.log("\n==================================================");
    console.log("ALL 3-ATTEMPT REMEDIAL CYCLE TESTS PASSED 100%!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
