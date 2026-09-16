import Link from "next/link";

import { applicationStatusLabel } from "@/lib/jobs";

export type RadarListItem = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  status: string;
  date?: string;
};

export function RadarJobList({
  items,
  empty,
}: {
  items: RadarListItem[];
  empty: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4">
          <Link href={`/jobs/${item.jobId}`} className="hover:text-accent">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{item.company}</p>
            <p className="font-semibold">{item.title}</p>
            {item.date ? <p className="text-xs text-muted">{item.date}</p> : null}
          </Link>
          <span className="shrink-0 text-xs text-muted">{applicationStatusLabel(item.status)}</span>
        </li>
      ))}
    </ul>
  );
}
