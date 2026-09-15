import { JobCard } from "@/components/job-card";
import { EmptyResults } from "@/components/empty-results";
import { getSessionUser } from "@/lib/auth";
import { rankJobsForUser } from "@/server/rank";
import { parseIntentHeuristic } from "@/lib/intent";
import { listStockJobs } from "@/server/jobs-store";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await getSessionUser();
  const stock = await listStockJobs();
  const ranked = stock.length
    ? await rankJobsForUser({
        intent: parseIntentHeuristic("opportunités pertinentes"),
        userId: user?.id,
        limit: 50,
        minScore: 0,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Offres actives</h1>
        <p className="mt-2 text-muted">
          Verified offers only. If nothing matches, JobRadar shows no results — it never invents a job.
        </p>
      </div>
      {ranked.length === 0 ? (
        <EmptyResults title="No opportunities found" hint="There are no verified offers in the stock yet." />
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
