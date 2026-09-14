import { explainMatch } from "@/lib/matching";
import { fingerprintJob, parseContractType, parseRemoteType, parseSeniority, parseSkillList } from "@/lib/normalize";
import type { CandidateSnapshot, JobInput, RankedJob, SearchIntent } from "@/lib/types";
import { normalizeJobInput } from "@/lib/import-jobs";
import { toJobRecord } from "@/lib/jobs";
import { rememberJob, upsertJobRecord } from "@/server/jobs-store";
import { rodiumChatJson } from "@/server/rodium";

function proposalJobId(fingerprint: string): string {
  const slug = fingerprint
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
  return `ai_${slug}`;
}

const SYSTEM = `Tu es le radar JobRadar. L'utilisateur n'a pas trouvé d'offre assez proche dans le stock.
Propose 5 pistes d'opportunités RÉALISTES (emplois, stages, missions, ONG, ONU/UNICEF/PNUD, entreprises) alignées sur la requête.
JSON strict :
{
  "jobs": [
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
      "description": string
    }
  ]
}
Règles :
- Ce sont des PISTES à sourcer, pas des offres scrapées. L'entreprise peut être un type d'organisation plausible (ex. "Agence UN — bureau pays", "ONG santé", "fintech régional").
- Ne invente pas d'URL. La description commence par "Piste IA JobRadar :" et explique pourquoi ça matche la requête.
- Reste dans la géographie et le contrat de la requête.`;

function heuristicTitle(intent: SearchIntent, index: number): string {
  const kind =
    intent.contractType === "internship"
      ? "Stage"
      : intent.contractType === "freelance"
        ? "Mission"
        : intent.contractType === "cdi"
          ? "Poste"
          : "Opportunité";
  const topic = intent.skills[0] || intent.keywords[0] || "ciblée";
  const loc = intent.location ? ` — ${intent.location}` : "";
  const base = `${kind} ${topic}${loc}`;
  return index === 0 ? base : `${base} (${index + 1})`;
}

function heuristicProposals(intent: SearchIntent): JobInput[] {
  const location = intent.location || "Remote";
  const skills = intent.skills.length ? intent.skills : intent.keywords;
  const contract = intent.contractType ?? "cdi";
  const seniority = intent.seniority ?? "mid";
  const bases = [
    { company: "Organisation cible (IA)", extra: "entreprise ou institution alignée" },
    { company: "ONG / agence pays (IA)", extra: "ONG, UNICEF, PNUD ou équivalent" },
    { company: "Mission consulting (IA)", extra: "mission freelance ou cabinet" },
  ];
  return bases.map((base, index) => {
    const title = heuristicTitle(intent, index);
    return {
      title,
      company: base.company,
      location,
      country: intent.country,
      remoteType: intent.remoteType ?? "hybrid",
      contractType: contract,
      seniority,
      skills,
      languages: intent.language ? [intent.language] : ["fr"],
      description: `Piste IA JobRadar : aucune offre du stock ne couvrait assez « ${intent.query} ». Piste ${base.extra} à ${location}. Compétences visées : ${skills.join(", ") || "à préciser"}. À valider et sourcer (pas une annonce officielle scrapée).`,
      source: "ai-proposal",
      sourceUrl: `ai://proposal/${index}/${fingerprintJob({ title: `${title}-${index}`, company: base.company, location })}`,
    };
  });
}

function parseProposedJobs(json: unknown, intent: SearchIntent): JobInput[] {
  if (!json || typeof json !== "object") return [];
  const jobs = (json as { jobs?: unknown }).jobs;
  if (!Array.isArray(jobs)) return [];
  const parsed: JobInput[] = [];
  jobs.forEach((raw, index) => {
    if (!raw || typeof raw !== "object") return;
    const row = raw as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const company = typeof row.company === "string" ? row.company.trim() : "";
    const location = typeof row.location === "string" ? row.location.trim() : intent.location || "Remote";
    const description = typeof row.description === "string" ? row.description.trim() : "";
    if (!title || !company || !description) return;
    parsed.push({
      title,
      company,
      location,
      country: typeof row.country === "string" ? row.country : intent.country,
      remoteType: parseRemoteType(typeof row.remoteType === "string" ? row.remoteType : intent.remoteType),
      contractType: parseContractType(typeof row.contractType === "string" ? row.contractType : intent.contractType),
      seniority: parseSeniority(typeof row.seniority === "string" ? row.seniority : intent.seniority),
      skills: Array.isArray(row.skills) ? row.skills.map(String) : intent.skills,
      languages: Array.isArray(row.languages) ? row.languages.map(String) : intent.language ? [intent.language] : ["fr"],
      description: description.startsWith("Piste IA") ? description : `Piste IA JobRadar : ${description}`,
      source: "ai-proposal",
      sourceUrl: `ai://proposal/${fingerprintJob({ title, company, location })}-${index}`,
    });
  });
  return parsed;
}

export function searchNeedsAiProposals(ranked: RankedJob[]): boolean {
  const strong = ranked.filter((job) => job.match.score >= 55 && job.source !== "ai-proposal");
  return ranked.length === 0 || strong.length < 3;
}

export async function proposeOpportunities(intent: SearchIntent, candidate: CandidateSnapshot): Promise<RankedJob[]> {
  let inputs = heuristicProposals(intent);
  if (process.env.RODIUMAI_API_KEY?.trim()) {
    try {
      const result = await rodiumChatJson({
        system: SYSTEM,
        user: JSON.stringify({ query: intent.query, intent, profileSkills: candidate.skills }),
      });
      const parsed = parseProposedJobs(result?.json, intent);
      if (parsed.length) inputs = parsed;
    } catch {
      /* keep heuristic */
    }
  }

  const ranked: RankedJob[] = [];
  for (const input of inputs.slice(0, 6)) {
    try {
      const normalized = normalizeJobInput({
        ...input,
        skills: parseSkillList(input.skills),
        source: "ai-proposal",
      });
      const id = proposalJobId(normalized.fingerprint);
      const stored = await upsertJobRecord({
        id,
        ...normalized,
        active: true,
      });
      const record = stored ?? {
        ...toJobRecord({
          id,
          ...normalized,
          postedAt: normalized.postedAt,
        }),
        source: "ai-proposal",
      };
      rememberJob(record);
      ranked.push({ ...record, match: explainMatch(record, candidate) });
    } catch {
      continue;
    }
  }
  return ranked;
}
