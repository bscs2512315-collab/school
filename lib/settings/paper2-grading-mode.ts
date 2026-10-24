import { db } from "@/lib/db";

export enum PAPER2_GRADING_MODE {
  AI = "AI",
  MANUAL = "MANUAL",
}

export const PAPER2_GRADING_MODE_KEY = "PAPER2_GRADING_MODE";

export async function getPaper2GradingMode(): Promise<PAPER2_GRADING_MODE> {
  const { rows } = await db
    .query(`SELECT value FROM app_settings WHERE key = $1`, [PAPER2_GRADING_MODE_KEY])
    .catch(() => ({ rows: [] as { value: string }[] }));

  const value = rows[0]?.value;
  if (value === PAPER2_GRADING_MODE.AI) {
    return PAPER2_GRADING_MODE.AI;
  }
  return PAPER2_GRADING_MODE.MANUAL;
}
