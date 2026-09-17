import Link from "next/link";
import { AdminJobActions } from "@/components/admin-job-actions";
import { AdminUserActions } from "@/components/admin-user-actions";
import { AdminRadarForms } from "@/components/admin-extract-form";
import { AdminEmailTest } from "@/components/admin-email-test";
import { AdminHudStat, AdminKpiRing, AdminTelemetryRadar } from "@/components/admin-telemetry";
import { ImportForm } from "@/components/import-form";
import { getAdminOrNull } from "@/lib/admin-page";
import { displayField, formatContract, formatJobDeadline } from "@/lib/jobs";
import { jobLifecycle } from "@/lib/job-lifecycle";
import { prisma } from "@/lib/prisma";
import { listAllJobs } from "@/server/jobs-store";
import { withTimeout } from "@/lib/timeout";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; type?: string }>;
}) {
  const admin = await getAdminOrNull();
  if (!admin) return null;
  const { tab = "overview", q = "", type = "" } = await searchParams;
  const jobs = await withTimeout(listAllJobs(), 2500, []);
  const query = q.trim().toLowerCase();
  const typeFilter = type.trim();
  const filtered = jobs.filter((job) => {
    if (query && !`${job.title} ${job.company} ${job.location}`.toLowerCase().includes(query)) return false;
    if (typeFilter && job.contractType !== typeFilter) return false;
    return true;
  });
  const pending = filtered.filter((job) => job.status === "pending");
  const published = filtered.filter((job) => job.status === "published");
  const [userCount, searchCount] = await Promise.all([
    withTimeout(prisma.user.count().catch(() => 0), 2500, 0),
    withTimeout(prisma.search.count().catch(() => 0), 2500, 0),
  ]);

  const pendingCount = jobs.filter((job) => job.status === "pending").length;
  const publishedCount = jobs.filter((job) => job.status === "published").length;
  const closingSoon = jobs.filter((job) => jobLifecycle(job.deadline) === "closing_soon").slice(0, 6);
  const incoming = pending.slice(0, 6);

  return (
    <div className="space-y-6">
      {tab === "overview" || !tab ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminHudStat label="Total stock" value={String(jobs.length)} hint="Real opportunities in database" />
            <AdminKpiRing label="Pending" value={pendingCount} total={Math.max(jobs.length, 1)} tone="cyan" />
            <AdminKpiRing label="Published" value={publishedCount} total={Math.max(jobs.length, 1)} tone="blue" />
            <AdminHudStat label="Users / searches" value={`${userCount} / ${searchCount}`} hint="Accounts and saved searches" />
          </section>
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <AdminTelemetryRadar
              jobs={jobs.map((job) => ({
                id: job.id,
                title: job.title,
                company: job.company,
                status: job.status,
                deadline: job.deadline,
              }))}
            />
            <div className="space-y-4">
              <section className="hud-panel p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] hud-kicker">Closing soon</p>
                {closingSoon.length ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {closingSoon.map((job) => (
                      <li key={job.id}>
                        <Link href={`/admin/jobs/${job.id}/edit`} className="hover:text-accent">
                          {displayField(job.company)} — {displayField(job.title)}
                        </Link>
                        <span className="hud-muted ml-2 text-xs">{formatJobDeadline(job.deadline)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm hud-muted">No matching opportunities found.</p>
                )}
              </section>
              <section className="hud-panel p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] hud-kicker">Incoming pending</p>
                {incoming.length ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {incoming.map((job) => (
                      <li key={job.id}>
                        <Link href={`/admin/jobs/${job.id}/edit`} className="hover:text-accent">
                          {displayField(job.title)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm hud-muted">Aucune offre en attente.</p>
                )}
              </section>
            </div>
          </section>
        </>
      ) : null}

      {tab === "overview" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-6">
            <h2 className="font-semibold">Import texte (RodiumAI)</h2>
            <div className="mt-4">
              <AdminRadarForms />
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="font-semibold">Import CSV / JSON</h2>
            <p className="mt-2 text-sm text-muted">Les imports sont publiés tout de suite dans Offres.</p>
            <div className="mt-4">
              <ImportForm />
            </div>
          </div>
          <AdminEmailTest />
        </section>
      ) : null}

      {tab === "opportunities" || tab === "pending" || tab === "published" ? (
        <section className="panel overflow-x-auto p-6">
          <form className="mb-4 flex flex-wrap gap-3">
            <input type="hidden" name="tab" value={tab} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search title, company, location"
              className="field w-full max-w-md rounded-xl px-3 py-2 text-sm"
            />
            <select name="type" defaultValue={type} className="field rounded-xl px-3 py-2 text-sm">
              <option value="">All types</option>
              <option value="internship">Internship</option>
              <option value="employee">Job / Employee</option>
              <option value="consultant">Consultant</option>
              <option value="freelance">Freelance</option>
              <option value="mission">Mission</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="other">Other</option>
            </select>
            <button type="submit" className="rounded-xl border border-line px-3 py-2 text-sm">
              Filter
            </button>
          </form>
          <OpportunityTable
            jobs={tab === "pending" ? pending : tab === "published" ? published : filtered}
            empty={tab === "pending" ? "Aucune offre en attente." : "Aucune offre."}
          />
        </section>
      ) : null}

      {tab === "overview" ? (
        <p className="text-sm">
          <Link href="/admin/new" className="text-accent">
            Add opportunity
          </Link>
        </p>
      ) : null}

      {tab === "users" ? <AdminUsersTable currentUserId={admin.id} /> : null}
    </div>
  );
}

function OpportunityTable({
  jobs,
  empty,
}: {
  jobs: Awaited<ReturnType<typeof listAllJobs>>;
  empty: string;
}) {
  if (!jobs.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <table className="min-w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-[0.12em] text-muted">
        <tr>
          <th className="pb-3 pr-3">Position</th>
          <th className="pb-3 pr-3">Company</th>
          <th className="pb-3 pr-3">Type</th>
          <th className="pb-3 pr-3">Deadline</th>
          <th className="pb-3 pr-3">Status</th>
          <th className="pb-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id} className="border-t border-line">
            <td className="py-3 pr-3 font-medium">{displayField(job.title)}</td>
            <td className="py-3 pr-3">{displayField(job.company)}</td>
            <td className="py-3 pr-3">{formatContract(job.contractType)}</td>
            <td className="py-3 pr-3">{formatJobDeadline(job.deadline)}</td>
            <td className="py-3 pr-3">{job.status}</td>
            <td className="py-3">
              <AdminJobActions jobId={job.id} status={job.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function AdminUsersTable({ currentUserId }: { currentUserId: string }) {
  const users = await withTimeout(
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { profile: { select: { id: true } } },
    }),
    2500,
    [],
  );

  if (!users.length) {
    return (
      <section className="panel p-6">
        <p className="text-sm text-muted">Aucun utilisateur JobRadar.</p>
      </section>
    );
  }

  return (
    <section className="panel overflow-x-auto p-6">
      <h2 className="mb-4 font-semibold">Users</h2>
      <p className="mb-4 text-sm text-muted">
        Delete profile enlève le CV / headline. Delete user data enlève les données JobRadar. Le compte Clerk
        n&apos;est pas supprimé.
      </p>
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="pb-3 pr-3">Email</th>
            <th className="pb-3 pr-3">Name</th>
            <th className="pb-3 pr-3">Role</th>
            <th className="pb-3 pr-3">Profile</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-line">
              <td className="py-3 pr-3">{user.email ?? "Not specified"}</td>
              <td className="py-3 pr-3">{user.name ?? "Not specified"}</td>
              <td className="py-3 pr-3">{user.role}</td>
              <td className="py-3 pr-3">{user.profile ? "Yes" : "No"}</td>
              <td className="py-3">
                {user.id === currentUserId ? (
                  <span className="text-xs text-muted">You</span>
                ) : (
                  <AdminUserActions userId={user.id} hasProfile={Boolean(user.profile)} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
