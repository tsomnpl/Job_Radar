import { fold } from "./normalize";
import { NOT_SPECIFIED } from "./jobs";

const AFRICA_PLACES = new Set([
  "africa",
  "afrique",
  "west africa",
  "afrique de l ouest",
  "togo",
  "tg",
  "lome",
  "benin",
  "bj",
  "cotonou",
  "senegal",
  "sn",
  "dakar",
  "ghana",
  "gh",
  "accra",
  "nigeria",
  "ng",
  "lagos",
  "cote d ivoire",
  "cotedivoire",
  "ci",
  "abidjan",
  "burkina",
  "bf",
  "ouagadougou",
  "mali",
  "ml",
  "bamako",
  "niger",
  "ne",
  "niamey",
]);

/** Remote jobs that do not restrict applicants to a region. */
export function isUnrestrictedRemoteLocation(location: string | null | undefined): boolean {
  const folded = fold(location ?? "");
  if (!folded || folded === fold(NOT_SPECIFIED)) return true;
  return /^(anywhere|worldwide|world wide|global|unrestricted|remote)$/.test(folded);
}

export function placesCompatible(candidatePlace: string, jobPlace: string): boolean {
  const candidate = fold(candidatePlace);
  const job = fold(jobPlace);
  if (!candidate || !job) return false;
  if (job.includes(candidate) || candidate.includes(job)) return true;
  if (isUnrestrictedRemoteLocation(jobPlace)) return true;
  const candidateAfrica = [...AFRICA_PLACES].some((place) => candidate.includes(place));
  const jobAfrica = [...AFRICA_PLACES].some((place) => job.includes(place));
  return candidateAfrica && jobAfrica;
}
