import { logDbError } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { jobExistsInDb } from "@/server/jobs-store";

export async function recordJobView(userId: string, jobId: string): Promise<void> {
  if (!userId || userId.startsWith("ephemeral_")) return;
  if (!(await jobExistsInDb(jobId))) return;
  try {
    await prisma.jobView.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: { seenAt: new Date() },
      create: { userId, jobId },
    });
  } catch (error) {
    logDbError("recordJobView", error);
  }
}

export async function listSeenJobIds(userId: string): Promise<Set<string>> {
  if (!userId || userId.startsWith("ephemeral_")) return new Set();
  try {
    const rows = await prisma.jobView.findMany({
      where: { userId },
      select: { jobId: true },
    });
    return new Set(rows.map((row) => row.jobId));
  } catch (error) {
    logDbError("listSeenJobIds", error);
    return new Set();
  }
}
