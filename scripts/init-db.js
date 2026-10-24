const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV !== "production" && process.env.DATABASE_SSL === "false"
    ? false : { rejectUnauthorized: true },
});

async function initDb() {
  const client = await pool.connect();
  try {
    console.log("Initializing database tables...");

    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        father_name TEXT,
        dob DATE,
        class TEXT NOT NULL,
        board TEXT NOT NULL DEFAULT 'AKUEB',
        school_name TEXT,
        otp_code TEXT,
        otp_purpose TEXT,
        otp_expiry TIMESTAMP WITH TIME ZONE,
        is_verified BOOLEAN DEFAULT FALSE,
        token_version INTEGER NOT NULL DEFAULT 1,
        points INTEGER DEFAULT 0,
        rank INTEGER,
        role TEXT NOT NULL DEFAULT 'STUDENT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
