import { isRodiumConfigured } from "@/lib/env";
import { parseIntentFromJson, parseIntentHeuristic } from "@/lib/intent";
import { rodiumIntentSchema } from "@/server/ai-schema";
import type { SearchIntent } from "@/lib/types";
import { rodiumChatJson } from "@/server/rodium";

const SYSTEM = `Tu es le moteur d'intention de JobRadar, un produit d'intelligence d'opportunités (pas un job board générique).
À partir d'une requête en langage naturel (FR ou EN), extraire un JSON strict :
{
  "keywords": string[],
  "skills": string[],
  "location": string | null,
  "country": string | null,
  "remoteType": "remote" | "hybrid" | "onsite" | null,
  "contractType": "cdi" | "cdd" | "freelance" | "internship" | "apprenticeship" | "other" | null,
  "seniority": "intern" | "junior" | "mid" | "senior" | "lead" | null,
  "language": "fr" | "en" | null
}
Ne invente pas de ville absente de la requête. Si un champ est inconnu, mets null ou [].`;

export async function resolveIntent(query: string): Promise<SearchIntent> {
  const fallback = parseIntentHeuristic(query);
  if (!isRodiumConfigured()) return fallback;
  try {
    const result = await rodiumChatJson({
      system: SYSTEM,
      user: query,
    });
    const parsed = parseIntentFromJson(query, rodiumIntentSchema.safeParse(result?.json).success ? result?.json : null);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
