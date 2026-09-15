import Link from "next/link";
import { AdminJobActions } from "@/components/admin-job-actions";
import { AdminRadarForms } from "@/components/admin-extract-form";
import { ImportForm } from "@/components/import-form";
import { getAdminOrNull } from "@/lib/admin-page";
import { displayField, formatContract, formatJobDeadline } from "@/lib/jobs";
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

  return (
    <div className="space-y-6">
      {tab === "overview" || !tab ? (
        <section className="grid gap-4 md:grid-cols-4">
          <article className="panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Total</p>
            <p className="mt-2 text-3xl font-semibold">{jobs.length}</p>
          </article>
          <article className="panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Pending</p>
            <p className="mt-2 text-3xl font-semibold">{jobs.filter((job) => job.status === "pending").length}</p>
          </article>
          <article className="panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Published</p>
            <p className="mt-2 text-3xl font-semibold">{jobs.filter((job) => job.status === "published").length}</p>
          </article>
          <article className="panel p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Users / searches</p>
            <p className="mt-2 text-3xl font-semibold">
              {userCount} / {searchCount}
            </p>
          </article>
        </section>
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
            <p className="mt-2 text-sm text-muted">Les imports arrivent en pending, puis vous publiez.</p>
            <div className="mt-4">
              <ImportForm />
            </div>
          </div>
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
