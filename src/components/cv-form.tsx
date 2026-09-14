"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CvForm({ initialText = "" }: { initialText?: string }) {
  const router = useRouter();
  const [cvText, setCvText] = useState(initialText);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const response = await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setStatus(data.error === "CV_TEXT_TOO_SHORT" ? "Collez un CV plus long (40 caractères min.)." : "Erreur de parsing.");
      return;
    }
    setStatus("Profil mis à jour. Relancez une recherche pour recalculer les matches.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <textarea
        value={cvText}
        onChange={(event) => setCvText(event.target.value)}
        rows={16}
        className="field w-full rounded-2xl p-4 text-sm outline-none"
        placeholder="Collez votre CV en texte (FR ou EN). JobRadar en extrait compétences, séniorité, langues et localisations."
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Analyse du CV..." : "Parser le CV"}
        </button>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </div>
    </form>
  );
}
