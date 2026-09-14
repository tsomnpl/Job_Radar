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
      <h1 className="text-2xl font-semibold">Cette page n&apos;a pas pu charger</h1>
      <p className="mt-3 text-[#b9d4d4]">
        Un incident serveur a interrompu l&apos;affichage. Réessayez, ou revenez à l&apos;accueil.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button type="button" onClick={reset} className="rounded-full bg-[#2ee6d6] px-4 py-2 text-sm font-semibold text-[#07111a]">
          Réessayer
        </button>
        <Link href="/" className="rounded-full border border-[#1c3a4d] px-4 py-2 text-sm">
          Accueil
        </Link>
      </div>
    </div>
  );
}
