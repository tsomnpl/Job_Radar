import Link from "next/link";
import { Pill, ScoreRing } from "@/components/brand";
import { formatContract, formatRemote, formatSeniority } from "@/lib/jobs";
import type { RankedJob } from "@/lib/types";

export function JobCard({ job }: { job: RankedJob }) {
  const topReason = job.match.reasons.find((reason) => reason.polarity === "positive") ?? job.match.reasons[0];
  return (
    <Link href={`/jobs/${job.id}`} className="panel block p-5 transition hover:border-[#2ee6d6]/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8eacb0]">{job.company}</p>
          <h3 className="mt-1 text-lg font-semibold">{job.title}</h3>
          <p className="mt-1 text-sm text-[#b9d4d4]">
            {job.location}
            {job.country ? ` · ${job.country}` : ""}
          </p>
        </div>
        <ScoreRing score={job.match.score} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>{formatRemote(job.remoteType)}</Pill>
        <Pill>{formatContract(job.contractType)}</Pill>
        <Pill>{formatSeniority(job.seniority)}</Pill>
      </div>
      {topReason ? <p className="mt-4 text-sm text-[#cfe7e4]">{topReason.detail}</p> : null}
      {job.match.gaps.length ? (
        <p className="mt-2 text-xs text-[#f5c14a]">Écarts : {job.match.gaps.slice(0, 4).join(", ")}</p>
      ) : null}
    </Link>
  );
}
