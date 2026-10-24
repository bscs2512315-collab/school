require("dotenv").config({ path: "/Users/muhammadtahatalib/Projects/ExBoardAI/.env" });
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const KEEP_CLASSROOM_ID = "f69fd798-8a66-44a5-8634-3abcd82c04f0__Mathematics__X__private";

async function runCleanup() {
  const client = await pool.connect();
  try {
    console.log("=== STARTING DATABASE CLEANUP ===");
    console.log("Classroom to KEEP:", KEEP_CLASSROOM_ID);

    await client.query("BEGIN");

    // 1. Check target classroom exists before deleting anything
    const { rows: targetCheck } = await client.query(
      "SELECT id, name, subject, class_level FROM teacher_classrooms WHERE id = $1",
      [KEEP_CLASSROOM_ID]
    );

    if (targetCheck.length === 0) {
      throw new Error(`CRITICAL: Target classroom ${KEEP_CLASSROOM_ID} was NOT found! Aborting.`);
    }
    console.log("Target classroom confirmed:", targetCheck[0]);

    // 2. Delete classroom members of other classrooms
    const delMembers = await client.query(
      "DELETE FROM classroom_members WHERE classroom_id != $1",
      [KEEP_CLASSROOM_ID]
    );
    console.log(`Deleted ${delMembers.rowCount} classroom_members from other classrooms.`);

    // 3. Delete papers of other classrooms (keeping null or target)
    const delPapers = await client.query(
      "DELETE FROM teacher_papers WHERE classroom_id IS NOT NULL AND classroom_id != $1",
      [KEEP_CLASSROOM_ID]
    );
    console.log(`Deleted ${delPapers.rowCount} teacher_papers from other classrooms.`);

    // 4. Delete other classrooms from teacher_classrooms
    const delClassrooms = await client.query(
      "DELETE FROM teacher_classrooms WHERE id != $1",
      [KEEP_CLASSROOM_ID]
    );
    console.log(`Deleted ${delClassrooms.rowCount} teacher_classrooms.`);

    await client.query("COMMIT");
    console.log("=== CLEANUP COMMITTED SUCCESSFULLY ===");

    // Post-check verification
    const { rows: remainingClassrooms } = await client.query("SELECT id, name FROM teacher_classrooms");
    console.log(`Remaining classrooms in DB: ${remainingClassrooms.length}`);
    remainingClassrooms.forEach(c => console.log(`- ${c.id} (${c.name})`));

    const { rows: remainingMembers } = await client.query(
      "SELECT student_id, status FROM classroom_members WHERE classroom_id = $1",
      [KEEP_CLASSROOM_ID]
    );
    console.log(`Remaining members in target classroom: ${remainingMembers.length}`);

    const { rows: remainingPapers } = await client.query(
      "SELECT id, title FROM teacher_papers WHERE classroom_id = $1",
      [KEEP_CLASSROOM_ID]
    );
    console.log(`Remaining papers in target classroom: ${remainingPapers.length}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Cleanup failed, rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runCleanup();
