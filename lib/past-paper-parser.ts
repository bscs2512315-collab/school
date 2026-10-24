export interface MCQOption {
  id: string;
  text: string;
}

export interface PaperIIData {
  betterResponse: string;
  weakerResponse: string;
  type: string;
}

export interface ExtractedQuestion {
  questionNumber: number;
  questionPart: string | null;
  questionText: string;
  questionType: "MCQ" | "CRQ" | "ERQ";
  mcqOptions?: MCQOption[];
  correctAnswer?: string | null;
  paperIIData?: PaperIIData;
  imageUrl?: string | null;
  suggestedChapter?: string | null;
}

/**
 * Parses raw text for Paper I (MCQs)
 */
export function parsePaperI(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  // Split by "Question X:" or "Question X" at the start of a line
  const questionBlocks = text
    .split(/\n?(?=Question\s+\d+:?)/i)
    .filter((block) => block.trim() !== "");

  questionBlocks.forEach((block) => {
    try {
      const qNumMatch = block.match(/Question\s+(\d+):?/i);
      if (!qNumMatch) return;

      const questionNumber = parseInt(qNumMatch[1]);

      // Extract question text (everything between "Question X:" and the first option "A.")
      const textMatch = block.match(
        /Question\s+\d+:?\s*([\s\S]*?)(?=\n[A-D]\.|$)/i,
      );
      let questionText = textMatch ? textMatch[1].trim() : "";

      // Extract options
      const options: MCQOption[] = [];
      const optionLetters = ["A", "B", "C", "D"];
      optionLetters.forEach((letter) => {
        const optRegex = new RegExp(
          `\n${letter}\\.\\s*([\\s\\S]*?)(?=\n[A-D]\\.|Correct Answer|$)`,
          "i",
        );
        const optMatch = block.match(optRegex);
        if (optMatch) {
          options.push({ id: letter, text: optMatch[1].trim() });
        }
      });

      // Extract correct answer
      const ansMatch = block.match(/Correct Answer\s*:?\s*([A-D])/i);
      const correctAnswer = ansMatch ? ansMatch[1].toUpperCase() : null;

      // Extract Chapter
      const chapMatch = block.match(/Chapter\s*:?\s*(.*)(?=\n|$)/i);
      const suggestedChapter = chapMatch ? chapMatch[1].trim() : null;

      // Extract Image URL if present (e.g. Image: https://...)
      const imgMatch = block.match(/Image\s*:?\s*(https?:\/\/[^\s\n]+)/i);
      const imageUrl = imgMatch ? imgMatch[1].trim() : null;

      questions.push({
        questionNumber,
        questionPart: null,
        questionText,
        questionType: "MCQ",
        mcqOptions: options,
        correctAnswer,
        suggestedChapter,
        imageUrl,
      });
    } catch (e) {
      console.error("Error parsing block:", block, e);
    }
  });

  return questions;
}

/**
 * Parses raw text for Paper II (CRQ/ERQ)
 */
