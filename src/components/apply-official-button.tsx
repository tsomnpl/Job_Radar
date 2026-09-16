"use client";

import Link from "next/link";
import { useState } from "react";
import { NOT_SPECIFIED } from "@/lib/jobs";

export function ApplyOfficialButton({
  jobId,
  officialUrl,
  signedIn,
  clerkEnabled,
  alreadyApplied,
}: {
  jobId: string;
  officialUrl: string | null;
  signedIn: boolean;
  clerkEnabled: boolean;
  alreadyApplied?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [applied, setApplied] = useState(Boolean(alreadyApplied));
  const returnTo = `/jobs/${jobId}`;

  if (!officialUrl) {
    return (
      <button type="button" disabled className="btn-primary rounded-full px-4 py-2 text-sm font-semibold opacity-60">
        Postuler — {NOT_SPECIFIED}
      </button>
    );
  }

  if (clerkEnabled && !signedIn) {
    return (
      <div className="panel space-y-3 p-4">
        <p className="font-semibold">Postuler</p>
        <p className="text-sm text-muted">Connectez-vous ou créez un compte JobRadar pour continuer.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`}
            className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
          >
            Sign in
          </Link>
          <Link
            href={`/sign-up?redirect_url=${encodeURIComponent(returnTo)}`}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const applyUrl = officialUrl;

  async function openOfficial() {
    setPending(true);
    try {
      await fetch(`/api/jobs/${jobId}/apply`, { method: "POST" });
      setApplied(true);
    } catch {
      /* still open the official URL */
    }
    window.open(applyUrl, "_blank", "noopener,noreferrer");
    setPending(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openOfficial}
        disabled={pending}
        className="btn-primary rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Opening…" : "Postuler maintenant"}
      </button>
      {applied ? (
        <p className="text-xs text-muted">Marked as applied — you opened the official link. JobRadar did not submit the application for you.</p>
      ) : null}
    </div>
  );
}
