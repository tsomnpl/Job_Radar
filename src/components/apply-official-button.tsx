"use client";

import Link from "next/link";
import { useState } from "react";
import { NOT_SPECIFIED } from "@/lib/jobs";

export function ApplyOfficialButton({
  jobId,
  officialUrl,
  signedIn,
  clerkEnabled,
}: {
  jobId: string;
  officialUrl: string | null;
  signedIn: boolean;
  clerkEnabled: boolean;
}) {
  const [pending, setPending] = useState(false);
  const returnTo = `/jobs/${jobId}`;

  if (!officialUrl) {
    return (
      <button type="button" disabled className="btn-primary rounded-full px-4 py-2 text-sm font-semibold opacity-60">
        Apply — {NOT_SPECIFIED}
      </button>
    );
  }

  const applyUrl = officialUrl;

  if (clerkEnabled && !signedIn) {
    return (
      <div className="panel space-y-3 p-4">
        <p className="font-semibold">Sign in to continue</p>
        <p className="text-sm text-muted">
          Then JobRadar will send you to the official application website — not a fake JobRadar form.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`}
            className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
          >
            Sign In
          </Link>
          <Link
            href={`/sign-up?redirect_url=${encodeURIComponent(returnTo)}`}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  async function openOfficial() {
    setPending(true);
    try {
      await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "applied" }),
      });
    } catch {
      /* still open the official URL */
    }
    window.open(applyUrl, "_blank", "noopener,noreferrer");
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={openOfficial}
      disabled={pending}
      className="btn-primary rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
    >
      {pending ? "Opening…" : "Apply / Postuler"}
    </button>
  );
}
