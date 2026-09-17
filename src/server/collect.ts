import { ingestPublishFields } from "@/lib/job-lifecycle";
import { normalizeJobInput } from "@/lib/import-jobs";
import { upsertJobRecord } from "@/server/jobs-store";
import type { SearchIntent } from "@/lib/types";
import {
  PUBLIC_BOARD_LABELS,
  cronFetchTargets,
  fetchTargetsForIntent,
  filterRelevantOpportunities,
  parseHimalayasPayload,
  parseJobicyPayload,
  parseRemoteOkPayload,
  parseRemotivePayload,
  parseTheMusePayload,
  type FetchTarget,
  type PublicOpportunity,
} from "@/server/public-sources";

export { PUBLIC_BOARD_LABELS };

export type CollectResult = {
  fetched: number;
  saved: number;
  sources: string[];
};

const FETCH_TIMEOUT_MS = 7_000;
const SEARCH_SAVE_CAP = 25;
const CRON_PER_SOURCE_CAP = 40;
const USER_AGENT = "JobRadar/1.0 (+https://github.com/tsomnpl/Job_Radar)";

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function parseTarget(kind: FetchTarget["kind"], payload: unknown): PublicOpportunity[] {
  if (kind === "jobicy") return parseJobicyPayload(payload);
  if (kind === "remoteok") return parseRemoteOkPayload(payload);
  if (kind === "remotive") return parseRemotivePayload(payload);
  if (kind === "themuse") return parseTheMusePayload(payload);
  return parseHimalayasPayload(payload);
}

function dedupe(jobs: PublicOpportunity[]): PublicOpportunity[] {
  const seen = new Set<string>();
  const result: PublicOpportunity[] = [];
  for (const job of jobs) {
    if (seen.has(job.sourceUrl) || seen.has(job.id)) continue;
    seen.add(job.sourceUrl);
    seen.add(job.id);
    result.push(job);
  }
  return result;
}

async function persistOpportunities(jobs: PublicOpportunity[]): Promise<number> {
  let saved = 0;
  for (const job of jobs) {
    try {
      const normalized = normalizeJobInput({
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        remoteType: job.remoteType,
        contractType: job.contractType,
        seniority: job.seniority,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency,
        skills: job.skills,
        languages: ["en"],
        description: job.description,
        sourceUrl: job.sourceUrl,
        source: job.source,
        language: job.language,
        postedAt: job.postedAt,
      });
      await upsertJobRecord({
        ...normalized,
        id: job.id,
        ...ingestPublishFields(),
      });
      saved += 1;
    } catch {
      // Skip malformed rows rather than inventing fields.
    }
  }
  return saved;
}

async function fetchTargets(targets: FetchTarget[]): Promise<PublicOpportunity[]> {
  const uniqueTargets: FetchTarget[] = [];
  const seen = new Set<string>();
  for (const target of targets) {
    if (seen.has(target.url)) continue;
    seen.add(target.url);
    uniqueTargets.push(target);
  }
  const payloads = await Promise.all(uniqueTargets.map((target) => fetchJson(target.url)));
  const jobs: PublicOpportunity[] = [];
  uniqueTargets.forEach((target, index) => {
    const payload = payloads[index];
    if (!payload) return;
    jobs.push(...parseTarget(target.kind, payload));
  });
  return dedupe(jobs);
}

export async function collectPublicOpportunitiesForIntent(intent: SearchIntent): Promise<CollectResult> {
  try {
    const fetched = await fetchTargets(fetchTargetsForIntent(intent));
    const relevant = filterRelevantOpportunities(fetched, intent, SEARCH_SAVE_CAP);
    const saved = await persistOpportunities(relevant);
    return { fetched: fetched.length, saved, sources: PUBLIC_BOARD_LABELS };
  } catch {
    return { fetched: 0, saved: 0, sources: PUBLIC_BOARD_LABELS };
  }
}

export async function ingestPublicBoards(): Promise<CollectResult> {
  try {
    const fetched = await fetchTargets(cronFetchTargets());
    const capped: PublicOpportunity[] = [];
    const perSource = new Map<string, number>();
    for (const job of fetched) {
      const count = perSource.get(job.source) ?? 0;
      if (count >= CRON_PER_SOURCE_CAP) continue;
      perSource.set(job.source, count + 1);
      capped.push(job);
    }
    const saved = await persistOpportunities(capped);
    return { fetched: fetched.length, saved, sources: PUBLIC_BOARD_LABELS };
  } catch {
    return { fetched: 0, saved: 0, sources: PUBLIC_BOARD_LABELS };
  }
}
