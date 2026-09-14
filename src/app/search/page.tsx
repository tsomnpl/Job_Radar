import { JobCard } from "@/components/job-card";
import { SearchBox } from "@/components/search-box";
import { Pill } from "@/components/brand";
import { getSessionUser } from "@/lib/auth";
import { persistSearch, rankJobsForUser } from "@/server/rank";
import { resolveIntent } from "@/server/search";
import Link from "next/link";

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
        <p className="text-muted">Décrivez le poste. S&apos;il n&apos;est pas dans le stock, l&apos;IA propose des pistes.</p>
        <SearchBox />
      </div>
    );
  }

  const user = await getSessionUser();
  const intent = await resolveIntent(query);
  const ranked = await rankJobsForUser({ intent, userId: user?.id, proposeIfWeak: true });
  await persistSearch({ user, intent, ranked });

  const stock = ranked.filter((job) => job.source !== "ai-proposal");
  const proposed = ranked.filter((job) => job.source === "ai-proposal");

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

      {stock.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Dans le stock</h2>
          <div className="grid gap-4">
            {stock.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      ) : (
        <section className="panel p-6">
          <h2 className="font-semibold">Rien dans le stock pour cette recherche</h2>
          <p className="mt-2 text-sm text-muted">
            Aucune offre importée ne match assez. L&apos;IA propose des pistes ci-dessous. Un admin peut aussi coller
            une annonce brute dans{" "}
            <Link href="/admin" className="text-accent">
              Admin
            </Link>
            .
          </p>
        </section>
      )}

      {proposed.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Pistes proposées par l&apos;IA</h2>
          <p className="text-sm text-muted">
            Ce ne sont pas des offres scrapées. Ce sont des pistes à sourcer, générées à partir de votre requête.
          </p>
          <div className="grid gap-4">
            {proposed.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
