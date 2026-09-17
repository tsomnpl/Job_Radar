"use client";

import Link from "next/link";
import { useState } from "react";
import { t, type AppLang } from "@/i18n/messages";

export function ApplyOfficialButton({
  jobId,
  officialUrl,
  signedIn,
  clerkEnabled,
  alreadyApplied,
  lang = "fr",
}: {
  jobId: string;
  officialUrl: string | null;
  signedIn: boolean;
  clerkEnabled: boolean;
  alreadyApplied?: boolean;
  lang?: AppLang;
}) {
  const [pending, setPending] = useState(false);
  const [applied, setApplied] = useState(Boolean(alreadyApplied));
  const [tracked, setTracked] = useState(Boolean(alreadyApplied));
  const returnTo = `/jobs/${jobId}`;

  if (!officialUrl) {
    return (
      <button type="button" disabled className="btn-primary rounded-full px-4 py-2 text-sm font-semibold opacity-60">
        {t(lang, "apply.missing")}
      </button>
    );
  }

  if (clerkEnabled && !signedIn) {
    return (
      <div className="panel space-y-3 p-4">
        <p className="font-semibold">{t(lang, "cta.apply")}</p>
        <p className="text-sm text-muted">{t(lang, "apply.needAuth")}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`}
            className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
          >
            {t(lang, "cta.signIn")}
          </Link>
          <Link
            href={`/sign-up?redirect_url=${encodeURIComponent(returnTo)}`}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold"
          >
            {t(lang, "cta.signUp")}
          </Link>
        </div>
      </div>
    );
  }

  async function openOfficial() {
    setPending(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { tracked?: boolean };
      setApplied(true);
      setTracked(Boolean(data.tracked));
    } catch {
      setApplied(true);
      setTracked(false);
    }
    window.open(officialUrl!, "_blank", "noopener,noreferrer");
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
        {pending ? t(lang, "apply.opening") : t(lang, "cta.apply")}
      </button>
      {applied ? (
        <p className="text-xs text-muted" role="status" aria-live="polite">
          {tracked ? t(lang, "apply.marked") : t(lang, "apply.untracked")}
        </p>
      ) : null}
    </div>
  );
}
