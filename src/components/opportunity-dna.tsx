import { displayField, formatDuration, formatOpportunityType, formatRemote, formatSeniority } from "@/lib/jobs";
import { formatClosesIn, formatDeadline } from "@/lib/job-lifecycle";
import { formatJobCategory } from "@/lib/job-categories";
import { t, type AppLang } from "@/i18n/messages";
import type { JobRecord } from "@/lib/types";

export function OpportunityDna({
  job,
  compact = false,
  lang = "fr",
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
    | "category"
  >;
  compact?: boolean;
  lang?: AppLang;
}) {
  const all = [
    { label: t(lang, "dna.type"), value: formatOpportunityType(job.contractType) },
    { label: t(lang, "dna.company"), value: displayField(job.company) },
    { label: t(lang, "dna.location"), value: displayField(job.location) },
    { label: t(lang, "dna.workMode"), value: formatRemote(job.remoteType) },
    { label: t(lang, "dna.experience"), value: job.experience?.trim() ? job.experience : formatSeniority(job.seniority) },
    { label: t(lang, "dna.duration"), value: formatDuration(job.duration) },
    { label: t(lang, "dna.deadline"), value: formatClosesIn(job.deadline) },
    { label: t(lang, "dna.source"), value: displayField(job.source) },
    { label: t(lang, "dna.posted"), value: formatDeadline(job.postedAt) },
    { label: t(lang, "dna.skills"), value: job.skills.length ? job.skills.slice(0, compact ? 4 : 8).join(" · ") : displayField(null) },
    { label: t(lang, "dna.category"), value: displayField(formatJobCategory(job.category)) },
  ];
  const rows = compact
    ? all.filter((row) => [t(lang, "dna.type"), t(lang, "dna.workMode"), t(lang, "dna.deadline"), t(lang, "dna.skills")].includes(row.label))
    : all;

  return (
    <section className={compact ? "" : "panel p-6"}>
      <p className="text-xs uppercase tracking-[0.18em] text-accent">{t(lang, "dna.title")}</p>
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
