import {
  CONTRACT_TYPES,
  REMOTE_TYPES,
  SENIORITY_LEVELS,
  type ContractType,
  type RemoteType,
  type Seniority,
} from "./types";

const SKILL_ALIASES: Record<string, string> = {
  js: "javascript",
  node: "nodejs",
  nodejs: "nodejs",
  "node.js": "nodejs",
  ts: "typescript",
  reactjs: "react",
  next: "nextjs",
  "next.js": "nextjs",
  nextjs: "nextjs",
  py: "python",
  postgres: "postgresql",
  psql: "postgresql",
  pg: "postgresql",
  gh: "github",
  "ci/cd": "cicd",
  "ci-cd": "cicd",
  ml: "machine learning",
  "power bi": "powerbi",
  excel: "excel",
  sql: "sql",
  "data analysis": "data",
  "data analyst": "data",
  analyse: "data",
  analytics: "data",
};

export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tokenize(value: string): string[] {
  return fold(value)
    .split(/[^a-z0-9+#]+/g)
    .filter((token) => token.length > 1);
}

export function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = fold(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }
  return result;
}

export function normalizeSkill(value: string): string {
  const folded = fold(value).replace(/\s+/g, " ");
  return SKILL_ALIASES[folded] ?? folded;
}

export function parseSkillList(value: string[] | string | null | undefined): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;|/]/g)
      : [];
  return unique(raw.map((item) => normalizeSkill(item)).filter(Boolean));
}

export function parseRemoteType(value: string | null | undefined): RemoteType | null {
  if (!value) return null;
  const folded = fold(value);
  if (/(unspecified|not specified|inconnu)/.test(folded)) return "unspecified";
  if (/(remote|teletravail|full.?remote|a distance)/.test(folded)) return "remote";
  if (/(hybrid|hybride|flex)/.test(folded)) return "hybrid";
  if (/(onsite|on-site|presentiel|sur site|bureau)/.test(folded)) return "onsite";
  return (REMOTE_TYPES as readonly string[]).includes(folded) ? (folded as RemoteType) : null;
}

export function parseContractType(value: string | null | undefined): ContractType | null {
  if (!value) return null;
  const folded = fold(value);
  if (/(stage|intern)/.test(folded)) return "internship";
  if (/(alternance|apprentissage|apprentice)/.test(folded)) return "apprenticeship";
  if (/(consultant|consulting)/.test(folded)) return "consultant";
  if (/(mission)/.test(folded)) return "mission";
  if (/(freelance|independant|contract)/.test(folded)) return "freelance";
  if (/\bcdi\b/.test(folded)) return "cdi";
  if (/\bcdd\b/.test(folded)) return "cdd";
  if (/(employee|emploi)/.test(folded)) return "employee";
  if (/(other|autre|unspecified)/.test(folded)) return "other";
  return (CONTRACT_TYPES as readonly string[]).includes(folded)
    ? (folded as ContractType)
    : null;
}

export function parseSeniority(value: string | null | undefined): Seniority | null {
  if (!value) return null;
  const folded = fold(value);
  if (/(stage|intern|alternant)/.test(folded)) return "intern";
  if (/(junior|debutant|entry)/.test(folded)) return "junior";
  if (/(lead|head|principal|staff|directeur)/.test(folded)) return "lead";
  if (/(senior|confirme|experient)/.test(folded)) return "senior";
  if (/(mid|confirme|intermediate)/.test(folded)) return "mid";
  if (/(unspecified|not specified|inconnu)/.test(folded)) return "unspecified";
  return (SENIORITY_LEVELS as readonly string[]).includes(folded)
    ? (folded as Seniority)
    : null;
}

export function canonicalSourceUrl(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_|ref$)/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return null;
  }
}

export function fingerprintJob(input: {
  title: string;
  company: string;
  location: string;
  sourceUrl?: string | null;
}): string {
  const canonical = canonicalSourceUrl(input.sourceUrl);
  if (canonical) return fold(canonical);
  return [input.title, input.company, input.location].map(fold).join("|");
}

export function asJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
