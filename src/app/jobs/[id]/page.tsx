import { notFound } from "next/navigation";
import { Pill, ScoreRing } from "@/components/brand";
import { ApplyOfficialButton } from "@/components/apply-official-button";
import { CompanyLogo } from "@/components/company-logo";
import { CoverLetterPanel } from "@/components/cover-letter-panel";
import { SaveJobButton } from "@/components/save-job-button";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import {
  displayField,
  formatContract,
  formatDuration,
  formatJobDeadline,
  formatLifecycle,
  formatOpportunityType,
  formatRemote,
  formatSalary,
  formatSeniority,
  jobApplicationUrl,
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
  const officialUrl = jobApplicationUrl(job);
  const persisted = Boolean(user && isPersistedUser(user));
  const [savedRow, application] = persisted
    ? await Promise.all([
        withDb(
          "savedJob",
          () => prisma.savedJob.findUnique({ where: { userId_jobId: { userId: user!.id, jobId: id } } }),
          null,
        ),
        withDb(
          "application",
          () => prisma.application.findUnique({ where: { userId_jobId: { userId: user!.id, jobId: id } } }),
          null,
        ),
      ])
    : [null, null];

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);
  const signedIn = Boolean(user) && (!isClerkConfigured() || !user?.isDemo);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <article className="panel p-6 md:p-8">
        <div className="flex items-start gap-4">
          <CompanyLogo name={job.company} src={job.companyLogo} size={56} />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{displayField(job.company)}</p>
            <h1 className="mt-2 text-3xl font-semibold">{displayField(job.title)}</h1>
            <p className="mt-2 text-muted">
              {displayField(job.location)}
              {job.country ? ` · ${job.country}` : ""}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{formatOpportunityType(job.contractType)}</Pill>
          <Pill>{formatContract(job.contractType)}</Pill>
          <Pill>Duration: {formatDuration(job.duration)}</Pill>
          <Pill>Deadline: {formatJobDeadline(job.deadline)}</Pill>
          <Pill>{formatLifecycle(job.deadline)}</Pill>
          <Pill>{formatRemote(job.remoteType)}</Pill>
          <Pill>{formatSeniority(job.seniority)}</Pill>
          <Pill>{salary ?? displayField(null)}</Pill>
        </div>
        <dl className="mt-6 grid gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted">Source</dt>
            <dd>{displayField(job.source)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Education</dt>
            <dd>{displayField(job.education)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Experience</dt>
            <dd>{displayField(job.experience)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Language</dt>
            <dd>{displayField(job.language)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Benefits</dt>
            <dd>{displayField(job.benefits)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Start</dt>
            <dd>{formatJobDeadline(job.startDate)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">End</dt>
            <dd>{formatJobDeadline(job.endDate)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Application link</dt>
            <dd className="break-all">{officialUrl ?? displayField(null)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <SaveJobButton jobId={job.id} initialSaved={Boolean(savedRow)} />
          <ApplyOfficialButton
            jobId={job.id}
            officialUrl={officialUrl}
            signedIn={signedIn}
            clerkEnabled={isClerkConfigured()}
            alreadyApplied={Boolean(application)}
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
        {job.requirements ? (
          <div className="mt-6">
            <h2 className="font-semibold">Requirements</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{job.requirements}</p>
          </div>
        ) : null}
      </article>

      <aside className="space-y-4">
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Match</h2>
            <ScoreRing score={match.score} />
          </div>
          <p className="mt-2 text-sm font-semibold">{match.score}% Match</p>
          <p className="mt-4 text-sm text-muted">{narrative}</p>
          <p className="mt-3 text-xs text-muted">Score déterministe. La lettre et l&apos;analyse CV peuvent utiliser RodiumAI.</p>
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
