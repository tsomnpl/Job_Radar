"use client";

import { useState } from "react";

const PROMPTS = [
  "Pourquoi cette offre correspond-elle à mon profil ?",
  "Quelles compétences me manquent ?",
  "Comment adapter mon CV ?",
  "Quels éléments dois-je vérifier ?",
];

export function OpportunityCopilot({
  jobId,
  signedIn,
  lang = "fr",
}: {
  jobId: string;
  signedIn: boolean;
  lang?: "fr" | "en";
}) {
  const [question, setQuestion] = useState(PROMPTS[0] ?? "");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!signedIn) {
      setError(lang === "en" ? "Sign in or create your JobRadar account to continue." : "Connectez-vous ou créez un compte JobRadar pour continuer.");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch(`/api/jobs/${jobId}/copilot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = (await response.json()) as { answer?: string; source?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      if (response.status === 401) {
        setError("Sign in or create your JobRadar account to continue.");
        return;
      }
      if (response.status === 404) {
        setError(lang === "en" ? "Hey — coming soon." : "Hey — coming soon.");
        return;
      }
      if (response.status === 429) {
        setError("Too many Copilot requests. Try again in a minute.");
        return;
      }
      setError("Something went wrong while searching for opportunities.");
      return;
    }
    setAnswer(data.answer ?? "Information not available.");
  }

  return (
    <section className="panel space-y-3 p-6">
      <h3 className="font-semibold">{lang === "en" ? "Opportunity Copilot" : "Opportunity Copilot"}</h3>
      <p className="text-sm text-muted">
        {lang === "en"
          ? "Assistant for this offer. It does not invent deadlines, salaries, or URLs."
          : "Assistant lié à cette offre. Il n'invente pas de deadline, salaire ou URL."}
      </p>
      <form onSubmit={ask} className="space-y-3">
        <label className="block text-sm">
          <span className="sr-only">Question</span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            className="field mt-1 w-full rounded-xl px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setQuestion(item)}
              className="rounded-full border border-line px-3 py-1 text-xs hover:border-accent"
            >
              {item}
            </button>
          ))}
        </div>
        <button type="submit" disabled={pending} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {pending ? "Analyzing…" : "Ask Copilot"}
        </button>
      </form>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {answer ? (
        <div className="text-sm leading-6">
          <p>{answer}</p>
          <p className="mt-2 text-xs text-muted">
            {lang === "en" ? "Answer based on this offer’s real data." : "Réponse basée sur les données réelles de l’offre."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
