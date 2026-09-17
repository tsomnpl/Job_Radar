"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminRadarForms() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [extracted, setExtracted] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function extract(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const response = await fetch("/api/jobs/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: raw }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setStatus("Extraction impossible. Collez un texte plus long, ou vérifiez Rodium / Postgres.");
      return;
    }
    setExtracted(JSON.stringify({ jobs: [data.job] }, null, 2));
    setStatus("Offre structurée. Relisez le JSON, puis importez — elle sera publiée tout de suite dans Offres.");
  }

  async function publishExtracted() {
    if (!extracted.trim()) return;
    setPending(true);
    const response = await fetch("/api/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: extracted,
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setStatus(`Import KO : ${data.error ?? "erreur"}`);
      return;
    }
    setStatus(`Import publié — +${data.createdCount} / ~${data.updatedCount}. Visible dans Offres.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={extract} className="space-y-3">
        <textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          rows={8}
          className="field w-full rounded-2xl p-4 text-sm outline-none"
          placeholder="Collez le texte brut d'une offre (ONG, ONU, entreprise, job board…). L'IA extraie titre, organisation, lieu, compétences."
        />
        <button
          type="submit"
          disabled={pending || raw.trim().length < 40}
          className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Extraction..." : "Analyze with AI"}
        </button>
      </form>
      {extracted ? (
        <>
          <textarea
            value={extracted}
            onChange={(event) => setExtracted(event.target.value)}
            rows={10}
            className="field w-full rounded-2xl p-4 font-mono text-xs outline-none"
          />
          <button
            type="button"
            onClick={publishExtracted}
            disabled={pending}
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:border-accent disabled:opacity-60"
          >
            Importer et publier
          </button>
        </>
      ) : null}
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}
