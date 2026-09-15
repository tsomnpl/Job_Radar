import { notFound } from "next/navigation";
import { Pill, ScoreRing } from "@/components/brand";
import { ApplyOfficialButton } from "@/components/apply-official-button";
import { CoverLetterPanel } from "@/components/cover-letter-panel";
import { SaveJobButton } from "@/components/save-job-button";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import {
  NOT_SPECIFIED,
  displayField,
  formatContract,
  formatDuration,
  formatOpportunityType,
  formatRemote,
  formatSalary,
  formatSeniority,
  officialApplicationUrl,
} from "@/lib/jobs";
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
  const officialUrl = officialApplicationUrl(job.sourceUrl);
  const savedRow =
    user && isPersistedUser(user)
      ? await withDb(
          "savedJob",
          () => prisma.savedJob.findUnique({ where: { userId_jobId: { userId: user.id, jobId: id } } }),
          null,
        )
      : null;

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <article className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{displayField(job.company)}</p>
        <h1 className="mt-2 text-3xl font-semibold">{displayField(job.title)}</h1>
        <p className="mt-2 text-muted">
          {displayField(job.location)}
          {job.country ? ` · ${job.country}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{formatOpportunityType(job.contractType)}</Pill>
          <Pill>{formatContract(job.contractType)}</Pill>
          <Pill>Duration: {formatDuration()}</Pill>
          <Pill>Deadline: {NOT_SPECIFIED}</Pill>
          <Pill>{formatRemote(job.remoteType)}</Pill>
          <Pill>{formatSeniority(job.seniority)}</Pill>
          <Pill>{salary ?? NOT_SPECIFIED}</Pill>
        </div>
        <dl className="mt-6 grid gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted">Source</dt>
            <dd>{displayField(job.source)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Application link</dt>
            <dd className="break-all">{officialUrl ?? NOT_SPECIFIED}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <SaveJobButton jobId={job.id} initialSaved={Boolean(savedRow)} />
          <ApplyOfficialButton
            jobId={job.id}
            officialUrl={officialUrl}
            signedIn={Boolean(user)}
            clerkEnabled={isClerkConfigured()}
          />
          {officialUrl ? (
            <a
              href={officialUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
            >
              View source
            </a>
          ) : null}
        </div>
        <div className="mt-8 space-y-3 text-sm leading-7 whitespace-pre-wrap">
          {displayField(job.description)}
        </div>
      </article>

      <aside className="space-y-4">
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">AI MATCH</h2>
            <ScoreRing score={match.score} />
          </div>
          <p className="mt-2 text-sm font-semibold">{match.score}% Match</p>
          <p className="mt-4 text-sm text-muted">{narrative}</p>
        </section>
        <section className="panel space-y-3 p-6">
          <h3 className="font-semibold">Why you match</h3>
          {match.reasons.map((reason) => (
            <div key={reason.factor} className="border-b border-line pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between text-sm">
                <span>{reason.label}</span>
                <span
                  className={
                    reason.polarity === "positive"
                      ? "text-good"
                      : reason.polarity === "negative"
                        ? "text-danger"
                        : "text-warn"
                  }
                >
                  {reason.score}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">{reason.detail}</p>
            </div>
          ))}
        </section>
        {match.gaps.length ? (
          <section className="panel p-6">
            <h3 className="font-semibold">Missing skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {match.gaps.map((gap) => (
                <Pill key={gap}>{gap}</Pill>
              ))}
            </div>
          </section>
        ) : null}
        {user ? <CoverLetterPanel jobId={job.id} /> : (
          <section className="panel p-6 text-sm text-muted">
            Sign in to generate a cover letter for this verified offer.
          </section>
        )}
      </aside>
    </div>
  );
}
