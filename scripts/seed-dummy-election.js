const { Pool } = require("pg");
require("dotenv").config();

const EMAIL = "mtahatalib110@gmail.com";
const SLUG = "dummy-election";
const NAME = "Dummy Election";

const MALE_AVATARS = [
  "/avatars/male-1.png",
  "/avatars/male-2.png",
  "/avatars/male-3.png",
  "/avatars/male-islamic.png",
];
const FEMALE_AVATARS = [
  "/avatars/female-1.png",
  "/avatars/female-2.png",
  "/avatars/female-3.png",
  "/avatars/female-hijab.png",
];

const RACES = [
  {
    category: "President",
    gender: "male",
    names: [
      "Muhammad Taha",
      "Ahmed Khan",
      "Ali Raza",
      "Hassan Malik",
      "Bilal Ahmed",
    ],
  },
  {
    category: "President",
    gender: "female",
    names: ["Zara Ali", "Sara Shah", "Ayesha Khan", "Fatima Noor", "Hina Sheikh"],
  },
  {
    category: "Vice President",
    gender: "male",
    names: [
      "Usman Tariq",
      "Hamza Iqbal",
      "Omar Farooq",
      "Fahad Sheikh",
      "Daniyal Mehmood",
    ],
  },
  {
    category: "Vice President",
    gender: "female",
    names: [
      "Maryam Hassan",
      "Laiba Ahmed",
      "Noor Fatima",
      "Amna Siddiqui",
      "Mahnoor Khan",
    ],
  },
  {
    category: "General Secretary",
    gender: "male",
    names: [
      "Ibrahim Shah",
      "Saad Qureshi",
      "Rehan Ali",
      "Waleed Anwar",
      "Yousuf Kamal",
    ],
  },
  {
    category: "General Secretary",
    gender: "female",
    names: [
      "Sana Malik",
      "Iqra Javed",
      "Rida Batool",
      "Anum Rizvi",
      "Hira Yousaf",
    ],
  },
];

const CLASSES = ["XI", "XII", "XI", "XII", "XI"];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function ensureSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS election_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS election_candidates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      election_id UUID NOT NULL REFERENCES election_events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      class_level TEXT NOT NULL,
      section TEXT,
      position TEXT,
      gender TEXT,
      profile_image_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await client.query(`
    ALTER TABLE election_candidates
    ADD COLUMN IF NOT EXISTS position TEXT
  `);
  await client.query(`
    ALTER TABLE election_candidates
    ADD COLUMN IF NOT EXISTS gender TEXT
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS election_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      election_id UUID NOT NULL REFERENCES election_events(id) ON DELETE CASCADE,
      candidate_id UUID NOT NULL REFERENCES election_candidates(id) ON DELETE RESTRICT,
      voter_name TEXT NOT NULL,
      voter_roll_number TEXT NOT NULL,
      voter_roll_normalized TEXT NOT NULL,
      voter_email TEXT NOT NULL,
      race_key TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function main() {
  const client = await pool.connect();
  try {
    await ensureSchema(client);

    const { rows: users } = await client.query(
      `SELECT id, email, role, name FROM users WHERE lower(email) = $1 LIMIT 1`,
      [EMAIL],
    );
    if (users.length === 0) {
      throw new Error(`No user found for ${EMAIL}`);
    }
    const teacher = users[0];
    console.log(`Found ${teacher.role} ${teacher.name} (${teacher.email})`);

    await client.query(`
      ALTER TABLE election_events
      ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}'
    `);

    const startsAt = new Date("2026-09-06T00:00:00+05:00");
    const endsAt = new Date("2026-09-07T23:59:00+05:00");

    const { rows: existing } = await client.query(
      `SELECT id FROM election_events WHERE slug = $1 LIMIT 1`,
      [SLUG],
    );

    let electionId;
    if (existing[0]) {
      electionId = existing[0].id;
      await client.query(
        `UPDATE election_events
         SET teacher_id = $1, name = $2, starts_at = $3, ends_at = $4, updated_at = NOW()
         WHERE id = $5`,
        [teacher.id, NAME, startsAt.toISOString(), endsAt.toISOString(), electionId],
      );
      await client.query(`DELETE FROM election_votes WHERE election_id = $1`, [
        electionId,
      ]);
      await client.query(`DELETE FROM election_candidates WHERE election_id = $1`, [
        electionId,
      ]);
      console.log(`Updated existing election ${SLUG}`);
    } else {
      const inserted = await client.query(
        `INSERT INTO election_events (teacher_id, name, slug, starts_at, ends_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [teacher.id, NAME, SLUG, startsAt.toISOString(), endsAt.toISOString()],
      );
      electionId = inserted.rows[0].id;
      console.log(`Created election ${SLUG}`);
    }

    const avatars = { male: MALE_AVATARS, female: FEMALE_AVATARS };
    let count = 0;
    for (const race of RACES) {
      for (let i = 0; i < race.names.length; i += 1) {
        const avatarList = avatars[race.gender];
        await client.query(
          `INSERT INTO election_candidates
             (election_id, name, class_level, position, gender, profile_image_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            electionId,
            race.names[i],
            CLASSES[i],
            race.category,
            race.gender,
            avatarList[i % avatarList.length],
          ],
        );
        count += 1;
      }
    }

    const categories = [...new Set(RACES.map((race) => race.category))];
    await client.query(
      `UPDATE election_events SET categories = $1, updated_at = NOW() WHERE id = $2`,
      [categories, electionId],
    );

    console.log(`Inserted ${count} candidates across ${categories.length} categories`);
    console.log(`Public URL: /${SLUG}`);
    console.log(`Registration URL: /${SLUG}/register`);
    console.log(`Voting window: ${startsAt.toISOString()} → ${endsAt.toISOString()}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
