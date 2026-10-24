/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ quiet: true });
const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    await client.query("SET LOCAL statement_timeout = 3000");
    const { rows } = await client.query(`
      SELECT to_regclass('public.notifications') IS NOT NULL
         AND to_regclass('public.idx_notifications_user') IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM (VALUES ('user_id'), ('is_read'), ('created_at'),
                               ('metadata')) AS required(column_name)
           WHERE NOT EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema = 'public' AND c.table_name = 'notifications'
               AND c.column_name = required.column_name
           )
         ) AS ready
    `);
    if (!rows[0]?.ready) throw new Error("Notifications schema is not ready.");
    console.log("Notifications schema ready.");
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Notifications schema check failed:", error);
  process.exitCode = 1;
});
