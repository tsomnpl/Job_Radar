import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { logDbError } from "@/lib/db";
import { jobApplicationUrl } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { jobExistsInDb } from "@/server/jobs-store";
import { notifyOfficialApplication } from "@/server/alerts";
import { notifyUser } from "@/server/notifications";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    if (!isPersistedUser(user) || !(await jobExistsInDb(id))) {
      return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
    }
    const job = await prisma.job.findUnique({
      where: { id },
      select: { title: true, company: true, sourceUrl: true, applicationUrl: true },
    });
    const officialUrl = jobApplicationUrl(job ?? {});
    if (!job || !officialUrl) {
      return NextResponse.json({ error: "APPLICATION_URL_MISSING" }, { status: 400 });
    }

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

    await notifyUser({
      userId: user.id,
      title: "Postulé",
      body: `Vous avez ouvert le lien officiel pour ${job.title} chez ${job.company}. JobRadar n'a pas envoyé la candidature à votre place.`,
      href: `/jobs/${id}`,
    });
    await notifyOfficialApplication({
      email: user.email,
      title: job.title,
      company: job.company,
      officialUrl,
    });

    return NextResponse.json({
      applied: true,
      status: application.status,
      label: "Postulé",
      officialUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    logDbError("api.apply", error);
    return NextResponse.json({ error: "DATABASE_UNAVAILABLE" }, { status: 503 });
  }
}
