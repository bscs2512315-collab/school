import { z } from "zod";
import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";
import { successResponse, errorResponse } from "@/lib/response-handlers";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { rateLimitDistributed } from "@/lib/security/rate-limit";
import { NextRequest } from "next/server";

/**
 * Auto-grades a virtual-lab practical task the same way the AKUEB examiner
 * would: the student records their Observation + Inference, and Gemini marks
 * them against the expected answer for that task.
 *
 * Kept deliberately generic (keyed by `practical`) so every future Stage/Task
 * plugs in by adding a rubric entry below.
 */

const bodySchema = z.object({
  practical: z.string(),
  observation: z.string().max(1000),
  inference: z.string().max(1000),
});

type Rubric = {
  title: string;
  maxMarks: number;
  expectedObservation: string;
  expectedInference: string;
};

const RUBRICS: Record<string, Rubric> = {
  "glucose-fehling": {
    title: "Practical 11 (SLO 21.1.3) — Detect glucose as a reducing sugar (Fehling's test)",
    maxMarks: 2,
    expectedObservation:
      "On warming the sample with Fehling's solution in a boiling water bath, the blue colour fades and a red / green / yellow precipitate of copper(I) oxide (Cu2O) is formed.",
    expectedInference:
      "A reducing sugar (e.g. glucose) is present; it contains a free aldehyde (–CHO) group which reduces Cu2+ (blue) to Cu2O precipitate.",
  },
  "salt-fe3": {
    title: "Salt Analysis — Basic radical: detection of Fe³⁺ (Group III)",
    maxMarks: 4,
    expectedObservation:
      "With dil. HCl: no precipitate (Group I absent). On passing H2S: no precipitate (Groups IB/IIB absent). With NH4Cl + excess NH4OH: a reddish-brown gelatinous precipitate of Fe(OH)3 is formed → Group III. Confirmatory: salt solution + KSCN (or K4[Fe(CN)6]) gives a blood-red colour (or Prussian-blue).",
    expectedInference:
      "The basic radical is Fe³⁺ (iron(III)), a Group III cation; the reddish-brown Fe(OH)3 and blood-red thiocyanate complex confirm iron(III).",
  },
};

function extractJson(text: string): { marks: number; feedback: string } | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.marks === "number" && typeof parsed.feedback === "string") {
      return { marks: parsed.marks, feedback: parsed.feedback };
    }
  } catch {
    /* fall through */
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!(await rateLimitDistributed(`lab:grade:${user.userId}`, 30, 60))) {
      return errorResponse("Rate limit exceeded. Please wait a moment before submitting again.", 429);
    }
    const { practical, observation, inference } = bodySchema.parse(await req.json());
    const rubric = RUBRICS[practical];
    if (!rubric) return errorResponse(`Unknown practical: ${practical}`, 400);

    const prompt = `You are an AKUEB HSSC Chemistry Paper III practical examiner. Mark the student's answer strictly but fairly.

TASK: ${rubric.title}
TOTAL MARKS: ${rubric.maxMarks} (1 for a correct Observation, 1 for a correct Inference)

EXPECTED OBSERVATION: ${rubric.expectedObservation}
EXPECTED INFERENCE: ${rubric.expectedInference}

STUDENT OBSERVATION: ${observation || "(blank)"}
STUDENT INFERENCE: ${inference || "(blank)"}

Award marks for chemically correct meaning, not exact wording. Reply with ONLY a JSON object of the form:
{"marks": <number 0-${rubric.maxMarks}>, "feedback": "<one or two sentences of concise, encouraging examiner feedback>"}`;

    const result = await generateGeminiContentWithRetry({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.response.text();
    const parsed = extractJson(text);

    if (!parsed) return errorResponse("Could not parse grading response. Please try again.", 502);

    const marks = Math.max(0, Math.min(rubric.maxMarks, Math.round(parsed.marks)));
    return successResponse(
      { marks, maxMarks: rubric.maxMarks, feedback: parsed.feedback },
      "Graded",
    );
  } catch (err) {
    if (err instanceof z.ZodError) return errorResponse(err.issues.map((i) => i.message).join(", "), 400);
    return errorResponse(err instanceof Error ? err : "Grading failed", 500);
  }
}
