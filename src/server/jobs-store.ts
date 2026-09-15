import { logDbError } from "@/lib/db";
import { isPublicBoardSource, isVerifiedOpportunity, toJobRecord } from "@/lib/jobs";
import { isExcludedFromSearch, isPubliclyListed } from "@/lib/job-lifecycle";
import { prisma } from "@/lib/prisma";
import type { JobRecord } from "@/lib/types";
import type { NormalizedJobInput } from "@/lib/import-jobs";

const memoryJobs = new Map<string, JobRecord>();

export function rememberJob(job: JobRecord): void {
  memoryJobs.set(job.id, job);
}

export type JobWriteInput = NormalizedJobInput & {
  id: string;
  active?: boolean;
  status?: string;
};

function toRecord(data: JobWriteInput): JobRecord {
  return toJobRecord({
    id: data.id,
    title: data.title,
    company: data.company,
    companyLogo: data.companyLogo,
    location: data.location,
    country: data.country,
    remoteType: data.remoteType,
    contractType: data.contractType,
    seniority: data.seniority,
    salaryMin: data.salaryMin,
    salaryMax: data.salaryMax,
    currency: data.currency,
    skillsJson: data.skillsJson,
    languagesJson: data.languagesJson,
    description: data.description,
    requirements: data.requirements,
    education: data.education,
    experience: data.experience,
    benefits: data.benefits,
    duration: data.duration,
    contactInfo: data.contactInfo,
    sourceUrl: data.sourceUrl,
    applicationUrl: data.applicationUrl,
    source: data.source,
    language: data.language,
    postedAt: data.postedAt,
    deadline: data.deadline,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status ?? (data.active ? "published" : "pending"),
    active: data.active ?? false,
  });
}

export async function upsertJobRecord(data: JobWriteInput): Promise<JobRecord | null> {
  const record = toRecord(data);
  rememberJob(record);
  try {
    const existing = await prisma.job.findUnique({ where: { fingerprint: data.fingerprint } });
    const keepPublished = existing?.status === "published";
    const keepUnpublished = existing?.status === "unpublished";
    const status = keepPublished
      ? "published"
      : keepUnpublished
        ? "unpublished"
        : (data.status ?? "pending");
    const active = status === "published";
    const { id, ...rest } = data;
    const payload = {
      title: rest.title,
      company: rest.company,
      companyLogo: existing?.companyLogo ?? rest.companyLogo,
      location: rest.location,
      country: rest.country,
      remoteType: rest.remoteType,
      contractType: rest.contractType,
      seniority: rest.seniority,
      salaryMin: rest.salaryMin,
      salaryMax: rest.salaryMax,
      currency: rest.currency,
      skillsJson: rest.skillsJson,
      languagesJson: rest.languagesJson,
      description: rest.description,
      requirements: existing?.requirements ?? rest.requirements,
      education: existing?.education ?? rest.education,
      experience: existing?.experience ?? rest.experience,
      benefits: existing?.benefits ?? rest.benefits,
      duration: existing?.duration ?? rest.duration,
      contactInfo: existing?.contactInfo ?? rest.contactInfo,
      sourceUrl: rest.sourceUrl,
      applicationUrl: existing?.applicationUrl ?? rest.applicationUrl,
      source: rest.source,
      language: rest.language,
      postedAt: rest.postedAt,
      deadline: existing?.deadline ?? rest.deadline,
      startDate: existing?.startDate ?? rest.startDate,
      endDate: existing?.endDate ?? rest.endDate,
      fingerprint: rest.fingerprint,
      status,
      active,
    };

    const job = existing
      ? await prisma.job.update({ where: { id: existing.id }, data: payload })
      : await prisma.job.create({ data: { id, ...payload } });
    const stored = toJobRecord(job);
    rememberJob(stored);
    return stored;
  } catch (error) {
    logDbError("upsertJobRecord", error);
    return record;
  }
}

export function isStockJob(job: Pick<JobRecord, "source">): boolean {
  return isVerifiedOpportunity(job);
}

export async function listPublishedJobs(): Promise<JobRecord[]> {
  try {
    const jobs = await prisma.job.findMany({
      where: { active: true, status: "published" },
      orderBy: { postedAt: "desc" },
    });
    return jobs.map(toJobRecord).filter((job) => isStockJob(job) && isPubliclyListed(job));
  } catch (error) {
    logDbError("listPublishedJobs", error);
    return [...memoryJobs.values()].filter((job) => job.active !== false && isStockJob(job) && isPubliclyListed(job));
  }
}

export async function listActiveJobs(): Promise<JobRecord[]> {
  return listPublishedJobs();
}

/** Offres publiées — pas les pistes IA ni le catalogue seed. */
export async function listStockJobs(): Promise<JobRecord[]> {
  return listPublishedJobs();
}

export async function listSearchableJobs(): Promise<JobRecord[]> {
  const published = await listPublishedJobs();
  const merged = new Map<string, JobRecord>();
  for (const job of published) merged.set(job.id, job);
  for (const job of memoryJobs.values()) {
    if (!isStockJob(job)) continue;
    if (isExcludedFromSearch(job)) continue;
    if (!merged.has(job.id)) merged.set(job.id, job);
  }
  return [...merged.values()];
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  const remembered = memoryJobs.get(id);
  if (remembered && isStockJob(remembered)) return remembered;
  if (remembered && !isStockJob(remembered)) return null;
  try {
    const job = await prisma.job.findUnique({ where: { id } });
    if (job) {
      const record = toJobRecord(job);
      if (!isStockJob(record)) return null;
      if (record.status === "published") return record;
      if (record.status === "pending" && isPublicBoardSource(record.source)) return record;
    }
  } catch (error) {
    logDbError("getJobById", error);
  }
  return null;
}

export async function getJobByIdAdmin(id: string): Promise<JobRecord | null> {
  try {
    const job = await prisma.job.findUnique({ where: { id } });
    return job ? toJobRecord(job) : memoryJobs.get(id) ?? null;
  } catch (error) {
    logDbError("getJobByIdAdmin", error);
    return memoryJobs.get(id) ?? null;
  }
}

export async function listAllJobs(): Promise<(JobRecord & { active: boolean })[]> {
  try {
    const jobs = await prisma.job.findMany({ orderBy: { postedAt: "desc" } });
    return jobs.map((job) => ({ ...toJobRecord(job), active: job.active }));
  } catch (error) {
    logDbError("listAllJobs", error);
    return [...memoryJobs.values()].map((job) => ({ ...job, active: job.active ?? false }));
  }
}

export async function jobExistsInDb(id: string): Promise<boolean> {
  try {
    const job = await prisma.job.findUnique({ where: { id }, select: { id: true } });
    return Boolean(job);
  } catch (error) {
    logDbError("jobExistsInDb", error);
    return false;
  }
}
