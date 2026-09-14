import Link from "next/link";
import { redirect } from "next/navigation";
import { Pill, ScoreRing } from "@/components/brand";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { parseIntentHeuristic } from "@/lib/intent";
import { rankJobsForUser } from "@/server/rank";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user && isClerkConfigured()) redirect("/sign-in");

  const canPersist = Boolean(user && isPersistedUser(user));
  const [profile, searches, matches, saved] = await Promise.all([
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
          "dashboard.matches",
          () =>
            prisma.match.findMany({
              where: { userId: user!.id },
              include: { job: true },
              orderBy: { score: "desc" },
              take: 8,
            }),
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

  const ranked = await rankJobsForUser({
    intent: parseIntentHeuristic(profile?.headline || "opportunités pertinentes"),
    userId: user?.id,
    limit: 6,
  });

  const applications = saved.filter((item) => item.status === "applied" || item.status === "interviewing" || item.status === "offer");
  const alerts = ranked.filter((job) => job.match.score >= 70).slice(0, 4);
  const skills = asJsonArray(profile?.skillsJson);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Radar personnel</p>
        <h1 className="mt-2 text-3xl font-semibold">Voici les opportunités que JobRadar a trouvées pour vous</h1>
        <p className="mt-2 text-muted">
          {user?.name ?? "Profil"} · {user?.isDemo ? "session démo" : user?.email}
        </p>
        {!canPersist ? (
          <p className="mt-2 text-sm text-warn">
            Postgres n&apos;est pas encore joignable : le radar affiche le catalogue. CV, sauvegardes et candidatures
            se persisteront dès que DATABASE_URL postgres:// sera valide.
          </p>
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Recommandées</p>
          <p className="mt-3 text-3xl font-semibold">{ranked.length}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Sur le radar</p>
          <p className="mt-3 text-3xl font-semibold">{saved.length}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Candidatures</p>
          <p className="mt-3 text-3xl font-semibold">{applications.length}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Alertes</p>
          <p className="mt-3 text-3xl font-semibold">{alerts.length}</p>
        </article>
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Meilleur match</h2>
          <Link href="/jobs" className="text-sm text-accent">
            Toutes les opportunités
          </Link>
        </div>
        {ranked[0] ? (
          <Link href={`/jobs/${ranked[0].id}`} className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">{ranked[0].company}</p>
              <p className="mt-1 text-lg font-semibold">{ranked[0].title}</p>
              <p className="mt-1 text-sm text-muted">{ranked[0].location}</p>
              <p className="mt-3 text-sm text-muted">{ranked[0].match.reasons[0]?.detail}</p>
            </div>
            <ScoreRing score={ranked[0].match.score} />
          </Link>
        ) : (
          <p className="mt-3 text-sm text-muted">Aucune offre sur le radar pour l&apos;instant.</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="font-semibold">Nouvelles recommandations</h2>
          <ul className="mt-4 space-y-3">
            {ranked.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3">
                <Link href={`/jobs/${job.id}`} className="text-sm hover:text-accent">
                  {job.title}
                  <span className="block text-xs text-muted">{job.company}</span>
                </Link>
                <ScoreRing score={job.match.score} />
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-6">
          <h2 className="font-semibold">Alertes radar</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {alerts.map((job) => (
              <li key={job.id}>
                <Link href={`/jobs/${job.id}`} className="hover:text-accent">
                  Match {job.match.score} · {job.title}
                </Link>
              </li>
            ))}
            {alerts.length === 0 ? <li className="text-muted">Complétez votre CV pour activer les alertes.</li> : null}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="font-semibold">Offres sauvegardées</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {saved.map((item) => (
              <li key={item.id}>
                <Link href={`/jobs/${item.jobId}`} className="hover:text-accent">
                  {item.job.title}
                </Link>
                <span className="ml-2 text-xs text-muted">{item.status}</span>
              </li>
            ))}
            {saved.length === 0 ? <li className="text-muted">Gardez une offre sur le radar depuis sa fiche.</li> : null}
          </ul>
        </section>
        <section className="panel p-6">
          <h2 className="font-semibold">Candidatures</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {applications.map((item) => (
              <li key={item.id}>
                <Link href={`/jobs/${item.jobId}`} className="hover:text-accent">
                  {item.job.title}
                </Link>
                <span className="ml-2 text-xs text-muted">{item.status}</span>
              </li>
            ))}
            {applications.length === 0 ? <li className="text-muted">Suivez une candidature depuis une offre.</li> : null}
          </ul>
        </section>
      </div>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Profil & CV</h2>
          <Link href="/cv" className="text-sm text-accent">
            Mettre à jour
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">{profile?.headline ?? "Importez votre CV pour personnaliser le radar."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.slice(0, 10).map((skill) => (
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
        ) : null}
      </section>
    </div>
  );
}
