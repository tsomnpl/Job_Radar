import Link from "next/link";
import { Suspense } from "react";
import { RadarJobList } from "@/components/radar-job-list";
import { AuthCallout, PageSkeleton } from "@/components/page-shell";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default function ApplicationsPage() {
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
              prisma.savedJob.findMany({
                where: {
                  userId: user.id,
                  status: { in: ["applied", "interviewing", "offer"] },
                },
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
        }))}
        empty="Aucune candidature. Sur une offre vérifiée, Apply ouvre le site officiel et enregistre le suivi."
      />
    </section>
  );
}
