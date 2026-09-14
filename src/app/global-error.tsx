"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="grid min-h-screen place-items-center bg-[#07111a] text-[#e8f6f3]">
        <div className="max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold">JobRadar a rencontré une erreur</h1>
          <p className="mt-3 text-sm text-[#8eacb0]">{error.digest ? `Référence ${error.digest}` : "Réessayez dans un instant."}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-[#2ee6d6] px-4 py-2 text-sm font-semibold text-[#07111a]"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
