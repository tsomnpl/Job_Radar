import { parseContractType, parseRemoteType, parseSeniority, parseSkillList } from "@/lib/normalize";
import { rodiumExtractSchema } from "@/server/ai-schema";
import type { JobInput } from "@/lib/types";
import { rodiumChatJson } from "@/server/rodium";

const SYSTEM = `Tu extraies une offre d'emploi depuis un texte brut (annonce, mail, page carrière).
JSON strict :
{
  "title": string,
  "company": string,
  "location": string | null,
  "country": string | null,
  "remoteType": "remote" | "hybrid" | "onsite" | null,
  "contractType": "cdi" | "cdd" | "freelance" | "internship" | "apprenticeship" | "other" | null,
  "seniority": "intern" | "junior" | "mid" | "senior" | "lead" | null,
  "skills": string[],
  "languages": string[],
  "description": string,
  "requirements": string | null,
  "education": string | null,
  "experience": string | null,
  "duration": string | null,
  "sourceUrl": string | null,
  "applicationUrl": string | null,
  "deadline": string | null
}
Ne fabrique pas d'entreprise, URL ou deadline absente du texte. Si un champ est inconnu, null ou [].`;

function heuristicExtract(raw: string): JobInput {
  const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return {
    title: lines[0]?.slice(0, 120) || "Not specified",
    company: lines[1]?.slice(0, 80) || "Not specified",
    location: /lomé|cotonou|dakar|accra|abidjan|remote|paris/i.exec(raw)?.[0] || "Not specified",
    description: raw.slice(0, 8000),
    skills: parseSkillList(raw),
    remoteType: parseRemoteType(raw),
    contractType: parseContractType(raw),
    seniority: parseSeniority(raw),
    source: "extract",
  };
}

export async function extractJobFromText(raw: string): Promise<JobInput> {
  const fallback = heuristicExtract(raw);
  if (!process.env.RODIUMAI_API_KEY?.trim()) return fallback;
  try {
    const result = await rodiumChatJson({
      system: SYSTEM,
      user: raw.slice(0, 12000),
    });
    const parsed = rodiumExtractSchema.safeParse(result?.json);
    if (!parsed.success) return fallback;
    const json = parsed.data;
    return {
      title: json.title,
      company: json.company,
      location: json.location?.trim() || fallback.location,
      country: json.country ?? null,
      remoteType: json.remoteType ?? fallback.remoteType,
      contractType: json.contractType ?? fallback.contractType,
      seniority: json.seniority ?? fallback.seniority,
      skills: json.skills.length ? json.skills : fallback.skills,
      languages: json.languages.length ? json.languages : ["fr"],
      description: json.description?.trim() || fallback.description,
      requirements: json.requirements ?? null,
      education: json.education ?? null,
      experience: json.experience ?? null,
      duration: json.duration ?? null,
      sourceUrl: json.sourceUrl ?? null,
      applicationUrl: json.applicationUrl ?? null,
      deadline: json.deadline ?? null,
      source: "extract",
    };
  } catch {
    return fallback;
  }
}
