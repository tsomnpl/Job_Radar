import { parseContractType, parseRemoteType, parseSeniority, fold, tokenize, unique } from "./normalize";
import type { SearchIntent } from "./types";

const KNOWN_LOCATIONS: Array<{ match: string; location: string; country: string }> = [
  { match: "cotonou", location: "Cotonou", country: "BJ" },
  { match: "porto-novo", location: "Porto-Novo", country: "BJ" },
  { match: "lome", location: "Lomé", country: "TG" },
  { match: "accra", location: "Accra", country: "GH" },
  { match: "lagos", location: "Lagos", country: "NG" },
  { match: "dakar", location: "Dakar", country: "SN" },
  { match: "abidjan", location: "Abidjan", country: "CI" },
  { match: "ouagadougou", location: "Ouagadougou", country: "BF" },
  { match: "bamako", location: "Bamako", country: "ML" },
  { match: "niamey", location: "Niamey", country: "NE" },
  { match: "casablanca", location: "Casablanca", country: "MA" },
  { match: "tunis", location: "Tunis", country: "TN" },
  { match: "nairobi", location: "Nairobi", country: "KE" },
  { match: "paris", location: "Paris", country: "FR" },
  { match: "lyon", location: "Lyon", country: "FR" },
  { match: "montreal", location: "Montréal", country: "CA" },
  { match: "benin", location: "Bénin", country: "BJ" },
  { match: "togo", location: "Togo", country: "TG" },
  { match: "senegal", location: "Sénégal", country: "SN" },
  { match: "côte d'ivoire", location: "Côte d'Ivoire", country: "CI" },
  { match: "cote d ivoire", location: "Côte d'Ivoire", country: "CI" },
  { match: "ghana", location: "Ghana", country: "GH" },
  { match: "nigeria", location: "Nigeria", country: "NG" },
];

const SKILL_DICTIONARY = [
  "python",
  "sql",
  "excel",
  "powerbi",
  "tableau",
  "react",
  "nextjs",
  "nodejs",
  "typescript",
  "javascript",
  "prisma",
  "postgresql",
  "figma",
  "product",
  "data",
  "machine learning",
  "nlp",
  "flutter",
  "dart",
  "aws",
  "docker",
  "kubernetes",
  "marketing",
  "growth",
  "community",
  "recrutement",
  "ux",
  "ui",
  "design",
  "finance",
  "comptabilite",
  "customer success",
  "support",
  "devops",
  "backend",
  "frontend",
  "fullstack",
  "cyber",
  "cybersecurity",
  "cybersecurite",
  "securite",
];

function detectLocation(query: string): { location: string; country: string } | null {
  const folded = fold(query);
  for (const item of KNOWN_LOCATIONS) {
    if (folded.includes(item.match)) return item;
  }
  return null;
}

function detectSkills(query: string): string[] {
  const folded = fold(query);
  return SKILL_DICTIONARY.filter((skill) => folded.includes(skill));
}

function detectLanguage(query: string): string | null {
  const folded = fold(query);
  if (/(francais|french|francophone)/.test(folded)) return "fr";
  if (/(anglais|english|anglophone)/.test(folded)) return "en";
  return null;
}

export function parseIntentHeuristic(query: string): SearchIntent {
  const cleaned = query.trim();
  const place = detectLocation(cleaned);
  const remoteType = parseRemoteType(cleaned);
  const contractType = parseContractType(cleaned);
  const seniority = parseSeniority(cleaned);
  const skills = detectSkills(cleaned);
  const keywords = unique(
    tokenize(cleaned).filter(
      (token) =>
        token.length > 2 &&
        !["cherche", "recherche", "offre", "offres", "poste", "job", "jobs", "stage", "remote"].includes(token),
    ),
  );

  return {
    query: cleaned,
    keywords,
    skills,
    location: place?.location ?? null,
    country: place?.country ?? null,
    remoteType,
    contractType,
    seniority,
    language: detectLanguage(cleaned),
    source: "heuristic",
  };
}

export function parseIntentFromJson(query: string, payload: unknown): SearchIntent | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const skills = Array.isArray(data.skills) ? data.skills.map(String) : [];
  const keywords = Array.isArray(data.keywords) ? data.keywords.map(String) : [];
  return {
    query,
    keywords: unique(keywords.length ? keywords : tokenize(query)),
    skills: unique(skills.map((item) => fold(item))),
    location: typeof data.location === "string" && data.location.trim() ? data.location.trim() : null,
    country: typeof data.country === "string" && data.country.trim() ? data.country.trim() : null,
    remoteType: parseRemoteType(typeof data.remoteType === "string" ? data.remoteType : null),
    contractType: parseContractType(typeof data.contractType === "string" ? data.contractType : null),
    seniority: parseSeniority(typeof data.seniority === "string" ? data.seniority : null),
    language: typeof data.language === "string" ? data.language : null,
    source: "rodium",
  };
}
