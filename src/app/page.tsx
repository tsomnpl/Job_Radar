import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Pill, ScoreRing } from "@/components/brand";
import { SearchBox } from "@/components/search-box";
import { OpportunityRadar } from "@/components/opportunity-radar";
import { OpportunityTimeline } from "@/components/opportunity-timeline";
import { LandingRadar } from "@/components/radar-dish";
import { formatOpportunityType } from "@/lib/jobs";
import { isClerkConfigured } from "@/lib/env";
import { listCatalogJobs } from "@/server/rank";
import { withTimeout } from "@/lib/timeout";

const EXAMPLES = [
  "stage data remote Cotonou",
  "CDI product designer Accra hybride",
  "mission consulting ONU francophone",
  "stage ONG Lomé",
  "internship cybersecurity remote",
];

const CATEGORIES = [
  { label: "Emploi", q: "CDI emploi" },
  { label: "Stage", q: "stage" },
  { label: "Mission", q: "freelance mission" },
  { label: "Consulting", q: "consulting" },
  { label: "ONG", q: "ONG" },
  { label: "International", q: "ONU UNICEF PNUD" },
];

const SOURCES = ["Jobicy", "Remote OK", "Remotive", "The Muse", "Himalayas", "ONG / ONU (import admin)"];

const FACTORS = [
  { label: "Compétences", weight: "35%" },
  { label: "Intention de recherche", weight: "20%" },
  { label: "Localisation", weight: "15%" },
  { label: "Séniorité", weight: "10%" },
  { label: "Remote / présentiel", weight: "10%" },
  { label: "Langues", weight: "5%" },
  { label: "Fraîcheur de l'offre", weight: "5%" },
];

const STEPS = [
  {
    n: "01",
    title: "Décrivez ce que vous cherchez",
    body: "Une phrase suffit : stage cybersécurité remote, CDI product Accra, mission ONU. JobRadar structure l'intention — lieu, contrat, compétences.",
  },
  {
    n: "02",
    title: "Le radar collecte des offres réelles",
    body: "Job boards publics et imports admin, avec URL officielle. Si un champ manque, il affiche Not specified. Jamais une entreprise inventée.",
  },
  {
    n: "03",
    title: "Chaque match s'explique",
    body: "Score déterministe, facteurs, écarts, et un label prudent (Strong match, Potential match, Requirements unclear, Likely not eligible).",
  },
  {
    n: "04",
    title: "Vous postulez sur le site officiel",
    body: "Apply ouvre uniquement un lien http(s) employeur. JobRadar enregistre Marked as applied — il ne candidate pas à votre place.",
  },
];

const AUDIENCE = [
  {
    title: "Afrique francophone + remote",
    body: "Cotonou, Lomé, Dakar, Accra, Abidjan, et les offres full remote compatibles. Le lieu de l'offre n'est jamais inventé.",
  },
  {
    title: "Stages et premiers postes",
    body: "Internship, stage, junior. Le matching exige un titre de stage réel quand vous cherchez un internat — pas un CDI déguisé.",
  },
  {
    title: "ONG et organisations internationales",
    body: "Missions, consulting, ONU / import admin. Les offres trouvées sont publiées tout de suite dans Offres.",
  },
  {
    title: "Candidats qui veulent comprendre le score",
    body: "Pas une boîte noire. Skills, expérience, lieu, formation et requirements sont visibles. Ce qui manque reste Not specified.",
  },
];

const FAQ = [
  {
    q: "JobRadar est-il un job board ?",
    a: "Non. C'est un radar d'intelligence d'opportunités : vous décrivez une piste, on classe des offres réelles et on explique le match.",
  },
  {
    q: "D'où viennent les offres ?",
    a: "De job boards publics (Jobicy, Remote OK, Remotive, The Muse, Himalayas) et d'imports admin. Pas de scrape LinkedIn, pas d'offres générées par l'IA.",
  },
  {
    q: "Le score garantit-il que je suis éligible ?",
    a: "Non. JobRadar ne promet pas d'embauche. Les labels sont prudents. Education et Requirements restent Not specified s'ils ne sont pas dans l'offre.",
  },
  {
    q: "JobRadar postule-t-il pour moi ?",
    a: "Non. Postuler maintenant ouvre le lien officiel. Marked as applied est uniquement votre suivi.",
  },
  {
    q: "Que se passe-t-il s'il n'y a aucun match ?",
    a: "La page affiche No matching opportunities found. JobRadar ne fabrique pas une offre pour remplir l'écran.",
  },
];

