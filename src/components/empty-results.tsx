import Link from "next/link";

export function EmptyResults({
  title = "No matching opportunities found.",
  hint = "Try changing your search criteria.",
  sources,
}: {
  title?: string;
  hint?: string;
  sources?: string[];
}) {
  return (
    <section className="panel space-y-4 p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted">{hint}</p>
      <p className="text-sm text-muted">
        We couldn&apos;t find verified opportunities matching your criteria. JobRadar does not invent offers.
      </p>
      {sources?.length ? (
        <p className="text-sm text-muted">Consulted: {sources.join(", ")}.</p>
      ) : null}
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        <li>changing your location</li>
        <li>changing the job type</li>
        <li>broadening your search</li>
      </ul>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/search" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          Search Opportunities
        </Link>
      </div>
    </section>
  );
}
