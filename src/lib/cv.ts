import { fold, parseRemoteType, parseSeniority, unique } from "./normalize";
import type { ParsedCv, Seniority } from "./types";

const SKILL_DICTIONARY = [
  "python",
  "sql",
  "excel",
  "powerbi",
  "tableau",
  "r",
  "react",
  "nextjs",
  "nodejs",
  "typescript",
  "javascript",
  "html",
  "css",
  "prisma",
  "postgresql",
  "mysql",
  "mongodb",
  "figma",
  "product management",
  "product",
  "data",
  "machine learning",
  "nlp",
  "pandas",
  "numpy",
  "flutter",
  "dart",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "linux",
  "git",
  "marketing",
  "growth",
  "seo",
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
  "django",
  "fastapi",
  "laravel",
  "php",
  "java",
  "spring",
  "c#",
  "go",
];

const LOCATION_HINTS = [
  "cotonou",
  "lome",
  "accra",
  "lagos",
  "dakar",
  "abidjan",
  "ouagadougou",
  "bamako",
  "niamey",
  "casablanca",
  "tunis",
  "nairobi",
  "paris",
  "lyon",
  "montreal",
  "benin",
  "togo",
  "senegal",
  "ghana",
  "nigeria",
  "france",
];

function extractYears(text: string): number | null {
  const match = fold(text).match(/(\d{1,2})\s*(ans|an|years|year)/);
  if (!match) return null;
  const years = Number(match[1]);
  return Number.isFinite(years) ? years : null;
}

function inferSeniority(years: number | null, text: string): Seniority | null {
  const fromText = parseSeniority(text);
  if (fromText) return fromText;
  if (years == null) return null;
  if (years <= 1) return "intern";
  if (years <= 3) return "junior";
  if (years <= 6) return "mid";
  if (years <= 10) return "senior";
  return "lead";
}

function textHasSkill(folded: string, skill: string): boolean {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = new RegExp(`(?:^|[^a-z0-9+])${escaped}(?:[^a-z0-9+]|$)`);
  if (skill.length <= 3) return boundary.test(folded);
  const compact = folded.replace(/\s+/g, "");
  return boundary.test(folded) || compact.includes(skill.replace(/\s+/g, ""));
}

function extractHeadline(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const skip = /^(curriculum|cv|resume|nom|name|email|tel|phone)/i;
  const candidate = lines.find((line) => !skip.test(line) && line.length < 90);
  return candidate ?? null;
}

export function parseCvHeuristic(cvText: string): ParsedCv {
  const text = cvText.trim();
  const folded = fold(text);
  const skills = SKILL_DICTIONARY.filter((skill) => textHasSkill(folded, skill)).map((skill) =>
    skill === "power bi" ? "powerbi" : skill,
  );
  const languages: string[] = [];
  if (/(francais|french|francophone)/.test(folded)) languages.push("fr");
  if (/(anglais|english|anglophone)/.test(folded)) languages.push("en");
  if (/(espagnol|spanish)/.test(folded)) languages.push("es");
  const locations = LOCATION_HINTS.filter((place) => folded.includes(place));
  const yearsExperience = extractYears(text);
  const summary = text.slice(0, 500);

  return {
    headline: extractHeadline(text),
    summary,
    skills: unique(skills),
    languages: unique(languages),
    locations: unique(locations),
    seniority: inferSeniority(yearsExperience, text),
    yearsExperience,
    remotePreference: parseRemoteType(text),
    source: "heuristic",
  };
}

export function parseCvFromJson(cvText: string, payload: unknown): ParsedCv | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const skills = Array.isArray(data.skills) ? data.skills.map(String) : [];
  const languages = Array.isArray(data.languages) ? data.languages.map(String) : [];
  const locations = Array.isArray(data.locations) ? data.locations.map(String) : [];
  const years =
    typeof data.yearsExperience === "number"
      ? data.yearsExperience
      : typeof data.yearsExperience === "string"
        ? Number(data.yearsExperience)
        : null;

  return {
    headline: typeof data.headline === "string" ? data.headline : extractHeadline(cvText),
    summary: typeof data.summary === "string" ? data.summary : cvText.slice(0, 500),
    skills: unique(skills.map((item) => fold(item))),
    languages: unique(languages.map((item) => fold(item))),
    locations: unique(locations),
    seniority: parseSeniority(typeof data.seniority === "string" ? data.seniority : null),
    yearsExperience: years != null && Number.isFinite(years) ? years : extractYears(cvText),
    remotePreference: parseRemoteType(typeof data.remotePreference === "string" ? data.remotePreference : cvText),
    source: "rodium",
  };
}
