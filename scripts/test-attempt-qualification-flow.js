/**
 * Unit verification script for Counted Attempt Qualification & Variant Progression Rules.
 * Run with: node scripts/test-attempt-qualification-flow.js
 */

const { isCountedAttempt } = require("../lib/paper/variant-assignment");

function runTests() {
  console.log("=== Testing isCountedAttempt Rules ===");
  let passed = 0;
  let total = 0;

  function assert(name, condition) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      process.exitCode = 1;
    }
  }

  // 1. Ungraded or pending attempt -> should NOT count
  assert(
    "Pending manual grading (auto-approval off) does NOT count",
    !isCountedAttempt({
      grading_status: "pending_manual",
      score: 80,
      total_marks: 100,
      manual_grader_id: null,
    })
  );

  assert(
    "Pending AI grading does NOT count",
    !isCountedAttempt({
      grading_status: "pending_ai",
      score: 0,
      total_marks: 100,
      manual_grader_id: null,
    })
  );

  // 2. Graded with <= 50% score and no teacher approval -> should NOT count
  assert(
    "Score 0% (auto-approved / no teacher manual approval) does NOT count",
    !isCountedAttempt({
      grading_status: "graded",
      score: 0,
      total_marks: 100,
      manual_grader_id: null,
    })
  );

  assert(
    "Score 50% (exactly 50%, no teacher manual approval) does NOT count",
    !isCountedAttempt({
      grading_status: "graded",
      score: 50,
      total_marks: 100,
      manual_grader_id: null,
    })
  );

  assert(
    "Score 40% (no teacher manual approval) does NOT count",
    !isCountedAttempt({
      grading_status: "graded",
      score: 4,
      total_marks: 10,
      manual_grader_id: null,
    })
  );

  // 3. Graded with > 50% score (auto-approved) -> DOES count
  assert(
    "Score 51% (auto-approved / no manual grader) DOES count",
    isCountedAttempt({
      grading_status: "graded",
      score: 51,
      total_marks: 100,
      manual_grader_id: null,
    })
  );

  assert(
    "Score 80% (auto-approved / no manual grader) DOES count",
    isCountedAttempt({
      grading_status: "graded",
      score: 80,
      total_marks: 100,
      manual_grader_id: null,
    })
  );

  // 4. Graded with teacher approval (manual_grader_id set) -> ALWAYS counts regardless of score
  assert(
    "Score 0% WITH teacher approval DOES count",
    isCountedAttempt({
      grading_status: "graded",
      score: 0,
      total_marks: 100,
      manual_grader_id: "teacher-uuid-123",
    })
  );

  assert(
    "Score 30% WITH teacher approval DOES count",
    isCountedAttempt({
      grading_status: "graded",
      score: 30,
      total_marks: 100,
      manual_grader_id: "teacher-uuid-123",
    })
  );

  assert(
    "Score 90% WITH teacher approval DOES count",
    isCountedAttempt({
      grading_status: "graded",
      score: 90,
      total_marks: 100,
      manual_grader_id: "teacher-uuid-123",
    })
  );

  console.log(`\nResults: ${passed}/${total} basic qualification tests passed.\n`);

  console.log("=== Testing Progression Logic & Same-Set Retention ===");

  const variants = [
    { id: "paper-set-a", title: "Maths Final 2026 (Set A)", paper_type: "paper1" },
    { id: "paper-set-b", title: "Maths Final 2026 (Set B)", paper_type: "paper1" },
    { id: "paper-set-c", title: "Maths Final 2026 (Set C)", paper_type: "paper1" },
    { id: "paper-set-d", title: "Maths Final 2026 (Set D)", paper_type: "paper1" },
  ];

  // Helper simulating the core progression logic from getAssignedVariantForStudent
  function simulateAssignment(attempts) {
    const latestAttempt = attempts[attempts.length - 1];
    if (latestAttempt && !isCountedAttempt(latestAttempt)) {
      const active = variants.find((v) => v.id === latestAttempt.teacher_paper_id);
      return { assigned: active, reason: "retained_uncounted_same_set" };
    }

    const countedAttempts = attempts.filter(isCountedAttempt);
    const approvedCount = countedAttempts.length;
    const stepInCycle = (approvedCount % 3) + 1;
    const cycleNumber = Math.floor(approvedCount / 3) + 1;

    if (stepInCycle === 1) {
      return { assigned: variants[0], stepInCycle, cycleNumber, reason: "step_1_set_a" };
    } else if (stepInCycle === 2) {
      return { assigned: variants[2], stepInCycle, cycleNumber, reason: "step_2_set_c" };
    } else {
      return { assigned: { id: "remedial-id", title: "Maths Final 2026 (Weak Areas Practice)" }, stepInCycle, cycleNumber, reason: "step_3_remedial" };
    }
  }

  // Simulation 1: User attempts Set A, scores 0% with auto-approval ON.
  // Expectation: Re-attempt serves Set A (same test).
  const sim1Attempts = [
    {
      teacher_paper_id: "paper-set-a",
      grading_status: "graded",
      score: 0,
      total_marks: 100,
      manual_grader_id: null,
    },
  ];
  const sim1Res = simulateAssignment(sim1Attempts);
  assert(
    "Scenario 1: Auto-approval ON, score 0% -> serves SAME test (Set A)",
    sim1Res.assigned.id === "paper-set-a" && sim1Res.reason === "retained_uncounted_same_set"
  );

  // Simulation 2: Auto-approval OFF, student attempted Set A, unapproved by teacher.
  // Expectation: Re-attempt serves Set A (same test).
  const sim2Attempts = [
    {
      teacher_paper_id: "paper-set-a",
      grading_status: "pending_manual",
      score: 40,
      total_marks: 100,
      manual_grader_id: null,
    },
  ];
  const sim2Res = simulateAssignment(sim2Attempts);
  assert(
    "Scenario 2A: Auto-approval OFF, unapproved -> serves SAME test (Set A)",
    sim2Res.assigned.id === "paper-set-a" && sim2Res.reason === "retained_uncounted_same_set"
  );

  // Simulation 2B: Teacher approves the 40% attempt from Scenario 2A.
  // Expectation: Next attempt advances to Step 2 (Set C).
  const sim2BAttempts = [
    {
      teacher_paper_id: "paper-set-a",
      grading_status: "graded",
      score: 40,
      total_marks: 100,
      manual_grader_id: "teacher-123",
    },
  ];
  const sim2BRes = simulateAssignment(sim2BAttempts);
  assert(
    "Scenario 2B: Teacher approves -> advances to Set C (Attempt 2)",
    sim2BRes.assigned.id === "paper-set-c" && sim2BRes.stepInCycle === 2
  );

  // Simulation 3: Auto-approval ON, student scores 80% (>50%) on Set A.
  // Expectation: Next attempt advances to Step 2 (Set C).
  const sim3Attempts = [
    {
      teacher_paper_id: "paper-set-a",
      grading_status: "graded",
      score: 80,
      total_marks: 100,
      manual_grader_id: null,
    },
  ];
  const sim3Res = simulateAssignment(sim3Attempts);
  assert(
    "Scenario 3: Auto-approval ON, score 80% (>50%) -> advances to Set C (Attempt 2)",
    sim3Res.assigned.id === "paper-set-c" && sim3Res.stepInCycle === 2
  );

  // Simulation 4: Student scored 80% on Set A, then 75% on Set C.
  // Expectation: 3rd attempt serves Remedial Weak Areas Test!
  const sim4Attempts = [
    {
      teacher_paper_id: "paper-set-a",
      grading_status: "graded",
      score: 80,
      total_marks: 100,
      manual_grader_id: null,
    },
    {
      teacher_paper_id: "paper-set-c",
      grading_status: "graded",
      score: 75,
      total_marks: 100,
      manual_grader_id: null,
    },
  ];
  const sim4Res = simulateAssignment(sim4Attempts);
  assert(
    "Scenario 4: Two counted attempts (>50%) -> advances to Weak Areas Practice Test (Attempt 3)",
    sim4Res.assigned.id === "remedial-id" && sim4Res.stepInCycle === 3
  );

  console.log(`\nAll Tests Completed: ${passed}/${total} passed.\n`);
}

runTests();
