const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setupMilestones() {
  const client = await pool.connect();
  try {
    console.log(
      "Dropping existing milestones table for a clean setup with 12 levels...",
    );
    await client.query(`DROP TABLE IF EXISTS milestones;`);

    console.log("Creating milestones table...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        level INTEGER NOT NULL,
        name TEXT NOT NULL,
        points_required INTEGER NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        bg_color TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert 12 default milestones
    await client.query(`
      INSERT INTO milestones (level, name, points_required, icon, color, bg_color) VALUES 
      (1, 'Novice', 0, 'Star', 'text-slate-500', 'bg-slate-500/10'),
      (2, 'Apprentice', 50, 'BookOpen', 'text-slate-600', 'bg-slate-600/10'),
      (3, 'Scholar', 150, 'BookOpen', 'text-blue-400', 'bg-blue-400/10'),
      (4, 'Warrior', 300, 'Flame', 'text-red-400', 'bg-red-400/10'),
      (5, 'Knight', 500, 'Shield', 'text-blue-500', 'bg-blue-500/10'),
      (6, 'Hero', 1000, 'Zap', 'text-amber-400', 'bg-amber-400/10'),
      (7, 'Champion', 2000, 'Trophy', 'text-amber-500', 'bg-amber-500/10'),
      (8, 'Master', 3500, 'Award', 'text-purple-400', 'bg-purple-400/10'),
      (9, 'Grandmaster', 5000, 'Crown', 'text-purple-500', 'bg-purple-500/10'),
      (10, 'Elite', 7500, 'Flame', 'text-emerald-500', 'bg-emerald-500/10'),
      (11, 'Legend', 10000, 'Star', 'text-yellow-400', 'bg-yellow-400/10'),
      (12, 'Mythic', 15000, 'Crown', 'text-rose-500', 'bg-rose-500/10')
    `);
    console.log("Milestones table created and seeded with 12 defaults.");
  } catch (err) {
    console.error("Error setting up milestones:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupMilestones();
