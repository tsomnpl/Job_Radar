"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileQuickForm({
  initialHeadline = "",
  initialSkills = "",
  initialLocations = "",
  initialSeniority = "",
  hasProfile = false,
}: {
  initialHeadline?: string;
  initialSkills?: string;
  initialLocations?: string;
  initialSeniority?: string;
  hasProfile?: boolean;
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

  async function remove(scope: "profile" | "account") {
    const message =
      scope === "account"
        ? "Supprimer toutes vos données JobRadar (profil, CV, sauvegardes, candidatures) ? Votre compte Clerk reste. Vous pourrez vous reconnecter avec un profil vide."
        : "Supprimer ce profil et le CV enregistré ? Cette action est définitive.";
    if (!confirm(message)) return;
    setPending(true);
    setStatus(null);
    const response = await fetch(`/api/profile?scope=${scope}`, { method: "DELETE" });
    setPending(false);
    if (!response.ok) {
      setStatus("Suppression impossible.");
      return;
    }
    setHeadline("");
    setSkills("");
    setLocations("");
    setSeniority("");
    setStatus(scope === "account" ? "Données JobRadar supprimées." : "Profil supprimé.");
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
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {pending ? "Enregistrement..." : "Enregistrer le profil"}
        </button>
        {hasProfile ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void remove("profile")}
            className="rounded-xl border border-danger px-4 py-2 text-sm font-semibold text-danger disabled:opacity-60"
          >
            Supprimer le profil
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => void remove("account")}
          className="rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-60"
        >
          Supprimer mes données
        </button>
      </div>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </form>
  );
}
