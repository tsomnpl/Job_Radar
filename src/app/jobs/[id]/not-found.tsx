import Link from "next/link";
import { getRequestLang, t } from "@/i18n";

export default async function JobNotFound() {
  const lang = await getRequestLang();
  return (
    <div className="panel mx-auto max-w-lg p-8 text-center">
      <h1 className="text-2xl font-semibold">{t(lang, "404.jobTitle")}</h1>
      <p className="mt-3 text-muted">{t(lang, "404.jobBody")}</p>
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/search" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          {t(lang, "cta.find")}
        </Link>
        <Link href="/jobs" className="rounded-full border border-line px-4 py-2 text-sm">
          {t(lang, "nav.jobs")}
        </Link>
      </div>
    </div>
  );
}
