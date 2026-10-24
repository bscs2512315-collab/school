import "dotenv/config";
import { db } from "../lib/db";
import { ensureClassroomSchema } from "../lib/teacher/classroom-schema";

async function main() {
  try {
    await ensureClassroomSchema({ forceMigration: true });
    console.log("Classroom schema migration completed.");
  } finally {
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error("Classroom schema migration failed:", error);
  process.exitCode = 1;
});
