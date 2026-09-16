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

export default async function SavedJobsPage() {
  await requirePageUser("/saved-jobs");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Sur le radar</h1>
        <p className="mt-2 text-muted">Offres que vous avez gardées. JobRadar n&apos;invente aucune fiche.</p>
      </div>
      <AuthCallout next="/saved-jobs" clerkEnabled={isClerkConfigured()} />
      <Suspense fallback={<PageSkeleton title="Chargement des offres gardées…" />}>
        <SavedJobsList />
      </Suspense>
      <Link href="/search" className="text-sm text-accent">
        Lancer une recherche
      </Link>
    </div>
  );
}

async function SavedJobsList() {
  const user = await getSessionUser();
  const saved =
    user && isPersistedUser(user)
      ? await withTimeout(
          withDb(
            "savedJobsPage",
            () =>
              prisma.savedJob.findMany({
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
        items={saved.map((item) => ({
          id: item.id,
          jobId: item.jobId,
          title: item.job.title,
          company: item.job.company,
          status: item.status,
        }))}
        empty="Aucune offre sauvegardée. Ouvrez une fiche vérifiée et cliquez sur Garder sur le radar."
      />
    </section>
  );
}
