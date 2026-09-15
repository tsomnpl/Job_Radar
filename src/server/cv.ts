import { parseCvFromJson, parseCvHeuristic } from "@/lib/cv";
import type { ParsedCv } from "@/lib/types";
import { rodiumChatJson } from "@/server/rodium";

const SYSTEM = `Tu es le parseur de CV de JobRadar.
Extrais un JSON strict :
{
  "headline": string | null,
  "summary": string,
  "skills": string[],
  "languages": string[],
  "locations": string[],
  "education": string | null,
  "seniority": "intern" | "junior" | "mid" | "senior" | "lead" | null,
  "yearsExperience": number | null,
  "remotePreference": "remote" | "hybrid" | "onsite" | null
}
Ne fabrique pas d'expériences absentes du texte.`;

export async function parseCv(cvText: string): Promise<ParsedCv> {
  const fallback = parseCvHeuristic(cvText);
  if (!process.env.RODIUMAI_API_KEY?.trim()) return fallback;
  try {
    const result = await rodiumChatJson({
      system: SYSTEM,
      user: cvText.slice(0, 12000),
    });
    return parseCvFromJson(cvText, result?.json) ?? fallback;
  } catch {
    return fallback;
  }
}
