"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LANG_COOKIE, parseLang, t, type AppLang } from "@/i18n/messages";

function cookieLang(): AppLang {
  if (typeof document === "undefined") return "fr";
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`));
  return parseLang(match?.[1]);
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<AppLang>("fr");
  useEffect(() => {
    setLang(cookieLang());
    console.error("[page]", error.message);
  }, [error]);

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
