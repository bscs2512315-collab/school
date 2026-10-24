const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initSchools() {
  try {
    console.log("🚀 Starting School Account Initialization...");
    
    // 1. Fetch unique school names from STUDENT records
    const { rows: schoolNames } = await pool.query(`
      SELECT DISTINCT school_name 
      FROM users 
      WHERE role = 'STUDENT' AND school_name IS NOT NULL AND school_name != ''
    `);

    console.log(`🔍 Found ${schoolNames.length} unique institutions to evaluate.`);

    const passwordHash = await bcrypt.hash("Test@123", 10);

    for (const row of schoolNames) {
      const name = row.school_name;
      // Slugify name for email (e.g., "The H.A.S Academy" -> "hasacademy")
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const email = `mtahatalib110+${slug}@gmail.com`;

      console.log(`📁 Processing: "${name}" -> ${email}`);

      // 2. Check if account already exists
      const { rows: existing } = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existing.length > 0) {
        console.log(`⚠️  Account already exists for ${email}. Skipping.`);
        continue;
      }

      // 3. Create SCHOOL account
      await pool.query(
        `INSERT INTO users (
          id, email, password, name, role, is_verified, school_name, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
        )`,
        [
          `school_${Math.random().toString(36).substring(2, 11)}`, 
          email,
          passwordHash,
          name,
          "SCHOOL",
          true,
          name]
      );

      console.log(`✅ Created School Account for: "${name}"`);
    }

    console.log("🎉 School Account Initialization Complete!");
  } catch (error) {
    console.error("❌ Error initializing schools:", error);
  } finally {
    await pool.end();
  }
}

initSchools();
