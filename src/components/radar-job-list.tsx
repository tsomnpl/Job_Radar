import Link from "next/link";

export type RadarListItem = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  watching: "Sur le radar",
  applied: "Candidature envoyée",
  interviewing: "Entretien",
  offer: "Offre",
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
          </Link>
          <span className="shrink-0 text-xs text-muted">{STATUS_LABEL[item.status] ?? item.status}</span>
        </li>
      ))}
    </ul>
  );
}
