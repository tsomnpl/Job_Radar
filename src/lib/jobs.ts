import { asJsonArray } from "@/lib/normalize";
import { formatClosesIn, formatDeadline, jobLifecycle, LIFECYCLE_LABELS } from "@/lib/job-lifecycle";
import type { JobRecord } from "@/lib/types";

export function toJobRecord(job: {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
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
  requirements?: string | null;
  education?: string | null;
  experience?: string | null;
  benefits?: string | null;
  duration?: string | null;
  contactInfo?: string | null;
  sourceUrl: string | null;
  applicationUrl?: string | null;
  source: string;
  language: string;
  postedAt: Date;
  deadline?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: string | null;
  active?: boolean;
  importedAt?: Date | null;
}): JobRecord {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo ?? null,
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
    requirements: job.requirements ?? null,
    education: job.education ?? null,
    experience: job.experience ?? null,
    benefits: job.benefits ?? null,
    duration: job.duration ?? null,
    contactInfo: job.contactInfo ?? null,
    sourceUrl: job.sourceUrl,
    applicationUrl: job.applicationUrl ?? null,
    source: job.source,
    language: job.language,
    postedAt: job.postedAt,
    deadline: job.deadline ?? null,
    startDate: job.startDate ?? null,
    endDate: job.endDate ?? null,
    status: job.status ?? (job.active === false ? "unpublished" : "published"),
    active: job.active ?? true,
    importedAt: job.importedAt ?? null,
  };
}

export const NOT_SPECIFIED = "Not specified";

export function displayField(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "unspecified") return NOT_SPECIFIED;
  return trimmed;
}

/** Real http(s) application/source URL only. Never ai:// or invented schemes. */
export function officialApplicationUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function officialLogoUrl(url: string | null | undefined): string | null {
  return officialApplicationUrl(url);
}

export function jobApplicationUrl(job: {
  applicationUrl?: string | null;
  sourceUrl?: string | null;
}): string | null {
  return officialApplicationUrl(job.applicationUrl) ?? officialApplicationUrl(job.sourceUrl);
}

export function isVerifiedOpportunity(job: { source: string }): boolean {
  return job.source !== "ai-proposal" && !job.source.startsWith("ai/") && job.source !== "seed";
}

export function isPublicBoardSource(source: string): boolean {
  return ["jobicy", "remotive", "remoteok", "themuse", "himalayas"].includes(source);
}

/** Internship searches must match the title, not a noisy board tag. */
export function hasInternTitle(title: string): boolean {
  return /(?:^|[^a-z])(?:interns?|internship|stage|stagiaire|trainee|apprentice)(?:[^a-z]|$)/.test(
    title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
  );
}

export function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (min == null && max == null) return null;
  const formatter = new Intl.NumberFormat("fr-FR");
  const unit = currency?.trim() || "";
  if (min != null && max != null) return `${formatter.format(min)} – ${formatter.format(max)}${unit ? ` ${unit}` : ""}`;
  if (min != null) return `à partir de ${formatter.format(min)}${unit ? ` ${unit}` : ""}`;
  return `jusqu'à ${formatter.format(max as number)}${unit ? ` ${unit}` : ""}`;
}

export function formatRemote(value: string): string {
  if (value === "remote") return "Remote";
  if (value === "onsite") return "On-site";
  if (value === "hybrid") return "Hybrid";
  return NOT_SPECIFIED;
}

export function formatContract(value: string): string {
  const labels: Record<string, string> = {
    internship: "Internship",
    employee: "Job / Employee",
    cdi: "Job / Employee",
    cdd: "Job / Employee",
    consultant: "Consultant",
    freelance: "Freelance",
    mission: "Mission",
    apprenticeship: "Apprenticeship",
    other: "Other",
  };
  return labels[value] ?? NOT_SPECIFIED;
}

export function formatSeniority(value: string): string {
  const labels: Record<string, string> = {
    intern: "Intern",
    junior: "Junior",
    mid: "Mid",
    senior: "Senior",
    lead: "Lead",
  };
  return labels[value] ?? NOT_SPECIFIED;
}

export function formatOpportunityType(contractType: string): string {
  return formatContract(contractType);
}

export function formatDuration(value?: string | null): string {
  return displayField(value);
}

export function formatJobDeadline(deadline?: Date | string | null): string {
  return formatDeadline(deadline);
}

export function formatLifecycle(deadline?: Date | string | null): string {
  return LIFECYCLE_LABELS[jobLifecycle(deadline)];
}

export function formatClosesLabel(deadline?: Date | string | null): string {
  return formatClosesIn(deadline);
}

export function applicationStatusLabel(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (normalized === "APPLIED" || status === "applied") return "Postulé";
  if (status === "watching") return "Sur le radar";
  if (status === "interviewing") return "Entretien";
  if (status === "offer") return "Offre";
  return status;
}
