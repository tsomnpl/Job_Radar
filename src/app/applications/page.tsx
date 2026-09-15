import Link from "next/link";
import { redirect } from "next/navigation";
import { RadarJobList } from "@/components/radar-job-list";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const user = await getSessionUser();
  if (!user && isClerkConfigured()) redirect("/sign-in");

  const applications =
    user && isPersistedUser(user)
      ? await withDb(
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
        )
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Candidatures</h1>
        <p className="mt-2 text-muted">
          Suivi des candidatures ouvertes via l&apos;URL officielle de l&apos;offre. Pas de formulaire JobRadar inventé.
        </p>
      </div>
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
      <Link href="/saved-jobs" className="text-sm text-accent">
        Voir les offres sur le radar
      </Link>
    </div>
  );
}
