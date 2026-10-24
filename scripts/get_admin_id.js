const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getAdminId() {
  try {
    const { rows } = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (rows.length > 0) {
      console.log(rows[0].id);
    } else {
      console.error('No admin found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

getAdminId();
