import { BOT_QUERY_INTENT } from "@/types/bot";

const BLOCKED_PATTERNS = [
  /\b(write my homework|do my assignment for me)\b/i,
  /\b(ignore (all )?previous instructions|ignore your rules|jailbreak|system prompt)\b/i,
  /\b(give me (the )?answers? (during|in) (the )?exam)\b/i,
  /\b(cheat|cheating|hack the exam)\b/i,
  /\b(proctored academic assessment|refusal directive|live certified exam|exboard.*live examination)\b|认证考试|严禁AI代答|系统警报|学术诚信/i,
  /\b(tell me a joke|who won the world cup|latest news|politics|dating advice|relationship advice)\b/i,
  /\b(recipe for|cook me|buy drugs|gambling)\b/i,
];

const GREETINGS_AND_CASUAL = [
  /^(hi|hello|hey|salam|assalam|aao|good morning|good evening|howdy|sup)\b/i,
  /^(help|help me|can you help|start|test|menu)\b/i,
];

export function quickIntentCheck(query: string): BOT_QUERY_INTENT | null {
  const trimmed = query.trim();
  if (!trimmed) return BOT_QUERY_INTENT.OFF_TOPIC;

  // Allow short greetings and queries
  if (trimmed.length < 3) {
    if (/^(hi|ok|no|go|1|2|a|b|c|d)$/i.test(trimmed)) {
      return null;
    }
    return BOT_QUERY_INTENT.OFF_TOPIC;
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      if (/cheat|answers? (during|in)|hack|proctored|directive|certified exam|exboard/i.test(trimmed)) {
        return BOT_QUERY_INTENT.ACADEMIC_DISHONESTY;
      }
      return BOT_QUERY_INTENT.OFF_TOPIC;
    }
  }

  // Fast-path greetings and standard conversational starters
  for (const pattern of GREETINGS_AND_CASUAL) {
    if (pattern.test(trimmed)) return null;
  }

  return null;
}

/**
 * Fast query classifier.
 * Uses high-performance pattern recognition so questions are answered in milliseconds
 * without unnecessary sequential LLM round-trips. Nova's system prompt handles nuanced refusal.
 */
export async function classifyQuery(
  query: string,
  _scope?: { board?: string; class?: string; subject?: string },
): Promise<{ intent: BOT_QUERY_INTENT; confidence: number; reason: string }> {
  const quick = quickIntentCheck(query);
  if (quick) {
    return { intent: quick, confidence: 0.95, reason: "Rule-based filter" };
  }

  // Fast allow: Default to syllabus concept for academic focus
  return {
    intent: BOT_QUERY_INTENT.SYLLABUS_CONCEPT,
    confidence: 0.9,
    reason: "Fast-path academic query",
  };
}

export function shouldBlockIntent(intent: BOT_QUERY_INTENT, confidence: number): boolean {
  if (intent === BOT_QUERY_INTENT.OFF_TOPIC || intent === BOT_QUERY_INTENT.ACADEMIC_DISHONESTY) {
    return confidence >= 0.65;
  }
  return false;
}
