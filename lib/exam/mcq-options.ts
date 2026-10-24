export const SHORT_OPTION_MAX_LENGTH = 28;

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function isShortMcqOption(text: string): boolean {
  return stripHtml(text).length <= SHORT_OPTION_MAX_LENGTH;
}
