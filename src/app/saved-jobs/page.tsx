import Link from "next/link";
import { redirect } from "next/navigation";
import { RadarJobList } from "@/components/radar-job-list";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SavedJobsPage() {
  const user = await getSessionUser();
  if (!user && isClerkConfigured()) redirect("/sign-in");

  const saved =
    user && isPersistedUser(user)
      ? await withDb(
          "savedJobsPage",
          () =>
            prisma.savedJob.findMany({
              where: { userId: user.id },
              include: { job: true },
              orderBy: { createdAt: "desc" },
              take: 50,
            }),
          [],
        )
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Sur le radar</h1>
        <p className="mt-2 text-muted">Offres que vous avez gardées. JobRadar n&apos;invente aucune fiche.</p>
      </div>
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
      <Link href="/search" className="text-sm text-accent">
        Lancer une recherche
      </Link>
    </div>
  );
}
