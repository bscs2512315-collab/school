import "dotenv/config";
import fs from "fs";
import path from "path";
import { extractSindhPaper1MCQs, extractSindhPaper2Theory } from "./extract-sindh-paper";

async function main() {
  const baseDir = path.resolve(process.cwd(), "pastpapers/sindh_board/X/Mathematics/2025");
  
  console.log("=== Testing 2025 Class X Mathematics Paper 1 (MCQs) ===");
  const mcqImg = fs.readFileSync(path.join(baseDir, "2025-p1-mcq.png"));
  const mcqs = await extractSindhPaper1MCQs([mcqImg], { classVal: "X", subject: "Mathematics", year: 2025 });
  console.log(`✅ Extracted ${mcqs.length} MCQs!`);
  console.log("Sample MCQ 1:", JSON.stringify(mcqs[0], null, 2));
  console.log("Sample MCQ 2:", JSON.stringify(mcqs[1], null, 2));

  console.log("\n=== Testing 2025 Class X Mathematics Paper 2 (Theory) ===");
  const secBImg = fs.readFileSync(path.join(baseDir, "2025-p2-secB.png"));
  const secCImg = fs.readFileSync(path.join(baseDir, "2025-p2-secC.png"));
  const theory = await extractSindhPaper2Theory([secBImg, secCImg], { classVal: "X", subject: "Mathematics", year: 2025 });
  console.log(`✅ Extracted ${theory.length} Theory questions!`);
  const crqs = theory.filter(q => q.questionType === "CRQ");
  const erqs = theory.filter(q => q.questionType === "ERQ");
  console.log(`- Section B (Short Qs / CRQ): ${crqs.length}`);
  console.log(`- Section C (Long Qs / ERQ): ${erqs.length}`);
  console.log("Sample Short Q (CRQ):", JSON.stringify(crqs[0], null, 2));
  console.log("Sample Long Q (ERQ):", JSON.stringify(erqs[0], null, 2));

  fs.writeFileSync(
    path.join(baseDir, "extracted_2025.json"),
    JSON.stringify({ mcqs, theory }, null, 2),
    "utf-8"
  );
  console.log(`\n🎉 Saved full extracted JSON to ${path.join(baseDir, "extracted_2025.json")}`);
}

main().catch(console.error);
