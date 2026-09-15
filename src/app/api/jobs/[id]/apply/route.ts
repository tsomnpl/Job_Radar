import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { logDbError } from "@/lib/db";
import { officialApplicationUrl } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { jobExistsInDb } from "@/server/jobs-store";
import { notifyOfficialApplication } from "@/server/alerts";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    if (!isPersistedUser(user) || !(await jobExistsInDb(id))) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const body = (await request.json().catch(() => null)) as { status?: string } | null;
    const status = body?.status === "watching" ? "watching" : "applied";
    const saved = await prisma.savedJob.upsert({
      where: { userId_jobId: { userId: user.id, jobId: id } },
      update: { status },
      create: { userId: user.id, jobId: id, status },
    });
    if (status === "applied") {
      const job = await prisma.job.findUnique({ where: { id }, select: { title: true, company: true, sourceUrl: true } });
      const officialUrl = officialApplicationUrl(job?.sourceUrl);
      if (job && officialUrl) {
        await notifyOfficialApplication({
          email: user.email,
          title: job.title,
          company: job.company,
          officialUrl,
        });
      }
    }
    return NextResponse.json({ saved: true, status: saved.status });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    logDbError("api.apply", error);
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
