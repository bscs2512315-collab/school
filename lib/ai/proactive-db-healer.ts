import { db } from "@/lib/db";
import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";

function stripJsonFences(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Proactively scans and auto-heals questions with dummy/missing options in the database
 */
export async function autoHealDummyQuestions(limit = 100): Promise<{
  healedCount: number;
  totalFound: number;
  healedQuestions: Array<{ id: string; questionNumber: number; subject: string }>;
}> {
  // Find questions where options are dummy A, B, C, D and image_url is empty
  const { rows } = await db.query(
    `SELECT q.id, q.question_number, q.question_text, q.mcq_data,
            p.subject, p.class, p.year, p.board
     FROM questions q
     JOIN past_papers p ON q.past_paper_id = p.id
     WHERE (q.mcq_data->'options'->0->>'text' = 'A' AND q.mcq_data->'options'->1->>'text' = 'B')
       AND (q.image_url IS NULL OR q.image_url = '')
     LIMIT $1`,
    [limit]
  );

  let healedCount = 0;
  const healedQuestions: Array<{ id: string; questionNumber: number; subject: string }> = [];

  for (const q of rows) {
    try {
      const subject = q.subject || "General Science";
      const className = q.class || "";
      const board = q.board || "AKUEB";
      const questionText = q.question_text || "";

      if (!questionText.trim()) continue;

      const prompt = `You are a master examination author and senior subject specialist for ${board} Class ${className} ${subject}.
The following official exam question has missing or placeholder options ("A", "B", "C", "D").

Question:
"${questionText}"

Task:
1. Solve the question scientifically / mathematically.
2. Generate 4 clear, standardized, unambiguous multiple-choice options for A, B, C, D.
3. Determine the 100% correct answer key (A, B, C, or D).

Respond with ONLY a JSON object:
{
  "options": [
    { "id": "A", "text": "Option A text" },
    { "id": "B", "text": "Option B text" },
    { "id": "C", "text": "Option C text" },
    { "id": "D", "text": "Option D text" }
  ],
  "correctAnswer": "A or B or C or D",
  "explanation": "concise scientific proof"
}`;

      const aiRes = await generateGeminiContentWithRetry({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const jsonText = stripJsonFences(aiRes.response.text());
      const parsed = JSON.parse(sanitizeJsonEscapes(jsonText));

      if (Array.isArray(parsed.options) && parsed.options.length >= 2 && parsed.correctAnswer) {
        const currentMcq = typeof q.mcq_data === "string" ? JSON.parse(q.mcq_data) : q.mcq_data || {};
        const updatedMcqData = {
          ...currentMcq,
          options: parsed.options,
          correctAnswer: String(parsed.correctAnswer).trim().toUpperCase(),
          explanation: parsed.explanation || "",
          auto_healed: true,
          healed_at: new Date().toISOString(),
        };

        await db.query(
          `UPDATE questions 
           SET mcq_data = $1 
           WHERE id = $2`,
          [JSON.stringify(updatedMcqData), q.id]
        );

        healedCount++;
        healedQuestions.push({
          id: q.id,
          questionNumber: q.question_number,
          subject: `${subject} Class ${className} (${q.year})`,
        });
      }
    } catch (err) {
      console.error(`Failed to auto-heal question ${q.id}:`, err);
    }
  }

  return {
    healedCount,
    totalFound: rows.length,
    healedQuestions,
  };
}
