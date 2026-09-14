import { fingerprintJob, parseContractType, parseRemoteType, parseSeniority, parseSkillList } from "./normalize";
import type { JobInput } from "./types";

export type NormalizedJobInput = {
  title: string;
  company: string;
  location: string;
  country: string | null;
  remoteType: string;
  contractType: string;
  seniority: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skillsJson: string;
  languagesJson: string;
  description: string;
  sourceUrl: string | null;
  source: string;
  language: string;
  postedAt: Date;
  fingerprint: string;
};

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function asDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

export function normalizeJobInput(input: JobInput): NormalizedJobInput {
  const title = input.title.trim();
  const company = input.company.trim();
  const location = input.location.trim();
  if (!title || !company || !location || !input.description.trim()) {
    throw new Error("JOB_FIELDS_REQUIRED");
  }

  return {
    title,
    company,
    location,
    country: input.country?.trim() || null,
    remoteType: parseRemoteType(input.remoteType) ?? "hybrid",
    contractType: parseContractType(input.contractType) ?? "cdi",
    seniority: parseSeniority(input.seniority) ?? "mid",
    salaryMin: asNumber(input.salaryMin),
    salaryMax: asNumber(input.salaryMax),
    currency: input.currency?.trim() || "XOF",
    skillsJson: JSON.stringify(parseSkillList(input.skills)),
    languagesJson: JSON.stringify(parseSkillList(input.languages)),
    description: input.description.trim(),
    sourceUrl: input.sourceUrl?.trim() || null,
    source: input.source?.trim() || "manual",
    language: input.language?.trim() || "fr",
    postedAt: asDate(input.postedAt),
    fingerprint: fingerprintJob({ title, company, location, sourceUrl: input.sourceUrl }),
  };
}

export function jobsFromUnknown(payload: unknown): JobInput[] {
  if (Array.isArray(payload)) return payload as JobInput[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { jobs?: unknown }).jobs)) {
    return (payload as { jobs: JobInput[] }).jobs;
  }
  throw new Error("IMPORT_FORMAT_INVALID");
}

export function jobsFromCsv(text: string): JobInput[] {
  return parseCsv(text).map((row) => ({
    title: row.title || row.intitule || row.poste || "",
    company: row.company || row.entreprise || "",
    location: row.location || row.ville || row.lieu || "",
    country: row.country || row.pays || null,
    remoteType: row.remoteType || row.modalite || row.remote || null,
    contractType: row.contractType || row.contrat || null,
    seniority: row.seniority || row.niveau || null,
    salaryMin: asNumber(row.salaryMin || row.salaireMin),
    salaryMax: asNumber(row.salaryMax || row.salaireMax),
    currency: row.currency || row.devise || "XOF",
    skills: row.skills || row.competences || "",
    languages: row.languages || row.langues || "",
    description: row.description || row.descriptif || "",
    sourceUrl: row.sourceUrl || row.url || null,
    source: row.source || "csv",
    language: row.language || row.langue || "fr",
    postedAt: row.postedAt || row.date || null,
  }));
}
