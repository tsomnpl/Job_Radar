import { JobCard } from "@/components/job-card";
import { SearchBox } from "@/components/search-box";
import { EmptyResults } from "@/components/empty-results";
import { Pill } from "@/components/brand";
import { parseIntentHeuristic } from "@/lib/intent";
import { collectPublicOpportunitiesForIntent, PUBLIC_BOARD_LABELS } from "@/server/collect";
import { persistSearch, rankJobsForUser } from "@/server/rank";
import { resolveIntent } from "@/server/search";
import { withTimeout } from "@/lib/timeout";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-shell";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
        <h1 className="text-3xl font-semibold">Recherche d&apos;opportunités</h1>
        <p className="text-muted">
          Décrivez une vraie piste. JobRadar ne fabrique pas d&apos;offre s&apos;il n&apos;y a pas de match.
        </p>
        <SearchBox />
        <section className="panel p-6 text-sm text-muted">
          Exemples : <strong>internship cybersecurity remote</strong> · <strong>stage data remote Cotonou</strong>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Radar de recherche</h1>
        <SearchBox initialQuery={query} size="md" />
      </div>
      <Suspense fallback={<PageSkeleton title="Recherche en cours…" />}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ query }: { query: string }) {
  const heuristic = parseIntentHeuristic(query);
  const [intent] = await Promise.all([
    withTimeout(resolveIntent(query), 8000, heuristic),
    collectPublicOpportunitiesForIntent(heuristic),
  ]);
  const ranked = await rankJobsForUser({ intent });
  await persistSearch({ intent, ranked });

  return (
    <>
      <section className="panel p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Intention extraite ({intent.source})</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {intent.location ? <Pill>{intent.location}</Pill> : null}
          {intent.country ? <Pill>{intent.country}</Pill> : null}
          {intent.remoteType ? <Pill>{intent.remoteType}</Pill> : null}
          {intent.seniority ? <Pill>{intent.seniority}</Pill> : null}
          {intent.contractType ? <Pill>{intent.contractType}</Pill> : null}
          {intent.skills.map((skill) => (
            <Pill key={skill}>{skill}</Pill>
          ))}
          {!intent.location && !intent.skills.length && !intent.contractType ? (
            <Pill>{query}</Pill>
          ) : null}
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
        <EmptyResults sources={PUBLIC_BOARD_LABELS} />
      )}
    </>
  );
}
