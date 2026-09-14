import { logDbError } from "@/lib/db";
import { toJobRecord } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import type { JobRecord } from "@/lib/types";
import type { NormalizedJobInput } from "@/lib/import-jobs";

const memoryJobs = new Map<string, JobRecord>();

export function rememberJob(job: JobRecord): void {
  memoryJobs.set(job.id, job);
}

export async function upsertJobRecord(
  data: NormalizedJobInput & { id: string; active?: boolean },
): Promise<JobRecord | null> {
  const record = toJobRecord({
    id: data.id,
    title: data.title,
    company: data.company,
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
    sourceUrl: data.sourceUrl,
    source: data.source,
    language: data.language,
    postedAt: data.postedAt,
    active: data.active ?? true,
  });
  rememberJob(record);
  try {
    const { id, active = true, ...rest } = data;
    const job = await prisma.job.upsert({
      where: { fingerprint: data.fingerprint },
      update: { ...rest, active },
      create: { id, ...rest, active },
    });
    const stored = toJobRecord(job);
    rememberJob(stored);
    return stored;
  } catch (error) {
    logDbError("upsertJobRecord", error);
    return record;
  }
}

export function isStockJob(job: Pick<JobRecord, "source">): boolean {
  return job.source !== "ai-proposal";
}

export async function listActiveJobs(): Promise<JobRecord[]> {
  try {
    const jobs = await prisma.job.findMany({
      where: { active: true },
      orderBy: { postedAt: "desc" },
    });
    return jobs.map(toJobRecord);
  } catch (error) {
    logDbError("listActiveJobs", error);
    return [...memoryJobs.values()].filter((job) => job.active !== false);
  }
}

/** Offres importées / saisies — pas les pistes IA d'une recherche. */
export async function listStockJobs(): Promise<JobRecord[]> {
  return (await listActiveJobs()).filter(isStockJob);
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  const remembered = memoryJobs.get(id);
  if (remembered) return remembered;
  try {
    const job = await prisma.job.findUnique({ where: { id } });
    if (job) return toJobRecord(job);
  } catch (error) {
    logDbError("getJobById", error);
  }
  return null;
}

export async function listAllJobs(): Promise<(JobRecord & { active: boolean })[]> {
  try {
    const jobs = await prisma.job.findMany({ orderBy: { postedAt: "desc" } });
    return jobs.map((job) => ({ ...toJobRecord(job), active: job.active }));
  } catch (error) {
    logDbError("listAllJobs", error);
    return [...memoryJobs.values()].map((job) => ({ ...job, active: job.active ?? true }));
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
