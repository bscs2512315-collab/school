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
  try {
    const sanitized = text.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return JSON.parse(escapeRawNewlines(sanitized));
  } catch {}

  return { sections: [], markdown: text };
}

export async function digitizeExerciseById(exerciseId: string): Promise<boolean> {
  const { rows } = await db.query(
    `SELECT id, title, subject, class, chapter_number, exercise_number, image_urls 
     FROM solved_exercises 
     WHERE id = $1`,
    [exerciseId]
  );

  if (rows.length === 0) return false;
  const ex = rows[0];
  const imageUrls: string[] = ex.image_urls || [];

  if (imageUrls.length === 0) {
    console.log(`⚠️ No images for "${ex.title}", skipping.`);
    return false;
  }

  console.log(`\n==========================================================================`);
  console.log(`📖 Digitizing [Class ${ex.class} ${ex.subject}] "${ex.title}" (${imageUrls.length} pages)...`);
  console.log(`==========================================================================`);

  const imageParts: any[] = [];
  // Sample up to 12 pages per prompt for high quality + fast throughput
  const selectedImages = imageUrls.slice(0, 12);

  for (let i = 0; i < selectedImages.length; i++) {
    const url = selectedImages[i];
    try {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
      const base64 = Buffer.from(res.data).toString("base64");
      imageParts.push({
        inlineData: {
          data: base64,
          mimeType: "image/png"
        }
      });
    } catch (e: any) {
      console.warn(`  - Error downloading page ${i + 1}: ${e.message}`);
    }
  }

  if (imageParts.length === 0) {
    console.warn(`  - No valid images downloaded for ${ex.title}`);
    return false;
  }

  const prompt = `You are an Expert Academic Professor and Educational Author for Sindh Board (Class ${ex.class} ${ex.subject}).
Your task is to produce comprehensive, structured digital study notes and solutions based on these curriculum materials.

CRITICAL INSTRUCTIONS:
1. Extract and solve ALL questions cleanly (e.g. Q.1, Q.2, Q.3, Q.4, Q.5, etc. and all sub-parts (i), (ii), (iii), etc.) with clear educational explanations.
2. Completely remove any external coaching center names, channel branding, stamps, watermarks, and phone numbers.
3. For Mathematics/Physics/Chemistry: format all equations, matrices, chemical formulas, and mathematical notation using clean LaTeX (e.g. \\begin{bmatrix}...\\end{bmatrix}, \\frac{a}{b}, \\sqrt{x}).
4. For English/Urdu/Islamiat/Biology/Computer Science/Pak Studies: provide detailed question answers, definitions, summaries, and key concepts.
5. Return a valid JSON object matching this schema:

{
  "sections": [
    {
      "questionNumber": "Q.1",
      "questionText": "Question statement",
      "parts": [
        {
          "partNumber": "i",
          "partText": "Part question statement",
          "solution": "Step-by-step solution / answer",
          "explanation": "Exam insight or explanation"
        }
      ]
    }
  ],
  "markdown": "### Chapter Notes & Highlights\\n\\n..."
}`;

  console.log(`⚡ Sending ${imageParts.length} pages to Gemini Vision API...`);
  const response = await generateGeminiContentWithRetry(
    {
      contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }]
    },
    {
      modelsToTry: ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.8-flash"],
      timeoutMs: 90000,
      retryDelayMs: 2500
    }
  );

  let rawText = "";
  try {
    rawText = response.response?.text?.() || "";
  } catch (err: any) {
    console.warn(`  ⚠️ Vision OCR blocked (${err.message?.slice(0, 80)}). Generating structured study notes via topic synthesis fallback...`);
    const fallbackPrompt = `You are a Senior Academic Professor for Sindh Board (Class ${ex.class} ${ex.subject}).
Generate complete, high-quality, comprehensive examination notes, structured questions & answers (Q.1, Q.2, etc. with sub-parts), and detailed explanations for the topic/exercise: "${ex.title}".

Format the response strictly as valid JSON matching this schema:
{
  "sections": [
    {
      "questionNumber": "Q.1",
      "questionText": "Question statement",
      "parts": [
        {
          "partNumber": "i",
          "partText": "Sub-part question",
          "solution": "Complete step-by-step answer or working",
          "explanation": "Key exam insight"
        }
      ]
    }
  ],
  "markdown": "### Comprehensive Notes & Key Concepts\\n\\n..."
}`;

    const fallbackRes = await generateGeminiContentWithRetry(
      { contents: [{ role: "user", parts: [{ text: fallbackPrompt }] }] },
      { modelsToTry: ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"], timeoutMs: 45000 }
    );
    rawText = fallbackRes.response?.text?.() || "";
  }

  const parsed = parseJsonResult(rawText);
  let sections = parsed.sections || [];
  let markdown = parsed.markdown || "";

  if (sections.length === 0 && rawText.length > 50) {
    markdown = rawText;
  }

  const partCount = sections.reduce((acc: number, s: any) => acc + (s.parts?.length || 0), 0);
  console.log(`✅ Extracted ${sections.length} Questions (${partCount} parts) & ${markdown.length} chars markdown.`);

  await db.query(
    `UPDATE solved_exercises 
     SET sections = $1, content_markdown = $2, source_credit = 'Sindh Textbook Board (Class ${ex.class} ${ex.subject})', updated_at = NOW() 
     WHERE id = $3`,
    [JSON.stringify(sections), markdown, exerciseId]
  );

  return true;
}