export const dynamic = "force-dynamic";

export default function HomePage() {
  const clerkEnabled = isClerkConfigured();

  return (
    <div data-landing className="pb-0">
      <section className="landing-hero relative flex items-center overflow-hidden">
        <LandingRadar>
          <Image
            src="/brand/jobradar-logo.png"
            alt="Logo JobRadar"
            width={220}
            height={220}
            className="jr-float absolute left-1/2 top-1/2 z-10 rounded-[2rem] shadow-2xl"
            priority
          />
        </LandingRadar>
        <Shell className="relative z-10 py-16 md:py-24">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-accent">
            <span className="jr-live-dot" aria-hidden />
            Opportunity intelligence · scanning
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
            Your next opportunity, before you miss it.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted md:text-xl">
            JobRadar n&apos;est pas un job board. C&apos;est un radar : décrivez ce que vous cherchez, on
            structure l&apos;intention, on match, on explique le score — emplois, stages, missions, ONG et
            organisations internationales.
          </p>
          <div className="mt-8 max-w-3xl">
            <SearchBox size="xl" />
          </div>
          <p className="mt-3 text-sm text-muted">Langage naturel. Aucune offre inventée. Aucun deadline fabriqué.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <Link key={example} href={`/search?q=${encodeURIComponent(example)}`}>
                <Pill>{example}</Pill>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {clerkEnabled ? (
              <Link href="/sign-up" className="btn-primary rounded-full px-6 py-3 text-sm font-semibold">
                Créer un compte
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-primary rounded-full px-6 py-3 text-sm font-semibold">
                Ouvrir le radar
              </Link>
            )}
            <Link href="/jobs" className="rounded-full border border-line bg-elev px-6 py-3 text-sm font-semibold">
              Voir les opportunités
            </Link>
            <Link href="/cv" className="rounded-full border border-line px-6 py-3 text-sm font-semibold">
              Nourrir le radar avec mon CV
            </Link>
          </div>
          <div className="mt-10 md:hidden">
            <Image
              src="/brand/jobradar-logo.png"
              alt="Logo JobRadar"
              width={160}
              height={160}
              className="rounded-3xl shadow-lg"
            />
          </div>
        </Shell>
      </section>

      <section className="border-y border-line bg-elev/60 py-6">
        <Shell>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Sources consultées — URL officielle uniquement</p>
          <div className="jr-marquee-mask mt-4">
            <div className="jr-marquee">
              {[...SOURCES, ...SOURCES].map((source, index) => (
                <Pill key={`${source}-${index}`}>{source}</Pill>
              ))}
            </div>
          </div>
        </Shell>
      </section>

      <section className="py-20 md:py-28">
        <Shell>
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Le problème</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold md:text-5xl">Les job boards noient. JobRadar explique.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Trop d'offres, zéro contexte",
                body: "Une liste sans score lisible ne dit pas pourquoi une piste vous correspond, ni ce qui manque.",
              },
              {
                title: "Des scores boîte noire",
                body: "Un pourcentage magique sans facteurs, sans écarts, sans lien officiel, n'aide pas à décider.",
              },
              {
                title: "Des fiches trop belles pour être vraies",
                body: "JobRadar n'invente ni entreprise, ni salaire, ni deadline. Vide = Not specified. Vide de résultats = No matching opportunities found.",
              },
            ].map((item) => (
              <article key={item.title} className="panel p-7 md:p-8">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </Shell>
      </section>

      <section id="comment" className="border-y border-line bg-elev/40 py-20 md:py-28">
        <Shell>
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Comment ça marche</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold md:text-5xl">Quatre étapes. Toujours des offres réelles.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {STEPS.map((step) => (
              <article key={step.n} className="panel flex gap-5 p-7 md:p-8">
                <span className="text-3xl font-semibold text-accent">{step.n}</span>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </Shell>
      </section>

      <section id="matching" className="py-20 md:py-28">
        <Shell>
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Matching explicable</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold md:text-5xl">Le score n&apos;est pas une IA qui décide pour vous.</h2>
          <p className="mt-4 max-w-2xl text-muted">
            Pondération déterministe. L&apos;analyse explique le match ; elle ne fabrique pas le pourcentage.
            Education et Requirements n&apos;apparaissent en % que si les textes existent.
          </p>
          <div className="mt-10 grid gap-3">
            {FACTORS.map((factor) => (
              <div key={factor.label} className="panel flex items-center justify-between gap-4 px-5 py-4">
                <span className="font-medium">{factor.label}</span>
                <span className="text-sm text-accent">{factor.weight}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Strong match", "Potential match", "Requirements unclear", "Likely not eligible"].map((label) => (
              <div key={label} className="rounded-2xl border border-line bg-elev px-4 py-3 text-sm font-medium">
                {label}
              </div>
            ))}
          </div>
        </Shell>
      </section>

      <section className="border-y border-line py-20 md:py-28">
        <Shell>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-accent">Sur le radar</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Opportunités vérifiées</h2>
            </div>
            <Link href="/jobs" className="text-sm font-medium text-accent">
              Tout voir
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
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
          <div className="mt-10">
            <Suspense
              fallback={
                <div className="panel p-8 text-sm text-muted">Chargement des offres vérifiées (sans inventer)…</div>
              }
            >
              <HomeJobPreview />
            </Suspense>
          </div>
        </Shell>
      </section>

      <section className="py-20 md:py-28">
        <Shell>
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Pour qui</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold md:text-5xl">Un radar pour des pistes concrètes, pas un catalogue générique.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {AUDIENCE.map((item) => (
              <article key={item.title} className="panel p-7 md:p-8">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </Shell>
      </section>

      <section id="faq" className="border-y border-line bg-elev/40 py-20 md:py-28">
        <Shell>
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Questions fréquentes</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Sans marketing creux.</h2>
          <div className="mt-12 space-y-4">
            {FAQ.map((item) => (
              <article key={item.q} className="panel p-6 md:p-7">
                <h3 className="text-lg font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.a}</p>
              </article>
            ))}
          </div>
        </Shell>
      </section>

      <section id="scan" className="py-20 md:py-28">
        <Shell>
          <div className="panel radar-ring overflow-hidden px-6 py-14 md:px-12 md:py-16">
            <p className="text-xs uppercase tracking-[0.22em] text-accent">Prêt à scanner</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold md:text-5xl">
              Décrivez une vraie piste. JobRadar ira chercher des offres réelles.
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Si rien ne match, vous verrez No matching opportunities found — pas une liste fictive.
            </p>
            <div className="mt-8 max-w-3xl">
              <SearchBox size="xl" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/cv" className="rounded-full border border-line bg-elev px-5 py-2.5 text-sm font-semibold">
                Ajouter mon CV
              </Link>
              <Link href="/privacy" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">
                Privacy
              </Link>
            </div>
          </div>
        </Shell>
      </section>
    </div>
  );
}

function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className ?? ""}`}>{children}</div>;
}

async function HomeJobPreview() {
  const catalog = await withTimeout(listCatalogJobs({ limit: 24 }), 2500, []);
  const preview = catalog.slice(0, 3);

  if (!preview.length) {
    return (
      <div className="space-y-4">
        <OpportunityRadar jobs={[]} />
        <OpportunityTimeline jobs={[]} />
        <div className="panel space-y-3 p-6">
          <p className="font-semibold">Hey — coming soon</p>
          <p className="text-sm text-muted">
            De nouvelles opportunités arrivent bientôt. Revenez un peu plus tard, ou lancez une recherche.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/search" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
              Find my opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OpportunityRadar jobs={catalog} />
      <OpportunityTimeline
        jobs={catalog.slice(0, 20).map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          postedAt: job.postedAt,
        }))}
      />
      <div className="grid gap-4">
        {preview.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="panel panel-hover flex items-center justify-between gap-4 p-5">
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
    </div>
  );
}
