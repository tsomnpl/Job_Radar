import { formatDeadline } from "@/lib/job-lifecycle";
import { jobApplicationUrl, officialApplicationUrl } from "@/lib/jobs";
import type { JobRecord } from "@/lib/types";

function Row({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
      <span className={ok ? "text-xs text-accent" : "text-xs text-muted"}>{ok ? "Available" : "Not specified"}</span>
    </div>
  );
}

export function OpportunityVerification({ job }: { job: JobRecord }) {
  const sourceUrl = officialApplicationUrl(job.sourceUrl);
  const applyUrl = jobApplicationUrl(job);
  const lastSeen = job.importedAt ?? job.postedAt;

  return (
    <section className="panel p-6">
      <h2 className="font-semibold">Opportunity Verification</h2>
      <p className="mt-2 text-sm text-muted">
        JobRadar vérifie uniquement la présence de ces champs. Une URL http(s) n&apos;est pas une entreprise
        certifiée.
      </p>
      <div className="mt-4">
        <Row label="Source" ok={Boolean(job.source && job.source !== "unspecified")} detail={job.source || "Not specified"} />
        <Row label="Source URL" ok={Boolean(sourceUrl)} detail={sourceUrl ?? "Not specified"} />
        <Row
          label="Official application URL"
          ok={Boolean(applyUrl)}
          detail={applyUrl ? "Application link available" : "Not specified"}
        />
        <Row label="Last checked" ok={Boolean(lastSeen)} detail={formatDeadline(lastSeen)} />
        <Row
          label="Application destination"
          ok={Boolean(applyUrl)}
          detail={applyUrl ? "Official source" : "Information not available."}
        />
      </div>
    </section>
  );
}
