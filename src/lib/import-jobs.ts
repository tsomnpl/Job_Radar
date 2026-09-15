import { fingerprintJob, parseContractType, parseRemoteType, parseSeniority, parseSkillList } from "./normalize";
import { officialApplicationUrl, officialLogoUrl } from "./jobs";
import { parseOptionalDate } from "./job-lifecycle";
import type { JobInput } from "./types";

export type NormalizedJobInput = {
  title: string;
  company: string;
  companyLogo: string | null;
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
  requirements: string | null;
  education: string | null;
  experience: string | null;
  benefits: string | null;
  duration: string | null;
  contactInfo: string | null;
  sourceUrl: string | null;
  applicationUrl: string | null;
  source: string;
  language: string;
  postedAt: Date;
  deadline: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  fingerprint: string;
};

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function asDate(value: unknown): Date {
  const parsed = parseOptionalDate(value as string | Date | null);
  return parsed ?? new Date();
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.toLowerCase() !== "not specified" ? trimmed : null;
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

  const sourceUrl = officialApplicationUrl(input.sourceUrl);
  const applicationUrl = officialApplicationUrl(input.applicationUrl) ?? sourceUrl;
  const salaryMin = asNumber(input.salaryMin);
  const salaryMax = asNumber(input.salaryMax);
  const currency = salaryMin == null && salaryMax == null ? (input.currency?.trim() || "") : (input.currency?.trim() || "");

  return {
    title,
    company,
    companyLogo: officialLogoUrl(input.companyLogo),
    location,
    country: input.country?.trim() || null,
    remoteType: parseRemoteType(input.remoteType) ?? "unspecified",
    contractType: parseContractType(input.contractType) ?? "other",
    seniority: parseSeniority(input.seniority) ?? "unspecified",
    salaryMin,
    salaryMax,
    currency,
    skillsJson: JSON.stringify(parseSkillList(input.skills)),
    languagesJson: JSON.stringify(parseSkillList(input.languages)),
    description: input.description.trim(),
    requirements: optionalText(input.requirements),
    education: optionalText(input.education),
    experience: optionalText(input.experience) ?? (parseSeniority(input.seniority) && parseSeniority(input.seniority) !== "unspecified" ? parseSeniority(input.seniority) : null),
    benefits: optionalText(input.benefits),
    duration: optionalText(input.duration),
    contactInfo: optionalText(input.contactInfo),
    sourceUrl,
    applicationUrl,
    source: input.source?.trim() || "manual",
    language: input.language?.trim() || "",
    postedAt: asDate(input.postedAt),
    deadline: parseOptionalDate(input.deadline),
    startDate: parseOptionalDate(input.startDate),
    endDate: parseOptionalDate(input.endDate),
    fingerprint: fingerprintJob({ title, company, location, sourceUrl: sourceUrl ?? input.sourceUrl }),
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
    companyLogo: row.companyLogo || row.logo || null,
    location: row.location || row.ville || row.lieu || "",
    country: row.country || row.pays || null,
    remoteType: row.remoteType || row.modalite || row.remote || null,
    contractType: row.contractType || row.contrat || row.opportunityType || null,
    seniority: row.seniority || row.niveau || null,
    salaryMin: asNumber(row.salaryMin || row.salaireMin),
    salaryMax: asNumber(row.salaryMax || row.salaireMax),
    currency: row.currency || row.devise || "",
    skills: row.skills || row.competences || "",
    languages: row.languages || row.langues || "",
    description: row.description || row.descriptif || "",
    requirements: row.requirements || row.requis || null,
    education: row.education || null,
    experience: row.experience || null,
    benefits: row.benefits || row.avantages || null,
    duration: row.duration || row.duree || null,
    contactInfo: row.contactInfo || row.contact || null,
    sourceUrl: row.sourceUrl || row.url || null,
    applicationUrl: row.applicationUrl || row.applyUrl || null,
    source: row.source || "csv",
    language: row.language || row.langue || "",
    postedAt: row.postedAt || row.date || row.publishedAt || null,
    deadline: row.deadline || row.dateLimite || null,
    startDate: row.startDate || null,
    endDate: row.endDate || null,
  }));
}
