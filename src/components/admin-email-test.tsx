"use client";

import { useState } from "react";

export function AdminEmailTest() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function send() {
    setPending(true);
    setStatus(null);
    const response = await fetch("/api/admin/email/test", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; skipped?: boolean };
    setPending(false);
    if (response.status === 503 || data.error === "EMAIL_NOT_CONFIGURED") {
      setStatus("GMAIL_USER / GMAIL_APP_PASSWORD manquent. Aucun email n’est envoyé.");
      return;
    }
    if (!response.ok) {
      setStatus(data.error === "FORBIDDEN" ? "Accès admin refusé." : "Envoi impossible.");
      return;
    }
    setStatus(data.ok ? "Email de test envoyé." : data.skipped ? "Déjà envoyé récemment." : "Envoi impossible.");
  }

  return (
    <div className="panel space-y-3 p-6">
      <h2 className="font-semibold">Email SMTP (Gmail)</h2>
      <p className="text-sm text-muted">
        Envoie un message de test vers l’email Clerk admin. JobRadar n’invente pas d’offre dans cet email.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={send}
        className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Send test email"}
      </button>
      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}
