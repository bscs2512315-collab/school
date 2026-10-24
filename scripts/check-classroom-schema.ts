import "dotenv/config";
import { db } from "../lib/db";
import { ensureClassroomSchema } from "../lib/teacher/classroom-schema";

async function main() {
  const startedAt = performance.now();
  try {
    await ensureClassroomSchema();
    console.log(`Classroom schema ready (${(performance.now() - startedAt).toFixed(1)} ms).`);
  } finally {
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error("Classroom schema check failed:", error);
  process.exitCode = 1;
});
