import { buildCandidate, explainMatch, narrativeFromMatch } from "@/lib/matching";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { toJobRecord } from "@/lib/jobs";
import type { CandidateSnapshot, RankedJob, SearchIntent } from "@/lib/types";

async function loadCandidate(intent: SearchIntent, userId?: string | null): Promise<CandidateSnapshot> {
  let profile: Partial<CandidateSnapshot> | null = null;
  if (userId) {
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
  }
  return buildCandidate(intent, profile);
}

export async function rankJobsForUser(params: {
  intent: SearchIntent;
  userId?: string | null;
  limit?: number;
}): Promise<RankedJob[]> {
  const [jobs, candidate] = await Promise.all([
    prisma.job.findMany({ where: { active: true }, orderBy: { postedAt: "desc" } }),
    loadCandidate(params.intent, params.userId),
  ]);

  return jobs
    .map((job) => {
      const record = toJobRecord(job);
      return { ...record, match: explainMatch(record, candidate) };
    })
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, params.limit ?? 40);
}

export async function persistSearch(params: {
  userId?: string | null;
  intent: SearchIntent;
  ranked: RankedJob[];
}) {
  const search = await prisma.search.create({
    data: {
      userId: params.userId ?? null,
      query: params.intent.query,
      intentJson: JSON.stringify(params.intent),
      resultCount: params.ranked.length,
    },
  });

  if (!params.userId) return search;

  await Promise.all(
    params.ranked.slice(0, 20).map((item) =>
      prisma.match.upsert({
        where: { userId_jobId: { userId: params.userId as string, jobId: item.id } },
        update: {
          searchId: search.id,
          score: item.match.score,
          reasonsJson: JSON.stringify(item.match.reasons),
          gapsJson: JSON.stringify(item.match.gaps),
          narrative: narrativeFromMatch(item, item.match),
        },
        create: {
          userId: params.userId as string,
          jobId: item.id,
          searchId: search.id,
          score: item.match.score,
          reasonsJson: JSON.stringify(item.match.reasons),
          gapsJson: JSON.stringify(item.match.gaps),
          narrative: narrativeFromMatch(item, item.match),
        },
      }),
    ),
  );

  return search;
}

export async function matchOneJob(params: { jobId: string; userId?: string | null; query?: string }) {
  const job = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!job) return null;
  const intent = {
    query: params.query ?? "",
    keywords: [],
    skills: [],
    location: null,
    country: null,
    remoteType: null,
    contractType: null,
    seniority: null,
    language: null,
    source: "heuristic" as const,
  };
  const candidate = await loadCandidate(intent, params.userId);
  const record = toJobRecord(job);
  const match = explainMatch(record, candidate);
  return { job: record, match, candidate };
}
