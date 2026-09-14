import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { persistSearch, rankJobsForUser } from "@/server/rank";
import { resolveIntent } from "@/server/search";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "QUERY_REQUIRED" }, { status: 400 });
  }

  const user = await getSessionUser();
  const intent = await resolveIntent(query);
  const ranked = await rankJobsForUser({ intent, userId: user?.id, limit: 40 });
  await persistSearch({ userId: user?.id, intent, ranked });

  return NextResponse.json({
    intent,
    results: ranked.map((item) => ({
      id: item.id,
      title: item.title,
      company: item.company,
      location: item.location,
      remoteType: item.remoteType,
      contractType: item.contractType,
      seniority: item.seniority,
      score: item.match.score,
      reasons: item.match.reasons,
      gaps: item.match.gaps,
    })),
  });
}
