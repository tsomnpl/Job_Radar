"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportForm() {
  const router = useRouter();
  const [payload, setPayload] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function importJson(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setPending(false);
      setStatus("JSON invalide.");
      return;
    }
    const response = await fetch("/api/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setStatus(`Import KO : ${data.error ?? "erreur"}`);
      return;
    }
    setStatus(`Import OK — créées ${data.createdCount}, mises à jour ${data.updatedCount}, ignorées ${data.skippedCount}.`);
    router.refresh();
  }

  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPending(true);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/jobs/import", { method: "POST", body: form });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setStatus(`Import fichier KO : ${data.error ?? "erreur"}`);
      return;
    }
    setStatus(`Fichier ${file.name} : +${data.createdCount} / ~${data.updatedCount} / skip ${data.skippedCount}.`);
    router.refresh();
  }

  return (
    <form onSubmit={importJson} className="space-y-4">
      <label className="block text-sm text-muted">
        Fichier CSV ou JSON
        <input
          type="file"
          accept=".csv,application/json,.json"
          onChange={importFile}
          className="mt-2 block w-full text-sm"
        />
      </label>
      <textarea
        value={payload}
        onChange={(event) => setPayload(event.target.value)}
        rows={12}
        className="field w-full rounded-2xl p-4 font-mono text-xs outline-none"
        placeholder='{"jobs":[{"title":"...","company":"...","location":"...","description":"..."}]}'
      />
      <button
        type="submit"
        disabled={pending || !payload.trim()}
        className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Import..." : "Importer le JSON"}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </form>
  );
}
