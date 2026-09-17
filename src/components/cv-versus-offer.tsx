import { displayField } from "@/lib/jobs";
import { t, type AppLang } from "@/i18n/messages";
import type { MatchExplanation } from "@/lib/types";

export function CvVersusOffer({
  match,
  jobEducation,
  candidateEducation,
  lang = "fr",
}: {
  match: MatchExplanation;
  jobEducation?: string | null;
  candidateEducation?: string | null;
  lang?: AppLang;
}) {
  const matched = match.matchedSkills.length ? match.matchedSkills.slice(0, 10).join(" · ") : displayField(null);
  const gaps = match.gaps.length ? match.gaps.slice(0, 10).join(" · ") : displayField(null);
  const education =
    jobEducation?.trim() || candidateEducation?.trim()
      ? `${displayField(candidateEducation)} → ${displayField(jobEducation)}`
      : displayField(null);

  return (
    <section className="panel space-y-3 p-6">
      <h2 className="font-semibold">{t(lang, "cvvs.title")}</h2>
      <p className="text-sm text-muted">{t(lang, "cvvs.hint")}</p>
      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">{t(lang, "cvvs.matched")}</dt>
          <dd className="mt-1">{matched}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">{t(lang, "cvvs.gaps")}</dt>
          <dd className="mt-1">{gaps}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">{t(lang, "cvvs.education")}</dt>
          <dd className="mt-1">{education}</dd>
        </div>
      </dl>
    </section>
  );
}
