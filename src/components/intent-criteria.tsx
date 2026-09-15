import { Pill } from "@/components/brand";
import { formatContract, formatRemote, formatSeniority } from "@/lib/jobs";
import type { SearchIntent } from "@/lib/types";

export function IntentCriteria({ intent }: { intent: SearchIntent }) {
  const rows: Array<{ label: string; value: string }> = [];
  if (intent.contractType) rows.push({ label: "Type", value: formatContract(intent.contractType) });
  if (intent.skills.length) rows.push({ label: "Field", value: intent.skills.slice(0, 4).join(" · ") });
  if (intent.location) rows.push({ label: "Location", value: intent.location });
  if (intent.country && intent.country !== intent.location) rows.push({ label: "Country", value: intent.country });
  if (intent.remoteType) rows.push({ label: "Remote", value: formatRemote(intent.remoteType) });
  if (intent.seniority) rows.push({ label: "Experience", value: formatSeniority(intent.seniority) });

  return (
    <section className="panel p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">
        Intention extraite ({intent.source === "rodium" ? "RodiumAI" : "déterministe"})
      </p>
      {rows.length ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">{row.label}</dt>
              <dd className="mt-1 text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill>{intent.query}</Pill>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        {intent.source === "rodium"
          ? "Critères issus de RodiumAI. Le score de match reste algorithmique."
          : "Critères extraits par règles déterministes (RodiumAI non utilisé pour cette requête)."}
      </p>
    </section>
  );
}
