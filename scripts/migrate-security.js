const { Pool } = require("pg");
require("dotenv").config();

// If DATABASE_URL was populated with a masked string (e.g., Netlify CLI pulling secret env vars),
// force reload from the local .env file.
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("***")) {
  require("dotenv").config({ override: true });
}

async function main() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl || rawUrl.includes("***")) {
    console.warn("[migrate-security] Skipping: DATABASE_URL is missing or masked in this environment.");
    return;
  }

  let connectionString = rawUrl;
  try {
    const databaseUrl = new URL(rawUrl);
    databaseUrl.searchParams.delete("sslmode");
    databaseUrl.searchParams.delete("ssl");
    databaseUrl.searchParams.delete("channel_binding");
    connectionString = databaseUrl.toString();
  } catch (err) {
    console.warn("[migrate-security] Failed to parse DATABASE_URL as URL, using raw string:", err.message);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV !== "production" && process.env.DATABASE_SSL === "false"
      ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_purpose TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID;
        ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS strict_mode BOOLEAN DEFAULT FALSE;
        ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS allow_resume BOOLEAN DEFAULT TRUE;
        CREATE TABLE IF NOT EXISTS security_rate_limits (
          key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS manual_grading_rewards (
          attempt_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL, points INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await client.query("COMMIT");
      console.log("Security schema is ready");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (connErr) {
    console.warn("[migrate-security] Database connection warning:", connErr.message);
    console.warn("[migrate-security] Continuing build with existing schema.");
    return;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.warn("[migrate-security] Non-critical migration warning:", error.message);
});

