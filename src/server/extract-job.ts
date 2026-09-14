import { parseContractType, parseRemoteType, parseSeniority, parseSkillList } from "@/lib/normalize";
import type { JobInput } from "@/lib/types";
import { rodiumChatJson } from "@/server/rodium";

const SYSTEM = `Tu extraies une offre d'emploi depuis un texte brut (annonce, mail, page carrière).
JSON strict :
{
  "title": string,
  "company": string,
  "location": string,
  "country": string | null,
  "remoteType": "remote" | "hybrid" | "onsite" | null,
  "contractType": "cdi" | "cdd" | "freelance" | "internship" | "apprenticeship" | "other" | null,
  "seniority": "intern" | "junior" | "mid" | "senior" | "lead" | null,
  "skills": string[],
  "languages": string[],
  "description": string,
  "sourceUrl": string | null
}
Ne fabrique pas d'entreprise absente du texte. Si un champ est inconnu, null ou [].`;

function heuristicExtract(raw: string): JobInput {
  const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return {
    title: lines[0]?.slice(0, 120) || "Offre importée",
    company: lines[1]?.slice(0, 80) || "Organisation",
    location: /lomé|cotonou|dakar|accra|abidjan|remote|paris/i.exec(raw)?.[0] || "Remote",
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
    const json = result?.json as Partial<JobInput> | null;
    if (!json || typeof json.title !== "string" || typeof json.company !== "string") return fallback;
    return {
      title: json.title,
      company: json.company,
      location: typeof json.location === "string" ? json.location : fallback.location,
      country: json.country ?? null,
      remoteType: json.remoteType ?? fallback.remoteType,
      contractType: json.contractType ?? fallback.contractType,
      seniority: json.seniority ?? fallback.seniority,
      skills: Array.isArray(json.skills) ? json.skills : fallback.skills,
      languages: Array.isArray(json.languages) ? json.languages : ["fr"],
      description: typeof json.description === "string" ? json.description : fallback.description,
      sourceUrl: typeof json.sourceUrl === "string" ? json.sourceUrl : null,
      source: "extract",
    };
  } catch {
    return fallback;
  }
}
