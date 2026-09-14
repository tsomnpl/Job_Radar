import { JobCard } from "@/components/job-card";
import { SearchBox } from "@/components/search-box";
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
        <h1 className="text-3xl font-semibold">Recherche en langage naturel</h1>
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
        <p className="text-xs uppercase tracking-[0.18em] text-[#2ee6d6]">Intention extraite ({intent.source})</p>
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
      <div className="grid gap-4">
        {ranked.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
