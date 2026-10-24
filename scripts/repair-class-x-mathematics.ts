import "dotenv/config";
import fs from "fs";
import path from "path";
import type { PoolClient } from "pg";
import { db } from "../lib/db";
import { uploadToCloudinary } from "../lib/storage/cloudinary";

type QuestionKey = { year: number; paper: number; question: number; part?: string };
type Replacement = QuestionKey & { file: string };

const CROP_DIR = path.resolve("tmp/pdfs/class-x-math/corrected-crops");
const APPLY = process.argv.includes("--apply");

const removals: QuestionKey[] = [
  ...[8, 12, 13, 16, 17, 18, 21, 22, 40].map((question) => ({ year: 2021, paper: 1, question })),
  ...[12, 13, 16, 19, 40].map((question) => ({ year: 2022, paper: 1, question })),
  ...[7, 8, 13, 16, 26, 27].map((question) => ({ year: 2023, paper: 1, question })),
  ...[9, 10, 11, 12, 13, 30, 33].map((question) => ({ year: 2024, paper: 1, question })),
  { year: 2024, paper: 2, question: 3, part: "a" },
  { year: 2025, paper: 2, question: 1, part: "ii" },
  { year: 2025, paper: 2, question: 2, part: "a" },
  { year: 2025, paper: 2, question: 2, part: "b" },
  { year: 2025, paper: 2, question: 8, part: "b" },
];

const replacements: Replacement[] = [
  { year: 2022, paper: 1, question: 1, file: "2022-p1-q1-table.png" },
  { year: 2022, paper: 1, question: 2, file: "2022-p1-q2-q3-chart.png" },
  { year: 2022, paper: 1, question: 3, file: "2022-p1-q2-q3-chart.png" },
  { year: 2024, paper: 1, question: 18, file: "2024-p1-q18-number-line.png" },
  { year: 2024, paper: 1, question: 31, file: "2024-p1-q31-q32-ladder.png" },
  { year: 2024, paper: 1, question: 32, file: "2024-p1-q31-q32-ladder.png" },
  { year: 2023, paper: 2, question: 3, part: "b", file: "2023-p2-q3b-number-line.png" },
  { year: 2023, paper: 2, question: 4, part: "i", file: "2023-p2-q4i-table.png" },
  { year: 2023, paper: 2, question: 4, part: "ii", file: "2023-p2-q4ii-grid.png" },
  { year: 2023, paper: 2, question: 7, part: "a", file: "2023-p2-q7a-triangle.png" },
  { year: 2023, paper: 2, question: 7, part: "b", file: "2023-p2-q7b-triangle.png" },
  { year: 2023, paper: 2, question: 8, part: "a.i", file: "2023-p2-q8a-tangents.png" },
  { year: 2023, paper: 2, question: 8, part: "a.ii", file: "2023-p2-q8a-tangents.png" },
  { year: 2023, paper: 2, question: 8, part: "b.i", file: "2023-p2-q8b-circle.png" },
  { year: 2023, paper: 2, question: 8, part: "b.ii", file: "2023-p2-q8b-circle.png" },
  { year: 2024, paper: 2, question: 3, part: "b", file: "2024-p2-q3b-number-line.png" },
  { year: 2024, paper: 2, question: 7, part: "b", file: "2024-p2-q7b-ships.png" },
  { year: 2024, paper: 2, question: 8, part: "b", file: "2024-p2-q8b-tangents.png" },
  { year: 2025, paper: 2, question: 1, part: "i", file: "2025-p2-q1i-table.png" },
  { year: 2025, paper: 2, question: 3, part: "b", file: "2025-p2-q3b-number-line.png" },
  { year: 2025, paper: 2, question: 8, part: "ai", file: "2025-p2-q8a-circle.png" },
  { year: 2025, paper: 2, question: 8, part: "aii", file: "2025-p2-q8a-circle.png" },
  { year: 2025, paper: 2, question: 8, part: "aiii", file: "2025-p2-q8a-circle.png" },
];

const descriptionCleanup = [21, 22, 27, 31, 32, 38, 39, 40, 41, 44, 45];

const missingQuestions = [
  {
    year: 2023, paper: 2, question: 2, part: "a", marks: 4,
    chapter: "Algebraic Manipulation",
    text: "The HCF and LCM of two polynomials are x − 5 and (x − 5)(x + 5)(x − 1), respectively. If one polynomial is x<sup>2</sup> − 6x + 5, find the other polynomial.",
  },
  {
    year: 2023, paper: 2, question: 2, part: "b", marks: 4,
    chapter: "Algebraic Manipulation",
    text: "Resolve the fraction x/((x − 1)(x + 1)) into partial fractions.",
  },
  {
    year: 2023, paper: 2, question: 3, part: "a", marks: 3,
    chapter: "Linear Equations and Inequalities",
    text: "Solve the equation |x − 1|/2 = 1.",
  },
  {
    year: 2023, paper: 2, question: 3, part: "b", marks: 3,
    chapter: "Linear Equations and Inequalities",
    text: "Solve the inequality (x + 2)/3 ≥ 1 and show the solution on the given number line.",
  },
];

function label(key: QuestionKey): string {
  return `${key.year} P${key.paper} Q${key.question}${key.part ? `(${key.part})` : ""}`;
}