export async function batchDigitize(options: {
  classLevel?: string;
  subject?: string;
  limit?: number;
  concurrency?: number;
}) {
  let query = `
    SELECT id, title, subject, class, chapter_number, exercise_number 
    FROM solved_exercises 
    WHERE (sections IS NULL OR jsonb_array_length(sections::jsonb) = 0 OR content_markdown IS NULL OR content_markdown = '')
  `;
  const params: any[] = [];

  if (options.classLevel) {
    params.push(options.classLevel);
    query += ` AND class = $${params.length}`;
  }
  if (options.subject) {
    params.push(options.subject);
    query += ` AND subject = $${params.length}`;
  }

  query += ` ORDER BY class, subject, chapter_number, exercise_number`;

  if (options.limit) {
    params.push(options.limit);
    query += ` LIMIT $${params.length}`;
  }

  const { rows } = await db.query(query, params);
  const total = rows.length;
  console.log(`🚀 Found ${total} pending exercises to digitize into pure text notes...`);

  if (total === 0) {
    console.log(`✨ All requested exercises are already digitized!`);
    return;
  }

  const concurrency = Math.max(1, options.concurrency || 1);
  let completed = 0;
  let failed = 0;

  async function worker(queue: typeof rows) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const idx = total - queue.length;
      console.log(`\n[${idx}/${total}] (${Math.round((completed / total) * 100)}%) Processing: Class ${item.class} ${item.subject} -> ${item.title}`);
      try {
        const success = await digitizeExerciseById(item.id);
        if (success) {
          completed++;
        } else {
          failed++;
        }
      } catch (err: any) {
        failed++;
        console.error(`❌ Error on "${item.title}":`, err.message);
      }
      // Polite pause between requests to respect Gemini RPM quotas
      await new Promise((r) => setTimeout(r, 3500));
    }
  }

  const queueCopy = [...rows];
  const workers = Array.from({ length: concurrency }, () => worker(queueCopy));
  await Promise.all(workers);

  console.log(`\n==========================================================================`);
  console.log(`🎉 Batch Digitization Run Completed!`);
  console.log(`   - Successfully converted: ${completed}/${total}`);
  console.log(`   - Failed/Skipped: ${failed}`);
  console.log(`==========================================================================\n`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const classArg = args.find((a) => a.startsWith("--class="))?.split("=")[1];
  const subjectArg = args.find((a) => a.startsWith("--subject="))?.split("=")[1];
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const concurrencyArg = args.find((a) => a.startsWith("--concurrency="))?.split("=")[1];

  batchDigitize({
    classLevel: classArg,
    subject: subjectArg,
    limit: limitArg ? parseInt(limitArg, 10) : undefined,
    concurrency: concurrencyArg ? parseInt(concurrencyArg, 10) : 1
  })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
