import type { ChatAction } from "@/types/bot";

const IMAGE_PAPER_INTENT =
  /\b(generate|create|make|build|prepare|convert|turn|extract|pull|get|take)\b.{0,40}\b(paper|quiz|test|mcqs?|questions?|practice)\b|\b(paper|quiz|test|mcqs?|questions?)\b.{0,30}\b(from|form|using|based on|in)\b.{0,25}\b(image|photo|picture|this|these|diagram|notes|page|sheet)\b|\bpractice\s*(test|paper|quiz)\b|\bextract\s+([a-z]+\s+)?mcqs?\b|\b(create|make)\s+paper\s+(?:from|form)\s+these\b/i;

const IMAGE_PAPER_FOLLOW_UP =
  /\b(image\s+paper|from\s+(this\s+)?image|paper\s+from\s+image|generate\s+paper\s+from\s+image|extract\s+.*mcqs?|create\s+paper\s+(?:from|form)\s+these\s+mcqs?)\b/i;

export function isImagePaperIntent(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  return IMAGE_PAPER_INTENT.test(trimmed) || IMAGE_PAPER_FOLLOW_UP.test(trimmed);
}

export interface ParsedImagePaperPrefs {
  paperType: 1 | 2 | null;
  questionCount: number | null;
  difficulty: "Alpha" | "Beta" | "Gamma" | null;
  isExtractOnly: boolean;
  userPrompt: string;
}

export function parseImagePaperPrefs(message: string): ParsedImagePaperPrefs {
  const lower = message.toLowerCase();

  // Difficulty detection
  let difficulty: "Alpha" | "Beta" | "Gamma" | null = null;
  if (/\b(gamma|hard|difficult|advanced|entry[- ]?test|ecat|mdcat|grip)\b/i.test(lower)) {
    difficulty = "Gamma";
  } else if (/\b(alpha|easy|foundational|basic|simple)\b/i.test(lower)) {
    difficulty = "Alpha";
  } else if (/\b(beta|medium|moderate|balanced|standard|intermediate)\b/i.test(lower)) {
    difficulty = "Beta";
  }

  // Paper type detection
  let paperType: 1 | 2 | null = null;
  if (/\b(paper\s*2|crq|erq|theory|subjective|descriptive)\b/i.test(lower)) {
    paperType = 2;
  } else if (/\b(paper\s*1|mcqs?|quiz)\b/i.test(lower) || difficulty !== null) {
    paperType = 1;
  }

  // Question count detection
  const countMatch = lower.match(
    /\b(\d{1,2})\s*(?:[a-z]+\s+)?(questions?|mcqs?|items?)\b|\b(?:questions?|mcqs?|items?)\s*[:=]?\s*(\d{1,2})\b/,
  );
  const rawCount = countMatch ? Number(countMatch[1] || countMatch[3] || countMatch[2]) : null;
  const questionCount =
    rawCount && Number.isFinite(rawCount) ? Math.min(Math.max(rawCount, 1), 40) : null;

  // Extract-only / existing MCQs intent
  const isExtractOnly =
    /\b(extract|pull|take|get|same\s+mcqs?|these\s+mcqs?|from\s+these|form\s+these|existing)\b/i.test(
      lower,
    );

  return {
    paperType,
    questionCount,
    difficulty,
    isExtractOnly,
    userPrompt: message.trim(),
  };
}

function followUpMessage(parts: {
  paperType?: 1 | 2;
  questionCount?: number;
  difficulty?: "Alpha" | "Beta" | "Gamma" | null;
}): string {
  const bits = ["Generate paper from image"];
  if (parts.difficulty) bits.push(`${parts.difficulty} difficulty`);
  if (parts.paperType) bits.push(`Paper ${parts.paperType}`);
  if (parts.questionCount) bits.push(`${parts.questionCount} questions`);
  return bits.join(". ") + ".";
}

