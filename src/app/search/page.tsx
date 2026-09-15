import { JobCard } from "@/components/job-card";
import { SearchBox } from "@/components/search-box";
import { EmptyResults } from "@/components/empty-results";
import { Pill } from "@/components/brand";
import { getSessionUser } from "@/lib/auth";
import { persistSearch, rankJobsForUser } from "@/server/rank";
import { resolveIntent } from "@/server/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  if (!query) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Search Opportunities</h1>
        <p className="text-muted">Describe a real opportunity. JobRadar only returns verified offers — never invented ones.</p>
        <SearchBox />
      </div>
    );
  }

  const user = await getSessionUser();
  const intent = await resolveIntent(query);
  const ranked = await rankJobsForUser({ intent, userId: user?.id });
  await persistSearch({ user, intent, ranked });

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Radar de recherche</h1>
        <SearchBox initialQuery={query} size="md" />
      </div>
      <section className="panel p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Intention extraite ({intent.source})</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {intent.location ? <Pill>{intent.location}</Pill> : null}
          {intent.remoteType ? <Pill>{intent.remoteType}</Pill> : null}
          {intent.seniority ? <Pill>{intent.seniority}</Pill> : null}
          {intent.contractType ? <Pill>{intent.contractType}</Pill> : null}
          {intent.skills.map((skill) => (
            <Pill key={skill}>{skill}</Pill>
          ))}
        </div>
      </section>

      {ranked.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Verified opportunities</h2>
          <div className="grid gap-4">
            {ranked.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyResults />
      )}
    </div>
  );
}
