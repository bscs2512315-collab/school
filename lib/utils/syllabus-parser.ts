export interface SLO {
  sloNumber: string;
  sloText: string;
  cognitiveLevel: string;
}

export interface Subtopic {
  subtopicNumber: string;
  subtopicName: string;
  slos: SLO[];
}

export interface ParsedChapter {
  classLevel: string;
  chapterNumber: number;
  chapterName: string;
  subtopics: Subtopic[];
}

/**
 * Parses raw syllabus text into a structured format
 * @param text Raw syllabus text provided by user
 * @returns Array of parsed chapters with subtopics and SLOs
 */
export function parseSyllabus(text: string): ParsedChapter[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const result: ParsedChapter[] = [];
  let currentClass = "";
  let currentChapter: ParsedChapter | null = null;
  let currentSubtopic: Subtopic | null = null;
  let currentSLO: SLO | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Match Class (e.g., Class IX, Class X)
    const classMatch = line.match(/^Class\s+(IX|X|XI|XII)$/i);
    if (classMatch) {
      currentClass = classMatch[1].toUpperCase();
      continue;
    }

    // 2. Match Topic No. (e.g., Topic No. : 1)
    const topicNoMatch = line.match(/^Topic\s+No\.\s*:\s*(\d+)$/i);
    if (topicNoMatch) {
      const number = parseInt(topicNoMatch[1], 10);
      currentChapter = {
        classLevel: currentClass,
        chapterNumber: number,
        chapterName: "",
        subtopics: [],
      };
      result.push(currentChapter);
      currentSubtopic = null;
      currentSLO = null;
      continue;
    }

    // 3. Match Topic Title (e.g., Topic Title: Physical Quantities and Measurement)
    const topicTitleMatch = line.match(/^Topic\s+Title\s*:\s*(.+)$/i);
    if (topicTitleMatch && currentChapter) {
      currentChapter.chapterName = topicTitleMatch[1].trim();
      continue;
    }

    // 4. Match Subtopic (e.g., Subtopic 1.1: Introduction)
    // Sometimes contains SLO on the same line
    const subtopicMatch = line.match(
      /^Subtopic\s+(\d+\.\d+)\s*:\s*(.+?)(?=\s+SLO|\s*;|$)/i,
    );
    if (subtopicMatch && currentChapter) {
      currentSubtopic = {
        subtopicNumber: subtopicMatch[1],
        subtopicName: subtopicMatch[2].trim(),
        slos: [],
      };
      currentChapter.subtopics.push(currentSubtopic);
      currentSLO = null;

      // Check if SLO part in the same line
      const sloMatchInline = line.match(
        /SLO\s+(\d+\.\d+\.\d+)\s*:\s*(.+?)(?=\s+Cognitive\s+Level|\s*;|$)/i,
      );
      if (sloMatchInline) {
        currentSLO = {
          sloNumber: sloMatchInline[1],
          sloText: sloMatchInline[2].trim(),
          cognitiveLevel: "",
        };
        currentSubtopic.slos.push(currentSLO);

        // Check if Cognitive Level in the same line
        const cogLevelMatchInline = line.match(
          /(?:Cognitive\s+Level|Cog\s+Level)\s*:\s*([RUKAC]|FA|CA|Ap|An|E)/i,
        );
        if (cogLevelMatchInline) {
          const raw = cogLevelMatchInline[1].toUpperCase();
          currentSLO.cognitiveLevel = raw === "K" ? "R" : raw === "CA" ? "FA" : raw;
        }
      }
      continue;
    }

    // 5. Match SLO (e.g., SLO 10.1.1: define ...)
    const sloMatch = line.match(
      /^SLO\s+(\d+\.\d+\.\d+)\s*:\s*(.+?)(?=\s*;\s*$|$)/i,
    );
    if (sloMatch && currentSubtopic) {
      currentSLO = {
        sloNumber: sloMatch[1],
        sloText: sloMatch[2].trim(),
        cognitiveLevel: "",
      };
      currentSubtopic.slos.push(currentSLO);
      continue;
    }

    // 6. Match Cognitive Level (e.g., Cognitive Level: R)
    const cogLevelMatch = line.match(
      /^(?:Cognitive\s+Level|Cog\s+Level)\s*:\s*([RUKAC]|FA|CA|Ap|An|E)/i,
    );
    if (cogLevelMatch && currentSLO) {
      const raw = cogLevelMatch[1].toUpperCase();
      currentSLO.cognitiveLevel = raw === "K" ? "R" : raw === "CA" ? "FA" : raw;
      continue;
    }

    // Fallback: If currentChapter exists but chapterName is empty, maybe the line is the name
    if (
      currentChapter &&
      !currentChapter.chapterName &&
      !line.includes(":") &&
      !line.startsWith("Class")
    ) {
      currentChapter.chapterName = line.trim();
    }
  }

  return result;
}