async function findQuestion(client: PoolClient, key: QuestionKey) {
  const result = await client.query(
    `SELECT q.id, q.image_url, q.question_text
       FROM questions q
       JOIN past_papers pp ON pp.id = q.past_paper_id
      WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
        AND pp.year = $1 AND pp.paper_number = $2 AND q.question_number = $3
        AND (($4::text IS NULL AND q.question_part IS NULL) OR q.question_part = $4)`,
    [key.year, key.paper, key.question, key.part ?? null],
  );
  if (result.rowCount !== 1) {
    throw new Error(`${label(key)} resolved to ${result.rowCount} rows; expected exactly one`);
  }
  return result.rows[0];
}

async function countQuestion(client: PoolClient, key: QuestionKey): Promise<number> {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
       FROM questions q
       JOIN past_papers pp ON pp.id = q.past_paper_id
      WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
        AND pp.year = $1 AND pp.paper_number = $2 AND q.question_number = $3
        AND (($4::text IS NULL AND q.question_part IS NULL) OR q.question_part = $4)`,
    [key.year, key.paper, key.question, key.part ?? null],
  );
  return result.rows[0].count;
}

async function main() {
  for (const replacement of replacements) {
    const filePath = path.join(CROP_DIR, replacement.file);
    if (!fs.existsSync(filePath)) throw new Error(`Missing crop: ${filePath}`);
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics'))");

    for (const key of removals) await findQuestion(client, key);
    for (const key of replacements) {
      const isMissingQuestion = missingQuestions.some(
        (missing) => label(missing) === label(key),
      );
      if (!isMissingQuestion) await findQuestion(client, key);
    }
    for (const missing of missingQuestions) {
      const count = await countQuestion(client, missing);
      if (count !== 0) throw new Error(`${label(missing)} already exists; refusing to insert a duplicate`);
    }
    for (const question of descriptionCleanup) {
      await findQuestion(client, { year: 2024, paper: 1, question });
    }

    if (!APPLY) {
      await client.query("ROLLBACK");
      console.log(JSON.stringify({ mode: "dry-run", removals: removals.length, replacements: replacements.length, inserts: missingQuestions.length, textCleanups: descriptionCleanup.length + 2 }));
      return;
    }

    // Upload each distinct corrected crop once, then reuse its URL for shared figures.
    const uploaded = new Map<string, string>();
    for (const replacement of replacements) {
      if (uploaded.has(replacement.file)) continue;
      const result = await uploadToCloudinary(
        fs.readFileSync(path.join(CROP_DIR, replacement.file)),
        replacement.file,
        "questions/class-x-mathematics-reviewed",
      );
      uploaded.set(replacement.file, result.url);
      console.log(`Uploaded ${replacement.file}`);
    }

    for (const key of removals) {
      const row = await findQuestion(client, key);
      await client.query("UPDATE questions SET image_url = NULL, updated_at = NOW() WHERE id = $1", [row.id]);
    }

    const paper2023P2 = await client.query(
      `SELECT id FROM past_papers
        WHERE board = 'AKUEB' AND class = 'X' AND subject = 'Mathematics'
          AND year = 2023 AND paper_number = 2`,
    );
    if (paper2023P2.rowCount !== 1) throw new Error("Could not uniquely resolve 2023 Paper II");
    for (const missing of missingQuestions) {
      await client.query(
        `INSERT INTO questions
           (past_paper_id, question_number, question_part, question_text,
            question_type, chapter_id, chapter_name, is_verified, mcq_data,
            image_url, marks, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'CRQ', NULL, $5, TRUE, NULL, NULL, $6, NOW(), NOW())`,
        [paper2023P2.rows[0].id, missing.question, missing.part, missing.text, missing.chapter, missing.marks],
      );
    }
    await client.query(
      "UPDATE past_papers SET total_questions = 17, updated_at = NOW() WHERE id = $1",
      [paper2023P2.rows[0].id],
    );

    for (const replacement of replacements) {
      const row = await findQuestion(client, replacement);
      await client.query("UPDATE questions SET image_url = $1, updated_at = NOW() WHERE id = $2", [uploaded.get(replacement.file), row.id]);
    }

    for (const question of descriptionCleanup) {
      const key = { year: 2024, paper: 1, question };
      const row = await findQuestion(client, key);
      const cleaned = row.question_text
        .replace(/\s*<br\s*\/?>\s*<sub>\s*\((?:Image|Graph|Diagram)[\s\S]*?<\/sub>/gi, "")
        .trim();
      if (cleaned === row.question_text) throw new Error(`${label(key)} did not contain the expected generated image description`);
      await client.query("UPDATE questions SET question_text = $1, updated_at = NOW() WHERE id = $2", [cleaned, row.id]);
    }


    for (const part of ["a", "b"]) {
      const key = { year: 2023, paper: 2, question: 7, part };
      const row = await findQuestion(client, key);
      const cleaned = row.question_text.replace(/\s*\(Diagram shows[\s\S]*$/i, "").trim();
      if (cleaned === row.question_text) throw new Error(`${label(key)} did not contain the expected generated diagram description`);
      await client.query("UPDATE questions SET question_text = $1, updated_at = NOW() WHERE id = $2", [cleaned, row.id]);
    }

    await client.query("COMMIT");
    const manifestPath = path.resolve("tmp/pdfs/class-x-math/applied-image-urls.json");
    fs.writeFileSync(manifestPath, `${JSON.stringify(Object.fromEntries(uploaded), null, 2)}\n`);
    console.log(JSON.stringify({ mode: "applied", removals: removals.length, replacements: replacements.length, inserts: missingQuestions.length, textCleanups: descriptionCleanup.length + 2, manifestPath }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
