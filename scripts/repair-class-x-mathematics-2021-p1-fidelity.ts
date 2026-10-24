import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "../lib/db";

type Option = { id: string; text: string };
type McqData = { options: Option[]; correctAnswer: string; [key: string]: unknown };
type Question = {
  id: string;
  question_number: number;
  question_text: string;
  mcq_data: McqData;
};

const sharedAges =
  "The given data, in ascending order, represents the ages of people who visited a shop in a day.<br><br>" +
  "9, 9, 10, 15, 17, 19, 23, 27, p, p, 32, 35, 35, 35, 37, 40, 40.";

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics-2021-p1-fidelity'))");
    const result = await client.query<Question>(
      `SELECT q.id, q.question_number, q.question_text, q.mcq_data
         FROM questions q JOIN past_papers pp ON pp.id = q.past_paper_id
        WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
          AND pp.year = 2021 AND pp.paper_number = 1
          AND q.question_part IS NULL
        ORDER BY q.question_number FOR UPDATE OF q`,
    );
    if (result.rowCount !== 50) throw new Error(`Expected 50 questions; found ${result.rowCount}`);
    const questions = new Map(result.rows.map((row) => [row.question_number, row]));
    const changes = new Map<number, { text?: string; options?: Partial<Record<string, string>>; answer?: string }>([
      [5, { text: `${sharedAges}<br><br>If the median is 28, then the value of p is equal to` }],
      [6, { text: `${sharedAges}<br><br>The mode of the data` }],
      [7, { text: "If \\frac{X}{Y} = \\frac{a}{2} and \\bar{X} = \\frac{a}{2}, then the value of \\bar{Y} is equal to" }],
      [12, { text: "On simplification of (1 - (1)/(x)) &divide; (1)/(x), we get" }],
      [15, { options: { B: "x" } }],
      [16, { options: { A: "-1/2" } }],
      [21, {
        options: { A: "{1/4}", B: "{1/2}", C: "{0, 1/4}", D: "{0, 1/2}" },
        answer: "B",
      }],
      [24, { answer: "B" }],
      [30, { options: { C: "b/c" } }],
    ]);

    const backupDir = join(process.cwd(), "backups", "production", "class-x-mathematics");
    await mkdir(backupDir, { recursive: true });
    const backupPath = join(backupDir, `2021-p1-fidelity-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    await writeFile(backupPath, JSON.stringify({
      source: "https://files.akuebresources.com/2024/08/Mathematics-X-Paper-I-2021.pdf",
      records: result.rows.filter((row) => changes.has(row.question_number)),
    }, null, 2));

    for (const [number, change] of changes) {
      const question = questions.get(number);
      if (!question) throw new Error(`Q${number} missing`);
      const mcqData: McqData = structuredClone(question.mcq_data);
      for (const [id, text] of Object.entries(change.options ?? {})) {
        if (text === undefined) continue;
        const option = mcqData.options.find((item) => item.id === id);
        if (!option) throw new Error(`Q${number} option ${id} missing`);
        option.text = text;
      }
      if (change.answer) mcqData.correctAnswer = change.answer;
      await client.query(
        "UPDATE questions SET question_text = $1, mcq_data = $2::jsonb, updated_at = NOW() WHERE id = $3",
        [change.text ?? question.question_text, JSON.stringify(mcqData), question.id],
      );
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ status: "applied", paper: "Class X Mathematics 2021 Paper I", correctedQuestions: [...changes.keys()], backupPath }));
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
