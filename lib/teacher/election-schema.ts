import { db } from "@/lib/db";
import { buildElectionPublicUrl } from "@/lib/elections/public-url";
import { ElectionStatus, Gender } from "@/types/enums";
import type {
  ElectionCandidate,
  ElectionEvent,
  ElectionAnalytics,
  PublicElection,
  PublicElectionCandidate,
} from "@/types/election";

const globalForElection = globalThis as unknown as {
  __election_schema_ready?: boolean;
  __election_schema_promise?: Promise<void> | null;
};

export async function ensureElectionSchema(): Promise<void> {
  if (globalForElection.__election_schema_ready) return;
  if (globalForElection.__election_schema_promise) return globalForElection.__election_schema_promise;

  globalForElection.__election_schema_promise = (async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS election_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        categories TEXT[] NOT NULL DEFAULT '{}',
        registration_closed BOOLEAN NOT NULL DEFAULT FALSE,
        results_approved_at TIMESTAMPTZ
      )
    `);

    await db.query(`
      ALTER TABLE election_events
      ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}'
    `);

    await db.query(`
      ALTER TABLE election_events
      ADD COLUMN IF NOT EXISTS registration_closed BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await db.query(`
      ALTER TABLE election_events
      ADD COLUMN IF NOT EXISTS results_approved_at TIMESTAMPTZ
    `);

    await db.query(`
      ALTER TABLE election_events
      ADD COLUMN IF NOT EXISTS show_live_results BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await db.query(`
      ALTER TABLE election_events
      ADD COLUMN IF NOT EXISTS images_archived_at TIMESTAMPTZ
    `);

    await db.query(`
      UPDATE election_events e
      SET categories = sub.cats
      FROM (
        SELECT election_id, ARRAY_AGG(pos) AS cats
        FROM (
          SELECT election_id, TRIM(position) AS pos
          FROM election_candidates
          WHERE position IS NOT NULL AND TRIM(position) <> ''
          GROUP BY election_id, TRIM(position)
        ) distinct_positions
        GROUP BY election_id
      ) sub
      WHERE e.id = sub.election_id
        AND COALESCE(CARDINALITY(e.categories), 0) = 0
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_election_events_teacher
      ON election_events(teacher_id, created_at DESC)
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS election_candidates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        election_id UUID NOT NULL REFERENCES election_events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        class_level TEXT NOT NULL,
        section TEXT,
        position TEXT,
        gender TEXT,
        profile_image_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_election_candidates_election
      ON election_candidates(election_id, created_at)
    `);

    await db.query(`
      ALTER TABLE election_candidates
      ADD COLUMN IF NOT EXISTS position TEXT
    `);

    await db.query(`
      ALTER TABLE election_candidates
      ADD COLUMN IF NOT EXISTS gender TEXT
    `);

    await db.query(`
      ALTER TABLE election_candidates
      ADD COLUMN IF NOT EXISTS symbol_url TEXT
    `);

    await db.query(`
      ALTER TABLE election_candidates
      ADD COLUMN IF NOT EXISTS symbol_name TEXT
    `);

    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_election_candidates_symbol
      ON election_candidates(election_id, LOWER(TRIM(symbol_name)))
      WHERE symbol_name IS NOT NULL AND TRIM(symbol_name) <> ''
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS election_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        election_id UUID NOT NULL REFERENCES election_events(id) ON DELETE CASCADE,
        candidate_id UUID NOT NULL REFERENCES election_candidates(id) ON DELETE RESTRICT,
        voter_name TEXT NOT NULL,
        voter_roll_number TEXT NOT NULL,
        voter_roll_normalized TEXT NOT NULL,
        voter_email TEXT NOT NULL DEFAULT '',
        voter_selfie_url TEXT,
        race_key TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      ALTER TABLE election_votes
      ADD COLUMN IF NOT EXISTS race_key TEXT NOT NULL DEFAULT ''
    `);

    await db.query(`
      ALTER TABLE election_votes
      ADD COLUMN IF NOT EXISTS voter_selfie_url TEXT
    `);

    await db.query(`
      ALTER TABLE election_votes
      ADD COLUMN IF NOT EXISTS discarded_at TIMESTAMPTZ
    `);

    await db.query(`
      ALTER TABLE election_votes
      ADD COLUMN IF NOT EXISTS discarded_reason TEXT
    `);

    await db.query(`
      ALTER TABLE election_votes
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ
    `);

    await db.query(`
      ALTER TABLE election_votes
      ALTER COLUMN voter_email SET DEFAULT ''
    `);

    await db.query(`
      UPDATE election_votes v
      SET race_key = LOWER(TRIM(COALESCE(c.position, ''))) || '::' || LOWER(TRIM(COALESCE(c.gender, '')))
      FROM election_candidates c
      WHERE v.candidate_id = c.id
        AND (v.race_key IS NULL OR v.race_key = '')
    `);

    await db.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT c.conname
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          WHERE t.relname = 'election_votes'
            AND c.contype = 'u'
        LOOP
          EXECUTE format('ALTER TABLE election_votes DROP CONSTRAINT IF EXISTS %I', r.conname);
        END LOOP;
      END $$;
    `);

    await db.query(`DROP INDEX IF EXISTS uniq_election_votes_roll`);
    await db.query(`DROP INDEX IF EXISTS uniq_election_votes_email`);
    await db.query(`DROP INDEX IF EXISTS uniq_election_votes_email_race`);
    await db.query(`DROP INDEX IF EXISTS idx_election_votes_email`);
    await db.query(`DROP INDEX IF EXISTS uniq_election_votes_roll_race`);

    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_election_votes_roll_race
      ON election_votes(election_id, voter_roll_normalized, race_key)
      WHERE discarded_at IS NULL
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_election_votes_election
      ON election_votes(election_id, created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_election_votes_candidate_active
      ON election_votes(candidate_id)
      WHERE discarded_at IS NULL
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_election_votes_election_race
      ON election_votes(election_id, race_key)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_election_votes_election_active
      ON election_votes(election_id)
      WHERE discarded_at IS NULL
    `);

    globalForElection.__election_schema_ready = true;
  })();

  try {
    await globalForElection.__election_schema_promise;
  } finally {
    globalForElection.__election_schema_promise = null;
  }
}

