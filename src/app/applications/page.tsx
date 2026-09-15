import Link from "next/link";
import { Suspense } from "react";
import { RadarJobList } from "@/components/radar-job-list";
import { AuthCallout, PageSkeleton } from "@/components/page-shell";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { requirePageUser } from "@/lib/page-guard";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  await requirePageUser("/applications");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Candidatures</h1>
        <p className="mt-2 text-muted">
          Suivi des candidatures ouvertes via l&apos;URL officielle de l&apos;offre. Pas de formulaire JobRadar
          inventé.
        </p>
      </div>
      <AuthCallout next="/applications" clerkEnabled={isClerkConfigured()} />
      <Suspense fallback={<PageSkeleton title="Chargement des candidatures…" />}>
        <ApplicationsList />
      </Suspense>
      <Link href="/saved-jobs" className="text-sm text-accent">
        Voir les offres sur le radar
      </Link>
    </div>
  );
}

async function ApplicationsList() {
  const user = await getSessionUser();
  const applications =
    user && isPersistedUser(user)
      ? await withTimeout(
          withDb(
            "applicationsPage",
            () =>
              prisma.application.findMany({
                where: { userId: user.id },
                include: { job: true },
                orderBy: { createdAt: "desc" },
                take: 50,
              }),
            [],
          ),
          2500,
          [],
        )
      : [];

  return (
    <section className="panel p-6">
      <RadarJobList
        items={applications.map((item) => ({
          id: item.id,
          jobId: item.jobId,
          title: item.job.title,
          company: item.job.company,
          status: item.status,
          date: item.createdAt.toISOString().slice(0, 10),
        }))}
        empty="Aucune candidature. Sur une offre, Postuler maintenant ouvre le site officiel et enregistre le statut Postulé."
      />
    </section>
  );
}
