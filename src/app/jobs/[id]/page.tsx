import { notFound } from "next/navigation";
import { Pill, ScoreRing } from "@/components/brand";
import { SaveJobButton } from "@/components/save-job-button";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { formatContract, formatRemote, formatSalary, formatSeniority } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { matchOneJob } from "@/server/rank";
import { explainNarrative } from "@/server/narrative";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const matched = await matchOneJob({ jobId: id, userId: user?.id });
  if (!matched) notFound();
  const { job, match } = matched;
  const narrative = await explainNarrative(job, match);
  const saved =
    user && isPersistedUser(user)
      ? await withDb(
          "savedJob",
          async () =>
            Boolean(
              await prisma.savedJob.findUnique({
                where: { userId_jobId: { userId: user.id, jobId: id } },
              }),
            ),
          false,
        )
      : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <article className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8eacb0]">{job.company}</p>
        <h1 className="mt-2 text-3xl font-semibold">{job.title}</h1>
        <p className="mt-2 text-[#b9d4d4]">
          {job.location}
          {job.country ? ` · ${job.country}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{formatRemote(job.remoteType)}</Pill>
          <Pill>{formatContract(job.contractType)}</Pill>
          <Pill>{formatSeniority(job.seniority)}</Pill>
          {formatSalary(job.salaryMin, job.salaryMax, job.currency) ? (
            <Pill>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</Pill>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <SaveJobButton jobId={job.id} initialSaved={saved} />
          {job.sourceUrl ? (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
            >
              Voir la source
            </a>
          ) : null}
        </div>
        <div className="mt-8 space-y-3 text-sm leading-7 whitespace-pre-wrap">{job.description}</div>
      </article>

      <aside className="space-y-4">
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Matching explicable</h2>
            <ScoreRing score={match.score} />
          </div>
          <p className="mt-4 text-sm text-[#b9d4d4]">{narrative}</p>
        </section>
        <section className="panel p-6 space-y-3">
          {match.reasons.map((reason) => (
            <div key={reason.factor} className="border-b border-[#1c3a4d] pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between text-sm">
                <span>{reason.label}</span>
                <span className={reason.polarity === "positive" ? "text-[#5be3a3]" : reason.polarity === "negative" ? "text-[#ff7a7a]" : "text-[#f5c14a]"}>
                  {reason.score}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#8eacb0]">{reason.detail}</p>
            </div>
          ))}
        </section>
        {match.gaps.length ? (
          <section className="panel p-6">
            <h3 className="font-semibold">Écarts</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {match.gaps.map((gap) => (
                <Pill key={gap}>{gap}</Pill>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
