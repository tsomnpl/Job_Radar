"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page]", error.message);
  }, [error]);

  return (
    <div className="panel mx-auto max-w-lg p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong while searching for opportunities.</h1>
      <p className="mt-3 text-muted">Réessayez, ou revenez à l&apos;accueil du radar.</p>
      <div className="mt-6 flex justify-center gap-4">
        <button type="button" onClick={reset} className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          Réessayer
        </button>
        <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm">
          Accueil
        </Link>
      </div>
    </div>
  );
}
