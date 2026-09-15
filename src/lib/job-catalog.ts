import catalogJson from "@/lib/job-catalog.json";
import { fingerprintJob } from "@/lib/normalize";
import type { JobRecord } from "@/lib/types";

export type CatalogJob = {
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
  skills: string[];
  languages: string[];
  postedDaysAgo: number;
  description: string;
};

export const CATALOG_JOBS = catalogJson as CatalogJob[];

export function catalogFingerprint(job: Pick<CatalogJob, "title" | "company" | "location">): string {
  return fingerprintJob({ title: job.title, company: job.company, location: job.location });
}

export function catalogJobId(fingerprint: string): string {
  const slug = fingerprint
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
  return `cat_${slug}`;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export type CatalogJobRow = {
  id: string;
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
  sourceUrl: null;
  source: "seed";
  language: string;
  postedAt: Date;
  fingerprint: string;
  active: true;
};

export function catalogJobRow(job: CatalogJob): CatalogJobRow {
  const fingerprint = catalogFingerprint(job);
  return {
    id: catalogJobId(fingerprint),
    title: job.title,
    company: job.company,
    location: job.location,
    country: job.country,
    remoteType: job.remoteType,
    contractType: job.contractType,
    seniority: job.seniority,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    skillsJson: JSON.stringify(job.skills),
    languagesJson: JSON.stringify(job.languages),
    description: job.description,
    sourceUrl: null,
    source: "seed",
    language: job.languages[0] ?? "fr",
    postedAt: daysAgo(job.postedDaysAgo),
    fingerprint,
    active: true,
  };
}

export function catalogJobRows(): CatalogJobRow[] {
  return CATALOG_JOBS.map(catalogJobRow);
}

export function catalogJobRecords(): JobRecord[] {
  return catalogJobRows().map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    country: job.country,
    remoteType: job.remoteType,
    contractType: job.contractType,
    seniority: job.seniority,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    skills: JSON.parse(job.skillsJson) as string[],
    languages: JSON.parse(job.languagesJson) as string[],
    description: job.description,
    sourceUrl: job.sourceUrl,
    source: job.source,
    language: job.language,
    postedAt: job.postedAt,
    active: true,
  }));
}

export function findCatalogJob(id: string): JobRecord | null {
  return catalogJobRecords().find((job) => job.id === id) ?? null;
}
