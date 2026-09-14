"use client";

import { useState } from "react";

export function CvOptimizeButton({ cvText }: { cvText: string }) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    const response = await fetch("/api/cv/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText }),
    });
    const data = (await response.json()) as { advice?: string };
    setPending(false);
    setAdvice(data.advice ?? "Ajoutez davantage de texte de CV pour un coaching utile.");
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={run}
        disabled={pending || cvText.trim().length < 40}
        className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent disabled:opacity-60"
      >
        {pending ? "Analyse..." : "Optimiser le CV (IA)"}
      </button>
      {advice ? <p className="text-sm leading-6 text-muted whitespace-pre-wrap">{advice}</p> : null}
    </div>
  );
}
