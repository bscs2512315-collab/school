import { Subject, Class, Board } from "@/types/enums";

export enum STRUCTURED_QUERY_TYPE {
  SYLLABUS = "syllabus",
  PAST_PAPER_TOPIC = "past_paper_topic",
  CREATE_PAPER = "create_paper",
  NONE = "none",
}

export interface ParsedBotQuery {
  type: STRUCTURED_QUERY_TYPE;
  subject: string | null;
  classLevel: string | null;
  board: string | null;
  topic: string | null;
  chapterNumber: number | null;
  chapterNumbers: number[] | null;
  yearFrom: number | null;
  yearTo: number | null;
  classFromMessage: boolean;
  boardFromMessage: boolean;
  paperType: 1 | 2 | null;
  questionCount: number | null;
  /** Where to pull questions from when creating a paper */
  paperSource: "slos" | "past_papers" | null;
  practiceMode: "myself" | "challenge" | null;
  challengeType: "normal" | "lightning" | null;
  difficulty: "Alpha" | "Beta" | "Gamma" | null;
}

const BOARD_ALIASES: Record<string, Board> = {
  akueb: Board.AKUEB,
  "karachi board": Board.SINDH_BOARD,
  karachi: Board.SINDH_BOARD,
  "sindh board": Board.SINDH_BOARD,
  sindh: Board.SINDH_BOARD,
  "punjab board": Board.PUNJAB_BOARD,
  punjab: Board.PUNJAB_BOARD,
  "kpk board": Board.KPK_BOARD,
  kpk: Board.KPK_BOARD,
  "balochistan board": Board.BALOCHISTAN_BOARD,
  balochistan: Board.BALOCHISTAN_BOARD,
  "federal board": Board.FEDERAL_BOARD,
  federal: Board.FEDERAL_BOARD,
};

const SUBJECT_ALIASES: Record<string, Subject> = {
  biology: Subject.BIOLOGY,
  bio: Subject.BIOLOGY,
  chemistry: Subject.CHEMISTRY,
  chem: Subject.CHEMISTRY,
  physics: Subject.PHYSICS,
  phy: Subject.PHYSICS,
  mathematics: Subject.MATHEMATICS,
  math: Subject.MATHEMATICS,
  maths: Subject.MATHEMATICS,
  english: Subject.ENGLISH,
  urdu: Subject.URDU,
  islamiat: Subject.ISLAMIAT,
  "pakistan studies": Subject.PAKISTAN_STUDIES,
  "pak studies": Subject.PAKISTAN_STUDIES,
  "computer science": Subject.COMPUTER_SCIENCE,
  computing: Subject.COMPUTER_SCIENCE,
  computer: Subject.COMPUTER_SCIENCE,
  cs: Subject.COMPUTER_SCIENCE,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSubject(message: string): string | null {
  const lower = message.toLowerCase();

  // Longer aliases first so "physics" wins over "phy", and word boundaries
  // so "phy" does not match inside "physical".
  const aliases = Object.entries(SUBJECT_ALIASES).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [alias, subject] of aliases) {
    const pattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i");
    if (pattern.test(lower)) return subject;
  }

  for (const subject of Object.values(Subject)) {
    const pattern = new RegExp(`\\b${escapeRegExp(subject.toLowerCase())}\\b`, "i");
    if (pattern.test(lower)) return subject;
  }

  return null;
}

function extractBoard(message: string): string | null {
  const lower = message.toLowerCase();

  for (const [alias, board] of Object.entries(BOARD_ALIASES)) {
    if (lower.includes(alias)) return board;
  }

  for (const board of Object.values(Board)) {
    if (lower.includes(board.toLowerCase())) return board;
  }

  return null;
}

