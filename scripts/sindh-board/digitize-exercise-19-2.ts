import "dotenv/config";
import axios from "axios";
import { db } from "../../lib/db";
import { generateGeminiContentWithRetry } from "../../lib/ai/gemini";

function escapeRawNewlines(input: string): string {
  let inString = false;
  let out = "";
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        out += ch;
      } else if (ch === "\\") {
        escaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === "\n") {
        out += "\\n";
      } else if (ch === "\r") {
        out += "\\r";
      } else if (ch === "\t") {
        out += "\\t";
      } else {
        out += ch;
      }
    } else {
      if (ch === '"') inString = true;
      out += ch;
    }
  }
  return out;
}

function parseJsonResult(raw: string): any {
  let text = raw.trim();
  if (text.startsWith("```json")) text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  else if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    text = text.substring(jsonStart, jsonEnd + 1);
  }

  try { return JSON.parse(text); } catch {}
  try { return JSON.parse(escapeRawNewlines(text)); } catch {}
  const sanitized = text.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
  return JSON.parse(escapeRawNewlines(sanitized));
}

async function digitizeExercise19_2() {
  const exerciseId = "e30969dd-bfa0-4335-a924-35beba7b56fd";
  const { rows } = await db.query(
    `SELECT id, title, exercise_number, image_urls FROM solved_exercises WHERE id = $1`,
    [exerciseId]
  );

  if (rows.length === 0) {
    console.error("Exercise 19.2 not found in DB");
    return;
  }

  const ex = rows[0];
  const imageUrls: string[] = ex.image_urls || [];
  console.log(`\n======================================================`);
  console.log(`📖 Digitizing "${ex.title}" (${imageUrls.length} pages) to Text & LaTeX...`);
  console.log(`======================================================\n`);

  // Download all pages (up to 15 at a time for optimal token limits and accuracy)
  const imageParts: any[] = [];
  const selectedImages = imageUrls.slice(0, 15); // process in chunks

  for (let i = 0; i < selectedImages.length; i++) {
    const url = selectedImages[i];
    console.log(`📥 Downloading page ${i + 1}/${selectedImages.length}...`);
    try {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 25000 });
      const base64 = Buffer.from(res.data).toString("base64");
      imageParts.push({
        inlineData: {
          data: base64,
          mimeType: "image/png"
        }
      });
    } catch (e: any) {
      console.warn(`Failed image ${url}: ${e.message}`);
    }
  }

  const prompt = `You are a Senior Mathematics Professor and Master Typesetter for the Sindh Textbook Board (Class X Mathematics - Unit 19: Matrices and Determinants).
Your task is to transcribe, digitize, and solve ALL the textbook mathematics questions from these exercise pages into CLEAN, BEAUTIFUL, ACADEMIC TEXT AND LATEX.

CRITICAL INSTRUCTIONS:
1. Extract ALL questions cleanly (e.g. Q.1, Q.2, Q.3, Q.4, Q.5, etc. and sub-parts (i), (ii), (iii), etc.).
2. IGNORE and completely strip all coaching center names, watermarks, stamps, and footer links.
3. For Matrices and Determinants, format every matrix cleanly using standard LaTeX:
   $\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$ or $\\begin{vmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{vmatrix}$
4. Provide complete step-by-step working: Multiplicative inverse $A^{-1} = \\frac{1}{|A|} \\text{Adj}(A)$, Adjoint of Matrix, Co-factors $A_{ij} = (-1)^{i+j} M_{ij}$, Cramer's Rule, Matrix Inversion Method, Determinant expansions.
5. Return a valid JSON object ONLY matching this schema:

{
  "sections": [
    {
      "questionNumber": "Q.1",
      "questionText": "Find the adjoint of the following matrices:",
      "parts": [
        {
          "partNumber": "i",
          "partText": "Matrix statement",
          "solution": "Step-by-step solution with LaTeX matrix",
          "explanation": "Formula and rule explanation"
        }
      ]
    }
  ],
  "markdown": "### Unit 19: Matrices and Determinants\\n\\n**Exercise 19.2 Notes and Formulations:**\\n..."
}`;

  console.log(`⚡ Sending ${imageParts.length} page images to Gemini Vision AI...`);
  const response = await generateGeminiContentWithRetry(
    {
      contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }]
    },
    {
      modelsToTry: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"],
      timeoutMs: 180000
    }
  );

  const rawText = response.response?.text?.() || "";
  const parsed = parseJsonResult(rawText);
  const sections = parsed.sections || [];
  const markdown = parsed.markdown || "";

  console.log(`\n🎉 Extracted ${sections.length} Questions with ${sections.reduce((acc: number, s: any) => acc + (s.parts?.length || 0), 0)} parts!`);
  sections.forEach((s: any) => {
    console.log(`   📌 ${s.questionNumber}: ${s.questionText.slice(0, 70)} (${s.parts?.length || 0} parts)`);
  });

  await db.query(
    `UPDATE solved_exercises 
     SET sections = $1, content_markdown = $2, source_credit = 'Sindh Textbook Board (Class X Mathematics)', updated_at = NOW() 
     WHERE id = $3`,
    [JSON.stringify(sections), markdown, exerciseId]
  );

  console.log(`\n💾 Saved digitized text & LaTeX to database for Exercise 19.2!`);
}

digitizeExercise19_2()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
