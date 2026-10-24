export enum PastPaperBrowseMode {
  CLASSIC = "classic",
  YEARLY = "yearly",
}

export const PAST_PAPER_YEARLY_START = 2015;

export function getPastPaperYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= PAST_PAPER_YEARLY_START; year -= 1) {
    years.push(year);
  }
  return years;
}
