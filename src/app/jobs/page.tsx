import { Suspense } from "react";
import type { Metadata } from "next";
import { JobCard } from "@/components/job-card";
import { EmptyResults } from "@/components/empty-results";
import { SearchBox } from "@/components/search-box";
import { PageSkeleton } from "@/components/page-shell";
import { listCatalogJobs } from "@/server/rank";
import { getRequestLang, t } from "@/i18n";
import { withTimeout } from "@/lib/timeout";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Live opportunities on JobRadar.",
};

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const lang = await getRequestLang();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t(lang, "jobs.title")}</h1>
        <p className="mt-2 text-muted">{t(lang, "jobs.lead")}</p>
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
  const lang = await getRequestLang();
  const ranked = await withTimeout(listCatalogJobs({ limit: 80 }), 2500, []);

  if (ranked.length === 0) {
    return <EmptyResults />;
  }

  return (
    <div className="grid gap-4">
      {ranked.map((job) => (
        <JobCard key={job.id} job={job} lang={lang} />
      ))}
    </div>
  );
}
