"use client";

import Link from "next/link";
import { useEffect } from "react";
import { t } from "@/i18n/messages";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page]", error.message);
  }, [error]);

  const lang = "fr" as const;

  return (
    <div className="panel mx-auto max-w-lg p-8 text-center">
      <h1 className="text-2xl font-semibold">{t(lang, "error.generic")}</h1>
      <p className="mt-3 text-muted">{t(lang, "error.retry")}</p>
      <div className="mt-6 flex justify-center gap-4">
        <button type="button" onClick={reset} className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          {t(lang, "cta.retry")}
        </button>
        <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm">
          {t(lang, "cta.home")}
        </Link>
      </div>
    </div>
  );
}
