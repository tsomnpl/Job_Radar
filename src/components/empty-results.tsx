import Link from "next/link";
import { getRequestLang, t } from "@/i18n";

export async function EmptyResults({
  title,
  hint,
  sources,
}: {
  title?: string;
  hint?: string;
  sources?: string[];
}) {
  const lang = await getRequestLang();
  return (
    <section className="panel space-y-4 p-6">
      <h2 className="text-xl font-semibold">{title ?? t(lang, "empty.none")}</h2>
      <p className="text-sm text-muted">{hint ?? t(lang, "empty.hint")}</p>
      <p className="text-sm text-muted">{t(lang, "empty.radar")}</p>
      {sources?.length ? (
        <p className="text-sm text-muted">
          {lang === "fr" ? "Consulté" : "Consulted"}: {sources.join(", ")}.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/search" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          {t(lang, "cta.find")}
        </Link>
      </div>
    </section>
  );
}
