import Link from "next/link";
import { Pill, ScoreRing } from "@/components/brand";
import { CompanyLogo } from "@/components/company-logo";
import { DeadlineBadge } from "@/components/deadline-badge";
import { OpportunityDna } from "@/components/opportunity-dna";
import { formatContract, formatRemote, formatSeniority } from "@/lib/jobs";
import type { RankedJob } from "@/lib/types";

export function JobCard({ job, query }: { job: RankedJob; query?: string }) {
  const topReason = job.match.reasons.find((reason) => reason.polarity === "positive") ?? job.match.reasons[0];
  const href = query?.trim() ? `/jobs/${job.id}?q=${encodeURIComponent(query.trim())}` : `/jobs/${job.id}`;
  return (
    <Link href={href} className="panel panel-hover block p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyLogo name={job.company} src={job.companyLogo} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{job.company}</p>
            <h3 className="mt-1 text-lg font-semibold">{job.title}</h3>
            <p className="mt-1 text-sm text-muted">
              {job.location}
              {job.country ? ` · ${job.country}` : ""}
            </p>
          </div>
        </div>
        <ScoreRing score={job.match.score} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{formatRemote(job.remoteType)}</Pill>
        <Pill>{formatContract(job.contractType)}</Pill>
        <Pill>{formatSeniority(job.seniority)}</Pill>
        <DeadlineBadge deadline={job.deadline} />
        {job.source ? <Pill>{job.source}</Pill> : null}
      </div>
      {topReason ? (
        <p className="mt-4 text-sm text-muted">
          Why it matches: {topReason.detail}
        </p>
      ) : null}
      {job.match.gaps.length ? (
        <p className="mt-2 text-xs text-warn">Potential gaps : {job.match.gaps.slice(0, 4).join(", ")}</p>
      ) : null}
      <div className="mt-4 hidden md:block">
        <OpportunityDna job={job} compact />
      </div>
    </Link>
  );
}
