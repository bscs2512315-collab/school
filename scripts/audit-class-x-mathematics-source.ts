import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { parsePDF } from "../lib/pdf/parser";

type PaperSpec = { year: number; paper: number; pdf: string };
type Row = {
  year: number; paper_number: number; question_number: number; question_part: string | null;
  question_text: string; image_url: string | null; mcq_data: { options?: Array<{ id: string; text: string }> } | null;
};

const PAPERS: PaperSpec[] = [
  { year: 2021, paper: 1, pdf: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2021.pdf" },
  { year: 2022, paper: 1, pdf: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2022.pdf" },
  { year: 2023, paper: 1, pdf: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2023.pdf" },
  { year: 2023, paper: 2, pdf: "pastpapers/ClassX_P2/Mathematics/Mathematics-X-Paper-II-2023.pdf" },
  { year: 2024, paper: 1, pdf: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2024.pdf" },
  { year: 2024, paper: 2, pdf: "pastpapers/ClassX_P2/Mathematics/Mathematics-X-Paper-II-2024.pdf" },
  { year: 2025, paper: 1, pdf: "pastpapers/MathsXP1/Mathematics-X-Paper-I-2025.pdf" },
  { year: 2025, paper: 2, pdf: "pastpapers/ClassX_P2/Mathematics/Mathematics-X-Paper-II-2025.pdf" },
];

// These diagrams were compared with rendered source pages and repaired where
// necessary. All remaining image assignments stay open for visual review.
const REVIEWED_IMAGES = new Set([
  ...[1, 2, 4, 26, 27, 28, 30, 31, 34, 35, 41, 42, 43, 44, 46, 47, 48, 49, 50]
    .map((question) => `2021-P1:${question}`),
  "2023-P1:20",
  "2024-P1:18", "2024-P1:31", "2024-P1:32",
]);

function normalise(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !/^\d+$/.test(token));
}

function tokenOverlap(databaseText: string, sourceText: string) {
  const dbTokens = new Set(normalise(databaseText));
  const sourceTokens = new Set(normalise(sourceText));
  if (!dbTokens.size) return 1;
  let found = 0;
  for (const token of dbTokens) if (sourceTokens.has(token)) found++;
  return found / dbTokens.size;
}

function sourceBlocks(text: string) {
  // Ignore the numbered instructions on the cover page. Questions start after
  // the candidate-signature block in each official AKUEB PDF.
  const signature = text.lastIndexOf("Candidate’s Signature", text.indexOf("Page 2 of"));
  const questionText = signature >= 0 ? text.slice(signature + "Candidate’s Signature".length) : text;
  const matches = [...questionText.matchAll(/(?:^|\n)\s*(?:Q\.?\s*)?(\d{1,2})\.\s+/gm)];
  const blocks = new Map<number, string>();
  for (let i = 0; i < matches.length; i++) {
    const number = Number(matches[i][1]);
    if (number < 1 || number > 50 || blocks.has(number)) continue;
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? questionText.length : questionText.length;
    blocks.set(number, questionText.slice(start, end));
  }
  return blocks;
}

function sharedReferences(text: string) {
  return [...text.matchAll(/Use the given (?:information|graph|image) to answer Q\.?\s*(\d+)(?:\s*(?:and|to)\s*Q\.?\s*(\d+))?/gi)]
    .map((match) => ({ firstQuestion: Number(match[1]), lastQuestion: Number(match[2] ?? match[1]), text: match[0] }));
}

async function main() {
  const { rows } = await db.query<Row>(
    `SELECT pp.year, pp.paper_number, q.question_number, q.question_part, q.question_text, q.image_url, q.mcq_data
       FROM questions q JOIN past_papers pp ON pp.id=q.past_paper_id
      WHERE pp.board='AKUEB' AND pp.class='X' AND pp.subject='Mathematics'
      ORDER BY pp.year, pp.paper_number, q.question_number, q.question_part NULLS FIRST`,
  );
  const report: Array<Record<string, unknown>> = [];
  for (const paper of PAPERS) {
    const text = await parsePDF(fs.readFileSync(path.resolve(paper.pdf)));
    const blocks = sourceBlocks(text);
    const shared = sharedReferences(text);
    for (const row of rows.filter((candidate) => candidate.year === paper.year && candidate.paper_number === paper.paper)) {
      const source = blocks.get(row.question_number) ?? "";
      const overlap = tokenOverlap(row.question_text, source);
      const needsSharedContext = shared.some((reference) => row.question_number >= reference.firstQuestion && row.question_number <= reference.lastQuestion);
      const optionLabelsPresent = !row.mcq_data?.options?.length || row.mcq_data.options.every((option) =>
        new RegExp(`(?:^|\\n)\\s*${option.id}\\.`).test(source),
      );
      const recordKey = `${paper.year}-P${paper.paper}:${row.question_number}${row.question_part ? `:${row.question_part}` : ""}`;
      const automaticStatus = !source
        ? "manual-source-review"
        : overlap < 0.55 || !optionLabelsPresent
          ? "manual-text-review"
          : row.image_url
            ? "manual-image-review"
            : needsSharedContext
              ? "manual-shared-context-review"
              : "source-text-matched";
      report.push({
        paper: `${paper.year}-P${paper.paper}`,
        question: `${row.question_number}${row.question_part ? `:${row.question_part}` : ""}`,
        imageAssigned: Boolean(row.image_url),
        sourceBlockFound: Boolean(source),
        questionTokenOverlap: Number(overlap.toFixed(2)),
        optionLabelsPresent,
        needsSharedContext,
        status: row.image_url && REVIEWED_IMAGES.has(recordKey) ? "source-visual-confirmed" : automaticStatus,
      });
    }
  }
  const out = path.resolve("docs/past-paper-audits/2026-09-22/class-x-mathematics-source-audit.json");
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  const summary = report.reduce<Record<string, number>>((counts, item) => {
    const status = String(item.status);
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({ checked: report.length, summary, report: out }));
  await db.pool.end();
}

main().catch(async (error) => { console.error(error); await db.pool.end().catch(() => undefined); process.exit(1); });
