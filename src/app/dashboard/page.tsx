import Link from "next/link";
import { redirect } from "next/navigation";
import { Pill, ScoreRing } from "@/components/brand";
import { RadarJobList } from "@/components/radar-job-list";
import { ProfileQuickForm } from "@/components/profile-quick-form";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { parseIntentHeuristic } from "@/lib/intent";
import { rankJobsForUser } from "@/server/rank";
import { listStockJobs } from "@/server/jobs-store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user && isClerkConfigured()) redirect("/sign-in");

  const canPersist = Boolean(user && isPersistedUser(user));
  const [profile, searches, saved] = await Promise.all([
    canPersist
      ? withDb("dashboard.profile", () => prisma.profile.findUnique({ where: { userId: user!.id } }), null)
      : Promise.resolve(null),
    canPersist
      ? withDb(
          "dashboard.searches",
          () => prisma.search.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" }, take: 6 }),
          [],
        )
      : Promise.resolve([]),
    canPersist
      ? withDb(
          "dashboard.saved",
          () =>
            prisma.savedJob.findMany({
              where: { userId: user!.id },
              include: { job: true },
              orderBy: { createdAt: "desc" },
              take: 8,
            }),
          [],
        )
      : Promise.resolve([]),
  ]);

  const stock = await listStockJobs();
  const radarQuery = searches[0]?.query || profile?.headline || "";
  const ranked = stock.length
    ? await rankJobsForUser({
        intent: parseIntentHeuristic(radarQuery || "opportunités"),
        userId: user?.id,
        limit: 6,
      })
    : [];

  const applications = saved.filter(
    (item) => item.status === "applied" || item.status === "interviewing" || item.status === "offer",
  );
  const alerts = ranked.filter((job) => job.match.score >= 70).slice(0, 4);
  const skills = asJsonArray(profile?.skillsJson);
  const empty =
    stock.length === 0 && saved.length === 0 && searches.length === 0 && !profile?.cvText && skills.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Compte</p>
        <h1 className="mt-2 text-3xl font-semibold">
          {empty ? "Compte prêt — tout est à zéro" : "Voici les opportunités que JobRadar a trouvées pour vous"}
        </h1>
        <p className="mt-2 text-muted">
          {user?.name ?? "Profil"} · {user?.isDemo ? "session démo" : user?.email}
        </p>
      </div>

      {empty ? (
        <section className="panel space-y-4 p-6">
          <p className="text-sm text-muted">
            Aucune offre vérifiée, aucun CV, aucune candidature. Remplissez votre profil, importez de vraies offres en
            admin, ou lancez une recherche — s&apos;il n&apos;y a rien, JobRadar n&apos;inventera pas d&apos;offre.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/cv" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
              Ajouter mon CV
            </Link>
            <Link href="/search" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
              Lancer une recherche
            </Link>
            <Link href="/admin" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
              Importer des offres
            </Link>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Offres en stock</p>
          <p className="mt-3 text-3xl font-semibold">{stock.length}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Sur le radar</p>
          <p className="mt-3 text-3xl font-semibold">{saved.length}</p>
          <Link href="/saved-jobs" className="mt-3 inline-block text-sm text-accent">
            Voir
          </Link>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Candidatures</p>
          <p className="mt-3 text-3xl font-semibold">{applications.length}</p>
          <Link href="/applications" className="mt-3 inline-block text-sm text-accent">
            Voir
          </Link>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Alertes</p>
          <p className="mt-3 text-3xl font-semibold">{alerts.length}</p>
        </article>
      </section>

      <section className="panel p-6">
        <h2 className="font-semibold">Mon profil (à remplir)</h2>
        <p className="mt-2 text-sm text-muted">Sans ça, le matching n&apos;a pas de compétences à comparer.</p>
        <div className="mt-4">
          <ProfileQuickForm
            initialHeadline={profile?.headline ?? ""}
            initialSkills={skills.join(", ")}
            initialLocations={asJsonArray(profile?.locationsJson).join(", ")}
            initialSeniority={profile?.seniority ?? ""}
          />
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Meilleur match</h2>
          <Link href="/search" className="text-sm text-accent">
            Rechercher
          </Link>
        </div>
        {ranked[0] ? (
          <Link href={`/jobs/${ranked[0].id}`} className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">{ranked[0].company}</p>
              <p className="mt-1 text-lg font-semibold">{ranked[0].title}</p>
              <p className="mt-1 text-sm text-muted">{ranked[0].location}</p>
            </div>
            <ScoreRing score={ranked[0].match.score} />
          </Link>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {radarQuery
              ? `Radar basé sur votre dernière recherche : "${radarQuery}".`
              : "No matching opportunities found. Lancez une recherche — JobRadar n'invente pas d'offre."}
          </p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Offres sauvegardées</h2>
            <Link href="/saved-jobs" className="text-sm text-accent">
              Tout voir
            </Link>
          </div>
          <div className="mt-4">
            <RadarJobList
              items={saved.map((item) => ({
                id: item.id,
                jobId: item.jobId,
                title: item.job.title,
                company: item.job.company,
                status: item.status,
              }))}
              empty="0 — aucune sauvegarde."
            />
          </div>
        </section>
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Candidatures</h2>
            <Link href="/applications" className="text-sm text-accent">
              Tout voir
            </Link>
          </div>
          <div className="mt-4">
            <RadarJobList
              items={applications.map((item) => ({
                id: item.id,
                jobId: item.jobId,
                title: item.job.title,
                company: item.job.company,
                status: item.status,
              }))}
              empty="0 — aucune candidature."
            />
          </div>
        </section>
      </div>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">CV</h2>
          <Link href="/cv" className="text-sm text-accent">
            Coller un CV
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">{profile?.headline ?? "Aucun CV importé."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Pill key={skill}>{skill}</Pill>
          ))}
        </div>
        {searches.length ? (
          <ul className="mt-4 space-y-2 text-sm">
            {searches.map((search) => (
              <li key={search.id}>
                <Link href={`/search?q=${encodeURIComponent(search.query)}`} className="hover:text-accent">
                  {search.query}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">0 recherche enregistrée.</p>
        )}
      </section>
    </div>
  );
}
