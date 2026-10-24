import { z } from "zod";

// Canonical Paper II exemplar payload (stored inside questions.paper_ii_data).
// Some older rows may use snake_case keys, so we accept both here.
const paperIIDataRawSchema = z
  .object({
    // Canonical (camelCase)
    betterResponse: z.string().nullable().optional(),
    weakerResponse: z.string().nullable().optional(),
    markingNotes: z.string().nullable().optional(),

    // Legacy (snake_case)
    better_response: z.string().nullable().optional(),
    weaker_response: z.string().nullable().optional(),
    marking_notes: z.string().nullable().optional(),

    botApproved: z.boolean().optional(),
  })
  .passthrough();

export const paperIIDataSchema = paperIIDataRawSchema.nullable().optional();

export type PaperIIData = {
  betterResponse?: string;
  weakerResponse?: string;
  markingNotes?: string;
  botApproved?: boolean;
};

type PaperIIDataRaw = NonNullable<z.infer<typeof paperIIDataSchema>>;

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickStringValue(
  source: Record<string, unknown>,
  exactKeys: string[],
  fuzzyTokens: string[],
): string | undefined {
  // 1) Try exact key matches first.
  for (const key of exactKeys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  // 2) Try normalized-key lookup (handles spacing/casing/underscore variants).
  const normalizedMap = new Map<string, unknown>();
  Object.entries(source).forEach(([key, value]) => {
    normalizedMap.set(normalizeKey(key), value);
  });

  for (const key of exactKeys) {
    const value = normalizedMap.get(normalizeKey(key));
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  // 3) Fuzzy fallback (e.g. "strongResponseExample", "weak answer response").
  for (const [rawKey, value] of Object.entries(source)) {
    if (typeof value !== "string" || value.trim() === "") continue;
    const normalized = normalizeKey(rawKey);
    const matchesAllTokens = fuzzyTokens.every((token) =>
      normalized.includes(token),
    );
    if (matchesAllTokens) {
      return value;
    }
  }

  return undefined;
}

export function parsePaperIIData(raw: unknown): PaperIIData | null {
  if (!raw) return null;

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const result = paperIIDataSchema.safeParse(parsed);
    if (!result.success || !result.data) {
      return null;
    }

    const data = result.data as PaperIIDataRaw;
    const root = toRecord(data) ?? {};
    const nested =
      toRecord(root.paperIIData) ??
      toRecord(root.paper_ii_data) ??
      toRecord(root.paperiiData) ??
      toRecord(root.paperii_data);

    const lookupSources = nested ? [root, nested] : [root];

    let betterResponse: string | undefined;
    let weakerResponse: string | undefined;
    let markingNotes: string | undefined;

    for (const source of lookupSources) {
      betterResponse =
        betterResponse ??
        pickStringValue(
          source,
          ["betterResponse", "better_response", "better response"],
          ["better", "response"],
        );
      weakerResponse =
        weakerResponse ??
        pickStringValue(
          source,
          ["weakerResponse", "weaker_response", "weaker response"],
          ["weaker", "response"],
        );
      markingNotes =
        markingNotes ??
        pickStringValue(
          source,
          ["markingNotes", "marking_notes", "marking notes"],
          ["marking", "notes"],
        );
    }

    return {
      betterResponse: betterResponse ?? undefined,
      weakerResponse: weakerResponse ?? undefined,
      markingNotes: markingNotes ?? undefined,
      botApproved: data.botApproved ?? undefined,
    };
  } catch {
    return null;
  }
}

export function serializePaperIIData(
  data:
    | PaperIIData
    | (Partial<PaperIIDataRaw> & Record<string, unknown>)
    | null
    | undefined,
): string | null {
  if (!data) return null;

  const betterResponse =
    (data as PaperIIData).betterResponse ?? (data as any).better_response;
  const weakerResponse =
    (data as PaperIIData).weakerResponse ?? (data as any).weaker_response;
  const markingNotes =
    (data as PaperIIData).markingNotes ?? (data as any).marking_notes;
  const botApproved = (data as PaperIIData).botApproved ?? (data as any).botApproved;

  // Only store canonical keys going forward.
  return JSON.stringify({
    betterResponse: betterResponse ?? undefined,
    weakerResponse: weakerResponse ?? undefined,
    markingNotes: markingNotes ?? undefined,
    botApproved: botApproved ?? undefined,
  });
}
