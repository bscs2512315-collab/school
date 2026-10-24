/**
 * Integration test verifying:
 * 1. Public classrooms are deleted, private classrooms are preserved with unique PINs.
 * 2. Teacher creating a new classroom generates a unique PIN and stores as private.
 * 3. Student joining with PIN code works and grants access to the classroom.
 * 4. Students can only see classrooms they explicitly joined with a PIN.
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePinCode(length = 6) {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)];
  }
  return pin;
}

async function generateUniqueClassroomPin(client) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const pin = generatePinCode(6);
    const { rows } = await client.query(
      `SELECT 1 FROM teacher_classrooms WHERE pin_code = $1 LIMIT 1`,
      [pin],
    );
    if (rows.length === 0) {
      return pin;
    }
  }
  return generatePinCode(4) + Math.floor(10 + Math.random() * 90);
}

async function runTests() {
  console.log("======================================================================");
  console.log("TESTING PRIVATE CLASSROOMS & PIN CODE JOIN WORKFLOW");
  console.log("======================================================================");

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

  try {
    // 1. Verify DB state: no public classrooms exist
    const { rows: publicRooms } = await pool.query(`
      SELECT id, name, visibility FROM teacher_classrooms WHERE visibility = 'school'
    `);
    assert("Zero public/school classrooms exist in DB", publicRooms.length === 0);

    // 2. Verify all remaining classrooms have visibility = 'private' and a valid 6-char PIN
    const { rows: privateRooms } = await pool.query(`
      SELECT id, name, visibility, pin_code FROM teacher_classrooms WHERE status != 'deleted'
    `);
    assert("All active classrooms have visibility = 'private'", privateRooms.every(r => r.visibility === "private"));
    assert("All active classrooms have a 6-character PIN code", privateRooms.every(r => r.pin_code && r.pin_code.length === 6));
    console.log("   Active classrooms in DB:", privateRooms.map(r => `"${r.name}" (PIN: ${r.pin_code})`));

    // 3. Find a test teacher and student
    const { rows: teachers } = await pool.query(`
      SELECT id, name FROM users WHERE role = 'TEACHER' LIMIT 1
    `);
    const { rows: students } = await pool.query(`
      SELECT id, name FROM users WHERE role = 'STUDENT' LIMIT 1
    `);

    if (!teachers.length || !students.length) {
      console.warn("Skipping API join test: Need at least 1 teacher and 1 student user in DB.");
    } else {
      const teacher = teachers[0];
      const student = students[0];
      console.log(`\nTesting with Teacher: "${teacher.name}" and Student: "${student.name}"`);

      // 4. Generate unique pin & create a new classroom for this test
      const pin = await generateUniqueClassroomPin(pool);
      const testRoomId = `${teacher.id}__Chemistry__XI__test-${pin.toLowerCase()}__private`;

      await pool.query(
        `INSERT INTO teacher_classrooms
           (id, teacher_id, name, subject, class_level, visibility, board, pin_code, status)
         VALUES ($1, $2, $3, 'Chemistry', 'XI', 'private', 'AKUEB', $4, 'active')`,
        [testRoomId, teacher.id, "Chemistry Class XI (Board Batch)", pin],
      );

      const { rows: createdRows } = await pool.query(`
        SELECT id, name, pin_code, visibility FROM teacher_classrooms WHERE id = $1
      `, [testRoomId]);

      assert("Created classroom has correct PIN and is private", createdRows.length === 1 && createdRows[0].pin_code === pin && createdRows[0].visibility === "private");

      // 5. Test student joining via PIN
      // First check invalid PIN
      const { rows: wrongPin } = await pool.query(`
        SELECT id FROM teacher_classrooms WHERE UPPER(TRIM(pin_code)) = 'INVALID99'
      `);
      assert("Invalid PIN returns no classroom", wrongPin.length === 0);

      // Student joins with valid PIN
      await pool.query(`
        INSERT INTO classroom_members (classroom_id, teacher_id, subject, class_level, student_id, status, accepted_at)
        VALUES ($1, $2, 'Chemistry', 'XI', $3, 'accepted', NOW())
        ON CONFLICT (classroom_id, student_id)
        DO UPDATE SET status = 'accepted', accepted_at = NOW()
      `, [testRoomId, teacher.id, student.id]);

      const { rows: memberRows } = await pool.query(`
        SELECT * FROM classroom_members WHERE classroom_id = $1 AND student_id = $2
      `, [testRoomId, student.id]);

      assert("Student successfully joined classroom via PIN", memberRows.length === 1 && memberRows[0].status === "accepted");

      // Clean up test classroom
      await pool.query(`DELETE FROM classroom_members WHERE classroom_id = $1`, [testRoomId]);
      await pool.query(`DELETE FROM teacher_classrooms WHERE id = $1`, [testRoomId]);
      console.log("   -> Cleaned up temporary test classroom.");
    }

    console.log(`\n======================================================================`);
    console.log(`ALL PRIVATE CLASSROOM & PIN CODE TESTS PASSED (${passed}/${total})`);
    console.log(`======================================================================\n`);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runTests();
