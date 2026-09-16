import { isRodiumConfigured } from "@/lib/env";
import { displayField } from "@/lib/jobs";
import type { JobRecord, MatchExplanation } from "@/lib/types";
import { rodiumCopilotSchema } from "@/server/ai-schema";
import { rodiumChatJson } from "@/server/rodium";

const UNAVAILABLE = "Information not available.";

export function copilotFallback(params: {
  job: JobRecord;
  match: MatchExplanation;
  question: string;
}): string {
  const q = params.question.toLowerCase();
  if (q.includes("compétence") || q.includes("skill") || q.includes("manque")) {
    return params.match.gaps.length
      ? `Compétences absentes du profil (données de l'offre) : ${params.match.gaps.slice(0, 8).join(", ")}.`
      : "Peu d'écarts de compétences listés sur cette offre.";
  }
  if (q.includes("pourquoi") || q.includes("match") || q.includes("correspond")) {
    return params.match.matchedSkills.length
      ? `Correspondances détectées : ${params.match.matchedSkills.slice(0, 8).join(", ")}. Score algorithmique ${params.match.score}%.`
      : params.match.reasons[0]?.detail || UNAVAILABLE;
  }
  if (q.includes("cv") || q.includes("lettre") || q.includes("prépar")) {
    return `Adaptez le CV avec les mots-clés réels de l'offre (${params.job.skills.slice(0, 6).join(", ") || UNAVAILABLE}). Relisez le lien officiel avant de postuler.`;
  }
  if (q.includes("éligib") || q.includes("eligib")) {
    return `JobRadar ne confirme pas l'éligibilité. Vérifiez ${displayField(params.job.education)}, ${displayField(params.job.experience)} et le site officiel.`;
  }
  return `Offre : ${params.job.title} chez ${params.job.company}. ${params.match.reasons[0]?.detail ?? UNAVAILABLE} Score déterministe ${params.match.score}%.`;
}

export async function answerOpportunityCopilot(params: {
  job: JobRecord;
  match: MatchExplanation;
  profile: {
    headline?: string | null;
    skills?: string[];
    education?: string | null;
    seniority?: string | null;
    locations?: string[];
    summary?: string;
    languages?: string[];
  } | null;
  question: string;
}): Promise<{ answer: string; source: "rodium" | "deterministic" }> {
  const fallback = copilotFallback(params);
  if (!isRodiumConfigured()) return { answer: fallback, source: "deterministic" };

  const result = await rodiumChatJson({
    system: `Tu es Opportunity Copilot JobRadar. Réponds en français, factuel, sans inventer.
Si une donnée manque, écris exactement "${UNAVAILABLE}".
Ne promets pas que l'utilisateur obtiendra le poste.
JSON : {"answer": string}`,
    user: JSON.stringify({
      question: params.question,
      job: {
        title: params.job.title,
        company: params.job.company,
        location: params.job.location,
        remoteType: params.job.remoteType,
        contractType: params.job.contractType,
        skills: params.job.skills,
        duration: params.job.duration,
        deadline: params.job.deadline,
        requirements: params.job.requirements,
        education: params.job.education,
        experience: params.job.experience,
        source: params.job.source,
      },
      profile: params.profile
        ? {
            headline: params.profile.headline,
            skills: params.profile.skills,
            education: params.profile.education,
            seniority: params.profile.seniority,
            locations: params.profile.locations,
          }
        : null,
      match: {
        score: params.match.score,
        matchedSkills: params.match.matchedSkills,
        gaps: params.match.gaps,
      },
    }),
  });
  const payload = rodiumCopilotSchema.safeParse(result?.json);
  if (payload.success) return { answer: payload.data.answer, source: "rodium" };
  return { answer: fallback, source: "deterministic" };
}
