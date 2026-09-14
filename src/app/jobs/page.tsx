import { JobCard } from "@/components/job-card";
import { getSessionUser } from "@/lib/auth";
import { rankJobsForUser } from "@/server/rank";
import { parseIntentHeuristic } from "@/lib/intent";
import { listStockJobs } from "@/server/jobs-store";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await getSessionUser();
  const stock = await listStockJobs();
  const ranked = stock.length
    ? await rankJobsForUser({
        intent: parseIntentHeuristic("opportunités pertinentes"),
        userId: user?.id,
        limit: 50,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Offres actives</h1>
        <p className="mt-2 text-muted">
          Uniquement les offres que vous (ou l&apos;admin) avez ajoutées. Les pistes IA apparaissent dans la recherche,
          pas ici.
        </p>
      </div>
      {ranked.length === 0 ? (
        <section className="panel space-y-3 p-6">
          <p className="font-semibold">0 offre</p>
          <p className="text-sm text-muted">
            Importez des annonces dans Admin, ou lancez une recherche : si rien ne match, l&apos;IA propose des pistes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/search" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
              Rechercher
            </Link>
            <Link href="/admin" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
              Admin
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-4">
          {ranked.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
