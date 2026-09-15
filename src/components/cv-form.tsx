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

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPending(true);
    setStatus(null);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/cv/upload", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      const messages: Record<string, string> = {
        UNSUPPORTED_FILE: "Formats acceptés : PDF, DOCX, TXT (5 Mo max).",
        FILE_TOO_LARGE: "Fichier trop volumineux (5 Mo max).",
        PDF_PARSE_FAILED: "Impossible de lire ce PDF. Collez le texte.",
        CV_TEXT_TOO_SHORT: "Peu de texte extrait. Collez le CV manuellement.",
      };
      setStatus(messages[data.error] ?? "Upload impossible.");
      return;
    }
    if (typeof data.cvText === "string") setCvText(data.cvText);
    setStatus("CV analysé. Compétences, expérience et formation ont été extraits.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        Upload PDF ou DOCX
        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={onUpload}
          className="mt-2 block w-full text-sm"
        />
      </label>
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
