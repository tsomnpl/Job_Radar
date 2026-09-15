import { fold, normalizeSkill, unique } from "./normalize";
import { isUnrestrictedRemoteLocation, placesCompatible } from "./places";
import { tokenMatchesHaystack } from "./synonyms";
import type {
  CandidateSnapshot,
  JobRecord,
  MatchExplanation,
  MatchReason,
  SearchIntent,
  Seniority,
} from "./types";

export const MIN_MATCH_SCORE = 55;

export function selectVerifiedMatches<T extends { source: string; match: { score: number } }>(
  jobs: T[],
  minScore = MIN_MATCH_SCORE,
): T[] {
  return jobs.filter(
    (job) => job.source !== "ai-proposal" && !job.source.startsWith("ai/") && job.match.score >= minScore,
  );
}

const WEIGHTS = {
  skills: 0.35,
  query: 0.2,
  location: 0.15,
  seniority: 0.1,
  remote: 0.1,
  language: 0.05,
  recency: 0.05,
} as const;

const SENIORITY_RANK: Record<Seniority, number> = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function skillOverlap(candidate: string[], job: string[]) {
  const candidateSet = new Set(candidate.map(normalizeSkill));
  const jobSet = unique(job.map(normalizeSkill));
  if (jobSet.length === 0) {
    return { score: candidateSet.size ? 55 : 40, matched: [] as string[], missing: [] as string[] };
  }
  const matched = jobSet.filter((skill) => candidateSet.has(skill));
  const missing = jobSet.filter((skill) => !candidateSet.has(skill));
  const coverage = matched.length / jobSet.length;
  const extra = candidateSet.size === 0 ? 0 : Math.min(0.15, matched.length / Math.max(candidateSet.size, 1));
  return {
    score: clamp(coverage * 100 + extra * 100),
    matched,
    missing,
  };
}

