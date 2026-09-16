import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { parseIntentHeuristic } from "@/lib/intent";
import { rejectIfRateLimited } from "@/lib/rate-limit";
import { collectPublicOpportunitiesForIntent, PUBLIC_BOARD_LABELS } from "@/server/collect";
import { persistSearch, rankJobsForUser } from "@/server/rank";
import { resolveIntent } from "@/server/search";

export const maxDuration = 30;

export async function POST(request: Request) {
  const limited = rejectIfRateLimited(request, "search", 20);
  if (limited) return limited;
  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "QUERY_REQUIRED" }, { status: 400 });
  }

  const user = await getSessionUser();
  const heuristic = parseIntentHeuristic(query);
  const [intent] = await Promise.all([
    resolveIntent(query),
    collectPublicOpportunitiesForIntent(heuristic),
  ]);
  const ranked = await rankJobsForUser({ intent, userId: user?.id, limit: 40 });
  await persistSearch({ user, intent, ranked });

  return NextResponse.json({
    intent,
    sourcesConsulted: PUBLIC_BOARD_LABELS,
    results: ranked.map((item) => ({
      id: item.id,
      title: item.title,
      company: item.company,
      location: item.location,
      remoteType: item.remoteType,
      contractType: item.contractType,
      seniority: item.seniority,
      source: item.source,
      sourceUrl: item.sourceUrl,
      score: item.match.score,
      reasons: item.match.reasons,
      gaps: item.match.gaps,
    })),
  });
}
