import Image from "next/image";
import Link from "next/link";
import { Pill, ScoreRing } from "@/components/brand";
import { SearchBox } from "@/components/search-box";
import { formatOpportunityType } from "@/lib/jobs";
import { isClerkConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { rankJobsForUser } from "@/server/rank";
import { parseIntentHeuristic } from "@/lib/intent";
import { listStockJobs } from "@/server/jobs-store";

const EXAMPLES = [
  "stage data remote Cotonou",
  "CDI product designer Accra hybride",
  "mission consulting ONU francophone",
  "stage ONG Lomé",
];

const CATEGORIES = [
  { label: "Emploi", q: "CDI emploi" },
  { label: "Stage", q: "stage" },
  { label: "Mission", q: "freelance mission" },
  { label: "Consulting", q: "consulting" },
  { label: "ONG", q: "ONG" },
  { label: "International", q: "ONU UNICEF PNUD" },
];

const SOURCES = ["Entreprises", "ONG", "ONU", "UNICEF", "PNUD", "Job boards", "RSS / APIs publiques"];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  const stock = await listStockJobs();
  const preview = stock.length
    ? await rankJobsForUser({
        intent: parseIntentHeuristic("opportunités"),
        userId: user?.id,
        limit: 3,
        minScore: 0,
      })
    : [];
  const clerkEnabled = isClerkConfigured();

  return (
    <div className="space-y-14 pb-16">
      <section className="panel radar-ring relative overflow-hidden px-6 py-14 md:px-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Opportunity intelligence</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Your next opportunity, before you miss it.
            </h1>
            <p className="text-lg text-muted">
              JobRadar n&apos;est pas un job board. C&apos;est un radar : décrivez ce que vous cherchez, on
              structure l&apos;intention, on match, on explique le score — emplois, stages, missions, ONG et
              organisations internationales.
            </p>
            <SearchBox />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <Link key={example} href={`/search?q=${encodeURIComponent(example)}`}>
                  <Pill>{example}</Pill>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {clerkEnabled ? (
                <Link href="/sign-up" className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold">
                  Créer un compte
                </Link>
              ) : (
                <Link href="/dashboard" className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold">
                  Ouvrir le radar
                </Link>
              )}
              <Link href="/jobs" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">
                Voir les opportunités
              </Link>
            </div>
          </div>
          <div className="mx-auto shrink-0">
            <Image
              src="/brand/jobradar-logo.png"
              alt="Logo JobRadar"
              width={280}
              height={280}
              className="rounded-3xl shadow-lg"
              priority
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Types d&apos;opportunités</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category.label}
              href={`/search?q=${encodeURIComponent(category.q)}`}
              className="rounded-full border border-line bg-elev px-4 py-2 text-sm hover:border-accent"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold">Opportunités sur le radar</h2>
          <Link href="/jobs" className="text-sm text-accent">
            Tout voir
          </Link>
        </div>
        {preview.length ? (
          <div className="grid gap-4">
            {preview.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="panel flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">{job.company}</p>
                  <h3 className="mt-1 font-semibold">{job.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {job.location} · {formatOpportunityType(job.contractType)}
                  </p>
                </div>
                <ScoreRing score={job.match.score} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-sm text-muted">
            No opportunities found. We couldn&apos;t find verified opportunities to preview. JobRadar will not invent
            offers. Import a real posting in Admin, or search with broader criteria.
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "1. Dites ce que vous cherchez",
            body: "Langage naturel, comme à un recruteur. RodiumAI structure l'intention (lieu, contrat, compétences).",
          },
          {
            title: "2. Matching explicable",
            body: "Chaque offre a un score, des raisons, et les critères manquants. Pas de boîte noire.",
          },
          {
            title: "3. Le radar veille",
            body: "Profil, CV, offres sauvegardées et candidatures dans un dashboard. L'admin alimente le flux.",
          },
        ].map((item) => (
          <article key={item.title} className="panel p-6">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm text-muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="panel p-6 md:p-8">
        <h2 className="text-2xl font-semibold">Sources du radar</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Entreprises, ONG, organisations internationales et job boards légalement accessibles. Pas de contournement
          anti-bot. LinkedIn n&apos;est pas la seule source.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {SOURCES.map((source) => (
            <Pill key={source}>{source}</Pill>
          ))}
        </div>
      </section>
    </div>
  );
}