export function buildImagePaperWizard(params: {
  paperType: 1 | 2 | null;
  questionCount: number | null;
  role: "student" | "teacher";
  difficulty?: "Alpha" | "Beta" | "Gamma" | null;
  userPrompt?: string;
  isExtractOnly?: boolean;
}): { reply: string; actions: ChatAction[] } {
  const { paperType, questionCount, role, difficulty, userPrompt, isExtractOnly } = params;
  const destination =
    role === "teacher"
      ? "I'll open a preview so you can edit and publish it to a classroom."
      : "I'll save Paper 1 quizzes to **My Quizzes**. Paper 2 opens as a practice paper you can attempt.";

  // If user asked to extract MCQs from the image or specified difficulty (e.g. "Extract gamma MCQs from this image"):
  // Do NOT force them through generic question count chips! Immediately offer the action button!
  if (difficulty || isExtractOnly || (paperType === 1 && !questionCount)) {
    const effectivePaperType = paperType ?? 1;
    const diffText = difficulty ? `**${difficulty}** difficulty ` : "";
    const teacherBtn = difficulty
      ? `Generate ${difficulty} Practice Test`
      : "Create Practice Test from Image MCQs";
    const studentBtn = difficulty
      ? `Extract ${difficulty} MCQs & Create Paper`
      : "Create Paper from Image MCQs";

    const reply =
      role === "teacher"
        ? `Ready to extract ${diffText}questions from your image. All diagrams, charts, and graphs will be reproduced in ExBoardAI format so you can edit and publish them to a classroom.`
        : `Ready to extract ${diffText}MCQs from your image into ExBoardAI format. Any diagrams, graphs, and charts will be recreated faithfully as interactive SVGs.\n\nTap below to generate your quiz:`;

    const actions: ChatAction[] = [
      {
        type: "generate_paper_from_image",
        label: role === "teacher" ? teacherBtn : studentBtn,
        paperType: effectivePaperType,
        questionCount: questionCount ?? undefined,
        difficulty: difficulty ?? undefined,
        userPrompt: userPrompt ?? undefined,
      },
    ];

    // Offer difficulty filter chips so user can easily toggle tiers
    if (difficulty !== "Alpha") {
      actions.push({
        type: "difficulty_chip",
        label: "Alpha (Easy)",
        message: "Extract Alpha MCQs from this image",
        difficulty: "Alpha",
      });
    }
    if (difficulty !== "Beta") {
      actions.push({
        type: "difficulty_chip",
        label: "Beta (Medium)",
        message: "Extract Beta MCQs from this image",
        difficulty: "Beta",
      });
    }
    if (difficulty !== "Gamma") {
      actions.push({
        type: "difficulty_chip",
        label: "Gamma (Hard)",
        message: "Extract Gamma MCQs from this image",
        difficulty: "Gamma",
      });
    }

    return { reply, actions };
  }

  if (!paperType) {
    return {
      reply: `I can turn this image into an exam paper with diagrams, graphs, and charts recreated. Do you want **Paper 1** (MCQs) or **Paper 2** (CRQ/ERQ)?\n\n${destination}`,
      actions: [
        {
          type: "paper_type_chip",
          label: "Paper 1 (MCQs)",
          message: followUpMessage({ paperType: 1, questionCount: questionCount ?? undefined, difficulty }),
        },
        {
          type: "paper_type_chip",
          label: "Paper 2 (CRQ/ERQ)",
          message: followUpMessage({ paperType: 2, questionCount: questionCount ?? undefined }),
        },
        {
          type: "difficulty_chip",
          label: "Extract Gamma MCQs",
          message: "Extract Gamma MCQs from this image",
          difficulty: "Gamma",
        },
      ],
    };
  }

  if (!questionCount) {
    const counts = paperType === 1 ? [10, 15, 20, 25] : [4, 6, 8, 10];
    return {
      reply: `Got it — **Paper ${paperType}** from your image. How many questions should I generate?`,
      actions: counts.map((count) => ({
        type: "question_count_chip" as const,
        label: `${count} questions`,
        message: followUpMessage({ paperType, questionCount: count, difficulty }),
      })),
    };
  }

  const diffPrefix = difficulty ? `${difficulty} ` : "";
  return {
    reply:
      role === "teacher"
        ? `Ready to generate **${diffPrefix}Paper ${paperType}** with **${questionCount} questions** from your image. All diagrams and charts will be recreated. Tap below to preview and edit.`
        : paperType === 1
          ? `Ready to generate a **${questionCount}-question ${diffPrefix}Paper 1 quiz** from your image with full diagram reproduction. Tap below and I'll save it to **My Quizzes**.`
          : `Ready to generate a **${questionCount}-question Paper 2** from your image. Tap below to open it as a practice paper.`,
    actions: [
      {
        type: "generate_paper_from_image",
        label:
          role === "teacher"
            ? `Generate Practice Test · Paper ${paperType}`
            : paperType === 1
              ? `Generate & save to My Quizzes`
              : `Generate Paper ${paperType}`,
        paperType,
        questionCount,
        difficulty: difficulty ?? undefined,
        userPrompt: userPrompt ?? undefined,
      },
      ...(paperType === 1
        ? [
            {
              type: "difficulty_chip" as const,
              label: "Alpha (Easy)",
              message: "Extract Alpha MCQs from this image",
              difficulty: "Alpha" as const,
            },
            {
              type: "difficulty_chip" as const,
              label: "Beta (Medium)",
              message: "Extract Beta MCQs from this image",
              difficulty: "Beta" as const,
            },
            {
              type: "difficulty_chip" as const,
              label: "Gamma (Hard)",
              message: "Extract Gamma MCQs from this image",
              difficulty: "Gamma" as const,
            },
          ]
        : []),
    ],
  };
}
