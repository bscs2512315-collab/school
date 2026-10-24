import "dotenv/config";
import { db } from "../lib/db";

const APPLY = process.argv.includes("--apply");

// Transcribed from the AKUEB answer-key PDFs linked by AKUEB Resources.
const answerKeys: Record<number, string[]> = {
  2021: ["B", "D", "A", "B", "B", "B", "D", "A", "C", "D", "A", "B", "D", "A", "D", "A", "C", "A", "D", "A", "B", "D", "A", "D", "C", "A", "D", "B", "D", "D", "B", "B", "A", "C", "C", "B", "B", "A", "C", "C", "D", "C", "B", "A", "D", "C", "C", "B", "A", "C"],
  2022: ["C", "D", "B", "C", "B", "A", "C", "B", "D", "A", "A", "B", "B", "A", "A", "B", "D", "B", "B", "B", "D", "A", "D", "B", "A", "A", "C", "A", "B", "A", "D", "C", "B", "C", "C", "C", "D", "C", "B", "A", "D", "C", "A", "A", "C", "B", "B", "A", "C", "D"],
  2023: ["B", "C", "B", "A", "D", "C", "C", "C", "C", "A", "B", "C", "A", "C", "B", "D", "C", "A", "C", "C", "C", "C", "B", "A", "B", "D", "B", "A", "B", "C", "A", "A", "C", "A", "B", "C", "B", "C", "C", "A", "C", "B", "D", "D", "B"],
  // The published 2024 key displays bullets for Q21 and Q36. Their source
  // questions resolve unambiguously to A (slope -2, intercept 3) and B
  // (sin x = cos(-240°) = -1/2), respectively.
  2024: ["C", "B", "D", "C", "D", "C", "B", "C", "B", "D", "C", "C", "C", "A", "D", "B", "B", "C", "D", "D", "A", "C", "B", "D", "D", "A", "D", "C", "B", "C", "B", "A", "B", "A", "C", "B", "C", "B", "B", "B", "C", "D", "C", "B", "C"],
  2025: ["A", "C", "C", "C", "C", "B", "C", "A", "A", "D", "A", "D", "B", "B", "B", "C", "A", "D", "A", "B", "B", "C", "A", "B", "C", "D", "B", "A", "C", "C", "A", "C", "A", "B", "B", "C", "D", "C", "D", "B", "B", "B", "B", "C", "A"],
};

async function main() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('repair-class-x-mathematics-answer-keys'))");
    let changed = 0;
    let optionTextsChanged = 0;

    for (const [yearText, keys] of Object.entries(answerKeys)) {
      const year = Number(yearText);
      const result = await client.query(
        `SELECT q.id, q.question_number, q.mcq_data
           FROM questions q JOIN past_papers pp ON pp.id = q.past_paper_id
          WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
            AND pp.year = $1 AND pp.paper_number = 1
          ORDER BY q.question_number`,
        [year],
      );
      if (result.rowCount !== keys.length) throw new Error(`${year}: found ${result.rowCount} MCQs; expected ${keys.length}`);

      for (const row of result.rows) {
        const expected = keys[row.question_number - 1];
        if (!expected) throw new Error(`${year} Q${row.question_number}: missing expected key`);
        if (!row.mcq_data?.options?.some((option: { id: string }) => option.id === expected)) {
          throw new Error(`${year} Q${row.question_number}: expected key ${expected} is not an option`);
        }
        if (row.mcq_data.correctAnswer !== expected) {
          changed++;
          if (APPLY) {
            await client.query(
              `UPDATE questions
                  SET mcq_data = jsonb_set(mcq_data, '{correctAnswer}', to_jsonb($1::text)), updated_at = NOW()
                WHERE id = $2`,
              [expected, row.id],
            );
          }
        }
      }
    }

    // Correct two missing negative signs in the imported 2024 Q21 options.
    const q21 = await client.query(
      `SELECT q.id, q.mcq_data FROM questions q JOIN past_papers pp ON pp.id=q.past_paper_id
        WHERE pp.board='AKUEB' AND pp.class='X' AND pp.subject='Mathematics'
          AND pp.year=2024 AND pp.paper_number=1 AND q.question_number=21`,
    );
    if (q21.rowCount !== 1) throw new Error("Could not uniquely resolve 2024 P1 Q21");
    const corrected = structuredClone(q21.rows[0].mcq_data);
    corrected.options = corrected.options.map((option: { id: string; text: string }) => {
      if (option.id === "B" && option.text !== "−2 and 1.5 respectively.") {
        optionTextsChanged++;
        return { ...option, text: "−2 and 1.5 respectively." };
      }
      if (option.id === "C" && option.text !== "−0.5 and 3 respectively.") {
        optionTextsChanged++;
        return { ...option, text: "−0.5 and 3 respectively." };
      }
      return option;
    });
    if (APPLY && optionTextsChanged > 0) {
      await client.query("UPDATE questions SET mcq_data=$1, updated_at=NOW() WHERE id=$2", [corrected, q21.rows[0].id]);
    }
    if (APPLY) {
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }
    console.log(JSON.stringify({ mode: APPLY ? "applied" : "dry-run", papers: 5, checked: 235, answerKeysChanged: changed, optionTextsChanged }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
