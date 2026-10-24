import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { uploadToCloudinary } from "../lib/storage/cloudinary";

const APPLY = process.argv.includes("--apply");
const scopeArgument = process.argv.find((argument) => argument.startsWith("--scope="))?.slice("--scope=".length);
const CROP_DIR = path.resolve("tmp/pdfs/class-ix-math/reviewed-crops");
type Assignment = { year: number; paper: number; question: number; part?: string; crop: string };

const assignments: Assignment[] = [
  ...[4, 5].map((question) => ({ year: 2021, paper: 1, question, crop: "2021-p1-q4-q5.png" })),
  ...[44, 45, 46, 47, 48, 49].map((question) => ({ year: 2021, paper: 1, question, crop: `2021-p1-q${question}.png` })),
  ...[6, 9, 15, 40, 41, 42, 45, 47, 49, 50].map((question) => ({ year: 2022, paper: 1, question, crop: `2022-p1-q${question}.png` })),
  ...[4, 31, 39, 40, 41, 42, 43, 44, 45].map((question) => ({ year: 2023, paper: 1, question, crop: `2023-p1-q${question}.png` })),
  ...[4, 39, 40, 41, 42, 43, 44, 45].map((question) => ({ year: 2024, paper: 1, question, crop: `2024-p1-q${question}.png` })),
  ...[3, 5, 39, 40, 41, 42, 43, 44, 45].map((question) => ({ year: 2025, paper: 1, question, crop: `2025-p1-q${question}.png` })),
  ...["i", "ii"].map((part) => ({ year: 2023, paper: 2, question: 1, part, crop: "2023-p2-q1-i.png" })),
  { year: 2023, paper: 2, question: 1, part: "iii", crop: "2023-p2-q1-iii.png" },
  ...["i", "ii", "iii"].map((part) => ({ year: 2023, paper: 2, question: 7, part, crop: "2023-p2-q7.png" })),
  ...["a.i", "a.ii"].map((part) => ({ year: 2023, paper: 2, question: 8, part, crop: "2023-p2-q8-a.png" })),
  ...["b.i", "b.ii"].map((part) => ({ year: 2023, paper: 2, question: 8, part, crop: "2023-p2-q8-b.png" })),
  { year: 2023, paper: 2, question: 8, part: "c", crop: "2023-p2-q8-c.png" },
  ...["i", "ii", "iii"].map((part) => ({ year: 2024, paper: 2, question: 1, part, crop: "2024-p2-q1.png" })),
  { year: 2024, paper: 2, question: 7, crop: "2024-p2-q7.png" },
  ...["a.i", "a.ii", "a.iii"].map((part) => ({ year: 2024, paper: 2, question: 8, part, crop: "2024-p2-q8-a.png" })),
  ...["b.i", "b.ii", "b.iii"].map((part) => ({ year: 2024, paper: 2, question: 8, part, crop: "2024-p2-q8-b.png" })),
  { year: 2024, paper: 2, question: 8, part: "c", crop: "2024-p2-q8-c.png" },
  { year: 2025, paper: 2, question: 7, crop: "2025-p2-q7.png" },
  { year: 2025, paper: 2, question: 8, part: "a", crop: "2025-p2-q8-a.png" },
  ...["b.i", "b.ii"].map((part) => ({ year: 2025, paper: 2, question: 8, part, crop: "2025-p2-q8-b.png" })),
  { year: 2025, paper: 2, question: 8, part: "c", crop: "2025-p2-q8-c.png" },
];

const key = (item: Pick<Assignment, "year" | "paper" | "question" | "part">) => `${item.year}-P${item.paper}-Q${item.question}${item.part ? `:${item.part}` : ""}`;

async function main() {
  const scopedAssignments = scopeArgument
    ? assignments.filter((assignment) => `${assignment.year}-p${assignment.paper}` === scopeArgument)
    : assignments;
  if (!scopedAssignments.length) throw new Error(`Unknown or empty scope: ${scopeArgument ?? "all"}`);
  const scopes = [...new Set(scopedAssignments.map((assignment) => `${assignment.year}-p${assignment.paper}`))];
  const distinctCrops = [...new Set(scopedAssignments.map(({ crop }) => crop))];
  for (const crop of distinctCrops) if (!fs.existsSync(path.join(CROP_DIR, crop))) throw new Error(`Missing reviewed crop: ${crop}`);
  if (!APPLY) {
    console.log(JSON.stringify({ mode: "dry-run", scopes, assignments: scopedAssignments.length, reviewedCrops: distinctCrops.length, removeUnapprovedImages: true }));
    return;
  }

  const uploads = new Map<string, string>();
  // Upload independent files concurrently so the database transaction remains
  // short and the repair cannot be interrupted halfway through an upload loop.
  for (let offset = 0; offset < distinctCrops.length; offset += 12) {
    const batch = distinctCrops.slice(offset, offset + 12);
    const completed = await Promise.all(batch.map(async (crop) => ({
      crop,
      result: await uploadToCloudinary(fs.readFileSync(path.join(CROP_DIR, crop)), crop, "questions/class-ix-mathematics-reviewed"),
    })));
    for (const { crop, result } of completed) uploads.set(crop, result.url);
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-ix-mathematics-images'))");
    const result = await client.query<{ id: string; year: number; paper_number: number; question_number: number; question_part: string | null; image_url: string | null }>(
      `SELECT q.id, pp.year, pp.paper_number, q.question_number, q.question_part, q.image_url
         FROM questions q JOIN past_papers pp ON pp.id=q.past_paper_id
        WHERE pp.board='AKUEB' AND pp.class='IX' AND pp.subject='Mathematics'
          AND (pp.year::text || '-p' || pp.paper_number::text) = ANY($1::text[])
        FOR UPDATE`, [scopes],
    );
    const planned = new Map(scopedAssignments.map((assignment) => [key(assignment), assignment]));
    const found = new Set<string>();
    let removed = 0; let assigned = 0;
    for (const row of result.rows) {
      const rowKey = key({ year: row.year, paper: row.paper_number, question: row.question_number, part: row.question_part ?? undefined });
      const assignment = planned.get(rowKey);
      if (!assignment) {
        if (row.image_url) { await client.query("UPDATE questions SET image_url=NULL, updated_at=NOW() WHERE id=$1", [row.id]); removed++; }
        continue;
      }
      found.add(rowKey);
      const imageUrl = uploads.get(assignment.crop)!;
      if (row.image_url !== imageUrl) { await client.query("UPDATE questions SET image_url=$1, updated_at=NOW() WHERE id=$2", [imageUrl, row.id]); assigned++; }
    }
    const missing = scopedAssignments.filter((assignment) => !found.has(key(assignment))).map(key);
    if (missing.length) throw new Error(`No production row for: ${missing.join(", ")}`);
    await client.query("COMMIT");
    console.log(JSON.stringify({ mode: "applied", scopes, assigned, removed, assignments: scopedAssignments.length, uploads: uploads.size }));
  } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; }
  finally { client.release(); await db.pool.end(); }
}
main().catch((error) => { console.error(error); process.exit(1); });