export function getElectionStatus(
  startsAt: Date | string,
  endsAt: Date | string,
  now = new Date(),
): ElectionStatus {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (now < start) return ElectionStatus.UPCOMING;
  if (now > end) return ElectionStatus.ENDED;
  return ElectionStatus.LIVE;
}

export interface ElectionRow {
  id: string;
  teacher_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  starts_at: Date | string;
  ends_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
  categories?: string[] | null;
  registration_closed?: boolean | null;
  show_live_results?: boolean | null;
  results_approved_at?: Date | string | null;
  candidate_count?: string | number;
  vote_count?: string | number;
}

export interface CandidateRow {
  id: string;
  election_id: string;
  name: string;
  class_level: string;
  position: string | null;
  gender: string | null;
  profile_image_url: string;
  symbol_url: string | null;
  symbol_name: string | null;
  created_at: Date | string;
  vote_count?: string | number;
}

export function mapElectionEvent(
  row: ElectionRow,
  origin?: string,
): ElectionEvent {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    name: row.name,
    slug: row.slug,
    publicUrl: buildElectionPublicUrl(row.slug, origin),
    logoUrl: row.logo_url,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
    status: getElectionStatus(row.starts_at, row.ends_at),
    candidateCount: Number(row.candidate_count ?? 0),
    voteCount: Number(row.vote_count ?? 0),
    categories: normalizeElectionCategories(row.categories),
    registrationClosed: Boolean(row.registration_closed),
    showLiveResults: row.show_live_results ?? true,
    resultsApprovedAt: row.results_approved_at
      ? new Date(row.results_approved_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function mapElectionCandidate(row: CandidateRow): ElectionCandidate {
  return {
    id: row.id,
    electionId: row.election_id,
    name: row.name,
    classLevel: row.class_level,
    category: row.position ?? null,
    gender: parseCandidateGender(row.gender),
    profileImageUrl: row.profile_image_url || "/avatars/avatar1.png",
    symbolUrl: row.symbol_url ?? null,
    symbolName: row.symbol_name ?? null,
    voteCount:
      row.vote_count === undefined ? undefined : Number(row.vote_count),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function parseCandidateGender(
  value: string | null | undefined,
): Gender | null {
  if (value === Gender.MALE || value === Gender.FEMALE) {
    return value;
  }
  return null;
}

export function toPublicCandidate(
  candidate: ElectionCandidate,
): PublicElectionCandidate {
  return {
    id: candidate.id,
    name: candidate.name,
    classLevel: candidate.classLevel,
    category: candidate.category,
    gender: candidate.gender,
    profileImageUrl: candidate.profileImageUrl,
    symbolUrl: candidate.symbolUrl,
    symbolName: candidate.symbolName,
  };
}

export function mapPublicElection(
  event: ElectionEvent,
  candidates: PublicElectionCandidate[],
): PublicElection {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    logoUrl: event.logoUrl,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    status: event.status,
    categories: event.categories,
    registrationClosed: event.registrationClosed,
    showLiveResults: event.showLiveResults,
    resultsApprovedAt: event.resultsApprovedAt,
    candidates,
  };
}

export async function getElectionForTeacher(
  electionId: string,
  teacherId: string,
): Promise<ElectionRow | null> {
  await ensureElectionSchema();
  const { rows } = await db.query<ElectionRow>(
    `SELECT e.*,
            (SELECT COUNT(*)::int FROM election_candidates c WHERE c.election_id = e.id) AS candidate_count,
            (SELECT COUNT(*)::int FROM election_votes v WHERE v.election_id = e.id AND v.discarded_at IS NULL) AS vote_count
     FROM election_events e
     WHERE e.id = $1 AND e.teacher_id = $2
     LIMIT 1`,
    [electionId, teacherId],
  );
  return rows[0] ?? null;
}

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

const electionCache = new Map<string, CacheItem<ElectionRow | null>>();
const candidatesCache = new Map<string, CacheItem<ElectionCandidate[]>>();
const analyticsCache = new Map<string, CacheItem<ElectionAnalytics>>();

export function invalidateAnalyticsCache(slug?: string): void {
  if (!slug) {
    analyticsCache.clear();
    return;
  }
  analyticsCache.delete(slug.trim().toLowerCase());
}

export function invalidateElectionCache(slugOrId?: string): void {
  if (!slugOrId) {
    electionCache.clear();
    candidatesCache.clear();
    analyticsCache.clear();
    return;
  }
  const key = slugOrId.trim().toLowerCase();
  electionCache.delete(key);
  candidatesCache.delete(slugOrId);
  analyticsCache.delete(key);
}

export async function getCachedElectionAnalytics(
  slug: string,
  electionId: string,
): Promise<ElectionAnalytics> {
  const key = slug.trim().toLowerCase();
  const cached = analyticsCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const data = await getElectionAnalytics(electionId);
  analyticsCache.set(key, { data, expiresAt: Date.now() + 5_000 });
  return data;
}

export async function getElectionBySlug(
  slug: string,
): Promise<ElectionRow | null> {
  const key = slug.trim().toLowerCase();
  const cached = electionCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  await ensureElectionSchema();
  const { rows } = await db.query<ElectionRow>(
    `SELECT e.*,
            (SELECT COUNT(*)::int FROM election_candidates c WHERE c.election_id = e.id) AS candidate_count,
            (SELECT COUNT(*)::int FROM election_votes v WHERE v.election_id = e.id AND v.discarded_at IS NULL) AS vote_count
     FROM election_events e
     WHERE e.slug = $1
     LIMIT 1`,
    [key],
  );
  const result = rows[0] ?? null;
  // Cache for 10 seconds to collapse concurrent load bursts
  electionCache.set(key, { data: result, expiresAt: Date.now() + 10_000 });
  return result;
}

export async function listCandidates(
  electionId: string,
  withCounts = false,
): Promise<ElectionCandidate[]> {
  if (!withCounts) {
    const cached = candidatesCache.get(electionId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  await ensureElectionSchema();
  const sql = withCounts
    ? `SELECT c.*,
              COALESCE(v.vote_count, 0) AS vote_count
       FROM election_candidates c
       LEFT JOIN (
         SELECT candidate_id, COUNT(*)::int AS vote_count
         FROM election_votes
         WHERE election_id = $1 AND discarded_at IS NULL
         GROUP BY candidate_id
       ) v ON v.candidate_id = c.id
       WHERE c.election_id = $1
       ORDER BY c.created_at ASC`
    : `SELECT c.* FROM election_candidates c
       WHERE c.election_id = $1
       ORDER BY c.created_at ASC`;
  const { rows } = await db.query<CandidateRow>(sql, [electionId]);
  const candidates = rows.map(mapElectionCandidate);

  if (!withCounts) {
    // Static candidates list doesn't change during election: cache for 60s
    candidatesCache.set(electionId, { data: candidates, expiresAt: Date.now() + 60_000 });
  }

  return candidates;
}

export async function getElectionAnalytics(
  electionId: string,
): Promise<ElectionAnalytics> {
  const candidates = await listCandidates(electionId, true);
  const totalVotes = candidates.reduce(
    (sum, candidate) => sum + (candidate.voteCount ?? 0),
    0,
  );

  return {
    totalVotes,
    updatedAt: new Date().toISOString(),
    tallies: [...candidates]
      .map((candidate) => {
        const voteCount = candidate.voteCount ?? 0;
        const percentage =
          totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 1000) / 10;
        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          category: candidate.category,
          gender: candidate.gender,
          profileImageUrl: candidate.profileImageUrl,
          symbolUrl: candidate.symbolUrl,
          symbolName: candidate.symbolName,
          voteCount,
          percentage,
        };
      })
      .sort((a, b) => b.voteCount - a.voteCount || a.candidateName.localeCompare(b.candidateName)),
  };
}

export function normalizeElectionCategories(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const item of input) {
    const value = String(item ?? "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    categories.push(value);
    if (categories.length >= 24) break;
  }
  return categories;
}

export function matchElectionCategory(
  categories: string[],
  selected: string,
): string | null {
  const wanted = selected.trim().toLowerCase();
  if (!wanted) return null;
  return categories.find((item) => item.trim().toLowerCase() === wanted) ?? null;
}

export async function insertElectionCandidate(params: {
  electionId: string;
  name: string;
  category: string;
  gender: Gender;
  classLevel: string;
  profileImageUrl: string;
  symbolUrl?: string;
  symbolName?: string;
}): Promise<ElectionCandidate> {
  const { rows } = await db.query<CandidateRow>(
    `INSERT INTO election_candidates
       (election_id, name, position, gender, class_level, profile_image_url, symbol_url, symbol_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *, 0 AS vote_count`,
    [
      params.electionId,
      params.name,
      params.category,
      params.gender,
      params.classLevel,
      params.profileImageUrl,
      params.symbolUrl ?? null,
      params.symbolName ?? null,
    ],
  );
  return mapElectionCandidate(rows[0]);
}

export async function findCandidateWithSymbol(
  electionId: string,
  symbolName: string,
  excludeCandidateId?: string,
): Promise<ElectionCandidate | null> {
  await ensureElectionSchema();
  const name = (symbolName || "").trim();
  if (!name) return null;
  const { rows } = await db.query<CandidateRow>(
    `SELECT c.*
     FROM election_candidates c
     WHERE c.election_id = $1
       AND LOWER(TRIM(c.symbol_name)) = LOWER($2)
       AND ($3::uuid IS NULL OR c.id <> $3)
     LIMIT 1`,
    [electionId, name, excludeCandidateId ?? null],
  );
  return rows[0] ? mapElectionCandidate(rows[0]) : null;
}

export async function ensureElectionCategory(
  electionId: string,
  category: string,
): Promise<void> {
  const value = category.trim();
  if (!value) return;
  await db.query(
    `UPDATE election_events
     SET categories = CASE
       WHEN EXISTS (
         SELECT 1
         FROM unnest(COALESCE(categories, '{}')) AS item
         WHERE LOWER(TRIM(item)) = LOWER($2)
       ) THEN categories
       WHEN CARDINALITY(COALESCE(categories, '{}')) >= 24 THEN categories
       ELSE ARRAY_APPEND(COALESCE(categories, '{}'), $2)
     END,
     updated_at = NOW()
     WHERE id = $1`,
    [electionId, value],
  );
}
