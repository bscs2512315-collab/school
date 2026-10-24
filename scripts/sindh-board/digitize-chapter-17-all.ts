import "dotenv/config";
import axios from "axios";
import { db } from "@/lib/db";
import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";

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

function sanitizeJsonEscapes(input: string): string {
  let inString = false;
  let out = "";
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      i++;
    } else {
      if (ch === '"') {
        inString = false;
        out += ch;
        i++;
      } else if (ch === "\\") {
        if (i + 1 < input.length) {
          const next = input[i + 1];
          if (['"', "\\", "/", "b", "f", "n", "r", "t"].includes(next)) {
            out += "\\" + next;
            i += 2;
          } else if (next === "u" && i + 5 < input.length && /^[0-9a-fA-F]{4}$/.test(input.slice(i + 2, i + 6))) {
            out += input.slice(i, i + 6);
            i += 6;
          } else {
            out += "\\\\";
            i++;
          }
        } else {
          out += "\\\\";
          i++;
        }
      } else {
        out += ch;
        i++;
      }
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
  try { return JSON.parse(sanitizeJsonEscapes(escapeRawNewlines(text))); } catch {}
  try {
    const sanitized = text.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return JSON.parse(escapeRawNewlines(sanitized));
  } catch {}

  throw new Error(`Failed to parse JSON: ${text.slice(0, 300)}...`);
}

async function digitizeSingleExercise(exerciseId: string, title: string, imageUrls: string[]) {
  console.log(`\n======================================================`);
  console.log(`📖 Digitizing "${title}" (${imageUrls.length} pages)...`);
  console.log(`======================================================`);

  const imageParts: any[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    console.log(`  - Fetching page ${i + 1}/${imageUrls.length}...`);
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
    const base64 = Buffer.from(res.data).toString("base64");
    imageParts.push({
      inlineData: {
        data: base64,
        mimeType: "image/png"
      }
    });
  }

  const prompt = `You are a Senior Mathematics Professor and Master Typesetter for the Sindh Board of Secondary Education (BSEK / BIEK Karachi & Sindh Board).
Your task is to transcribe, digitize, and solve ALL textbook mathematics questions across ALL ${imageUrls.length} pages of this exercise (${title}).

CRITICAL INSTRUCTIONS:
1. Extract EVERY SINGLE QUESTION without skipping anything (e.g. Q.1, Q.2, Q.3, Q.4, Q.5, etc. and all subparts (i), (ii), (iii), (iv), etc.).
2. IGNORE AND STRIP ALL coaching center names, channel promotions, watermarks, stamps, and footer links completely.
3. Structure every question cleanly: "Q.1", "Q.2", "Q.3", "Q.4", etc.
4. For sub-parts, use roman numerals: "i", "ii", "iii", "iv", "v", etc.
5. Use standard clean LaTeX math for sets, equations, fractions, matrices, symbols: $\\{...\\}$, $\\cup$, $\\cap$, $\\Delta$, $\\setminus$, $\\subset$, $\\frac{a}{b}$, $\\sqrt{x}$, etc.
6. Provide complete step-by-step solutions and explanations.
7. Return a valid JSON object only.

JSON Schema:
{
  "sections": [
    {
      "questionNumber": "Q.1",
      "questionText": "Full question statement",
      "parts": [
        {
          "partNumber": "i",
          "partText": "Sub-part text",
          "solution": "Step-by-step LaTeX solution",
          "explanation": "Mathematical explanation"
        }
      ]
    }
  ]
}`;

  const response = await generateGeminiContentWithRetry(
    {
      contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }]
    },
    {
      modelsToTry: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"],
      timeoutMs: 120000
    }
  );

  const rawText = response.response?.text?.() || "";
  const parsed = parseJsonResult(rawText);
  const sections = parsed.sections || [];

  console.log(`✅ Extracted ${sections.length} Questions for "${title}":`);
  sections.forEach((s: any) => {
    console.log(`   📌 ${s.questionNumber}: ${s.questionText.slice(0, 60)}... (${s.parts?.length} parts)`);
  });

  await db.query(
    `UPDATE solved_exercises SET sections = $1, source_credit = 'Sindh Textbook Board (Class X Mathematics)', updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(sections), exerciseId]
  );
  console.log(`💾 Persisted to database successfully.`);
}

async function run() {
  // Process Chapter 17 exercises (17.3, 17.4, 17.5, Review 17)
  const { rows } = await db.query(
    `SELECT id, title, exercise_number, image_urls 
     FROM solved_exercises 
     WHERE class = 'X' AND chapter_number = 17 AND exercise_number IN ('Exercise 17.3', 'Exercise 17.4', 'Exercise 17.5', 'Review Exercise 17')
     ORDER BY exercise_number`
  );

  for (const ex of rows) {
    try {
      await digitizeSingleExercise(ex.id, ex.title, ex.image_urls);
    } catch (e: any) {
      console.error(`❌ Failed for ${ex.title}:`, e.message);
    }
  }
}

run().catch(console.error).then(() => process.exit(0));
