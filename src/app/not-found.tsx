import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel mx-auto max-w-lg p-8 text-center">
      <h1 className="text-2xl font-semibold">Offre introuvable</h1>
      <p className="mt-3 text-muted">Ce signal n&apos;est plus sur le radar.</p>
      <Link href="/jobs" className="mt-6 inline-block text-accent">
        Retour aux offres
      </Link>
    </div>
  );
}
