import { rodiumChatJson } from "@/server/rodium";
import type { JobRecord, ParsedCv } from "@/lib/types";

export async function draftCoverLetter(job: JobRecord, profile: ParsedCv | { headline?: string | null; summary?: string; skills?: string[] }): Promise<string> {
  const fallback = `Madame, Monsieur,\n\nJe vous écris au sujet du poste de ${job.title} chez ${job.company}. Mon profil (${profile.headline ?? "en construction"}) et mes compétences (${(profile.skills ?? []).slice(0, 8).join(", ") || "à préciser"}) s'alignent avec cette opportunité.\n\nJe serais heureux d'échanger sur la manière dont je peux contribuer.\n\nCordialement`;
  if (!process.env.RODIUMAI_API_KEY?.trim()) return fallback;
  try {
    const result = await rodiumChatJson({
      system:
        'Tu rédiges une lettre de motivation courte (FR, 180-220 mots), factuelle, sans inventer d\'expériences. JSON : {"letter": string}',
      user: JSON.stringify({
        job: { title: job.title, company: job.company, location: job.location, skills: job.skills },
        profile,
      }),
    });
    const payload = result?.json as { letter?: string } | null;
    return payload?.letter?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function optimizeCvHints(cvText: string, target?: string): Promise<string> {
  const fallback =
    "Clarifiez un headline en une ligne, groupez les compétences par domaine, et ajoutez 2 résultats chiffrés par expérience récente.";
  if (!process.env.RODIUMAI_API_KEY?.trim()) return fallback;
  try {
    const result = await rodiumChatJson({
      system:
        'Tu es coach CV JobRadar. JSON : {"advice": string} — 5 puces max, concrètes, sans inventer de faits.',
      user: JSON.stringify({ cvText: cvText.slice(0, 8000), target: target ?? null }),
    });
    const payload = result?.json as { advice?: string } | null;
    return payload?.advice?.trim() || fallback;
  } catch {
    return fallback;
  }
}
