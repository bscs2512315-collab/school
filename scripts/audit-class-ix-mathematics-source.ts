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
  ...[2021, 2022, 2023, 2024, 2025].map((year) => ({
    year, paper: 1, pdf: `pastpapers/MathsIXP1/Mathematics-IX-Paper-I-${year}.pdf`,
  })),
  ...[2023, 2024, 2025].map((year) => ({
    year, paper: 2, pdf: `pastpapers/ClassIX_P2/Mathematics/Mathematics-IX-Paper-II-${year}.pdf`,
  })),
];

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

function sourceBlocks(text: string, paper: number) {
  const startAt = paper === 1
    ? Math.max(text.lastIndexOf("Candidate’s Signature", text.indexOf("Page 2 of")), 0)
    : 0;
  const questionText = text.slice(startAt);
  const matches = [...questionText.matchAll(/(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,2})\s*(?:\.|\))/gmi)];
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
  return [...text.matchAll(/Use the given (?:information|graph|image|figure|diagram) to answer Q\.?\s*(\d+)(?:\s*(?:and|to)\s*Q\.?\s*(\d+))?/gi)]
    .map((match) => ({ firstQuestion: Number(match[1]), lastQuestion: Number(match[2] ?? match[1]) }));
}

async function main() {
  const { rows } = await db.query<Row>(
    `SELECT pp.year, pp.paper_number, q.question_number, q.question_part, q.question_text, q.image_url, q.mcq_data
       FROM questions q JOIN past_papers pp ON pp.id=q.past_paper_id
      WHERE pp.board='AKUEB' AND pp.class='IX' AND pp.subject='Mathematics'
      ORDER BY pp.year, pp.paper_number, q.question_number, q.question_part NULLS FIRST`,
  );
  const report: Array<Record<string, unknown>> = [];
  for (const paper of PAPERS) {
    const text = await parsePDF(fs.readFileSync(path.resolve(paper.pdf)));
    const blocks = sourceBlocks(text, paper.paper);
    const shared = sharedReferences(text);
    for (const row of rows.filter((candidate) => candidate.year === paper.year && candidate.paper_number === paper.paper)) {
      const source = blocks.get(row.question_number) ?? "";
      const overlap = tokenOverlap(row.question_text, source);
      const needsSharedContext = shared.some((reference) => row.question_number >= reference.firstQuestion && row.question_number <= reference.lastQuestion);
      const optionLabelsPresent = !row.mcq_data?.options?.length || row.mcq_data.options.every((option) =>
        new RegExp(`(?:^|\\n)\\s*${option.id}\\.`).test(source),
      );
      let status = "source-text-matched";
      if (!source) status = "manual-source-review";
      else if (overlap < 0.72 || !optionLabelsPresent) status = "manual-text-review";
      else if (needsSharedContext || row.image_url) status = "manual-visual-review";
      report.push({
        paper: `${paper.year}-P${paper.paper}`,
        question: `${row.question_number}${row.question_part ? `:${row.question_part}` : ""}`,
        imageAssigned: Boolean(row.image_url), sourceBlockFound: Boolean(source),
        questionTokenOverlap: Number(overlap.toFixed(2)), optionLabelsPresent, needsSharedContext, status,
      });
    }
  }
  const out = path.resolve("docs/past-paper-audits/2026-09-22/class-ix-mathematics-source-audit.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  const summary = report.reduce<Record<string, number>>((counts, item) => {
    const status = String(item.status); counts[status] = (counts[status] ?? 0) + 1; return counts;
  }, {});
  console.log(JSON.stringify({ checked: report.length, summary, report: out }));
  await db.pool.end();
}

main().catch(async (error) => { console.error(error); await db.pool.end().catch(() => undefined); process.exit(1); });
