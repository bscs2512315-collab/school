const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setup() {
  const hash = await bcrypt.hash('Test@123', 10);
  const email = 'mtahatalib110+teststudent@gmail.com';
  
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (id, email, password, name, father_name, class, board, school_name, city, username, is_verified, onboarding_completed, role)
       VALUES (gen_random_uuid(), $1, $2, 'Test Student B', 'Father B', 'IX', 'AKUEB', 'Karachi Grammar School', 'Karachi', 'test_student_b', true, true, 'STUDENT')`,
      [email, hash]
    );
    console.log('Created Student B account:', email);
  } else {
    await pool.query(
      `UPDATE users SET password = $1, is_verified = true, onboarding_completed = true, class = 'IX', board = 'AKUEB' WHERE email = $2`,
      [hash, email]
    );
    console.log('Updated Student B account credentials:', email);
  }
  pool.end();
}
setup();
