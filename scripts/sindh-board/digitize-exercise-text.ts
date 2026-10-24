import "dotenv/config";
import axios from "axios";
import { generateGeminiContentWithRetry } from "@/lib/ai/gemini";
import { db } from "@/lib/db";

export interface QuestionPart {
  partNumber: string; // e.g. "i", "ii", "a", "b"
  partText: string;
  solution: string; // Step-by-step working with LaTeX math
  explanation?: string;
}

export interface ExerciseQuestion {
  questionNumber: string; // e.g. "Q.1", "Q.2", "Question 1"
  questionText: string;
  parts: QuestionPart[];
}

export async function digitizeExerciseImages(
  exerciseTitle: string,
  imageUrls: string[]
): Promise<{ sections: ExerciseQuestion[]; markdown: string }> {
  console.log(`🧠 Downloading ${imageUrls.length} page images for "${exerciseTitle}"...`);

  const imageParts: any[] = [];
  for (const url of imageUrls) {
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
      console.warn(`Failed to fetch image: ${url} (${e.message})`);
    }
  }

  if (imageParts.length === 0) {
    throw new Error("No images could be downloaded.");
  }

  const prompt = `You are a Senior Mathematics Professor and Master Typesetter for the Sindh Board of Secondary Education (BSEK / BIEK Karachi & Sindh Board).
Your task is to transcribe, digitize, and solve all the textbook mathematics questions from these exercise notes pages into CLEAN, BEAUTIFUL, ACADEMIC TEXT AND LATEX.

CRITICAL INSTRUCTIONS:
1. IGNORE AND STRIP ALL coaching center names, channel promotions, watermarks, stamps, and footer links completely. Do NOT mention any coaching center.
2. Structure every question cleanly: "Q.1", "Q.2", "Q.3", etc.
3. For sub-parts, extract them with roman numerals: "i", "ii", "iii", "iv", etc.
4. For all mathematical notation, use STANDARD LATEX math format:
   - Sets: $\\{1, 2, 3\\}$, $\\{x \\mid x \\in \\mathbb{Q} \\wedge 5 < x < 6\\}$, $\\mathbb{N}$, $\\mathbb{Z}$, $\\mathbb{W}$, $\\mathbb{R}$, $\\phi$ or $\\emptyset$
   - Fractions: $\\frac{a}{b}$
   - Powers & Roots: $x^2 + 2x + 1 = 0$, $\\sqrt{x + 2}$
   - Matrices: $\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$
   - Inequalities: $\\le$, $\\ge$, $\\in$, $\\notin$, $\\subset$, $\\cup$, $\\cap$
   - Logarithms, Trigonometry, etc.
5. Provide COMPLETE, step-by-step working and final answers for every sub-part with proper explanations.
6. Return a valid JSON object matching the schema below (do NOT include markdown code fences or backticks around the JSON).

JSON Schema:
{
  "sections": [
    {
      "questionNumber": "Q.1",
      "questionText": "Write the following sets in tabular form / set builder form:",
      "parts": [
        {
          "partNumber": "i",
          "partText": "A = Set of all rational numbers between 5 and 6",
          "solution": "$A = \\{x \\mid x \\in \\mathbb{Q} \\wedge 5 < x < 6\\}$",
          "explanation": "Rational numbers are denoted by $\\mathbb{Q}$. Between 5 and 6, any number $x$ satisfies $5 < x < 6$."
        }
      ]
    }
  ],
  "markdown": "# Exercise Title\\n\\n### Q.1 ...\\n- **(i)** ...\\n  - **Solution:** ...\\n"
}`;

  console.log(`⚡ Sending to Gemini Vision API...`);
  const response = await generateGeminiContentWithRetry(
    {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }
      ]
    },
    {
      modelsToTry: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"]
    }
  );

  const rawText = response.response?.text?.() || "";
  const cleanedJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(cleanedJson);
    return {
      sections: parsed.sections || [],
      markdown: parsed.markdown || ""
    };
  } catch (err: any) {
    console.error("JSON parse failed. Raw response snippet:", rawText.slice(0, 300));
    // Fallback simple markdown structure
    return {
      sections: [],
      markdown: rawText
    };
  }
}

async function testSingle() {
  const { rows } = await db.query(
    `SELECT id, title, image_urls FROM solved_exercises WHERE exercise_number = 'Exercise 17.1' AND class = 'X' LIMIT 1`
  );

  if (rows.length === 0) {
    console.log("No Exercise 17.1 found.");
    return;
  }

  const ex = rows[0];
  console.log(`Found: ${ex.title}`);
  const result = await digitizeExerciseImages(ex.title, ex.image_urls);

  console.log(`✅ Extracted ${result.sections.length} Questions.`);
  console.log("Sample Question 1:", JSON.stringify(result.sections[0], null, 2));

  // Save to DB
  await db.query(
    `UPDATE solved_exercises 
     SET content_markdown = $1, sections = $2, source_credit = 'Sindh Textbook Board (Class X Mathematics)'
     WHERE id = $3`,
    [result.markdown, JSON.stringify(result.sections), ex.id]
  );
  console.log("💾 Saved digitized text to database!");
}

testSingle().then(() => process.exit(0));
