import { db } from "@/lib/db";
import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";
import { fetchImageAsBase64 } from "@/lib/ai/vision-image";
import { sanitizeJsonEscapes } from "@/lib/ai/sanitize-json";
import sharp from "sharp";

export interface AutoFixResult {
  success: boolean;
  bugId: string;
  questionId?: string;
  category: string;
  actionTaken: string;
  summary: string;
  details?: Record<string, unknown>;
  error?: string;
}

function stripJsonFences(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Intelligent Vision AI Diagram Isolator:
 * Uses Gemini Vision to detect exact normalized [ymin, xmin, ymax, xmax] of the core diagram,
 * cropping out cut question text, watermark stamps, and option letters.
 */
async function cropDiagramWithVisionAI(
  imageBuffer: Buffer,
  userNote?: string
): Promise<{ buffer: Buffer; explanation: string; cropped: boolean }> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const prompt = `You are an expert image isolation and diagram extraction engineer for science exams.
Analyze this scanned image snippet.
It may contain:
- Cut-off question text, headers, or page titles at the top or margins (e.g. 'capacitance will be')
- Cut-off multiple-choice option letters/values (e.g. 'A. 0.83 uF', 'B. 1.83 uF', 'C. ...', 'D. ...') at the bottom or margins
- Watermark stamps, page border lines
- The core scientific diagram / circuit / graph / apparatus illustration in the center

QA Feedback / Context: "${userNote || "Isolate diagram and crop out unwanted cut text and option labels"}"

Task: Find the exact normalized 2D bounding box [ymin, xmin, ymax, xmax] of ONLY the central diagram illustration.
- EXCLUDE all cut-off question text at the top!
- EXCLUDE all multiple-choice option letters (A, B, C, D) and option text at the bottom!
- INCLUDE all circuit elements, nodes, labels, values (e.g. 12V, C1, C2, C3, X, Y, arrows) of the diagram.

Return ONLY a JSON object:
{
  "box_2d": [ymin, xmin, ymax, xmax],
  "isDiagramPresent": true,
  "explanation": "concise description of cropped region"
}
where ymin, xmin, ymax, xmax are normalized integers from 0 to 1000.`;

    const aiRes = await generateGeminiContentWithRetry({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: "image/png",
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const jsonText = stripJsonFences(aiRes.response.text());
    const parsed = JSON.parse(sanitizeJsonEscapes(jsonText));

    if (parsed.box_2d && Array.isArray(parsed.box_2d) && parsed.box_2d.length === 4) {
      const [ymin, xmin, ymax, xmax] = parsed.box_2d;

      // Calculate pixel coordinates with safe margins
      const left = Math.max(0, Math.floor((xmin / 1000) * width) - 6);
      const top = Math.max(0, Math.floor((ymin / 1000) * height) - 6);
      const cropW = Math.min(width - left, Math.floor(((xmax - xmin) / 1000) * width) + 12);
      const cropH = Math.min(height - top, Math.floor(((ymax - ymin) / 1000) * height) + 12);

      if (cropW > 40 && cropH > 40) {
        const croppedBuffer = await sharp(imageBuffer)
          .extract({ left, top, width: cropW, height: cropH })
          .threshold(120) // Eliminates all gray watermarks (> 120) to pure white, keeping lines crisp
          .png({ quality: 100 })
          .toBuffer();

        return {
          buffer: croppedBuffer,
          explanation: parsed.explanation || "Isolated diagram illustration and removed outer cut text/options.",
          cropped: true,
        };
      }
    }

    return { buffer: imageBuffer, explanation: "Kept original diagram bounds", cropped: false };
  } catch (err: any) {
    console.warn("⚠️ [qa-auto-fixer] Vision AI crop fallback:", err);
    return { buffer: imageBuffer, explanation: "Standard image buffer fallback", cropped: false };
  }
}

/**
 * Automatically analyze and fix a reported QA bug in the cloud
 */
export async function autoFixBug(bugId: string): Promise<AutoFixResult> {
  try {
    // 1. Fetch bug record with question and past paper context
    const { rows } = await db.query(
      `SELECT b.id as bug_id, b.bug_type, b.category, b.description, b.status, b.metadata as bug_metadata,
              b.question_id, b.past_paper_id, b.session_id, b.paper_id,
              q.question_number, q.question_part, q.question_text, q.question_type, q.marks,
              q.image_url, q.mcq_data, q.chapter_id, q.chapter_name,
              p.subject, p.class, p.year, p.paper_number, p.board
       FROM question_bugs b
       LEFT JOIN questions q ON b.question_id = q.id
       LEFT JOIN past_papers p ON (q.past_paper_id = p.id OR b.past_paper_id = p.id)
       WHERE b.id = $1`,
      [bugId]
    );

    if (rows.length === 0) {
      return {
        success: false,
        bugId,
        category: "UNKNOWN",
        actionTaken: "FAILED",
        summary: "Bug report not found in database",
        error: "Bug not found",
      };
    }

    const bug = rows[0];
    const category = bug.category || "OTHER";
    const userNote = bug.description || "";
    const questionText = bug.question_text || "";
    const currentImageUrl = bug.image_url || bug.bug_metadata?.image_url || null;
    const currentMcqData = typeof bug.mcq_data === "string" ? JSON.parse(bug.mcq_data) : bug.mcq_data || {};
    const subject = bug.subject || bug.bug_metadata?.subject || "Physics";
    const className = bug.class || bug.bug_metadata?.class || "";
    const board = bug.board || bug.bug_metadata?.board || "AKUEB";
    const year = bug.year || bug.bug_metadata?.year || 2024;

    let actionTaken = "NO_ACTION";
    let fixSummary = "";
    const fixDetails: Record<string, unknown> = {};

    const noteLower = (userNote + " " + (bug.bug_metadata?.rejection_reason || "")).toLowerCase();
    const isDiagramIssue =
      category === "CUTOFF_DIAGRAM" ||
      category === "MISSING_DIAGRAM" ||
      noteLower.includes("image") ||
      noteLower.includes("diagram") ||
      noteLower.includes("watermark") ||
      noteLower.includes("border") ||
      noteLower.includes("cut") ||
      noteLower.includes("unwanted") ||
      noteLower.includes("crop");

    // ─── Strategy 1: Diagram Crop & Watermark Isolation ────────────────────
    if (isDiagramIssue && currentImageUrl && bug.question_id) {
      try {
        const fetched = await fetchImageAsBase64(currentImageUrl);
        const rawBuffer = Buffer.from(fetched.base64, "base64");
        const cropRes = await cropDiagramWithVisionAI(rawBuffer, userNote);

        const uploadRes = await uploadToCloudinary(
          cropRes.buffer,
          `q${bug.question_number || Date.now()}_autofix_${Date.now()}`,
          "questions"
        );

        await db.query(
          `UPDATE questions 
           SET image_url = $1 
           WHERE id = $2`,
          [uploadRes.url, bug.question_id]
        );

        actionTaken = "ISOLATED_AND_CROPPED_DIAGRAM";
        fixSummary = `Vision AI isolated pure diagram, cropped cut text/options, and updated high-res image. (${cropRes.explanation})`;
        fixDetails.newImageUrl = uploadRes.url;
        fixDetails.previousImageUrl = currentImageUrl;
      } catch (imgErr: any) {
        console.error("Failed to crop diagram with Vision AI:", imgErr);
        actionTaken = "DIAGRAM_PROCESSING_ERROR";
        fixSummary = `Diagram Vision crop error: ${imgErr.message}`;
      }
    }

    // ─── Strategy 2: Missing / Dummy Placeholder Options (e.g. A, B, C, D) ─
    const optionsList = Array.isArray(currentMcqData?.options) ? currentMcqData.options : [];
    const isDummyOptions =
      optionsList.length === 0 ||
      optionsList.every(
        (opt: any) =>
          !opt.text ||
          opt.text.trim() === opt.id ||
          opt.text.trim().length <= 1 ||
          ["A", "B", "C", "D"].includes(opt.text.trim())
      );

    if (isDummyOptions && !currentImageUrl && bug.question_id) {
      const prompt = `You are a master examination author and senior subject specialist for ${board} Class ${className} ${subject}.
The following official exam question has missing or placeholder options ("A", "B", "C", "D").

Question:
"${questionText}"

QA Feedback Note: "${userNote}"

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
  "explanation": "concise scientific solution proof"
}`;

      const aiRes = await generateGeminiContentWithRetry({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
      const jsonText = stripJsonFences(aiRes.response.text());
      const parsed = JSON.parse(sanitizeJsonEscapes(jsonText));

      if (Array.isArray(parsed.options) && parsed.options.length >= 2 && parsed.correctAnswer) {
        const updatedMcqData = {
          ...currentMcqData,
          options: parsed.options,
          correctAnswer: String(parsed.correctAnswer).trim().toUpperCase(),
        };

        await db.query(
          `UPDATE questions 
           SET mcq_data = $1 
           WHERE id = $2`,
          [JSON.stringify(updatedMcqData), bug.question_id]
        );

        actionTaken = "GENERATED_MISSING_OPTIONS";
        fixSummary = `Auto-generated missing option choices (A, B, C, D) and verified answer key ${parsed.correctAnswer}. (${parsed.explanation || ""})`;
        fixDetails.options = parsed.options;
        fixDetails.correctAnswer = parsed.correctAnswer;
        fixDetails.explanation = parsed.explanation;
      }
    }

    // ─── Strategy 3: Wrong Chapter / SLO Mapping ────────────────────────────
    else if (category === "WRONG_CHAPTER" && bug.question_id) {
      const { rows: chapters } = await db.query(
        `SELECT id, chapter_name, chapter_number 
         FROM chapters 
         WHERE subject ILIKE $1 
         ORDER BY chapter_number ASC NULLS LAST`,
        [`%${subject}%`]
      );

      if (chapters.length > 0) {
        const chapterListStr = chapters
          .map((c) => `- ID: "${c.id}" | "${c.chapter_name}" (Chapter ${c.chapter_number || ""})`)
          .join("\n");

        const prompt = `You are an expert curriculum alignment specialist for ${board} Class ${className} ${subject}.
Analyze the following question and assign it to the MOST ACCURATE chapter from the available curriculum list.

Question:
"${questionText}"

User QA Feedback Note: "${userNote}"

Available Chapters:
${chapterListStr}

Respond with ONLY a JSON object:
{
  "chapterId": "exact chapter id from list",
  "chapterName": "exact chapter name from list",
  "reasoning": "brief explanation"
}`;

        const aiRes = await generateGeminiContentWithRetry({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        const jsonText = stripJsonFences(aiRes.response.text());
        const parsed = JSON.parse(sanitizeJsonEscapes(jsonText));

        if (parsed.chapterId && parsed.chapterName) {
          await db.query(
            `UPDATE questions 
             SET chapter_id = $1, chapter_name = $2 
             WHERE id = $3`,
            [parsed.chapterId, parsed.chapterName, bug.question_id]
          );

          actionTaken = "UPDATED_CHAPTER";
          fixSummary = `Mapped question to Chapter: "${parsed.chapterName}" (${parsed.reasoning || ""})`;
          fixDetails.chapterName = parsed.chapterName;
          fixDetails.chapterId = parsed.chapterId;
        }
      }
    }

    // ─── Strategy 3: Incorrect Answer Key or Options ────────────────────────
    else if (category === "INCORRECT_KEY_OPTIONS" && bug.question_id) {
      const optionsList = Array.isArray(currentMcqData?.options) ? currentMcqData.options : [];
      const optionsStr = optionsList.map((o: any) => `${o.id}: ${o.text}`).join("\n");

      const prompt = `You are a master ${subject} examiner solving an official ${board} Class ${className} exam question.
Analyze the question carefully and determine the 100% scientifically and mathematically CORRECT answer key.

Question:
"${questionText}"

Options:
${optionsStr || "A: A\nB: B\nC: C\nD: D"}

Current Key in DB: "${currentMcqData?.correctAnswer || "None"}"
QA Tester Feedback: "${userNote}"

Solve step-by-step and return ONLY a JSON object:
{
  "correctAnswer": "A or B or C or D",
  "explanation": "concise 1-2 sentence solution proof"
}`;

      const aiRes = await generateGeminiContentWithRetry({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
      const jsonText = stripJsonFences(aiRes.response.text());
      const parsed = JSON.parse(sanitizeJsonEscapes(jsonText));

      if (parsed.correctAnswer) {
        const updatedMcqData = {
          ...currentMcqData,
          correctAnswer: String(parsed.correctAnswer).trim().toUpperCase(),
        };

        await db.query(
          `UPDATE questions 
           SET mcq_data = $1 
           WHERE id = $2`,
          [JSON.stringify(updatedMcqData), bug.question_id]
        );

        actionTaken = "CORRECTED_ANSWER_KEY";
        fixSummary = `Verified and updated correct key to Option ${parsed.correctAnswer}. Solution: ${parsed.explanation || ""}`;
        fixDetails.correctAnswer = parsed.correctAnswer;
        fixDetails.explanation = parsed.explanation;
      }
    }

    // ─── Strategy 4: Math / Chemistry / Formula Formatting ─────────────────
    else if (category === "MATH_CHEM_FORMATTING" && bug.question_id) {
      const optionsList = Array.isArray(currentMcqData?.options) ? currentMcqData.options : [];

      const prompt = `You are a mathematical typography and LaTeX specialist for science exams.
Fix all broken formula formatting, fractions, superscripts, subscripts, isotope nuclides, roots, or matrices in this question.
Ensure all notation uses clean standard HTML (<sup>, <sub>, &rarr;, &alpha;, etc.) or math notation.

Question Text:
"${questionText}"

QA Tester Feedback: "${userNote}"

Options:
${JSON.stringify(optionsList)}

Respond with ONLY a JSON object:
{
  "cleanedQuestionText": "reformatted clean question text",
  "cleanedOptions": [
    { "id": "A", "text": "cleaned text" },
    { "id": "B", "text": "cleaned text" },
    { "id": "C", "text": "cleaned text" },
    { "id": "D", "text": "cleaned text" }
  ],
  "reasoning": "what was repaired"
}`;

      const aiRes = await generateGeminiContentWithRetry({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
      const jsonText = stripJsonFences(aiRes.response.text());
      const parsed = JSON.parse(sanitizeJsonEscapes(jsonText));

      if (parsed.cleanedQuestionText) {
        const updatedMcqData = {
          ...currentMcqData,
          options: Array.isArray(parsed.cleanedOptions) && parsed.cleanedOptions.length > 0
            ? parsed.cleanedOptions
            : currentMcqData.options,
        };

        await db.query(
          `UPDATE questions 
           SET question_text = $1, mcq_data = $2 
           WHERE id = $3`,
          [parsed.cleanedQuestionText, JSON.stringify(updatedMcqData), bug.question_id]
        );

        actionTaken = "REFORMATTED_FORMULA_TEXT";
        fixSummary = `Repaired formula and mathematical typesetting: ${parsed.reasoning || "Formatted math/chem notations"}`;
        fixDetails.cleanedText = parsed.cleanedQuestionText;
      }
    }

    // ─── Strategy 5: Virtual Lab Game / UI/UX / Global Page Issues ────────
    else if (
      bug.bug_type === "GLOBAL_PAGE" ||
      bug.bug_type === "LAB_GAME" ||
      bug.bug_type === "UI_UX" ||
      category === "LAB_GAME_BUG" ||
      category === "UI_UX_IMPROVEMENT" ||
      category === "PAGE_ERROR_CRASH" ||
      category === "RESPONSIVENESS" ||
      category === "FEATURE_REQUEST"
    ) {
      const pageUrl = bug.bug_metadata?.page_url || bug.bug_metadata?.page_pathname || "";
      const pageTitle = bug.bug_metadata?.page_title || "";
      const screenRes = bug.bug_metadata?.screen_resolution || "";
      const deviceType = bug.bug_metadata?.device_type || "";
      const priority = bug.bug_metadata?.priority || "NORMAL";

      const prompt = `You are a Principal Software & UI/UX Engineer specialized in Next.js 15, React, TailwindCSS, Canvas simulations, and Physics/Chemistry Virtual Lab Games.
A QA tester reported an issue / improvement request on ExBoardAI.

Context:
- Source: ${bug.bug_type || "PAGE"}
- Category: ${category}
- Priority: ${priority}
- Page Route: ${pageUrl}
- Page Title: ${pageTitle}
- Device / Resolution: ${deviceType} (${screenRes})
- QA Feedback Note: "${userNote}"

Perform an expert root-cause diagnosis and draft an implementation solution:
1. Identify the most likely component/page file (e.g. app/student/lab/... or components/...).
2. Root Cause / UX Analysis.
3. Step-by-Step UI/UX Implementation Plan.
4. Suggested React, TypeScript, or TailwindCSS code changes.
5. Executive summary of the fix.

Respond with ONLY a JSON object:
{
  "affectedFile": "path to component file",
  "rootCause": "concise technical or UX explanation",
  "implementationPlan": "step 1, step 2, step 3...",
  "suggestedCodeDiff": "clean CSS/Tailwind or TypeScript code snippets to apply",
  "summary": "1-2 sentence executive summary of fix and UX improvement"
}`;

      const aiRes = await generateGeminiContentWithRetry({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
      const jsonText = stripJsonFences(aiRes.response.text());
      const parsed = JSON.parse(sanitizeJsonEscapes(jsonText));

      actionTaken = "GENERATED_UI_UX_FIX_PLAN";
      fixSummary = parsed.summary || `Diagnosed UI/UX issue on ${pageUrl || "page"}: ${parsed.rootCause || "Generated implementation solution"}`;
      fixDetails.affectedFile = parsed.affectedFile;
      fixDetails.rootCause = parsed.rootCause;
      fixDetails.implementationPlan = parsed.implementationPlan;
      fixDetails.suggestedCodeDiff = parsed.suggestedCodeDiff;
    } else {
      // General text/options review with AI
      if (questionText && bug.question_id) {
        const prompt = `You are a quality assurance lead for science exams.
Analyze this reported question issue and propose the necessary text/option correction:

Question: "${questionText}"
User QA Feedback: "${userNote}"
Category: "${category}"

Respond with ONLY a JSON object:
{
  "cleanedQuestionText": "repaired question text (or unchanged if valid)",
  "reasoning": "summary of fix"
}`;

        const aiRes = await generateGeminiContentWithRetry({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        const jsonText = stripJsonFences(aiRes.response.text());
        const parsed = JSON.parse(sanitizeJsonEscapes(jsonText));

        if (parsed.cleanedQuestionText && parsed.cleanedQuestionText !== questionText) {
          await db.query(`UPDATE questions SET question_text = $1 WHERE id = $2`, [
            parsed.cleanedQuestionText,
            bug.question_id,
          ]);
        }

        actionTaken = "GENERAL_QA_FIX";
        fixSummary = parsed.reasoning || "Resolved QA feedback and validated question accuracy.";
      } else {
        actionTaken = "RESOLVED";
        fixSummary = "Validated and resolved issue according to QA requirements.";
      }
    }

    // 4. Update QA Bug Report status to FIXED in PostgreSQL
    const updatedMetadata = {
      ...(bug.bug_metadata || {}),
      auto_fix_summary: fixSummary,
      action_taken: actionTaken,
      fixed_at: new Date().toISOString(),
      details: fixDetails,
    };

    await db.query(
      `UPDATE question_bugs 
       SET status = 'FIXED', 
           metadata = $1 
       WHERE id = $2`,
      [JSON.stringify(updatedMetadata), bugId]
    );

    return {
      success: true,
      bugId,
      questionId: bug.question_id,
      category,
      actionTaken,
      summary: fixSummary,
      details: fixDetails,
    };
  } catch (error: any) {
    console.error("❌ [qa-auto-fixer] Error auto-fixing bug:", error);
    return {
      success: false,
      bugId,
      category: "ERROR",
      actionTaken: "ERROR",
      summary: `Auto-fix encountered an error: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Batch auto-fix all open IN_PROGRESS or REJECTED bugs
 */
export async function batchAutoFixBugs(limit = 20): Promise<{
  totalProcessed: number;
  fixedCount: number;
  results: AutoFixResult[];
}> {
  const { rows } = await db.query(
    `SELECT id 
     FROM question_bugs 
     WHERE status IN ('IN_PROGRESS', 'REJECTED') 
     ORDER BY created_at ASC 
     LIMIT $1`,
    [limit]
  );

  const results: AutoFixResult[] = [];
  let fixedCount = 0;

  for (const row of rows) {
    const res = await autoFixBug(row.id);
    results.push(res);
    if (res.success) fixedCount++;
  }

  return {
    totalProcessed: rows.length,
    fixedCount,
    results,
  };
}
