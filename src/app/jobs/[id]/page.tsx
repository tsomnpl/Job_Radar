import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pill } from "@/components/brand";
import { ApplyOfficialButton } from "@/components/apply-official-button";
import { CompanyLogo } from "@/components/company-logo";
import { CoverLetterPanel } from "@/components/cover-letter-panel";
import { DeadlineBadge } from "@/components/deadline-badge";
import { MatchWhy } from "@/components/match-why";
import { OpportunityCopilot } from "@/components/opportunity-copilot";
import { OpportunityDna } from "@/components/opportunity-dna";
import { OpportunityVerification } from "@/components/opportunity-verification";
import { SaveJobButton } from "@/components/save-job-button";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import {
  displayField,
  formatContract,
  formatDuration,
  formatJobDeadline,
  formatOpportunityType,
  formatRemote,
  formatSalary,
  formatSeniority,
  jobApplicationUrl,
} from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { matchOneJob } from "@/server/rank";
import { getJobById } from "@/server/jobs-store";
import { explainNarrative } from "@/server/narrative";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) return { title: "Opportunity" };
  return {
    title: `${displayField(job.title)} · ${displayField(job.company)}`,
    description: `${displayField(job.location)} · ${displayField(job.source)}`,
  };
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const queryParams = await searchParams;
  const fromQuery = (Array.isArray(queryParams.q) ? queryParams.q[0] : queryParams.q)?.trim() ?? "";
  const user = await getSessionUser();
  const matched = await matchOneJob({ jobId: id, userId: user?.id, query: fromQuery || undefined });
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
          <Pill>{formatRemote(job.remoteType)}</Pill>
          <Pill>{formatSeniority(job.seniority)}</Pill>
          <DeadlineBadge deadline={job.deadline} />
          <Pill>{salary ?? displayField(null)}</Pill>
        </div>
        <div className="mt-6">
          <OpportunityDna job={job} />
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
        <div className="mt-6">
          <OpportunityVerification job={job} />
        </div>
      </article>

      <aside className="space-y-4">
        <MatchWhy match={match} narrative={narrative} />
        {user ? <CoverLetterPanel jobId={job.id} /> : (
          <section className="panel p-6 text-sm text-muted">
            Sign in to generate a cover letter for this verified offer.
          </section>
        )}
        <OpportunityCopilot jobId={job.id} signedIn={signedIn} />
      </aside>
    </div>
  );
}
