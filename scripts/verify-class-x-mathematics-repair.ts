import "dotenv/config";
import { db } from "../lib/db";

const expectedRows = new Map([
  ["2021-P1", 50], ["2022-P1", 50], ["2023-P1", 45], ["2023-P2", 17],
  ["2024-P1", 45], ["2024-P2", 13], ["2025-P1", 45], ["2025-P2", 17],
]);

const expectedImages = new Map<string, string[]>([
  ["2021-P1", ["1", "2", "4", "26", "27", "28", "30", "31", "34", "35", "41", "42", "43", "44", "46", "47", "48", "49", "50"]],
  ["2022-P1", ["1", "2", "3", "7", "26", "27", "29", "33", "37", "42", "43", "44", "45", "46", "47", "48", "49", "50"]],
  ["2023-P1", ["1", "2", "5", "18", "19", "20", "21", "28", "33", "34", "35", "37", "38", "39", "40", "41", "42", "43", "44", "45"]],
  ["2023-P2", ["1", "3:b", "4:i", "4:ii", "6", "7:a", "7:b", "8:a.i", "8:a.ii", "8:b.i", "8:b.ii", "9"]],
  ["2024-P1", ["1", "2", "5", "18", "21", "22", "27", "31", "32", "38", "39", "40", "41", "43", "44", "45"]],
  ["2024-P2", ["1", "3:b", "7:a", "7:b", "8:a", "8:b", "9"]],
  ["2025-P1", ["1", "2", "17", "20", "21", "27", "28", "39", "41", "43", "44", "45"]],
  ["2025-P2", ["1:i", "3:b", "4:i", "4:ii", "8:ai", "8:aii", "8:aiii", "9:a"]],
]);

type QuestionRow = {
  year: number;
  paper_number: number;
  total_questions: number;
  question_number: number;
  question_part: string | null;
  question_text: string;
  question_type: string;
  mcq_data: { options?: Array<{ id: string; text: string }>; correctAnswer?: string } | null;
  image_url: string | null;
};

function questionKey(row: QuestionRow) {
  return `${row.question_number}${row.question_part ? `:${row.question_part}` : ""}`;
}

async function main() {
  const { rows } = await db.query<QuestionRow>(
    `SELECT pp.year, pp.paper_number, pp.total_questions,
            q.question_number, q.question_part, q.question_text,
            q.question_type, q.mcq_data, q.image_url
       FROM questions q JOIN past_papers pp ON pp.id = q.past_paper_id
      WHERE pp.board = 'AKUEB' AND pp.class = 'X' AND pp.subject = 'Mathematics'
      ORDER BY pp.year, pp.paper_number, q.question_number, q.question_part NULLS FIRST`,
  );

  const errors: string[] = [];
  const imageUrls = new Set<string>();
  for (const [paperKey, rowCount] of expectedRows) {
    const [year, paper] = paperKey.split("-P").map(Number);
    const paperRows = rows.filter((row) => row.year === year && row.paper_number === paper);
    if (paperRows.length !== rowCount) errors.push(`${paperKey}: ${paperRows.length} rows, expected ${rowCount}`);
    if (paperRows.some((row) => row.total_questions !== rowCount)) errors.push(`${paperKey}: total_questions is inconsistent`);

    const actualImages = paperRows.filter((row) => row.image_url).map(questionKey).sort();
    const wantedImages = [...(expectedImages.get(paperKey) ?? [])].sort();
    if (JSON.stringify(actualImages) !== JSON.stringify(wantedImages)) {
      errors.push(`${paperKey}: image keys ${actualImages.join(", ")} != ${wantedImages.join(", ")}`);
    }
    for (const row of paperRows) if (row.image_url) imageUrls.add(row.image_url);

    const uniqueKeys = new Set(paperRows.map(questionKey));
    if (uniqueKeys.size !== paperRows.length) errors.push(`${paperKey}: duplicate question/part keys`);

    if (paper === 1) {
      for (const row of paperRows) {
        const options = row.mcq_data?.options;
        const answer = row.mcq_data?.correctAnswer;
        if (!Array.isArray(options) || options.length !== 4) errors.push(`${paperKey} Q${row.question_number}: expected four MCQ options`);
        if (!options?.some((option) => option.id === answer)) errors.push(`${paperKey} Q${row.question_number}: invalid correct answer`);
      }
    }
  }

  for (const row of rows) {
    if (/<sub>\s*\(?(?:Image|Graph|Diagram)\b|\(Diagram shows/i.test(row.question_text)) {
      errors.push(`${row.year}-P${row.paper_number} Q${questionKey(row)}: generated image description remains`);
    }
  }

  const paper2021 = new Map(rows.filter((row) => row.year === 2021 && row.paper_number === 1)
    .map((row) => [row.question_number, row]));
  const q6 = paper2021.get(6);
  if (!q6?.question_text.includes("9, 9, 10, 15") ||
      q6.question_text.includes("answer Q.5 and Q.6")) {
    errors.push("2021-P1 Q6: shared data must be self-contained without PDF navigation text");
  }
  const q7 = paper2021.get(7);
  if (!q7?.question_text.includes("\\frac{X}{Y}") ||
      (q7.question_text.match(/\\bar\{/g) ?? []).length !== 2) {
    errors.push("2021-P1 Q7: plain X/Y and exactly two barred variables required");
  }
  if (!paper2021.get(12)?.question_text.includes("&divide; (1)/(x)")) {
    errors.push("2021-P1 Q12: divisor must be 1/x");
  }
  if (paper2021.get(16)?.mcq_data?.options?.find((option) => option.id === "A")?.text !== "-1/2") {
    errors.push("2021-P1 Q16: option A must be -1/2");
  }
  if (paper2021.get(21)?.mcq_data?.correctAnswer !== "B" ||
      paper2021.get(21)?.mcq_data?.options?.find((option) => option.id === "B")?.text !== "{1/2}") {
    errors.push("2021-P1 Q21: source choices and correct answer must be restored");
  }
  if (paper2021.get(24)?.mcq_data?.correctAnswer !== "B") {
    errors.push("2021-P1 Q24: square-root equation solves to x=2 (B)");
  }
  if (paper2021.get(30)?.mcq_data?.options?.find((option) => option.id === "C")?.text !== "b/c") {
    errors.push("2021-P1 Q30: option C must be b/c");
  }
  const q18_2024 = rows.find((row) => row.year === 2024 && row.paper_number === 1 && row.question_number === 18);
  if (q18_2024?.question_text !== "The given number line is the result of" ||
      q18_2024.mcq_data?.options?.find((option) => option.id === "C")?.text !== "1.5 &le; y < 5") {
    errors.push("2024-P1 Q18: clean prompt and source option C required");
  }
  for (const row of rows) {
    if (/Use the given (?:information|graph|image) to answer Q\./i.test(row.question_text)) {
      errors.push(`${row.year}-P${row.paper_number} Q${questionKey(row)}: PDF navigation text remains`);
    }
  }

  const failedUrls: string[] = [];
  for (const url of imageUrls) {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) failedUrls.push(`${response.status} ${url}`);
  }
  if (failedUrls.length) errors.push(...failedUrls);

  if (errors.length) throw new Error(`Verification failed:\n- ${errors.join("\n- ")}`);
  console.log(JSON.stringify({ papers: expectedRows.size, questions: rows.length, imageAssignments: rows.filter((row) => row.image_url).length, uniqueImagesChecked: imageUrls.size, status: "verified" }));
  await db.pool.end();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await db.pool.end().catch(() => undefined);
  process.exit(1);
});
