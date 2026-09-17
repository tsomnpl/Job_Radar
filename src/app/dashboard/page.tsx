import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Pill, ScoreRing } from "@/components/brand";
import { RadarJobList } from "@/components/radar-job-list";
import { PageSkeleton } from "@/components/page-shell";
import { ProfileEditor } from "@/components/profile-editor";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { requirePageUser } from "@/lib/page-guard";
import { asJsonArray } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { parseIntentHeuristic } from "@/lib/intent";
import { OpportunityCopilot } from "@/components/opportunity-copilot";
import { OpportunityRadar } from "@/components/opportunity-radar";
import { OpportunityTimeline } from "@/components/opportunity-timeline";
import { getRequestLang, t } from "@/i18n";
import { isClerkConfigured } from "@/lib/env";
import { jobLifecycle } from "@/lib/job-lifecycle";
import { listCatalogJobs, rankJobsForUser } from "@/server/rank";
import { listSeenJobIds } from "@/server/job-views";
import { withTimeout } from "@/lib/timeout";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Career Command Center — My Radar, saved jobs, and applications.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePageUser("/dashboard");
  const lang = await getRequestLang();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">{t(lang, "dashboard.kicker")}</p>
        <h1 className="mt-2 text-3xl font-semibold">{t(lang, "dashboard.title")}</h1>
        <p className="mt-2 text-muted">
          Préférences, opportunités recommandées, sauvegardes, candidatures et CV.
        </p>
      </div>

      <section className="panel p-6">
        <h2 className="font-semibold">My Radar</h2>
        <p className="mt-2 text-sm text-muted">
          Domaines, type, localisation, remote, niveau et compétences. Sans ça : Your radar is not configured yet.
        </p>
        <div className="mt-4">
          <ProfileEditor />
        </div>
      </section>

      <Suspense fallback={<PageSkeleton title="Chargement du compte…" />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}

async function DashboardData() {
  const user = await getSessionUser();
  const canPersist = Boolean(user && isPersistedUser(user));
  const [profile, searches, saved, applications, notifications] = await Promise.all([
    canPersist
      ? withTimeout(
          withDb("dashboard.profile", () => prisma.profile.findUnique({ where: { userId: user!.id } }), null),
          2500,
          null,
        )
      : Promise.resolve(null),
    canPersist
      ? withTimeout(
          withDb(
            "dashboard.searches",
            () => prisma.search.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" }, take: 6 }),
            [],
          ),
          2500,
          [],
        )
      : Promise.resolve([]),
    canPersist
      ? withTimeout(
          withDb(
            "dashboard.saved",
            () =>
              prisma.savedJob.findMany({
                where: { userId: user!.id },
                include: { job: true },
                orderBy: { createdAt: "desc" },
                take: 8,
              }),
            [],
          ),
          2500,
          [],
        )
      : Promise.resolve([]),
    canPersist
      ? withTimeout(
          withDb(
            "dashboard.applications",
            () =>
              prisma.application.findMany({
                where: { userId: user!.id },
                include: { job: true },
                orderBy: { createdAt: "desc" },
                take: 8,
              }),
            [],
          ),
          2500,
          [],
        )
      : Promise.resolve([]),
    canPersist
      ? withTimeout(
          withDb(
            "dashboard.notifications",
            () =>
              prisma.notification.findMany({
                where: { userId: user!.id },
                orderBy: { createdAt: "desc" },
                take: 6,
              }),
            [],
          ),
          2500,
          [],
        )
      : Promise.resolve([]),
  ]);

  const stock = await withTimeout(listCatalogJobs({ userId: user?.id, limit: 40 }), 2500, []);
  const radarQuery = searches[0]?.query || profile?.headline || "";
  const ranked = radarQuery
    ? await withTimeout(
        rankJobsForUser({
          intent: parseIntentHeuristic(radarQuery),
          userId: user?.id,
          limit: 6,
        }),
        2500,
        stock.slice(0, 6),
      )
    : stock.slice(0, 6);

  const alerts = ranked.filter((job) => job.match.score >= 70).slice(0, 4);
  const closing = stock.filter((job) => jobLifecycle(job.deadline) === "closing_soon");
  const skills = asJsonArray(profile?.skillsJson);
  const empty =
    stock.length === 0 && saved.length === 0 && searches.length === 0 && !profile?.cvText && skills.length === 0;
  const seen = user && isPersistedUser(user) ? await listSeenJobIds(user.id) : new Set<string>();
  const newForYou = ranked.filter((job) => !seen.has(job.id)).slice(0, 4);
  const lang = await getRequestLang();
  const signedIn = Boolean(user) && (!isClerkConfigured() || !user?.isDemo);

  return (
    <>
      <p className="text-sm text-muted">
        {user?.name ?? "Profil"} · {user?.isDemo ? "session démo" : user?.email ?? "pas encore connecté"}
      </p>

      {empty ? (
        <section className="panel space-y-4 p-6">
          <p className="text-sm text-muted">
            Hey — coming soon. Remplissez votre profil ou lancez une recherche : de nouvelles opportunités arrivent bientôt.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/cv" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
              Ajouter mon CV
            </Link>
            <Link href="/search" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
              Lancer une recherche
            </Link>
            {user?.role === "ADMIN" ? (
              <Link href="/admin" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
                Admin
              </Link>
            ) : null}
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

      <OpportunityRadar jobs={ranked} />
      <section className="panel p-6">
        <h2 className="font-semibold">{t(lang, "dashboard.new")}</h2>
        {newForYou.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {newForYou.map((job) => (
              <li key={job.id}>
                <Link href={`/jobs/${job.id}`} className="hover:text-accent">
                  {job.company} — {job.title} · {job.match.score}%
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">{t(lang, "dashboard.newEmpty")}</p>
        )}
      </section>
      {ranked[0] ? (
        <OpportunityCopilot jobId={ranked[0].id} signedIn={signedIn} lang={lang} />
      ) : null}
      <OpportunityTimeline
        jobs={stock.slice(0, 20).map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          postedAt: job.postedAt,
        }))}
      />
      <section className="panel p-6">
        <h2 className="font-semibold">Closing soon</h2>
        {closing.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {closing.slice(0, 6).map((job) => (
              <li key={job.id}>
                <Link href={`/jobs/${job.id}`} className="hover:text-accent">
                  {job.company} — {job.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No matching opportunities found.</p>
        )}
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recommended opportunities</h2>
          <Link href="/search" className="text-sm text-accent">
            Explore opportunities
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
              empty="No saved opportunities yet."
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
                date: item.createdAt.toISOString().slice(0, 10),
              }))}
              empty="No applications tracked yet."
            />
          </div>
        </section>
      </div>

      <section className="panel p-6">
        <h2 className="font-semibold">Notifications</h2>
        {notifications.length ? (
          <ul className="mt-4 space-y-3 text-sm">
            {notifications.map((item) => (
              <li key={item.id} className="border-b border-line pb-3 last:border-0">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Aucune notification.</p>
        )}
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">CV</h2>
          <Link href="/cv" className="text-sm text-accent">
            Coller un CV
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">{profile?.headline ?? "Aucun CV importé."}</p>
        <p className="mt-1 text-xs text-muted">{profile?.education || "Formation : Not specified"}</p>
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
    </>
  );
}
