import type { SLO } from "@/lib/utils/syllabus-parser";

interface AnalyzedContent {
  subtopics?: Array<{
    subtopicNumber?: string;
    subtopicName?: string;
    slos?: Array<{
      sloNumber?: string;
      sloText?: string;
      cognitiveLevel?: string;
    }>;
  }>;
  learningObjectives?: string[];
}

export function extractSlosFromAnalyzedContent(
  analyzedContent: unknown,
): SLO[] {
  if (!analyzedContent) return [];

  let parsed: AnalyzedContent;
  try {
    parsed =
      typeof analyzedContent === "string"
        ? JSON.parse(analyzedContent)
        : (analyzedContent as AnalyzedContent);
  } catch {
    return [];
  }

  const slos: SLO[] = [];

  for (const subtopic of parsed.subtopics ?? []) {
    for (const slo of subtopic.slos ?? []) {
      if (!slo.sloText?.trim()) continue;
      slos.push({
        sloNumber: slo.sloNumber ?? "",
        sloText: slo.sloText.trim(),
        cognitiveLevel: slo.cognitiveLevel ?? "U",
      });
    }
  }

  if (slos.length === 0 && parsed.learningObjectives?.length) {
    parsed.learningObjectives.forEach((text, index) => {
      if (!text?.trim()) return;
      slos.push({
        sloNumber: String(index + 1),
        sloText: text.trim(),
        cognitiveLevel: "U",
      });
    });
  }

  return slos;
}

export function formatSlosForPrompt(slos: SLO[], limit = 40): string {
  const testableSlos = slos.filter((s) => {
    const cog = s.cognitiveLevel?.trim().toUpperCase();
    return cog !== "CA" && cog !== "FA";
  });
  const targetList = testableSlos.length > 0 ? testableSlos : slos;
  return targetList
    .slice(0, limit)
    .map((slo, i) => {
      const num = slo.sloNumber || String(i + 1);
      return `- [${num}] (${slo.cognitiveLevel}) ${slo.sloText}`;
    })
    .join("\n");
}
