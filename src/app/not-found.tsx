import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel mx-auto max-w-lg p-8 text-center">
      <h1 className="text-2xl font-semibold">Offre introuvable</h1>
      <p className="mt-3 text-muted">Ce signal n&apos;est plus sur le radar.</p>
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/search" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          Find my opportunities
        </Link>
        <Link href="/jobs" className="rounded-full border border-line px-4 py-2 text-sm">
          Retour aux offres
        </Link>
      </div>
    </div>
  );
}
