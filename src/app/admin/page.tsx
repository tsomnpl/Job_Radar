import { redirect } from "next/navigation";
import { ImportForm } from "@/components/import-form";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") {
    return (
      <div className="panel p-8">
        <h1 className="text-2xl font-semibold">Accès admin refusé</h1>
        <p className="mt-2 text-[#b9d4d4]">Ajoutez votre Clerk user id dans ADMIN_CLERK_USER_IDS.</p>
      </div>
    );
  }

  const dbReady = isPersistedUser(user);
  const [jobCount, batches] = dbReady
    ? await Promise.all([
        withDb("admin.jobCount", () => prisma.job.count(), 0),
        withDb(
          "admin.batches",
          () => prisma.importBatch.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
          [],
        ),
      ])
    : [0, []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Import admin</h1>
        <p className="mt-2 text-[#b9d4d4]">
          {jobCount} offres en base. Mode {isClerkConfigured() ? "Clerk" : "démo"}.
        </p>
        {!dbReady ? (
          <p className="mt-2 text-sm text-[#f5c14a]">
            Postgres n&apos;est pas joignable : l&apos;import CSV/JSON nécessite une DATABASE_URL postgresql://.
          </p>
        ) : null}
      </div>
      <section className="panel p-6">
        <ImportForm />
      </section>
      <section className="panel p-6">
        <h2 className="font-semibold">Derniers imports</h2>
        <ul className="mt-4 space-y-2 text-sm text-[#b9d4d4]">
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
