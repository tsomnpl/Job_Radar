"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileQuickForm({
  initialHeadline = "",
  initialSkills = "",
  initialLocations = "",
  initialSeniority = "",
}: {
  initialHeadline?: string;
  initialSkills?: string;
  initialLocations?: string;
  initialSeniority?: string;
}) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initialHeadline);
  const [skills, setSkills] = useState(initialSkills);
  const [locations, setLocations] = useState(initialLocations);
  const [seniority, setSeniority] = useState(initialSeniority);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline, skills, locations, seniority }),
    });
    setPending(false);
    if (!response.ok) {
      setStatus("Enregistrement impossible. Vérifiez la connexion / Postgres.");
      return;
    }
    setStatus("Profil enregistré.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        value={headline}
        onChange={(event) => setHeadline(event.target.value)}
        placeholder="Headline — ex. Data analyst junior, Cotonou"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={skills}
        onChange={(event) => setSkills(event.target.value)}
        placeholder="Compétences — sql, python, excel"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={locations}
        onChange={(event) => setLocations(event.target.value)}
        placeholder="Lieux / préférences — Lomé, remote, Dakar"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={seniority}
        onChange={(event) => setSeniority(event.target.value)}
        placeholder="Séniorité — intern, junior, mid, senior"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <button type="submit" disabled={pending} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60">
        {pending ? "Enregistrement..." : "Enregistrer le profil"}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </form>
  );
}
