import { JobCard } from "@/components/job-card";
import { SearchBox } from "@/components/search-box";
import { SearchFiltersForm } from "@/components/search-filters";
import { IntentCriteria } from "@/components/intent-criteria";
import { EmptyResults } from "@/components/empty-results";
import { parseIntentHeuristic } from "@/lib/intent";
import { applySearchFilters, readSearchFilters } from "@/lib/search-filters";
import { collectPublicOpportunitiesForIntent, PUBLIC_BOARD_LABELS } from "@/server/collect";
import { persistSearch, rankJobsForUser } from "@/server/rank";
import { resolveIntent } from "@/server/search";
import { withTimeout } from "@/lib/timeout";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-shell";
import type { SearchFilters } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search real JobRadar opportunities in natural language.",
};

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const filters = readSearchFilters(params);
  const hasFilters = Object.values(filters).some(Boolean);
  if (!query && !hasFilters) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Recherche d&apos;opportunités</h1>
        <p className="text-muted">
          Décrivez une vraie piste. JobRadar ne fabrique pas d&apos;offre s&apos;il n&apos;y a pas de match.
        </p>
        <SearchBox />
        <SearchFiltersForm query="" filters={filters} />
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
        <SearchFiltersForm query={query} filters={filters} />
      </div>
      <Suspense fallback={<PageSkeleton title="Searching opportunities…" />}>
        <SearchResults query={query || "opportunités"} filters={filters} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ query, filters }: { query: string; filters: SearchFilters }) {
  const heuristic = parseIntentHeuristic(query);
  const [intent] = await Promise.all([
    withTimeout(resolveIntent(query), 8000, heuristic),
    collectPublicOpportunitiesForIntent(heuristic),
  ]);
  const ranked = applySearchFilters(await rankJobsForUser({ intent }), filters);
  await persistSearch({ intent, ranked });

  return (
    <>
      <IntentCriteria intent={intent} />

      {ranked.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Verified opportunities</h2>
          <div className="grid gap-4">
            {ranked.map((job) => (
              <JobCard key={job.id} job={job} query={query} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyResults sources={PUBLIC_BOARD_LABELS} />
      )}
    </>
  );
}
