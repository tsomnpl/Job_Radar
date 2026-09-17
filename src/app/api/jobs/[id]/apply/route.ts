import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { logDbError } from "@/lib/db";
import { jobApplicationUrl } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { getJobById, jobExistsInDb, persistRememberedJob } from "@/server/jobs-store";
import { notifyOfficialApplication } from "@/server/alerts";
import { notifyUser } from "@/server/notifications";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const job = await getJobById(id);
    const officialUrl = jobApplicationUrl(job ?? {});
    if (!job || !officialUrl) {
      return NextResponse.json({ error: "APPLICATION_URL_MISSING" }, { status: 400 });
    }

    let tracked = false;
    if (isPersistedUser(user)) {
      let inDb = await jobExistsInDb(id);
      if (!inDb) {
        const stored = await persistRememberedJob(job);
        inDb = Boolean(stored && (await jobExistsInDb(stored.id)));
      }
      if (inDb) {
        const [application] = await Promise.all([
          prisma.application.upsert({
            where: { userId_jobId: { userId: user.id, jobId: id } },
            update: { status: "APPLIED" },
            create: { userId: user.id, jobId: id, status: "APPLIED" },
          }),
          prisma.savedJob.upsert({
            where: { userId_jobId: { userId: user.id, jobId: id } },
            update: { status: "applied" },
            create: { userId: user.id, jobId: id, status: "applied" },
          }),
        ]);
        tracked = application.status === "APPLIED";
        await notifyUser({
          userId: user.id,
          type: "APPLICATION",
          title: "Postulé",
          body: `Vous avez ouvert le lien officiel pour ${job.title} chez ${job.company}. JobRadar n'a pas envoyé la candidature à votre place.`,
          href: `/jobs/${id}`,
        });
        await notifyOfficialApplication({
          userId: user.id,
          email: user.email,
          title: job.title,
          company: job.company,
          officialUrl,
        });
      }
    }

    return NextResponse.json({
      applied: tracked,
      tracked,
      status: tracked ? "APPLIED" : "UNTRACKED",
      label: tracked ? "Postulé" : "Lien officiel",
      officialUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    logDbError("api.apply", error);
    return NextResponse.json({ error: "APPLY_FAILED" }, { status: 500 });
  }
}
