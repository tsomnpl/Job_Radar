import { fold, unique } from "./normalize";

const QUERY_SYNONYMS: Record<string, string[]> = {
  stage: ["intern", "internship", "stagiaire", "trainee"],
  stagiaire: ["intern", "internship", "stage", "trainee"],
  intern: ["stage", "internship", "stagiaire", "trainee"],
  internship: ["stage", "intern", "stagiaire", "trainee"],
  internships: ["stage", "intern", "internship", "trainee"],
  trainee: ["intern", "internship", "stage"],
  cybersecurite: ["cyber", "cybersecurity", "security", "infosec", "appsec"],
  cybersecurity: ["cyber", "cybersecurite", "security", "infosec"],
  cyber: ["cybersecurity", "cybersecurite", "security", "infosec"],
  securite: ["security", "cybersecurity", "cybersecurite"],
  security: ["cybersecurity", "cybersecurite", "infosec"],
  infosec: ["security", "cybersecurity", "cyber"],
  developpeur: ["developer", "engineer", "dev"],
  developer: ["developpeur", "engineer", "dev"],
  engineer: ["developer", "developpeur", "ingenieur"],
  ingenieur: ["engineer", "developer"],
  consulting: ["consultant", "mission"],
  consultant: ["consulting", "mission"],
  mission: ["freelance", "consulting", "consultant"],
  ong: ["ngo", "nonprofit"],
  ngo: ["ong", "nonprofit"],
};

const PREFIX_VARIANTS = new Set(["cyber", "info", "data", "dev"]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function expandQueryToken(token: string): string[] {
  const folded = fold(token);
  if (!folded) return [];
  return unique([folded, ...(QUERY_SYNONYMS[folded] ?? [])]);
}

/** Whole-token match. "intern" must not hit "internal" / "international". */
export function variantInHaystack(variant: string, haystackFolded: string): boolean {
  if (variant.length < 2) return false;
  const escaped = escapeRegExp(variant);
  const allowPrefix = PREFIX_VARIANTS.has(variant);
  const end = allowPrefix ? "" : "(?:[^a-z0-9+#]|$)";
  return new RegExp(`(?:^|[^a-z0-9+#])${escaped}${end}`).test(haystackFolded);
}

export function tokenMatchesHaystack(token: string, haystackFolded: string): boolean {
  return expandQueryToken(token).some((variant) => variantInHaystack(variant, haystackFolded));
}