function extractClass(message: string): string | null {
  const lower = message.toLowerCase();

  // Explicit patterns: class/grade/standard/level
  const withClassWord = lower.match(
    /\b(?:class|clss|cls|grade|grd|standard|std)\s*(?:level\s*)?(ix|x|xi|xii|9th|10th|11th|12th|9|10|11|12)\b/i,
  );
  if (withClassWord) {
    const raw = withClassWord[1].toUpperCase();
    if (raw === "9" || raw === "9TH" || raw === "IX") return Class.IX;
    if (raw === "10" || raw === "10TH" || raw === "X") return Class.X;
    if (raw === "11" || raw === "11TH" || raw === "XI") return Class.XI;
    if (raw === "12" || raw === "12TH" || raw === "XII") return Class.XII;
    return raw;
  }

  // Ordinal shorthand: "10th chemistry", "9th physics", "11th class", "12th grade"
  const ordinalMatch = lower.match(
    /\b(9th|10th|11th|12th)\b(?=[^a-z0-9]*(?:class|grade|standard|subject|bio|biology|chem|chemistry|physics|math|maths|mathematics|english|urdu|islamiat|pakistan|cs|computer|paper|mcq|test|quiz))/i,
  );
  if (ordinalMatch) {
    const raw = ordinalMatch[1].toUpperCase();
    if (raw === "9TH") return Class.IX;
    if (raw === "10TH") return Class.X;
    if (raw === "11TH") return Class.XI;
    if (raw === "12TH") return Class.XII;
  }

  // Pakistani educational tiers
  if (/\b(?:ssc\s*[-_]?\s*1|ssc\s*[-_]?\s*i|matric\s*(?:part\s*)?1)\b/i.test(lower)) return Class.IX;
  if (/\b(?:ssc\s*[-_]?\s*2|ssc\s*[-_]?\s*ii|matric\s*(?:part\s*)?2|matric(?:ulation)?)\b/i.test(lower)) return Class.X;
  if (/\b(?:hssc\s*[-_]?\s*1|hssc\s*[-_]?\s*i|1st\s*year|first\s*year|inter\s*(?:part\s*)?1)\b/i.test(lower)) return Class.XI;
  if (/\b(?:hssc\s*[-_]?\s*2|hssc\s*[-_]?\s*ii|2nd\s*year|second\s*year|inter\s*(?:part\s*)?2|inter(?:mediate)?)\b/i.test(lower)) return Class.XII;

  const bareWithSubject = lower.match(
    /\b(ix|x|xi|xii|9|10|11|12)\b(?=[^a-z0-9]*(?:bio|biology|chem|chemistry|physics|math|maths|mathematics|english|urdu|islamiat|pakistan|cs|computer))/i,
  );
  if (bareWithSubject) {
    const value = bareWithSubject[1].toUpperCase();
    if (value === "9") return Class.IX;
    if (value === "10") return Class.X;
    if (value === "11") return Class.XI;
    if (value === "12") return Class.XII;
    return value;
  }

  return null;
}

function extractYearRange(message: string): { yearFrom: number | null; yearTo: number | null } {
  const rangeMatch = message.match(/\b(20\d{2})\s*(?:-|–|to|and)\s*(20\d{2})\b/i);
  if (rangeMatch) {
    return {
      yearFrom: parseInt(rangeMatch[1], 10),
      yearTo: parseInt(rangeMatch[2], 10),
    };
  }

  const years = [...message.matchAll(/\b(20\d{2})\b/g)].map((m) => parseInt(m[1], 10));
  if (years.length === 1) {
    return { yearFrom: years[0], yearTo: years[0] };
  }

  if (years.length >= 2) {
    return { yearFrom: Math.min(...years), yearTo: Math.max(...years) };
  }

  return { yearFrom: null, yearTo: null };
}

// Keep "and"/"or" — chapter titles like "Matrices and Determinants" need them.
const TOPIC_STOP_WORDS =
  /\b(come|came|appear|appeared|any|the|a|an|in|from|to|paper|papers|question|questions|mcqs?|items?|topic|chapter|chpater|chatper|chaper|ch|unit|year|years|between|during|list|tell|show|what|which|how|many|is|are|was|were|have|has|had|did|do|does|can|could|would|please|me|my|our|your|class|grade|standard|std|level|create|generate|make|prepare|set|practice|for|want|need|give|send|take|start|test|quiz|exam|assessment|of|on|about|with|i|we|you|he|she|they|myself|friends?|solo|challenge|blitz|lightning|arena)\b/gi;

const TOPIC_TRAILING_NOISE =
  /\s*(?:,?\s*)?(?:\d{1,2}\s*)?(?:questions?|mcqs?|items?)\s*$/i;

/** Words that look like topics but are paper-source / meta phrasing */
const TOPIC_META_NOISE =
  /^(slos?|past\s*papers?|syllabus|learning\s+outcomes?|outcomes?)$/i;

const CHAPTER_KEYWORD =
  String.raw`(?:chapter|chpater|chatper|chaper|chapt\.?|ch\.?|unit|topic)`;

