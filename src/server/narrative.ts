import { isRodiumConfigured } from "@/lib/env";
import { narrativeFromMatch } from "@/lib/matching";
import type { JobRecord, MatchExplanation } from "@/lib/types";
import { rodiumNarrativeSchema } from "@/server/ai-schema";
import { rodiumChatJson } from "@/server/rodium";

export async function explainNarrative(job: JobRecord, match: MatchExplanation): Promise<string> {
  const fallback = narrativeFromMatch(job, match);
  if (!isRodiumConfigured()) return fallback;
  try {
    const result = await rodiumChatJson({
      system:
        "Tu rédiges une explication courte (3-5 phrases, français) du matching JobRadar. Sois factuel, cite les raisons et les écarts. JSON : {\"narrative\": string}",
      user: JSON.stringify({
        title: job.title,
        company: job.company,
        score: match.score,
        reasons: match.reasons,
        gaps: match.gaps,
      }),
    });
    const payload = rodiumNarrativeSchema.safeParse(result?.json);
    if (payload.success) return payload.data.narrative;
    return fallback;
  } catch {
    return fallback;
  }
}
