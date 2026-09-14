import { JobCard } from "@/components/job-card";
import { getSessionUser } from "@/lib/auth";
import { rankJobsForUser } from "@/server/rank";
import { parseIntentHeuristic } from "@/lib/intent";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await getSessionUser();
  const ranked = await rankJobsForUser({
    intent: parseIntentHeuristic("opportunités pertinentes"),
    userId: user?.id,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Offres actives</h1>
        <p className="mt-2 text-[#b9d4d4]">Classées par score de matching contre votre profil (ou la requête ouverte).</p>
      </div>
      <div className="grid gap-4">
        {ranked.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
