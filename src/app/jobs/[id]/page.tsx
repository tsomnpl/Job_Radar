import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill, ScoreRing } from "@/components/brand";
import { ApplyButton } from "@/components/apply-button";
import { CoverLetterPanel } from "@/components/cover-letter-panel";
import { SaveJobButton } from "@/components/save-job-button";
import { getSessionUser, isPersistedUser } from "@/lib/auth";
import { withDb } from "@/lib/db";
import { isClerkConfigured } from "@/lib/env";
import {
  formatContract,
  formatDuration,
  formatOpportunityType,
  formatRemote,
  formatSalary,
  formatSeniority,
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
  const savedRow =
    user && isPersistedUser(user)
      ? await withDb(
          "savedJob",
          () => prisma.savedJob.findUnique({ where: { userId_jobId: { userId: user.id, jobId: id } } }),
          null,
        )
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <article className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{job.company}</p>
        <h1 className="mt-2 text-3xl font-semibold">{job.title}</h1>
        <p className="mt-2 text-muted">
          {job.location}
          {job.country ? ` · ${job.country}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>{formatOpportunityType(job.contractType)}</Pill>
          <Pill>{formatContract(job.contractType)}</Pill>
          <Pill>{formatDuration(job.contractType)}</Pill>
          <Pill>{formatRemote(job.remoteType)}</Pill>
          <Pill>{formatSeniority(job.seniority)}</Pill>
          {job.source === "ai-proposal" ? <Pill>Piste IA</Pill> : null}
          {formatSalary(job.salaryMin, job.salaryMax, job.currency) ? (
            <Pill>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</Pill>
          ) : null}
        </div>
        {job.source === "ai-proposal" ? (
          <p className="mt-4 text-sm text-warn">
            Piste générée par l&apos;IA : ce n&apos;est pas une annonce officielle scrapée. À sourcer et valider.
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <SaveJobButton jobId={job.id} initialSaved={Boolean(savedRow)} />
          {user || !isClerkConfigured() ? (
            <ApplyButton jobId={job.id} initialStatus={savedRow?.status ?? null} />
          ) : (
            <Link href="/sign-in" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
              Connexion pour postuler
            </Link>
          )}
          {job.sourceUrl && !job.sourceUrl.startsWith("ai:") ? (
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
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
            <h2 className="font-semibold">Compatibilité IA</h2>
            <ScoreRing score={match.score} />
          </div>
          <p className="mt-4 text-sm text-muted">{narrative}</p>
        </section>
        <section className="panel space-y-3 p-6">
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
            <h3 className="font-semibold">Compétences ou critères manquants</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {match.gaps.map((gap) => (
                <Pill key={gap}>{gap}</Pill>
              ))}
            </div>
          </section>
        ) : null}
        <CoverLetterPanel jobId={job.id} />
      </aside>
    </div>
  );
}
