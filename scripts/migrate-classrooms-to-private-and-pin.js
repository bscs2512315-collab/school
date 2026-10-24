/**
 * Migration script:
 * 1. Adds pin_code column to teacher_classrooms
 * 2. Deletes all public / school classrooms (keeping private classrooms intact)
 * 3. Assigns unique 6-character PIN codes to all private classrooms
 * 4. Cleans up '(Private)' suffixes from classroom names
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePin(length = 6) {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)];
  }
  return pin;
}

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("=== Starting Classroom Private & PIN Code Migration ===");

    // 1. Add pin_code column
    await client.query(`
      ALTER TABLE teacher_classrooms
      ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_classrooms_pin
      ON teacher_classrooms(pin_code)
      WHERE pin_code IS NOT NULL;
    `);
    console.log("1. Ensured pin_code column and unique index exist.");

    // 2. Count before delete
    const { rows: publicRooms } = await client.query(`
      SELECT id, name FROM teacher_classrooms WHERE visibility != 'private' OR visibility = 'school'
    `);
    console.log(`2. Found ${publicRooms.length} public/school classrooms to delete:`, publicRooms.map(r => r.name));

    // Delete public/school classrooms
    const delRes = await client.query(`
      DELETE FROM teacher_classrooms
      WHERE visibility != 'private' OR visibility = 'school';
    `);
    console.log(`   -> Deleted ${delRes.rowCount} public classrooms.`);

    // 3. Inspect remaining private classrooms
    const { rows: privateRooms } = await client.query(`
      SELECT id, name, pin_code, subject, class_level, board, teacher_id FROM teacher_classrooms
    `);
    console.log(`3. Found ${privateRooms.length} private classrooms to preserve:`);

    const usedPins = new Set();
    for (const room of privateRooms) {
      let pin = room.pin_code;
      if (!pin) {
        do {
          pin = generatePin(6);
        } while (usedPins.has(pin));
      }
      usedPins.add(pin);

      // Clean up name if it contains " (Private)"
      let cleanName = room.name || `${room.subject} - Class ${room.class_level}`;
      cleanName = cleanName.replace(/\s*\(Private\)\s*/gi, "").trim();

      await client.query(`
        UPDATE teacher_classrooms
        SET visibility = 'private',
            pin_code = $1,
            name = $2
        WHERE id = $3
      `, [pin, cleanName, room.id]);

      console.log(`   - Preserved: "${cleanName}" (ID: ${room.id}) -> PIN: ${pin}`);
    }

    console.log("=== Migration Completed Successfully ===");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
