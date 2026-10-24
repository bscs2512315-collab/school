const TECHNICAL_PATTERNS = [
  /gemini/i,
  /\.env/i,
  /api[_\s]?key/i,
  /yarn dev/i,
  /GEMINI_MODEL/i,
  /google cloud/i,
  /environment variable/i,
  /502/i,
  /504/i,
  /500/i,
  /503/i,
  /bad gateway/i,
  /gateway timeout/i,
  /<!doctype/i,
  /<html/i,
  /status code 502/i,
  /status code 504/i,
  /status code 500/i,
  /internal server error/i,
  /econnrefused/i,
  /econnreset/i,
];

function isTechnicalMessage(message: string): boolean {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

export function getNovaChatErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: string }).message)
      : error && typeof error === "object" && "error" in error
        ? String((error as { error: string }).error)
        : typeof error === "string"
          ? error
          : "";

  const lower = message.toLowerCase();

  if (
    lower.includes("504") ||
    lower.includes("gateway timeout") ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  ) {
    return "Nova took too long to respond. Please try asking again or try a shorter question.";
  }

  if (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted")
  ) {
    return "Nova is a bit busy right now. Please wait a moment and try again.";
  }

  if (
    lower.includes("failed to reach") ||
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("econnreset")
  ) {
    return "Nova couldn't connect right now. Please check your internet and try again.";
  }

  if (lower.includes("unauthorized") || lower.includes("401")) {
    return "Your session expired. Please sign in again and retry.";
  }

  if (message && !isTechnicalMessage(message) && message.length < 150) {
    return message;
  }

  return "Something went wrong. Please try again in a moment.";
}