function cleanTopic(raw: string): string | null {
  let topic = raw
    .replace(TOPIC_TRAILING_NOISE, " ")
    .replace(/\b(?:paper\s*(?:1|2|i|ii)|p[12])\b/gi, " ")
    .replace(
      /\b(?:maths?|mathematics|biology|bio|chemistry|chem|physics|phy|english|urdu|islamiat|pakistan\s*studies|computer\s*science|cs)\b/gi,
      " ",
    )
    .replace(/\b(?:ix|x|xi|xii|9th|10th|11th|12th|9|10|11|12)\b/gi, " ")
    .replace(/\b(?:from\s+)?(?:slos?|past\s*papers?|syllabus)\b/gi, " ")
    .replace(TOPIC_STOP_WORDS, " ")
    .replace(/[^\w\s&/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Drop a lone trailing count left after stripping "questions"
  topic = topic.replace(/\s+\d{1,2}$/g, "").trim();

  if (
    topic.length < 3 ||
    /^\d{4}$/.test(topic) ||
    /^\d{1,2}$/.test(topic) ||
    TOPIC_META_NOISE.test(topic)
  ) {
    return null;
  }
  return topic;
}

function extractChapterNumber(message: string): number | null {
  const nums = extractChapterNumbers(message);
  return nums && nums.length === 1 ? nums[0] : null;
}

export function extractChapterNumbers(message: string): number[] | null {
  const cleaned = message
    .replace(/\b(?:class|grade|yr|year|20\d{2})\s+\d+/gi, " ")
    .replace(/\b(?:questions?|mcqs?|items?)\b/gi, " ");

  // 1. "chapters 1 to 4" or "chapters 1-4"
  const rangeMatch = cleaned.match(
    new RegExp(String.raw`\b${CHAPTER_KEYWORD}s?\s*(\d{1,2})\s*(?:to|-)\s*(\d{1,2})\b`, "i"),
  );
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (start > 0 && end > 0 && start <= 40 && end <= 40 && start <= end) {
      const nums: number[] = [];
      for (let i = start; i <= end; i++) nums.push(i);
      return nums;
    }
  }

  // 2. "chapters 1, 2, 3" / "chapter 1, 2 and 3"
  const listMatch = cleaned.match(
    new RegExp(String.raw`\b${CHAPTER_KEYWORD}s?\s*(\d{1,2}(?:\s*(?:,|&|\band\b)\s*\d{1,2})+)\b`, "i"),
  );
  if (listMatch) {
    const nums = [...listMatch[1].matchAll(/\b(\d{1,2})\b/g)]
      .map((m) => parseInt(m[1], 10))
      .filter((n) => n > 0 && n <= 40);
    if (nums.length > 0) {
      return Array.from(new Set(nums));
    }
  }

  // 3. Repeated "chapter 1 and chapter 2" / "ch 1, ch 2"
  const repeated = [...cleaned.matchAll(new RegExp(String.raw`\b${CHAPTER_KEYWORD}\s*(\d{1,2})\b`, "gi"))]
    .map((m) => parseInt(m[1], 10))
    .filter((n) => n > 0 && n <= 40);

  if (repeated.length > 1) {
    return Array.from(new Set(repeated));
  }

  // 4. Single chapter
  const singleMatch = cleaned.match(
    new RegExp(String.raw`\b${CHAPTER_KEYWORD}\s*(\d{1,2})\b`, "i"),
  );
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    if (num > 0 && num <= 40) return [num];
  }

  return null;
}