export function parsePaperII(text: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  // Split by "Question X:" or "Question Type :" at the start of a line
  const blocks = text
    .split(/\n?(?=Question\s+\d+)/i)
    .filter((b) => b.trim() !== "");

  blocks.forEach((block, index) => {
    try {
      const qNumMatch = block.match(/Question\s+(\d+)/i);
      if (!qNumMatch) return;

      const questionNumber = parseInt(qNumMatch[1]);

      // Check for global metadata in the block (before subparts)
      const globalTypeMatch = block.match(/Question Type\s*:\s*([A-Z]+)/i);
      const globalType = (
        globalTypeMatch ? globalTypeMatch[1].toUpperCase() : null
      ) as "CRQ" | "ERQ" | null;

      const globalChapMatch = block.match(/Chapter\s*:?\s*(.*)(?=\n|$)/i);
      const globalChapter = globalChapMatch ? globalChapMatch[1].trim() : null;

      // Check for subparts
      const subpartBlocks = block.split(/\n?(?=Subpart\s+[a-z]:?)/i);

      if (subpartBlocks.length > 1) {
        // First block is the main question text or context
        let contextText = subpartBlocks[0]
          .replace(/Question\s+\d+:?/i, "")
          .replace(/Question Type\s*:\s*[A-Z]+/i, "")
          .replace(/Chapter\s*:?\s*.*(?=\n|$)/i, "")
          .trim();

        // Add line breaks for Roman Numerals (i., ii., iii., etc.) and Alphabetical sub-points (a., b., etc.)
        contextText = contextText.replace(
          /(^|[\n.?!])\s*(?!(?:part|step|element|version|table|figure)\s+)(([ivx]+|[a-e])[.)]\s*)/gi,
          "$1\n\n$2",
        );

        subpartBlocks.slice(1).forEach((subBlock) => {
          const partMatch = subBlock.match(/Subpart\s+([a-z]):?/i);
          const part = partMatch ? partMatch[1] : null;

          const qTypeMatch = subBlock.match(/Question Type\s*:\s*([A-Z]+)/i);
          const questionType = (
            qTypeMatch ? qTypeMatch[1].toUpperCase() : globalType || "CRQ"
          ) as "CRQ" | "ERQ";

          const betterMatch = subBlock.match(
            /Better Response\s*:\s*([\s\S]*?)(?=\nWeaker Response|$)/i,
          );
          const weakerMatch = subBlock.match(
            /Weaker Response\s*:\s*([\s\S]*?)$/i,
          );

          // Get the question text for this subpart
          // Stop at any major metadata or next section
          const subTextMatch = subBlock.match(
            /Subpart\s+[a-z]:?\s*([\s\S]*?)(?=\n(Question Type|Better Response|Weaker Response|Chapter)|$)/i,
          );
          let subText = subTextMatch ? subTextMatch[1].trim() : "";

          // Add line breaks for Roman Numerals and Alphabetical sub-points in subpart text
          subText = subText.replace(
            /(^|[\n.?!])\s*(?!(?:part|step|element|version|table|figure)\s+)(([ivx]+|[a-e])[.)]\s*)/gi,
            "$1\n\n$2",
          );

          // Clean subText of metadata labels
          subText = subText
            .replace(/Question Type\s*:\s*[A-Z]+/i, "")
            .replace(/Better Response\s*:\s*([\s\S]*?)$/i, "") // Safety clean
            .replace(/Chapter\s*:?\s*.*(?=\n|$)/i, "")
            .trim();

          questions.push({
            questionNumber,
            questionPart: part,
            questionText: contextText
              ? `${contextText}\n\n${subText}`
              : subText,
            questionType,
            paperIIData: {
              betterResponse: betterMatch ? betterMatch[1].trim() : "",
              weakerResponse: weakerMatch ? weakerMatch[1].trim() : "",
              type: questionType,
            },
            suggestedChapter:
              subBlock.match(/Chapter\s*:?\s*(.*)(?=\n|$)/i)?.[1]?.trim() ||
              globalChapter,
          });
        });
      } else {
        // Single question block
        const qTypeMatch = block.match(/Question Type\s*:\s*([A-Z]+)/i);
        const questionType = (
          qTypeMatch ? qTypeMatch[1].toUpperCase() : globalType || "CRQ"
        ) as "CRQ" | "ERQ";

        const betterMatch = block.match(
          /Better Response\s*:\s*([\s\S]*?)(?=\nWeaker Response|$)/i,
        );
        const weakerMatch = block.match(/Weaker Response\s*:\s*([\s\S]*?)$/i);

        const textMatch = block.match(
          /Question\s+\d+:?\s*([\s\S]*?)(?=\n(Question Type|Better Response|Weaker Response|Chapter)|$)/i,
        );
        let questionText = textMatch ? textMatch[1].trim() : "";

        // Add line breaks for Roman Numerals and Alphabetical sub-points
        questionText = questionText.replace(
          /(^|[\n.?!])\s*(?!(?:part|step|element|version|table|figure)\s+)(([ivx]+|[a-e])[.)]\s*)/gi,
          "$1\n\n$2",
        );

        // Clean questionText of metadata
        questionText = questionText
          .replace(/Question Type\s*:\s*[A-Z]+/i, "")
          .replace(/Chapter\s*:?\s*.*(?=\n|$)/i, "")
          .trim();

        questions.push({
          questionNumber,
          questionPart: null,
          questionText,
          questionType,
          paperIIData: {
            betterResponse: betterMatch ? betterMatch[1].trim() : "",
            weakerResponse: weakerMatch ? weakerMatch[1].trim() : "",
            type: questionType,
          },
          suggestedChapter:
            block.match(/Chapter\s*:?\s*(.*)(?=\n|$)/i)?.[1]?.trim() ||
            globalChapter,
        });
      }
    } catch (e) {
      console.error("Error parsing block:", block, e);
    }
  });

  return questions;
}
