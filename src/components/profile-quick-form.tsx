"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileQuickForm({
  initialHeadline = "",
  initialSkills = "",
  initialLocations = "",
  initialSeniority = "",
  initialRemote = "",
  initialDomains = "",
  initialTypes = "",
  initialKeywords = "",
  emailNotifications = false,
  newOpportunityAlerts = true,
  deadlineAlerts = true,
  weeklyDigest = false,
  hasProfile = false,
}: {
  initialHeadline?: string;
  initialSkills?: string;
  initialLocations?: string;
  initialSeniority?: string;
  initialRemote?: string;
  initialDomains?: string;
  initialTypes?: string;
  initialKeywords?: string;
  emailNotifications?: boolean;
  newOpportunityAlerts?: boolean;
  deadlineAlerts?: boolean;
  weeklyDigest?: boolean;
  hasProfile?: boolean;
}) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initialHeadline);
  const [skills, setSkills] = useState(initialSkills);
  const [locations, setLocations] = useState(initialLocations);
  const [seniority, setSeniority] = useState(initialSeniority);
  const [remotePreference, setRemotePreference] = useState(initialRemote);
  const [domains, setDomains] = useState(initialDomains);
  const [contractTypes, setContractTypes] = useState(initialTypes);
  const [keywords, setKeywords] = useState(initialKeywords);
  const [mailOn, setMailOn] = useState(emailNotifications);
  const [alertNew, setAlertNew] = useState(newOpportunityAlerts);
  const [alertDeadline, setAlertDeadline] = useState(deadlineAlerts);
  const [digest, setDigest] = useState(weeklyDigest);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline,
        skills,
        locations,
        seniority,
        remotePreference,
        domains: domains || headline,
        contractTypes,
        keywords,
        emailNotifications: mailOn,
        newOpportunityAlerts: alertNew,
        deadlineAlerts: alertDeadline,
        weeklyDigest: digest,
      }),
    });
    setPending(false);
    if (!response.ok) {
      setStatus("Enregistrement impossible. Vérifiez la connexion / Postgres.");
      return;
    }
    setStatus("Profil enregistré. Ces préférences alimentent le matching.");
    router.refresh();
  }

  async function remove(scope: "profile" | "account") {
    const message =
      scope === "account"
        ? "Supprimer toutes vos données JobRadar (profil, CV, sauvegardes, candidatures) ? Votre compte Clerk reste."
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
    setRemotePreference("");
    setDomains("");
    setContractTypes("");
    setKeywords("");
    setStatus(scope === "account" ? "Données JobRadar supprimées." : "Profil supprimé.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        value={headline}
        onChange={(event) => setHeadline(event.target.value)}
        placeholder="Headline — ex. Cybersecurity intern"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={domains}
        onChange={(event) => setDomains(event.target.value)}
        placeholder="Domaines — cybersecurity, data, ONG"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={contractTypes}
        onChange={(event) => setContractTypes(event.target.value)}
        placeholder="Types — internship, cdi, mission"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={skills}
        onChange={(event) => setSkills(event.target.value)}
        placeholder="Compétences — sql, python, excel"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={keywords}
        onChange={(event) => setKeywords(event.target.value)}
        placeholder="Mots-clés — radar, ONU, remote"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={locations}
        onChange={(event) => setLocations(event.target.value)}
        placeholder="Lieux — Lomé, remote, Dakar"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <input
        value={seniority}
        onChange={(event) => setSeniority(event.target.value)}
        placeholder="Séniorité — intern, junior, mid, senior"
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      />
      <select
        value={remotePreference}
        onChange={(event) => setRemotePreference(event.target.value)}
        className="field w-full rounded-xl px-3 py-2 text-sm outline-none"
      >
        <option value="">Remote preference — Not specified</option>
        <option value="remote">Remote</option>
        <option value="hybrid">Hybrid</option>
        <option value="onsite">On-site</option>
      </select>
      <fieldset className="space-y-2 rounded-xl border border-line p-3 text-sm">
        <legend className="px-1 text-xs uppercase tracking-[0.14em] text-muted">Notifications</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={mailOn} onChange={(event) => setMailOn(event.target.checked)} />
          Emails (nécessite Gmail SMTP configuré)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={alertNew} onChange={(event) => setAlertNew(event.target.checked)} />
          Alertes nouvelles opportunités
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={alertDeadline} onChange={(event) => setAlertDeadline(event.target.checked)} />
          Alertes deadline
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={digest} onChange={(event) => setDigest(event.target.checked)} />
          Digest hebdomadaire
        </label>
      </fieldset>
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
      {status ? (
        <p className="text-sm text-muted" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </form>
  );
}
