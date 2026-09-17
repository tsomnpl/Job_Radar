"use client";

import { useState } from "react";

export function CoverLetterPanel({ jobId }: { jobId: string }) {
  const [letter, setLetter] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/jobs/${jobId}/letter`, { method: "POST" });
    const data = (await response.json()) as { letter?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      setError(response.status === 401 ? "Connectez-vous pour générer une lettre." : "Impossible de générer la lettre.");
      return;
    }
    setLetter(data.letter ?? "");
  }

  return (
    <section className="panel space-y-3 p-6">
      <h3 className="font-semibold">Lettre de motivation</h3>
      <p className="text-sm text-muted">JobRadar rédige une base à partir de votre profil. Relisez avant d&apos;envoyer.</p>
      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent disabled:opacity-60"
      >
        {pending ? "Rédaction..." : "Générer une lettre"}
      </button>
      {error ? <p className="text-sm text-warn">{error}</p> : null}
      {letter ? <pre className="whitespace-pre-wrap text-sm leading-6 text-muted">{letter}</pre> : null}
    </section>
  );
}
