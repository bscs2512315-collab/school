const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV !== "production" && process.env.DATABASE_SSL === "false"
    ? false : { rejectUnauthorized: true },
});

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log("Updating database schema...");

    // Add new columns to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS father_name TEXT,
      ADD COLUMN IF NOT EXISTS dob DATE,
      ADD COLUMN IF NOT EXISTS otp_code TEXT,
      ADD COLUMN IF NOT EXISTS otp_purpose TEXT,
      ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS student_count TEXT,
      ADD COLUMN IF NOT EXISTS registered_by_school BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS registration_id TEXT,
      ADD COLUMN IF NOT EXISTS school_id UUID,
      ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS gender TEXT;
    `);

    // Add strict_mode and allow_resume columns to past_papers table
    await client.query(`
      ALTER TABLE past_papers 
      ADD COLUMN IF NOT EXISTS strict_mode BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS allow_resume BOOLEAN DEFAULT TRUE;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS security_rate_limits (
        key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS manual_grading_rewards (
        attempt_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL, points INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Make class column nullable to support school registrations
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN class DROP NOT NULL;
    `);

    console.log("Schema updated successfully.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
