import { displayField, formatDuration, formatOpportunityType, formatRemote, formatSeniority } from "@/lib/jobs";
import { formatClosesIn, formatDeadline } from "@/lib/job-lifecycle";
import type { JobRecord } from "@/lib/types";

export function OpportunityDna({
  job,
  compact = false,
}: {
  job: Pick<
    JobRecord,
    | "contractType"
    | "company"
    | "location"
    | "remoteType"
    | "seniority"
    | "skills"
    | "duration"
    | "deadline"
    | "source"
    | "postedAt"
    | "experience"
  >;
  compact?: boolean;
}) {
  const all = [
    { label: "Type", value: formatOpportunityType(job.contractType) },
    { label: "Company", value: displayField(job.company) },
    { label: "Location", value: displayField(job.location) },
    { label: "Work mode", value: formatRemote(job.remoteType) },
    { label: "Experience", value: job.experience?.trim() ? job.experience : formatSeniority(job.seniority) },
    { label: "Duration", value: formatDuration(job.duration) },
    { label: "Deadline", value: formatClosesIn(job.deadline) },
    { label: "Source", value: displayField(job.source) },
    { label: "Posted date", value: formatDeadline(job.postedAt) },
    { label: "Skills", value: job.skills.length ? job.skills.slice(0, compact ? 4 : 8).join(" · ") : displayField(null) },
  ];
  const rows = compact ? all.filter((row) => ["Type", "Work mode", "Deadline", "Skills"].includes(row.label)) : all;

  return (
    <section className={compact ? "" : "panel p-6"}>
      <p className="text-xs uppercase tracking-[0.18em] text-accent">Opportunity DNA</p>
      <dl className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2" : "md:grid-cols-2"}`}>
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">{row.label}</dt>
            <dd className="mt-1 text-sm">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
