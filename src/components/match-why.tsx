import { Pill, ScoreRing } from "@/components/brand";
import { NOT_SPECIFIED } from "@/lib/jobs";
import type { MatchExplanation } from "@/lib/types";

function FactorRow({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className="font-medium">{typeof score === "number" ? `${score}%` : NOT_SPECIFIED}</span>
    </div>
  );
}

export function MatchWhy({
  match,
  narrative,
}: {
  match: MatchExplanation;
  narrative: string;
}) {
  const positives = match.reasons.filter((reason) => reason.polarity === "positive");
  const skills = match.reasons.find((reason) => reason.factor === "skills");
  const experience = match.reasons.find((reason) => reason.factor === "seniority");
  const location = match.reasons.find((reason) => reason.factor === "location");
  return (
    <div className="space-y-4">
      <section className="panel p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Why this opportunity matches you</h2>
          <ScoreRing score={match.score} />
        </div>
        <p className="mt-2 text-sm font-medium">{match.eligibility.label}</p>
        <p className="mt-1 text-sm text-muted">{match.eligibility.why}</p>
        <p className="mt-2 text-sm text-muted">{narrative}</p>
        <p className="mt-3 text-xs text-muted">
          Score algorithmique déterministe ({match.score}%). Le texte d&apos;analyse peut utiliser RodiumAI.
        </p>
      </section>
      <section className="panel space-y-2 p-6">
        <h3 className="font-semibold">Compatibility factors</h3>
        <FactorRow label="Skills" score={skills?.score ?? null} />
        <FactorRow label="Experience" score={experience?.score ?? null} />
        <FactorRow label="Location" score={location?.score ?? null} />
        <FactorRow label="Education" score={match.educationScore} />
        <FactorRow label="Requirements" score={match.requirementsScore} />
      </section>
      <section className="panel p-6">
        <h3 className="font-semibold">Points de correspondance</h3>
        {positives.length || match.matchedSkills.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {match.matchedSkills.slice(0, 8).map((skill) => (
              <li key={skill}>✓ {skill}</li>
            ))}
            {positives.map((reason) => (
              <li key={reason.factor}>✓ {reason.detail}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Information not available.</p>
        )}
      </section>
      <section className="panel p-6">
        <h3 className="font-semibold">Potential gaps</h3>
        {match.gaps.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {match.gaps.map((gap) => (
              <Pill key={gap}>{gap}</Pill>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Peu d&apos;écarts techniques déclarés sur cette offre.</p>
        )}
      </section>
      <section className="panel p-6 text-sm text-muted">
        <h3 className="font-semibold text-[var(--text)]">Éléments à vérifier</h3>
        <p className="mt-2">
          Deadline, éligibilité, et le lien officiel. JobRadar ne promet pas que vous obtiendrez le poste.
        </p>
      </section>
    </div>
  );
}
