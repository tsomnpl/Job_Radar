import { buildCandidate, explainMatch, narrativeFromMatch } from "@/lib/matching";
import { asJsonArray } from "@/lib/normalize";
import { logDbError } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { getJobById, jobExistsInDb, listActiveJobs } from "@/server/jobs-store";
import { isPersistedUser, type AppUser } from "@/lib/auth";
import type { CandidateSnapshot, RankedJob, SearchIntent } from "@/lib/types";

async function loadCandidate(intent: SearchIntent, userId?: string | null): Promise<CandidateSnapshot> {
  let profile: Partial<CandidateSnapshot> | null = null;
  if (userId && !userId.startsWith("ephemeral_")) {
    try {
      const row = await prisma.profile.findUnique({ where: { userId } });
      if (row) {
        profile = {
          skills: asJsonArray(row.skillsJson),
          languages: asJsonArray(row.languagesJson),
          locations: asJsonArray(row.locationsJson),
          seniority: (row.seniority as CandidateSnapshot["seniority"]) ?? null,
          yearsExperience: row.yearsExperience,
          remotePreference: (row.remotePreference as CandidateSnapshot["remotePreference"]) ?? null,
          headline: row.headline,
        };
      }
    } catch (error) {
      logDbError("loadCandidate", error);
    }
  }
  return buildCandidate(intent, profile);
}

export async function rankJobsForUser(params: {
  intent: SearchIntent;
  userId?: string | null;
  limit?: number;
}): Promise<RankedJob[]> {
  const [jobs, candidate] = await Promise.all([
    listActiveJobs(),
    loadCandidate(params.intent, params.userId),
  ]);

  return jobs
    .map((record) => ({ ...record, match: explainMatch(record, candidate) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, params.limit ?? 40);
}

export async function persistSearch(params: {
  user?: AppUser | null;
  userId?: string | null;
  intent: SearchIntent;
  ranked: RankedJob[];
}): Promise<void> {
  const userId = params.user ? (isPersistedUser(params.user) ? params.user.id : null) : (params.userId ?? null);
  if (userId?.startsWith("ephemeral_")) return;

  try {
    const search = await prisma.search.create({
      data: {
        userId,
        query: params.intent.query,
        intentJson: JSON.stringify(params.intent),
        resultCount: params.ranked.length,
      },
    });

    if (!userId) return;

    await Promise.all(
      params.ranked.slice(0, 20).map(async (item) => {
        if (!(await jobExistsInDb(item.id))) return;
        await prisma.match.upsert({
          where: { userId_jobId: { userId, jobId: item.id } },
          update: {
            searchId: search.id,
            score: item.match.score,
            reasonsJson: JSON.stringify(item.match.reasons),
            gapsJson: JSON.stringify(item.match.gaps),
            narrative: narrativeFromMatch(item, item.match),
          },
          create: {
            userId,
            jobId: item.id,
            searchId: search.id,
            score: item.match.score,
            reasonsJson: JSON.stringify(item.match.reasons),
            gapsJson: JSON.stringify(item.match.gaps),
            narrative: narrativeFromMatch(item, item.match),
          },
        });
      }),
    );
  } catch (error) {
    logDbError("persistSearch", error);
  }
}

export async function matchOneJob(params: { jobId: string; userId?: string | null; query?: string }) {
  const job = await getJobById(params.jobId);
  if (!job) return null;
  const intent = {
    query: params.query ?? "",
    keywords: [] as string[],
    skills: [] as string[],
    location: null,
    country: null,
    remoteType: null,
    contractType: null,
    seniority: null,
    language: null,
    source: "heuristic" as const,
  };
  const candidate = await loadCandidate(intent, params.userId);
  const match = explainMatch(job, candidate);
  return { job, match, candidate };
}
