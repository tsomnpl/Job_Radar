import { normalizeJobInput } from "@/lib/import-jobs";
import { upsertJobRecord } from "@/server/jobs-store";
import type { SearchIntent } from "@/lib/types";
import {
  JOBICY_CRON_URLS,
  PUBLIC_BOARD_LABELS,
  REMOTE_OK_URL,
  REMOTIVE_URL,
  filterRelevantOpportunities,
  jobicyUrlsForIntent,
  parseJobicyPayload,
  parseRemoteOkPayload,
  parseRemotivePayload,
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
      await upsertJobRecord({ ...normalized, id: job.id, active: true });
      saved += 1;
    } catch {
      // Skip malformed rows rather than inventing fields.
    }
  }
  return saved;
}

async function fetchPublicBoards(jobicyUrls: string[]): Promise<PublicOpportunity[]> {
  const uniqueUrls = uniqueStrings([...jobicyUrls, REMOTE_OK_URL, REMOTIVE_URL]);
  const payloads = await Promise.all(uniqueUrls.map((url) => fetchJson(url)));
  const jobs: PublicOpportunity[] = [];
  uniqueUrls.forEach((url, index) => {
    const payload = payloads[index];
    if (!payload) return;
    if (url.includes("jobicy.com")) jobs.push(...parseJobicyPayload(payload));
    else if (url.includes("remoteok.com")) jobs.push(...parseRemoteOkPayload(payload));
    else if (url.includes("remotive.com")) jobs.push(...parseRemotivePayload(payload));
  });
  return dedupe(jobs);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

export async function collectPublicOpportunitiesForIntent(intent: SearchIntent): Promise<CollectResult> {
  try {
    const fetched = await fetchPublicBoards(jobicyUrlsForIntent(intent));
    const relevant = filterRelevantOpportunities(fetched, intent, SEARCH_SAVE_CAP);
    const saved = await persistOpportunities(relevant);
    return { fetched: fetched.length, saved, sources: PUBLIC_BOARD_LABELS };
  } catch {
    return { fetched: 0, saved: 0, sources: PUBLIC_BOARD_LABELS };
  }
}

export async function ingestPublicBoards(): Promise<CollectResult> {
  try {
    const fetched = await fetchPublicBoards(JOBICY_CRON_URLS);
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
