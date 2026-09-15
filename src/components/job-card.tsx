import Link from "next/link";
import { Pill, ScoreRing } from "@/components/brand";
import { CompanyLogo } from "@/components/company-logo";
import { formatContract, formatJobDeadline, formatLifecycle, formatRemote, formatSeniority } from "@/lib/jobs";
import type { RankedJob } from "@/lib/types";

export function JobCard({ job }: { job: RankedJob }) {
  const topReason = job.match.reasons.find((reason) => reason.polarity === "positive") ?? job.match.reasons[0];
  return (
    <Link href={`/jobs/${job.id}`} className="panel block p-5 transition hover:border-accent">
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
        <Pill>Deadline: {formatJobDeadline(job.deadline)}</Pill>
        <Pill>{formatLifecycle(job.deadline)}</Pill>
        {job.source ? <Pill>{job.source}</Pill> : null}
      </div>
      {topReason ? <p className="mt-4 text-sm text-muted">{topReason.detail}</p> : null}
      {job.match.gaps.length ? (
        <p className="mt-2 text-xs text-warn">Écarts : {job.match.gaps.slice(0, 4).join(", ")}</p>
      ) : null}
    </Link>
  );
}