function queryScore(query: string, job: JobRecord): number {
  if (!query.trim()) return 50;
  const haystack = fold(`${job.title} ${job.company} ${job.description} ${job.skills.join(" ")}`);
  const tokens = unique(fold(query).split(/[^a-z0-9+#]+/g).filter((token) => token.length > 2));
  if (tokens.length === 0) return 50;
  const hits = tokens.filter((token) => tokenMatchesHaystack(token, haystack));
  const titleFold = fold(job.title);
  const titleBoost = tokens.some((token) => tokenMatchesHaystack(token, titleFold)) ? 18 : 0;
  return clamp((hits.length / tokens.length) * 82 + titleBoost);
}

function locationScore(candidate: CandidateSnapshot, job: JobRecord): { score: number; detail: string; polarity: MatchReason["polarity"] } {
  const jobPlace = `${job.location} ${job.country ?? ""}`;
  const unrestricted = isUnrestrictedRemoteLocation(job.location);

  if (!candidate.locations.length) {
    if (job.remoteType === "remote") {
      return { score: 92, detail: "Offre full remote, compatible avec une recherche géographique ouverte.", polarity: "positive" };
    }
    return { score: 60, detail: "Aucune localisation candidate : score neutre.", polarity: "neutral" };
  }

  const hit = candidate.locations.some(
    (place) => placesCompatible(place, jobPlace) || placesCompatible(place, job.location),
  );
  if (hit) {
    return { score: 100, detail: `Correspondance géographique (${job.location}).`, polarity: "positive" };
  }
  if (job.remoteType === "remote" && unrestricted) {
    return { score: 80, detail: "Pas de match ville à ville, mais l'offre est remote sans restriction géographique.", polarity: "positive" };
  }
  return { score: 28, detail: `Localisation différente (${job.location}).`, polarity: "negative" };
}

function seniorityScore(candidate: Seniority | null, jobSeniority: string): { score: number; detail: string; polarity: MatchReason["polarity"] } {
  const job = (jobSeniority as Seniority) in SENIORITY_RANK ? (jobSeniority as Seniority) : "mid";
  if (!candidate) {
    return { score: 58, detail: "Séniorité candidate inconnue.", polarity: "neutral" };
  }
  const delta = Math.abs(SENIORITY_RANK[candidate] - SENIORITY_RANK[job]);
  if (delta === 0) return { score: 100, detail: `Niveau ${job} aligné.`, polarity: "positive" };
  if (delta === 1) return { score: 72, detail: `Écart d'un cran (${candidate} vs ${job}).`, polarity: "neutral" };
  return { score: 30, detail: `Séniorité éloignée (${candidate} vs ${job}).`, polarity: "negative" };
}

function remoteScore(preference: CandidateSnapshot["remotePreference"], jobRemote: string): { score: number; detail: string; polarity: MatchReason["polarity"] } {
  if (!preference) return { score: 60, detail: "Pas de préférence de modalité.", polarity: "neutral" };
  if (preference === jobRemote) return { score: 100, detail: `Modalité ${jobRemote} identique.`, polarity: "positive" };
  if (preference === "hybrid" || jobRemote === "hybrid") {
    return { score: 70, detail: "Hybride compatible avec une préférence mixte.", polarity: "neutral" };
  }
  if (preference === "remote" && jobRemote === "onsite") {
    return { score: 22, detail: "Offre sur site alors que le profil veut du remote.", polarity: "negative" };
  }
  return { score: 48, detail: `Modalité ${jobRemote} vs préférence ${preference}.`, polarity: "neutral" };
}

function languageScore(candidateLangs: string[], jobLangs: string[]): { score: number; detail: string; polarity: MatchReason["polarity"] } {
  if (!jobLangs.length) return { score: 70, detail: "Langue de l'offre non spécifiée.", polarity: "neutral" };
  if (!candidateLangs.length) return { score: 55, detail: "Langues du profil non renseignées.", polarity: "neutral" };
  const jobSet = jobLangs.map(fold);
  const hits = candidateLangs.filter((lang) => jobSet.includes(fold(lang)));
  if (hits.length) return { score: 100, detail: `Langues en commun : ${hits.join(", ")}.`, polarity: "positive" };
  return { score: 35, detail: "Pas de langue en commun déclarée.", polarity: "negative" };
}

function recencyScore(postedAt: Date, now = new Date()): number {
  const days = Math.max(0, (now.getTime() - postedAt.getTime()) / 86_400_000);
  if (days <= 7) return 100;
  if (days <= 30) return 78;
  if (days <= 90) return 52;
  return 24;
}

export function buildCandidate(intent: SearchIntent, profile?: Partial<CandidateSnapshot> | null): CandidateSnapshot {
  return {
    skills: unique([...(profile?.skills ?? []), ...intent.skills].map(normalizeSkill)),
    languages: unique([...(profile?.languages ?? []), ...(intent.language ? [intent.language] : [])]),
    locations: unique(
      [intent.location, ...(profile?.locations ?? [])].filter((item): item is string => Boolean(item)),
    ),
    seniority: intent.seniority ?? profile?.seniority ?? null,
    yearsExperience: profile?.yearsExperience ?? null,
    remotePreference: intent.remoteType ?? profile?.remotePreference ?? null,
    headline: profile?.headline ?? null,
    query: intent.query,
  };
}

export function explainMatch(job: JobRecord, candidate: CandidateSnapshot, now = new Date()): MatchExplanation {
  const skills = skillOverlap(candidate.skills, job.skills);
  const query = queryScore(candidate.query, job);
  const location = locationScore(candidate, job);
  const seniority = seniorityScore(candidate.seniority, job.seniority);
  const remote = remoteScore(candidate.remotePreference, job.remoteType);
  const language = languageScore(candidate.languages, job.languages);
  const recency = recencyScore(job.postedAt, now);

  const reasons: MatchReason[] = [
    {
      factor: "skills",
      label: "Compétences",
      weight: WEIGHTS.skills,
      score: skills.score,
      detail: skills.matched.length
        ? `Compétences en commun : ${skills.matched.slice(0, 6).join(", ")}.`
        : "Peu de compétences en commun avec l'offre.",
      polarity: skills.score >= 70 ? "positive" : skills.score >= 45 ? "neutral" : "negative",
    },
    {
      factor: "query",
      label: "Intention de recherche",
      weight: WEIGHTS.query,
      score: query,
      detail: query >= 70 ? "L'offre recoupe fortement la requête." : "Recouvrement partiel avec la requête.",
      polarity: query >= 70 ? "positive" : query >= 45 ? "neutral" : "negative",
    },
    {
      factor: "location",
      label: "Localisation",
      weight: WEIGHTS.location,
      score: location.score,
      detail: location.detail,
      polarity: location.polarity,
    },
    {
      factor: "seniority",
      label: "Séniorité",
      weight: WEIGHTS.seniority,
      score: seniority.score,
      detail: seniority.detail,
      polarity: seniority.polarity,
    },
    {
      factor: "remote",
      label: "Modalité",
      weight: WEIGHTS.remote,
      score: remote.score,
      detail: remote.detail,
      polarity: remote.polarity,
    },
    {
      factor: "language",
      label: "Langues",
      weight: WEIGHTS.language,
      score: language.score,
      detail: language.detail,
      polarity: language.polarity,
    },
    {
      factor: "recency",
      label: "Fraîcheur",
      weight: WEIGHTS.recency,
      score: recency,
      detail: recency >= 78 ? "Offre récente." : "Offre plus ancienne, signal plus faible.",
      polarity: recency >= 78 ? "positive" : recency >= 50 ? "neutral" : "negative",
    },
  ];

  const score = clamp(reasons.reduce((sum, reason) => sum + reason.score * reason.weight, 0));
  const highlights = reasons.filter((reason) => reason.polarity === "positive").map((reason) => reason.detail);

  return {
    score,
    reasons,
    gaps: skills.missing,
    highlights,
  };
}

export function narrativeFromMatch(job: JobRecord, match: MatchExplanation): string {
  const top = match.reasons
    .filter((reason) => reason.polarity === "positive")
    .slice(0, 2)
    .map((reason) => reason.detail);
  const gapText = match.gaps.length
    ? `Écarts à combler : ${match.gaps.slice(0, 4).join(", ")}.`
    : "Peu d'écarts techniques majeurs.";
  const lead =
    match.score >= 75
      ? `Match fort (${match.score}/100) pour ${job.title} chez ${job.company}.`
      : match.score >= 50
        ? `Match utile (${match.score}/100) pour ${job.title} chez ${job.company}.`
        : `Match faible (${match.score}/100) — à n'ouvrir que si le contexte vous parle.`;
  return [lead, ...top, gapText].join(" ");
}
