import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { parsePDF } from "../lib/pdf/parser";

type Spec = { year: number; paper: number; pdf: string };
const PAPERS: Spec[] = [
  ...[2021, 2022, 2023, 2024, 2025].map((year) => ({ year, paper: 1, pdf: `pastpapers/MathsXIP1/Mathematics-XI-Paper-I-${year}.pdf` })),
  ...[2023, 2024, 2025].map((year) => ({ year, paper: 2, pdf: `pastpapers/ClassXI_P2/Mathematics/Mathematics-XI-Paper-II-${year}.pdf` })),
];
function tokens(value: string) { return new Set(value.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((x) => x.length > 1 && !/^\d+$/.test(x))); }
function overlap(a: string, b: string) { const A = tokens(a), B = tokens(b); return A.size ? [...A].filter((x) => B.has(x)).length / A.size : 1; }
function blocks(text: string) {
  const signature = text.lastIndexOf("Candidate’s Signature", text.indexOf("Page 2 of"));
  const section = text.slice(signature >= 0 ? signature + "Candidate’s Signature".length : 0);
  const matches = [...section.matchAll(/(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,2})\s*(?:\.|\))/gmi)]; const out = new Map<number, string>();
  for (let i = 0; i < matches.length; i++) { const n = Number(matches[i][1]); if (n < 1 || n > 70 || out.has(n)) continue; out.set(n, section.slice(matches[i].index, i + 1 < matches.length ? matches[i + 1].index : section.length)); }
  return out;
}
async function main() {
  const { rows } = await db.query<any>(`SELECT pp.year,pp.paper_number,q.question_number,q.question_part,q.question_text,q.image_url,q.mcq_data FROM questions q JOIN past_papers pp ON pp.id=q.past_paper_id WHERE pp.board='AKUEB' AND pp.class='XI' AND pp.subject='Mathematics' ORDER BY pp.year,pp.paper_number,q.question_number,q.question_part NULLS FIRST`);
  const report:any[]=[];
  for (const paper of PAPERS) { const source = blocks(await parsePDF(fs.readFileSync(path.resolve(paper.pdf)))); for (const row of rows.filter((r:any)=>r.year===paper.year&&r.paper_number===paper.paper)) { const text=source.get(row.question_number)||""; const score=overlap(row.question_text,text); const options=Array.isArray(row.mcq_data?.options)&&row.mcq_data.options.every((o:any)=>new RegExp(`(?:^|\\n)\\s*${o.id}\\.`).test(text)); report.push({paper:`${paper.year}-P${paper.paper}`,question:`${row.question_number}${row.question_part?`:${row.question_part}`:""}`,imageAssigned:!!row.image_url,sourceBlockFound:!!text,questionTokenOverlap:Number(score.toFixed(2)),optionLabelsPresent:options,status:!text?"manual-source-review":score<.72||!options?"manual-text-review":row.image_url?"manual-visual-review":"source-text-matched"}); } }
  const out=path.resolve("docs/past-paper-audits/2026-09-23/class-xi-mathematics-source-audit.json");fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");const summary=report.reduce((a:any,r:any)=>{a[r.status]=(a[r.status]||0)+1;return a},{});console.log(JSON.stringify({checked:report.length,summary,report:out}));await db.pool.end();
}
main().catch(async(e)=>{console.error(e);await db.pool.end().catch(()=>undefined);process.exit(1)});
