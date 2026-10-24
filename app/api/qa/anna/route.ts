import { NextRequest, NextResponse } from "next/server";
import { generateGeminiContentWithRetry, getGeminiChatModelsToTry } from "@/lib/ai/gemini";
import { getUserFromRequest } from "@/lib/middleware/user-auth";
import { UserRole } from "@/types/enums";
import { rateLimitDistributed } from "@/lib/security/rate-limit";
import { jsonrepair } from "jsonrepair";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_BETA_STUDENT_EMAIL = "mtahatalib110+aliya@gmail.com";

function isAuthorized(user: { role: string; email?: string } | null): boolean {
  if (!user) return false;
  const role = String(user.role || "").toUpperCase();
  if (role === UserRole.QA || role === UserRole.ADMIN || role === "QA" || role === "ADMIN") {
    return true;
  }
  if (user.email && user.email.toLowerCase() === ALLOWED_BETA_STUDENT_EMAIL) {
    return true;
  }
  return false;
}

function parseJsonSafe<T>(rawText: string, fallback: T): T {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const repaired = jsonrepair(jsonMatch[0]);
    return JSON.parse(repaired) as T;
  } catch (err) {
    console.warn("[Anna API] JSON parsing failed, returning fallback:", err);
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !isAuthorized(user)) {
      return NextResponse.json({ error: "Unauthorized. Anna Voice AI is currently restricted to QA team." }, { status: 403 });
    }

    if (!(await rateLimitDistributed(`anna:${user.userId}`, 30, 60))) {
      return NextResponse.json({ error: "Too many voice requests. Please slow down a moment." }, { status: 429 });
    }

    const body = await req.json();
    const { mode } = body;

    // -------------------------------------------------------------
    // MODE 1: Siri-like Voice Command & Intent Parser
    // -------------------------------------------------------------
    if (mode === "command") {
      const { transcript, audioBase64, audioMimeType, userContext } = body;
      if (!transcript && !audioBase64) {
        return NextResponse.json({ error: "Transcript or audio recording is required" }, { status: 400 });
      }

      const promptParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      const promptText = `You are Anna, the intelligent, friendly voice assistant for ExBoard AI (an online exam preparation and AI tutoring platform for Pakistani matric and intermediate students - FBISE, AKU-EB, Sindh Board, Punjab Board).
${transcript ? `The student spoke this command: "${transcript.trim()}"` : `The student spoke the attached audio command. Listen carefully to what they said and transcribe it.`}

User Context:
Class: ${userContext?.class || "10"}
Board: ${userContext?.board || "Federal Board"}
Role: ${user?.role || "Student"}

Parse the student's command into JSON. Determine their exact intent, relevant subject, grade, and action:
Possible intents:
1. "GENERATE_PAPER": Student wants to generate or practice a test paper (e.g. "Generate paper for chemistry", "Make a 20 marks physics test").
2. "PAST_PAPERS": Student wants past papers (e.g. "Open past papers", "Show MCQs for biology").
3. "PAPERS_BANK": Student wants papers bank or question bank.
4. "CUSTOM_QUIZ": Student wants to view or build quizzes.
5. "NOVA_TUTOR": Student wants to talk with Nova AI tutor.
6. "START_VIVA": Student wants Anna to test them, quiz them orally, or conduct a viva on a topic.
7. "EXPLAIN_CONCEPT": Student asked a conceptual academic question (e.g. "Explain Boyle's law", "What is mitochondria?").
8. "NAVIGATE": General app navigation (dashboard, leaderboard, classrooms, solved notes).
9. "CHAT": Friendly greeting or general talk with Anna.

Rules:
- "transcribedText": The exact words spoken by the student (transcribed from audio or matched from text).
- "spokenResponse": A short, clear, friendly 1 to 2 sentence response suitable for Text-To-Speech. Write in pure conversational English without markdown asterisks, hashtags, or bullet points so Anna pronounces every word smoothly and naturally.
- "action": Link data for one-click action.
  If GENERATE_PAPER: url: "/student/generate?subject=" + (subject || "Chemistry")
  If PAST_PAPERS: url: "/student/past-papers-1"
  If PAPERS_BANK: url: "/student/papers-bank"
  If CUSTOM_QUIZ: url: "/student/custom-quizzes"
  If START_VIVA: type: "VIVA", topic: topic extracted
  If NAVIGATE: url: appropriate student route (/student/dashboard, /student/leaderboard, /student/solved-notes, etc.)
- "conceptSummary": If EXPLAIN_CONCEPT, give concise 2-3 bullet point summary for the screen.

Respond ONLY with valid JSON matching this schema:
{
  "transcribedText": "string",
  "intent": "GENERATE_PAPER" | "PAST_PAPERS" | "PAPERS_BANK" | "CUSTOM_QUIZ" | "NOVA_TUTOR" | "START_VIVA" | "EXPLAIN_CONCEPT" | "NAVIGATE" | "CHAT",
  "spokenResponse": "string",
  "subject": "Chemistry" | "Physics" | "Mathematics" | "Biology" | "Computer Science" | "English" | "Urdu" | "Islamiat" | "Pakistan Studies" | null,
  "topic": "string or null",
  "grade": "9" | "10" | "11" | "12" | null,
  "action": {
    "type": "LINK" | "VIVA" | "NONE",
    "title": "string",
    "url": "string or null",
    "badge": "string"
  },
  "conceptSummary": "string or null"
}`;

      promptParts.push({ text: promptText });

      if (audioBase64) {
        promptParts.push({
          inlineData: {
            mimeType: audioMimeType || "audio/webm",
            data: audioBase64,
          },
        });
      }

      const modelsToTry = getGeminiChatModelsToTry();
      const aiResult = await generateGeminiContentWithRetry(
        { contents: [{ role: "user", parts: promptParts }] },
        { modelsToTry, maxAttempts: 3 }
      );

      const parsed = parseJsonSafe(aiResult.response.text(), {
        transcribedText: transcript || "Spoken command",
        intent: "CHAT",
        spokenResponse: "I heard you! How can I assist you with your exam prep today?",
        subject: null,
        topic: null,
        grade: null,
        action: { type: "NONE", title: "Chat with Anna", url: null, badge: "Assistant" },
        conceptSummary: null,
      });

      return NextResponse.json(parsed);
    }

    // -------------------------------------------------------------
    // MODE 2: Viva Question Generator (Oral Examiner asks a question)
    // -------------------------------------------------------------
    if (mode === "viva_question") {
      const { subject = "Chemistry", topic = "Chemical Equilibrium", grade = "10", board = "AKUEB", previousQuestions = [] } = body;

      const prompt = `You are Anna, a friendly yet rigorous senior board examiner conducting an oral examination (viva voce) for a Pakistani student (${board}, Class ${grade}).
Subject: ${subject}
Topic: ${topic}
Previously asked questions: ${JSON.stringify(previousQuestions)}

Create 1 targeted, high-yield oral exam question that tests deep conceptual understanding, reasoning, or real-world application (not simple rote memorization).
Also identify 3-4 essential key points a student must state for a complete answer.

Format response ONLY as JSON:
{
  "question": "Clear, direct question text",
  "spokenIntro": "Spoken question intro for Anna to say aloud (e.g. 'Here is your question: Can you explain...')",
  "topic": "${topic}",
  "subject": "${subject}",
  "difficulty": "Easy" | "Medium" | "Challenging",
  "keyExpectedPoints": [
    "Key concept 1",
    "Key concept 2",
    "Key concept 3"
  ],
  "hint": "Short one-sentence hint if the student struggles"
}`;

      const modelsToTry = getGeminiChatModelsToTry();
      const aiResult = await generateGeminiContentWithRetry(
        { contents: [{ role: "user", parts: [{ text: prompt }] }] },
        { modelsToTry, maxAttempts: 3 }
      );

      const parsed = parseJsonSafe(aiResult.response.text(), {
        question: `Explain the fundamental concept of ${topic} and how it applies in ${subject}.`,
        spokenIntro: `Here is your question on ${topic}: Can you explain the fundamental principle and give one key example?`,
        topic,
        subject,
        difficulty: "Medium",
        keyExpectedPoints: [
          "Accurate scientific definition",
          "Underlying mechanism or formula",
          "Accurate real-world example or condition"
        ],
        hint: `Think about the key definitions and formulas related to ${topic}.`
      });

      return NextResponse.json(parsed);
    }

    // -------------------------------------------------------------
    // MODE 3: Viva Evaluator (Listen to Student's Spoken Answer & Grade)
    // -------------------------------------------------------------
    if (mode === "viva_evaluate") {
      const { question, topic, subject, studentAnswer, audioBase64, audioMimeType, keyExpectedPoints = [] } = body;

      if (!studentAnswer && !audioBase64) {
        return NextResponse.json({ error: "Student answer or audio is required for evaluation." }, { status: 400 });
      }

      const promptParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      const promptText = `You are Anna, an encouraging and expert oral examiner for ExBoard AI.
A student just spoke their answer to an oral exam question:

Subject: ${subject}
Topic: ${topic}
Question Asked: "${question}"
Expected Key Points: ${JSON.stringify(keyExpectedPoints)}

${studentAnswer ? `Student's Spoken Answer: "${studentAnswer.trim()}"` : `Student's Spoken Answer is in the attached audio recording. Listen to their spoken words carefully.`}

Evaluate the student's answer fairly and constructively:
1. "transcribedAnswer": The exact transcription of what the student spoke.
2. "score": Integer 0 to 100 based on accuracy, completeness, and clarity.
3. "verdict":
   - "MASTERED" if score >= 85 (Concept thoroughly understood, key terms covered)
   - "GOOD_PROGRESS" if score is 55 to 84 (Understood core idea, but missed some terms or details)
   - "NEEDS_REVISION" if score < 55 (Major misconception, irrelevant answer, or incomplete)
4. "spokenFeedback": A natural, warm, encouraging 2-3 sentence verbal response for Anna to speak aloud via Text-to-Speech.
   - Start with praise for what they got right.
   - Mention the 1 biggest missing detail or correction kindly.
   - Write in plain conversational English without markdown, asterisks, or formulas (e.g. write "water" or "H 2 O", not "H2O -> ...") so the voice sounds human and articulate.
   - Sound like a supportive personal tutor. Keep it under 50 words so it speaks quickly.
5. "praise": Bullet points of what they understood correctly.
6. "missingPoints": Bullet points of important scientific terms, conditions, or facts they left out.
7. "examTip": Specific board exam advice (e.g. "Always write the formula F=ma and state units of Newtons for full 4 marks").
8. "followUpQuestion": A natural follow-up question to test depth further.

Format response ONLY as JSON:
{
  "transcribedAnswer": "string",
  "score": 85,
  "verdict": "MASTERED" | "GOOD_PROGRESS" | "NEEDS_REVISION",
  "spokenFeedback": "Great job! You explained the direction of the reaction accurately. Remember to also state that the equilibrium constant decreases with temperature in exothermic reactions.",
  "praise": ["Correctly identified the shift direction", "Applied Le Chatelier's principle accurately"],
  "missingPoints": ["Did not mention the effect on equilibrium constant Kc"],
  "examTip": "In board exams, always specify both the reaction direction and the change in Kc value.",
  "followUpQuestion": "What would happen to the yield if we increased the pressure instead?"
}`;

      promptParts.push({ text: promptText });

      if (audioBase64) {
        promptParts.push({
          inlineData: {
            mimeType: audioMimeType || "audio/webm",
            data: audioBase64,
          },
        });
      }

      const modelsToTry = getGeminiChatModelsToTry();
      const aiResult = await generateGeminiContentWithRetry(
        { contents: [{ role: "user", parts: promptParts }] },
        { modelsToTry, maxAttempts: 3 }
      );

      const parsed = parseJsonSafe(aiResult.response.text(), {
        transcribedAnswer: studentAnswer || "Spoken response",
        score: 75,
        verdict: "GOOD_PROGRESS",
        spokenFeedback: "Good explanation! You captured the main concept well. Be sure to review the exact scientific terms for full marks.",
        praise: ["Explained the general idea well"],
        missingPoints: ["Include specific formulas and terminology"],
        examTip: "Always mention standard units and key definitions.",
        followUpQuestion: `Would you like another question on ${topic}?`
      });

      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: "Invalid mode requested." }, { status: 400 });
  } catch (error: unknown) {
    console.error("[Anna API Error]:", error);
    const message = error instanceof Error ? error.message : "Failed to process voice request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
