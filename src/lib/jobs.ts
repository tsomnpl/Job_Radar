import { asJsonArray } from "@/lib/normalize";
import type { JobRecord } from "@/lib/types";

export function toJobRecord(job: {
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
  sourceUrl: string | null;
  source: string;
  language: string;
  postedAt: Date;
  active?: boolean;
}): JobRecord {
  return {
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
    skills: asJsonArray(job.skillsJson),
    languages: asJsonArray(job.languagesJson),
    description: job.description,
    sourceUrl: job.sourceUrl,
    source: job.source,
    language: job.language,
    postedAt: job.postedAt,
    active: job.active ?? true,
  };
}

export function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (min == null && max == null) return null;
  const formatter = new Intl.NumberFormat("fr-FR");
  if (min != null && max != null) return `${formatter.format(min)} – ${formatter.format(max)} ${currency}`;
  if (min != null) return `à partir de ${formatter.format(min)} ${currency}`;
  return `jusqu'à ${formatter.format(max as number)} ${currency}`;
}

export function formatRemote(value: string): string {
  if (value === "remote") return "Remote";
  if (value === "onsite") return "Sur site";
  return "Hybride";
}

export function formatContract(value: string): string {
  const labels: Record<string, string> = {
    cdi: "CDI",
    cdd: "CDD",
    freelance: "Freelance",
    internship: "Stage",
    apprenticeship: "Alternance",
    other: "Autre",
  };
  return labels[value] ?? value;
}

export function formatSeniority(value: string): string {
  const labels: Record<string, string> = {
    intern: "Stage / intern",
    junior: "Junior",
    mid: "Confirmé",
    senior: "Senior",
    lead: "Lead",
  };
  return labels[value] ?? value;
}

export function formatOpportunityType(contractType: string): string {
  const labels: Record<string, string> = {
    cdi: "Emploi",
    cdd: "Emploi",
    freelance: "Mission / consulting",
    internship: "Stage",
    apprenticeship: "Alternance",
    other: "Opportunité",
  };
  return labels[contractType] ?? "Opportunité";
}

export function formatDuration(contractType: string): string {
  const labels: Record<string, string> = {
    cdi: "Durée indéterminée",
    cdd: "Durée déterminée",
    freelance: "Mission",
    internship: "3–6 mois (typique)",
    apprenticeship: "12 mois (typique)",
    other: "Selon l'offre",
  };
  return labels[contractType] ?? "Selon l'offre";
}
