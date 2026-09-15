import { Suspense } from "react";
import { ImportForm } from "@/components/import-form";
import { AdminRadarForms } from "@/components/admin-extract-form";
import { AuthCallout, PageSkeleton } from "@/components/page-shell";
import { PublishToggle } from "@/components/publish-toggle";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { listAllJobs } from "@/server/jobs-store";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin radar</h1>
        <p className="mt-2 text-muted">
          Pilotage des opportunités : import, publication, radar.
        </p>
      </div>

      <AuthCallout next="/admin" clerkEnabled={isClerkConfigured()} />

      <section className="panel p-6">
        <h2 className="font-semibold">Importer le texte brut d&apos;une offre</h2>
        <p className="mt-2 text-sm text-muted">L&apos;IA extraie titre, organisation, lieu et compétences.</p>
        <div className="mt-4">
          <AdminRadarForms />
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="font-semibold">Import CSV / JSON</h2>
        <div className="mt-4">
          <ImportForm />
        </div>
      </section>

      <Suspense fallback={<PageSkeleton title="Chargement du stock admin…" />}>
        <AdminStock />
      </Suspense>
    </div>
  );
}

async function AdminStock() {
  const user = await getSessionUser();
  if (user && user.role !== "ADMIN") {
    return (
      <div className="panel p-8">
        <h2 className="text-2xl font-semibold">Accès admin refusé</h2>
        <p className="mt-2 text-muted">
          Ajoutez votre Clerk user id dans <code>ADMIN_CLERK_USER_IDS</code>.
        </p>
        <p className="mt-3 text-sm text-muted">Votre id : {user.clerkUserId}</p>
      </div>
    );
  }

  const dbReady = Boolean(user && isPersistedUser(user));
  const jobs = await withTimeout(listAllJobs(), 2500, []);
  const [userCount, searchCount, batches] = dbReady
    ? await Promise.all([
        withTimeout(withDb("admin.users", () => prisma.user.count(), 0), 2500, 0),
        withTimeout(withDb("admin.searches", () => prisma.search.count(), 0), 2500, 0),
        withTimeout(
          withDb(
            "admin.batches",
            () => prisma.importBatch.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
            [],
          ),
          2500,
          [],
        ),
      ])
    : [0, 0, []];

  return (
    <>
      {!dbReady ? (
        <p className="text-sm text-warn">
          Postgres n&apos;est pas joignable : l&apos;import et la publication exigent une DATABASE_URL postgres://.
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Offres</p>
          <p className="mt-2 text-3xl font-semibold">{jobs.length}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Utilisateurs</p>
          <p className="mt-2 text-3xl font-semibold">{userCount}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Recherches</p>
          <p className="mt-2 text-3xl font-semibold">{searchCount}</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Publiées</p>
          <p className="mt-2 text-3xl font-semibold">{jobs.filter((job) => job.active).length}</p>
        </article>
      </section>

      <section className="panel p-6">
        <h2 className="font-semibold">Offres</h2>
        {jobs.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            0 offre. Collez un texte brut ou un CSV ci-dessus pour alimenter le radar.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {jobs.slice(0, 30).map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted">
                    {job.company} · {job.location} · {job.source} · {job.active ? "publiée" : "masquée"}
                  </p>
                </div>
                <PublishToggle jobId={job.id} active={Boolean(job.active)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-6">
        <h2 className="font-semibold">Derniers imports</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {batches.map((batch) => (
            <li key={batch.id}>
              {batch.createdAt.toISOString().slice(0, 16)} · {batch.format} · +{batch.createdCount} / ~
              {batch.updatedCount} / skip {batch.skippedCount}
              {batch.filename ? ` · ${batch.filename}` : ""}
            </li>
          ))}
          {batches.length === 0 ? <li>Aucun import encore.</li> : null}
        </ul>
      </section>
    </>
  );
}
