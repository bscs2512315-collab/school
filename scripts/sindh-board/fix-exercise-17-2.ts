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
            // Unescaped LaTeX backslash (e.g. \mathbb, \cup, \alpha) -> double escape
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

  // 1. Direct parse
  try { return JSON.parse(text); } catch {}

  // 2. Escape raw newlines
  try { return JSON.parse(escapeRawNewlines(text)); } catch {}

  // 3. Sanitize backslashes + escape newlines
  try { return JSON.parse(sanitizeJsonEscapes(escapeRawNewlines(text))); } catch {}

  // 4. Regex fallback
  try {
    const sanitized = text.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return JSON.parse(escapeRawNewlines(sanitized));
  } catch {}

  throw new Error(`Failed to parse JSON: ${text.slice(0, 300)}...`);
}

async function run() {
  console.log("🚀 Extracting all questions from Exercise 17.2 notes...");
  const { rows } = await db.query(
    `SELECT id, title, image_urls FROM solved_exercises WHERE exercise_number = 'Exercise 17.2' AND class = 'X' LIMIT 1`
  );

  if (rows.length === 0) {
    console.error("Exercise 17.2 not found in DB.");
    process.exit(1);
  }

  const ex = rows[0];
  console.log(`Found ${ex.title} with ${ex.image_urls.length} pages.`);

  const imageParts: any[] = [];
  for (let i = 0; i < ex.image_urls.length; i++) {
    const url = ex.image_urls[i];
    console.log(`Downloading page ${i + 1}/${ex.image_urls.length}...`);
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
Your task is to transcribe, digitize, and solve ALL the textbook mathematics questions from ALL ${ex.image_urls.length} pages of Exercise 17.2 (Sets and Functions - Class 10th Mathematics).

CRITICAL INSTRUCTIONS:
1. Examine EVERY SINGLE PAGE carefully from page 1 to page ${ex.image_urls.length}. Do NOT skip ANY question or ANY sub-part (e.g. Q.1, Q.2, Q.3, Q.4, Q.5, etc. and all parts (i), (ii), (iii), (iv), (v), (vi), etc.).
2. IGNORE AND STRIP ALL coaching center names, channel promotions, watermarks, stamps, and footer links completely.
3. Structure every question cleanly: "Q.1", "Q.2", "Q.3", "Q.4", "Q.5", etc.
4. For sub-parts, extract them with roman numerals: "i", "ii", "iii", "iv", "v", "vi", etc.
5. For all mathematical notation, use STANDARD CLEAN LATEX math format:
   - Sets: $\\{1, 2, 3\\}$, $\\{x \\mid x \\in \\mathbb{Q} \\wedge 5 < x < 6\\}$, $\\mathbb{N}$, $\\mathbb{Z}$, $\\mathbb{W}$, $\\mathbb{R}$, $\\emptyset$, $\\cup$, $\\cap$, $\\Delta$, $\\times$, $\\setminus$, $\\subset$, etc.
   - Fractions: $\\frac{a}{b}$
   - Powers & Roots: $x^2 + 2x + 1 = 0$, $\\sqrt{x + 2}$
   - Ordered pairs: $(x, y)$, Cartesian products $A \\times B$, Binary relations, Domain, Range
6. Provide COMPLETE, step-by-step working and final answers for EVERY sub-part with proper explanations.
7. Return a valid JSON object matching the schema below.

JSON Schema:
{
  "sections": [
    {
      "questionNumber": "Q.1",
      "questionText": "Full question statement",
      "parts": [
        {
          "partNumber": "i",
          "partText": "Sub-part text or problem",
          "solution": "Step-by-step LaTeX solution",
          "explanation": "Mathematical explanation"
        }
      ]
    }
  ]
}`;

  console.log("🤖 Calling Gemini Vision to extract all questions across all 9 pages...");
  const response = await generateGeminiContentWithRetry(
    {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...imageParts]
        }
      ]
    },
    {
      modelsToTry: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"],
      timeoutMs: 120000
    }
  );

  const rawText = response.response?.text?.() || "";
  const parsed = parseJsonResult(rawText);
  const sections = parsed.sections || [];

  console.log(`\n✅ Successfully parsed ${sections.length} Questions for Exercise 17.2:`);
  sections.forEach((s: any) => {
    console.log(`  📌 ${s.questionNumber}: ${s.questionText.slice(0, 70)}... (${s.parts?.length} parts)`);
    s.parts?.forEach((p: any) => {
      console.log(`     (${p.partNumber}) ${p.partText?.slice(0, 50)}`);
    });
  });

  // Persist to DB
  await db.query(
    `UPDATE solved_exercises SET sections = $1, source_credit = 'Sindh Textbook Board (Class X Mathematics)', updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(sections), ex.id]
  );
  console.log("\n💾 Saved complete Exercise 17.2 (with all questions & parts) into database!");
}

run().catch((err) => {
  console.error("❌ Extraction failed:", err);
  process.exit(1);
}).then(() => process.exit(0));
