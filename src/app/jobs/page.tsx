import { Suspense } from "react";
import { JobCard } from "@/components/job-card";
import { EmptyResults } from "@/components/empty-results";
import { SearchBox } from "@/components/search-box";
import { PageSkeleton } from "@/components/page-shell";
import { rankJobsForUser } from "@/server/rank";
import { parseIntentHeuristic } from "@/lib/intent";
import { listStockJobs } from "@/server/jobs-store";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Offres actives</h1>
        <p className="mt-2 text-muted">
          Verified offers only. If nothing matches, JobRadar shows no results — it never invents a job.
        </p>
        <div className="mt-4">
          <SearchBox size="md" />
        </div>
      </div>
      <Suspense fallback={<PageSkeleton title="Chargement des offres vérifiées…" />}>
        <JobsStock />
      </Suspense>
    </div>
  );
}

async function JobsStock() {
  const stock = await withTimeout(listStockJobs(), 2500, []);
  const ranked = stock.length
    ? await withTimeout(
        rankJobsForUser({
          intent: parseIntentHeuristic("opportunités pertinentes"),
          limit: 50,
          minScore: 0,
        }),
        2500,
        [],
      )
    : [];

  if (ranked.length === 0) {
    return <EmptyResults title="No opportunities found" hint="There are no verified offers in the stock yet." />;
  }

  return (
    <div className="grid gap-4">
      {ranked.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
