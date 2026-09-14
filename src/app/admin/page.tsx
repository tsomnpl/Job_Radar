import { redirect } from "next/navigation";
import { ImportForm } from "@/components/import-form";
import { AdminRadarForms } from "@/components/admin-extract-form";
import { PublishToggle } from "@/components/publish-toggle";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { listAllJobs } from "@/server/jobs-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") {
    return (
      <div className="panel p-8">
        <h1 className="text-2xl font-semibold">Accès admin refusé</h1>
        <p className="mt-2 text-muted">
          Ajoutez votre Clerk user id dans <code>ADMIN_CLERK_USER_IDS</code>.
        </p>
        <p className="mt-3 text-sm text-muted">Votre id : {user.clerkUserId}</p>
      </div>
    );
  }

  const dbReady = isPersistedUser(user);
  const jobs = await listAllJobs();
  const [userCount, searchCount, batches] = dbReady
    ? await Promise.all([
        withDb("admin.users", () => prisma.user.count(), 0),
        withDb("admin.searches", () => prisma.search.count(), 0),
        withDb(
          "admin.batches",
          () => prisma.importBatch.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
          [],
        ),
      ])
    : [0, 0, []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin radar</h1>
        <p className="mt-2 text-muted">
          Pilotage des opportunités. Mode {isClerkConfigured() ? "Clerk" : "démo"}.
        </p>
        {!dbReady ? (
          <p className="mt-2 text-sm text-warn">
            Postgres n&apos;est pas joignable : l&apos;import et la publication exigent une DATABASE_URL postgres://.
          </p>
        ) : null}
      </div>

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

      <section className="panel p-6">
        <h2 className="font-semibold">Offres</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {jobs.slice(0, 30).map((job) => (
            <li key={job.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-muted">
                  {job.company} · {job.location} · {job.active ? "publiée" : "masquée"}
                </p>
              </div>
              <PublishToggle jobId={job.id} active={Boolean(job.active)} />
            </li>
          ))}
        </ul>
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
    </div>
  );
}
