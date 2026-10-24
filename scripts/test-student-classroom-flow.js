const { SignJWT } = require("jose");
require("dotenv").config({ path: "/Users/muhammadtahatalib/Projects/ExBoardAI/.env" });

const CLASSROOM_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0__Mathematics__X__private";
const TEACHER_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0";

const students = [
  { id: "6834b3cc-cefb-4026-8cb5-a89de866b46f", name: "Laraib", email: "syedalaraibfatima234@gmail.com" },
  { id: "12c4855f-84b3-43e4-99ba-00139be6cc65", name: "Zainab", email: "hussaintheboss052@gmail.com" },
  { id: "e21b23ae-3ae1-4ccd-b8da-5934994c7fa3", name: "Taha", email: "mtahatalib110+3@gmail.com" }
];

async function makeToken(userId, email, role) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

async function run() {
  try {
    console.log("=== 1. Testing Student Classroom API ===");
    for (const student of students) {
      const token = await makeToken(student.id, student.email, "STUDENT");
      const res = await fetch(`http://localhost:3002/api/classrooms/${encodeURIComponent(CLASSROOM_ID)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(`Failed to fetch classroom for ${student.name}: ${JSON.stringify(data)}`);
      }

      console.log(`\nStudent: ${student.name} (${student.id})`);
      console.log(`  Visible Practice Test Cards: ${data.data.papers.length}`);
      data.data.papers.forEach(p => {
        console.log(`  - Card Title: "${p.title}" | Assigned Paper ID: ${p.id} | Questions: ${p.totalQuestions}`);
      });

      // Verify that student cannot have duplicate choice of Sets A, B, C, D
      const cnAlphaCount = data.data.papers.filter(p => p.title.toLowerCase().includes("complex")).length;
      const qeAlphaCount = data.data.papers.filter(p => p.title.toLowerCase().includes("quadratic")).length;

      if (cnAlphaCount !== 1 || qeAlphaCount !== 1) {
        throw new Error(`Expected exactly 1 card per test group, got CN=${cnAlphaCount}, QE=${qeAlphaCount}`);
      }

      // Test fetching the attempt paper for the assigned card
      const assignedPaperId = data.data.papers[0].id;
      const paperRes = await fetch(`http://localhost:3002/api/student/teacher-papers/${assignedPaperId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const paperData = await paperRes.json();
      console.log(`  Exam Endpoint Check: status ${paperRes.status}, title in exam: "${paperData.data.title}", questions: ${paperData.data.questions.length}`);
    }

    console.log("\n=== 2. Testing Teacher View (Teacher still sees all sets) ===");
    const teacherToken = await makeToken(TEACHER_ID, "mtahatalib110@gmail.com", "TEACHER");
    const teacherRes = await fetch(`http://localhost:3002/api/teacher/papers?classroomId=${encodeURIComponent(CLASSROOM_ID)}`, {
      headers: { Authorization: `Bearer ${token = teacherToken}` }
    });
    const teacherData = await teacherRes.json();
    console.log(`Teacher sees total created papers/sets: ${teacherData.data.length}`);
    teacherData.data.forEach(p => {
      console.log(`  - ${p.title} (${p.id})`);
    });

    console.log("\n=== 3. Testing Classroom Performance Analytics ===");
    for (const student of students) {
      const token = await makeToken(student.id, student.email, "STUDENT");
      const perfRes = await fetch(`http://localhost:3002/api/student/classrooms/${encodeURIComponent(CLASSROOM_ID)}/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const perfData = await perfRes.json();
      if (!perfData.success) {
        throw new Error(`Performance failed for ${student.name}: ${JSON.stringify(perfData)}`);
      }
      console.log(`\nPerformance for ${student.name}:`);
      console.log(`  Mastery: ${perfData.data.summary.overallPercentage}% | Marks: ${perfData.data.summary.totalMarksEarned}/${perfData.data.summary.totalMarksPossible} | Tests: ${perfData.data.summary.totalTestsAttempted}/${perfData.data.summary.totalTestsAssigned}`);
      console.log(`  Difficulty Tiers: Alpha=${perfData.data.summary.difficultyBreakdown.alpha.percentage}%, Beta=${perfData.data.summary.difficultyBreakdown.beta.percentage}%, Gamma=${perfData.data.summary.difficultyBreakdown.gamma.percentage}%`);
      console.log(`  Chapters: ${perfData.data.chapters.map(c => `Ch ${c.chapterNumber} (${c.chapterName}): ${c.accuracyPercentage}% [${c.status}]`).join(" | ")}`);
    }

    // Test Teacher Classroom Aggregate & Filtered Student Performance
    const teacherPerfRes = await fetch(`http://localhost:3002/api/student/classrooms/${encodeURIComponent(CLASSROOM_ID)}/performance`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    const teacherPerfData = await teacherPerfRes.json();
    console.log(`\nTeacher View (Classroom Aggregate):`);
    console.log(`  Class Mastery: ${teacherPerfData.data.summary.overallPercentage}% | Tests Attempted: ${teacherPerfData.data.summary.totalTestsAttempted} | Graded: ${teacherPerfData.data.summary.gradedAttemptsCount}`);

    const teacherFilteredRes = await fetch(`http://localhost:3002/api/student/classrooms/${encodeURIComponent(CLASSROOM_ID)}/performance?studentId=${students[0].id}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    const teacherFilteredData = await teacherFilteredRes.json();
    console.log(`\nTeacher View (Filtered for ${students[0].name}):`);
    console.log(`  Student: ${teacherFilteredData.data.student.name} (${teacherFilteredData.data.student.email})`);
    console.log(`  Mastery: ${teacherFilteredData.data.summary.overallPercentage}%`);

    console.log("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

run();
