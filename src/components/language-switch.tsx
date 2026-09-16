"use client";

import { useRouter } from "next/navigation";
import { LANG_COOKIE, type AppLang } from "@/i18n/messages";

export function LanguageSwitch({ lang }: { lang: AppLang }) {
  const router = useRouter();

  function setLang(next: AppLang) {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    void fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next }),
    }).finally(() => router.refresh());
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-line text-xs" role="group" aria-label={lang === "fr" ? "Langue" : "Language"}>
      <button
        type="button"
        className={`px-2 py-1 ${lang === "fr" ? "bg-elev font-semibold text-accent" : "text-muted"}`}
        aria-pressed={lang === "fr"}
        onClick={() => setLang("fr")}
      >
        FR
      </button>
      <button
        type="button"
        className={`px-2 py-1 ${lang === "en" ? "bg-elev font-semibold text-accent" : "text-muted"}`}
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}