function extractTopic(message: string): string | null {
  const chapterNums = extractChapterNumbers(message);
  if (chapterNums && chapterNums.length > 0) return null;

  // Strip source phrases so "from SLOs" is never treated as a chapter name
  const cleanedMessage = message
    .replace(/\bfrom\s+(the\s+)?(?:slos?|past\s*papers?|syllabus)\b/gi, " ")
    .replace(/\busing\s+(?:slos?|past\s*papers?|syllabus)\b/gi, " ");

  // 1. Create-paper style with CHAPTER keyword: "chapter Acid Bases and Salts", "topic Chemical Equilibrium"
  const createPaperWithChapterMatch = cleanedMessage.match(
    new RegExp(
      String.raw`\b${CHAPTER_KEYWORD}\s+([A-Za-z][\w\s&/'-]{1,80}?)(?=\s*,?\s*\d{1,2}\s*(?:questions?|mcqs?|items?)\b|\s*(?:for\s+class|in\s+class|class|grade|standard|\bfrom\b|\busings?\b|\bwith\b|[?.!])|$)`,
      "i",
    ),
  );
  if (createPaperWithChapterMatch?.[1]) {
    const topic = cleanTopic(createPaperWithChapterMatch[1]);
    if (topic) return topic;
  }

  // 2. Paper/quiz/test/questions of/on/for/about <topic>:
  // e.g. "paper of acid bases and salt", "test on chemical kinetics", "quiz for electrochemistry", "practice paper of matrices"
  const paperOfTopicMatch = cleanedMessage.match(
    /\b(?:paper|papers|test|tests|quiz|quizzes|exam|exams|questions?|mcqs?)\s+(?:of|on|for|about|from)\s+(?:the\s+)?(?:chapter\s+|topic\s+|unit\s+)?([A-Za-z][\w\s&/'-]{1,80}?)(?=\s*,?\s*\d{1,2}\s*(?:questions?|mcqs?|items?)\b|\s*(?:for\s+class|in\s+class|class|grade|standard|\bfrom\b|\busings?\b|\bwith\b|[?.!])|$)/i,
  );
  if (paperOfTopicMatch?.[1]) {
    const topic = cleanTopic(paperOfTopicMatch[1]);
    if (topic) return topic;
  }

  // 3. Action + topic: "generate/make/create <topic> paper", "practice <topic> paper"
  const actionTopicPaperMatch = cleanedMessage.match(
    /\b(?:generate|create|make|prepare|set|practice|want|need|give\s+me)\s+(?:a\s+|an\s+|the\s+)?([A-Za-z][\w\s&/'-]{1,80}?)\s+(?:paper|test|quiz|exam|mcqs?)\b/i,
  );
  if (actionTopicPaperMatch?.[1]) {
    const topic = cleanTopic(actionTopicPaperMatch[1]);
    if (topic) return topic;
  }

  const patterns = [
    /(?:from|about|on|of)\s+["']([^"']+)["']/i,
    new RegExp(
      String.raw`(?:from|about|on|of)\s+(?:the\s+)?${CHAPTER_KEYWORD}\s+["']?([^"'.?,]+?)["']?(?:\s+(?:come|came|appear|appeared|topic|chapter)|[?.!,]|$)`,
      "i",
    ),
    new RegExp(
      String.raw`${CHAPTER_KEYWORD}\s+["']?([^"'.?,]+?)["']?(?:\s+(?:come|came|appear|appeared)|[?.!,]|$)`,
      "i",
    ),
    /questions?\s+(?:from|on|about|of)\s+["']?([^"'.?,]+?)["']?(?:\s+(?:come|came|appear|appeared)|[?.!,]|$)/i,
    /(?:any|some)\s+question(?:s)?\s+(?:from|on|about|of)\s+["']?([^"'.?,]+?)["']?(?:\s+(?:come|came|appear|appeared)|[?.!,]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = cleanedMessage.match(pattern);
    if (match?.[1]) {
      const topic = cleanTopic(match[1]);
      if (topic) return topic;
    }
  }

  return null;
}

const TOPIC_SUBJECT_HINTS: Array<{ pattern: RegExp; subject: Subject }> = [
  {
    pattern:
      /\b(isomer|molecule|atom|ionic|covalent|periodic|acid|base|alkali|salt|mole|stoichiometry|electrolysis|oxidation|reduction|organic|polymer|valency|bond|hydrocarbon|titration|equilibrium|thermodynamics|alkane|alkene|alkyne|halogen|solution|solute|solvent|enthalpy|reaction)\b/i,
    subject: Subject.CHEMISTRY,
  },
  {
    pattern:
      /\b(force|energy|motion|velocity|acceleration|gravity|sound|waves?|light|electric|magnetic|current|resistance|optics|kinematics|newton|hooke|vector|circular\s*motion|thermodynamics|electrostatics|radiation|nuclear|semiconductor|capacitance|friction|torque|work\s+and\s+energy)\b/i,
    subject: Subject.PHYSICS,
  },
  {
    pattern:
      /\b(cell|tissue|organ|dna|rna|gene|enzyme|photosynthesis|respiration|ecosystem|species|evolution|mitosis|meiosis|nutrition|homeostasis|immunity|reproduction|genetics|biotechnology|biodiversity|circulation|excretion|nervous\s*system)\b/i,
    subject: Subject.BIOLOGY,
  },
  {
    pattern:
      /\b(equation|algebra|geometry|trigonometry|calculus|matrix|matrices|probability|theorem|polynomial|fraction|percentage|logarithm|logarithms|set|sets|permutation|combination|differentiation|integration|vector|coordinate|determinant)\b/i,
    subject: Subject.MATHEMATICS,
  },
  {
    pattern:
      /\b(algorithm|flowchart|programming|c\+\+|python|database|sql|networking|cybersecurity|data\s*structure|boolean\s*algebra|logic\s*gate|operating\s*system|network|binary)\b/i,
    subject: Subject.COMPUTER_SCIENCE,
  },
];

export function inferSubjectFromTopic(message: string): string | null {
  const explicit = extractSubject(message);
  if (explicit) return explicit;

  for (const hint of TOPIC_SUBJECT_HINTS) {
    if (hint.pattern.test(message)) return hint.subject;
  }

  return null;
}

function extractPaperType(message: string): 1 | 2 | null {
  const lower = message.toLowerCase();
  if (/\bpaper\s*(?:ii|2|two)\b/i.test(lower) || /\bp2\b/i.test(lower)) return 2;
  if (/\bpaper\s*(?:i|1|one)\b/i.test(lower) || /\bp1\b/i.test(lower)) return 1;
  if (/\b(mcq|multiple\s*choice)\b/i.test(lower)) return 1;
  if (/\b(crq|erq|structured\s*response)\b/i.test(lower)) return 2;
  return null;
}

function extractQuestionCount(message: string): number | null {
  const match = message.match(/\b(\d{1,2})\s*(?:questions?|mcqs?|items?)\b/i);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (Number.isNaN(n) || n < 1) return null;
  return Math.min(n, 40);
}

function extractPaperSource(
  message: string,
): "slos" | "past_papers" | null {
  const lower = message.toLowerCase();

  const wantsPastPapers =
    /\bfrom\s+(the\s+)?past\s*papers?\b/i.test(lower) ||
    /\bpast\s*paper\s+(bank|questions?|mcqs?)\b/i.test(lower) ||
    /\busing\s+past\s*papers?\b/i.test(lower) ||
    /\bgenerate\s+from\s+past\s*papers?\b/i.test(lower);

  const wantsSlos =
    /\bfrom\s+(the\s+)?slos?\b/i.test(lower) ||
    /\bfrom\s+(the\s+)?syllabus\b/i.test(lower) ||
    /\busing\s+(slos?|syllabus)\b/i.test(lower) ||
    /\bsyllabus\s+slos?\b/i.test(lower) ||
    /\bgenerate\s+from\s+slos?\b/i.test(lower);

  // Prefer the more specific phrase if both somehow appear
  if (wantsPastPapers && !wantsSlos) return "past_papers";
  if (wantsSlos && !wantsPastPapers) return "slos";
  if (wantsPastPapers) return "past_papers";
  if (wantsSlos) return "slos";
  return null;
}

function detectQueryType(message: string): STRUCTURED_QUERY_TYPE {
  const lower = message.toLowerCase();

  const isTutoringOrExplaining =
    /\b(paper\s+pattern|exam\s+pattern|marking\s+scheme|paper\s+scheme|how\s+to\s+prepare|tips|strategy|solve\s+(?:this|q|question)|explain\s+(?:this|q|question)|what\s+is\s+(?:the\s+)?paper\s+pattern)\b/i.test(
      lower,
    );

  const isCreatePaper =
    !isTutoringOrExplaining &&
    (/\b(generate|create|make|prepare|set|build|compose|give|send|want|need|get|provide|start|take|attempt|practice)\b.{0,40}\b(paper|papers|practice\s+paper|mock\s+paper|sample\s+paper|question\s+paper|quiz|quizzes|test|tests|exam|exams|assessment|mcqs?)\b/i.test(
      lower,
    ) ||
      /\b(paper\s*(?:1|2|i|ii)|practice\s+paper|mock\s+paper|sample\s+paper|question\s+paper)\b.{0,40}\b(generate|create|make|prepare|set|for\s+class|for\s+myself|to\s+challenge|of|for|on)\b/i.test(
        lower,
      ) ||
      /\b(?:please\s+)?(?:generate|create|make|prepare|start|give\s+me|i\s+want|i\s+need|need|want)\s+(?:a\s+|an\s+|the\s+)?(?:practice\s+)?(?:paper|quiz|test|exam|assessment|mcqs?)\b/i.test(
        lower,
      ) ||
      /\b(?:paper|quiz|test|exam)\s+(?:of|for|on|about)\s+(?:the\s+)?(?:chapter|topic|unit\s+)?[a-z]/i.test(
        lower,
      ) ||
      /\b(?:test\s+me\s+on|take\s+(?:my\s+)?test\s+on|quiz\s+me\s+on)\b/i.test(lower) ||
      /\b(generate\s+paper|generate\s+paper\s+(?:1|2|i|ii)|practice\s+for\s+myself|challenge\s+friends)\b/i.test(
        lower,
      ));

  if (isCreatePaper) return STRUCTURED_QUERY_TYPE.CREATE_PAPER;

  // A mention of a chapter/topic is not itself a syllabus-list request.
  // For example, "important notes for chapter Sound and Waves" must be taught,
  // not short-circuited to a list of syllabus subjects.
  const asksForLearningMaterial =
    /\b(notes?|summary|summari[sz]e|important|revise|revision|study|prepare|teach|explain|understand)\b/i.test(
      lower,
    );
  const isSyllabus =
    !asksForLearningMaterial &&
    (/\b(syllabus|curriculum|slo|slos|learning objectives?)\b/i.test(lower) ||
      /\b(list|show|view|what|which)\b.{0,24}\b(chapters|topics)\b/i.test(lower) ||
      /\b(chapters|topics)\b.{0,24}\b(list|in (?:my|the) syllabus|are there)\b/i.test(lower));

  const isPastPaper =
    /\b(past\s*paper|past\s*papers|mcq|crq|erq|question|came|appear|appeared|from\s+20\d{2}|between\s+20\d{2})\b/i.test(
      lower,
    ) || extractYearRange(message).yearFrom !== null;

  if (isPastPaper && (extractTopic(message) || extractChapterNumber(message) || (extractChapterNumbers(message)?.length ?? 0) > 0 || extractYearRange(message).yearFrom)) {
    return STRUCTURED_QUERY_TYPE.PAST_PAPER_TOPIC;
  }

  if (isSyllabus) return STRUCTURED_QUERY_TYPE.SYLLABUS;

  if (isPastPaper) return STRUCTURED_QUERY_TYPE.PAST_PAPER_TOPIC;

  return STRUCTURED_QUERY_TYPE.NONE;
}

function extractPracticeMode(message: string): "myself" | "challenge" | null {
  if (/\b(challenge|with (?:my )?friends?|multiplayer|compete|versus|vs\.?)\b/i.test(message)) {
    return "challenge";
  }
  if (/\b(for myself|practice myself|solo|self[ -]?practice|on my own)\b/i.test(message)) {
    return "myself";
  }
  return null;
}

function extractChallengeType(message: string): "normal" | "lightning" | null {
  if (/\b(lightning|live (?:round|arena)|game pin|real[ -]?time)\b/i.test(message)) {
    return "lightning";
  }
  if (/\b(blitz|async|asynchronous|one[ -]?to[ -]?one|1v1)\b/i.test(message)) {
    return "normal";
  }
  return null;
}

function extractDifficulty(message: string): "Alpha" | "Beta" | "Gamma" | null {
  if (/\b(alpha|easy|beginner|begineer|level 1|foundational)\b/i.test(message)) {
    return "Alpha";
  }
  if (/\b(beta|medium|intermediate|standard|level 2)\b/i.test(message)) {
    return "Beta";
  }
  if (/\b(gamma|hard|advanced|difficult|expert|level 3)\b/i.test(message)) {
    return "Gamma";
  }
  return null;
}

export function parseBotQuery(
  message: string,
  defaults: {
    classLevel?: string | null;
    board?: string | null;
    subject?: string | null;
  },
): ParsedBotQuery {
  const { yearFrom, yearTo } = extractYearRange(message);
  const extractedClass = extractClass(message);
  const extractedBoard = extractBoard(message);
  const chapterNumbers = extractChapterNumbers(message);

  return {
    type: detectQueryType(message),
    subject: extractSubject(message) ?? inferSubjectFromTopic(message) ?? defaults.subject ?? null,
    classLevel: extractedClass ?? defaults.classLevel ?? null,
    board: extractedBoard ?? defaults.board ?? null,
    topic: extractTopic(message),
    chapterNumber: chapterNumbers && chapterNumbers.length === 1 ? chapterNumbers[0] : extractChapterNumber(message),
    chapterNumbers,
    yearFrom,
    yearTo,
    classFromMessage: extractedClass !== null,
    boardFromMessage: extractedBoard !== null,
    paperType: extractPaperType(message),
    questionCount: extractQuestionCount(message),
    paperSource: extractPaperSource(message),
    practiceMode: extractPracticeMode(message),
    challengeType: extractChallengeType(message),
    difficulty: extractDifficulty(message),
  };
}
