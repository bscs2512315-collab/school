import type { QuestionBankFacet } from "@/types/question-bank";
import { Class } from "@/types/enums";

export function getClassQuestionCounts(facets: QuestionBankFacet[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const facet of facets) {
    counts.set(facet.class, (counts.get(facet.class) || 0) + facet.count);
  }
  return counts;
}

export function getSubjectsForClass(
  facets: QuestionBankFacet[],
  className: string,
): Array<{ subject: string; count: number }> {
  const counts = new Map<string, number>();
  for (const facet of facets.filter((item) => item.class === className)) {
    counts.set(facet.subject, (counts.get(facet.subject) || 0) + facet.count);
  }

  return Array.from(counts.entries())
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

export function getPaperQuestionCount(
  facets: QuestionBankFacet[],
  className: string,
  subject: string,
  paperNumber: number,
): number {
  return (
    facets.find(
      (facet) =>
        facet.class === className &&
        facet.subject === subject &&
        facet.paperNumber === paperNumber,
    )?.count ?? 0
  );
}

export const CLASS_ORDER = Object.values(Class);
