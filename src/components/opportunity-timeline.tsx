import Link from "next/link";
import { groupByTimeline } from "@/lib/radar-view";

type Item = { id: string; title: string; company: string; postedAt: Date };

export function OpportunityTimeline({ jobs }: { jobs: Item[] }) {
  const groups = groupByTimeline(jobs);
  const rows = [
    { key: "today" as const, label: "Today", items: groups.today },
    { key: "yesterday" as const, label: "Yesterday", items: groups.yesterday },
    { key: "earlier" as const, label: "Earlier", items: groups.earlier },
  ];

  if (!jobs.length) {
    return (
      <section className="panel p-6">
        <h2 className="font-semibold">New on your radar</h2>
        <p className="mt-3 text-sm text-muted">No new opportunities detected.</p>
      </section>
    );
  }

  return (
    <section className="panel p-6">
      <h2 className="font-semibold">New on your radar</h2>
      <div className="mt-4 space-y-5">
        {rows.map((row) => (
          <div key={row.key}>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              {row.label}
              {row.items.length ? ` · ${row.items.length} opportunit${row.items.length === 1 ? "y" : "ies"} detected` : ""}
            </p>
            {row.items.length ? (
              <ul className="mt-2 space-y-2">
                {row.items.slice(0, 5).map((job) => (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}`} className="text-sm hover:text-accent">
                      {job.company} — {job.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No new opportunities detected.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
