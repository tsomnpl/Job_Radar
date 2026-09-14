import { catalogJobRecords, catalogJobRows, findCatalogJob } from "@/lib/job-catalog";
import { logDbError } from "@/lib/db";
import { toJobRecord } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import type { JobRecord } from "@/lib/types";

let seedAttempted = false;

async function seedCatalogIfEmpty(): Promise<void> {
  if (seedAttempted) return;
  seedAttempted = true;
  const count = await prisma.job.count();
  if (count > 0) return;
  for (const data of catalogJobRows()) {
    const { id, ...update } = data;
    await prisma.job.upsert({
      where: { fingerprint: data.fingerprint },
      update,
      create: { id, ...update },
    });
  }
}

export async function listActiveJobs(): Promise<JobRecord[]> {
  try {
    await seedCatalogIfEmpty();
    const jobs = await prisma.job.findMany({
      where: { active: true },
      orderBy: { postedAt: "desc" },
    });
    if (jobs.length > 0) return jobs.map(toJobRecord);
  } catch (error) {
    logDbError("listActiveJobs", error);
  }
  return catalogJobRecords();
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  try {
    const job = await prisma.job.findUnique({ where: { id } });
    if (job) return toJobRecord(job);
  } catch (error) {
    logDbError("getJobById", error);
  }
  return findCatalogJob(id);
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
