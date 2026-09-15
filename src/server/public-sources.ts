import { stripHtml } from "@/lib/html";
import { hasInternTitle, NOT_SPECIFIED, officialApplicationUrl } from "@/lib/jobs";
import { isUnrestrictedRemoteLocation, placesCompatible } from "@/lib/places";
import { fold, parseContractType, parseSeniority, parseSkillList, tokenize, unique } from "@/lib/normalize";
import { tokenMatchesHaystack } from "@/lib/synonyms";
import type { ContractType, SearchIntent, Seniority } from "@/lib/types";

export const PUBLIC_BOARDS = [
  { id: "jobicy", label: "Jobicy" },
  { id: "remoteok", label: "Remote OK" },
  { id: "remotive", label: "Remotive" },
] as const;

export const PUBLIC_BOARD_LABELS = PUBLIC_BOARDS.map((board) => board.label);

export type PublicBoardId = (typeof PUBLIC_BOARDS)[number]["id"];

export type PublicOpportunity = {
  id: string;
  source: PublicBoardId;
  title: string;
  company: string;
  location: string;
  country: string | null;
  remoteType: "remote";
  contractType: ContractType;
  seniority: Seniority;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skills: string[];
  description: string;
  sourceUrl: string;
  language: "en";
  postedAt: Date;
};

const REMOTEOK_META_TAGS = new Set([
  "digital nomad",
  "non tech",
  "full time",
  "part time",
  "internship",
  "intern",
  "exec",
  "legal",
]);

const STOP_TOKENS = new Set([
  "cherche",
  "recherche",
  "offre",
  "offres",
  "poste",
  "postes",
  "job",
  "jobs",
  "remote",
  "hybrid",
  "hybride",
  "onsite",
  "teletravail",
  "opportunite",
  "opportunites",
  "pour",
  "une",
  "des",
  "les",
  "the",
  "and",
  "avec",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asString).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(/[,;/|]/g).map((item) => item.trim()).filter(Boolean);
  return [];
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  return null;
}

function asDate(value: unknown): Date {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 1e12 ? value * 1000 : value;
    const fromEpoch = new Date(millis);
    if (!Number.isNaN(fromEpoch.getTime())) return fromEpoch;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function firstUrl(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const url = officialApplicationUrl(asString(candidate));
    if (url) return url;
  }
  return null;
}

function locationFrom(value: unknown): string {
  const raw = asString(value);
  return raw || NOT_SPECIFIED;
}

function classifyRole(title: string, typeBlob: string, levelBlob: string): {
  contractType: ContractType;
  seniority: Seniority;
} {
  const blob = `${title} ${typeBlob} ${levelBlob}`;
  const contractType = parseContractType(blob) ?? parseContractType(typeBlob) ?? "other";
  const seniority =
    parseSeniority(blob) ?? (contractType === "internship" || contractType === "apprenticeship" ? "intern" : "mid");
  return { contractType, seniority };
}

function finalize(input: {
  source: PublicBoardId;
  sourceId: string;
  title: string;
  company: string;
  location: string;
  country?: string | null;
  typeBlob?: string;
  levelBlob?: string;
  description: string;
  sourceUrl: string | null;
  skills?: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  postedAt?: Date;
}): PublicOpportunity | null {
  const title = input.title.trim();
  const company = input.company.trim();
  const description = stripHtml(input.description).slice(0, 8000);
  const sourceUrl = input.sourceUrl;
  if (!title || !company || !description || !sourceUrl) return null;
  const { contractType, seniority } = classifyRole(title, input.typeBlob ?? "", input.levelBlob ?? "");
  return {
    id: `pub_${input.source}_${input.sourceId}`,
    source: input.source,
    title,
    company,
    location: input.location.trim() || NOT_SPECIFIED,
    country: input.country?.trim() || null,
    remoteType: "remote",
    contractType,
    seniority,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    currency: input.currency?.trim() || "USD",
    skills: parseSkillList(input.skills ?? []),
    description,
    sourceUrl,
    language: "en",
    postedAt: input.postedAt ?? new Date(),
  };
}

export function parseJobicyPayload(payload: unknown): PublicOpportunity[] {
  const root = asRecord(payload);
  const jobs = Array.isArray(root?.jobs) ? root.jobs : Array.isArray(payload) ? payload : [];
  const parsed: PublicOpportunity[] = [];
  for (const item of jobs) {
    const job = asRecord(item);
    if (!job) continue;
    const id = asString(job.id) || asString(job.jobSlug);
    const record = finalize({
      source: "jobicy",
      sourceId: id,
      title: asString(job.jobTitle) || asString(job.title),
      company: asString(job.companyName) || asString(job.company),
      location: locationFrom(job.jobGeo),
      typeBlob: asStringList(job.jobType).join(" "),
      levelBlob: asString(job.jobLevel),
      description: asString(job.jobDescription) || asString(job.jobExcerpt),
      sourceUrl: firstUrl(job.url),
      skills: asStringList(job.jobIndustry),
      salaryMin: asFiniteNumber(job.salaryMin),
      salaryMax: asFiniteNumber(job.salaryMax),
      currency: asString(job.salaryCurrency) || "USD",
      postedAt: asDate(job.pubDate),
    });
    if (record) parsed.push(record);
  }
  return parsed;
}

export function parseRemoteOkPayload(payload: unknown): PublicOpportunity[] {
  const jobs = Array.isArray(payload) ? payload : [];
  const parsed: PublicOpportunity[] = [];
  for (const item of jobs) {
    const job = asRecord(item);
    if (!job || job.legal != null) continue;
    const id = asString(job.id) || asString(job.slug);
    const record = finalize({
      source: "remoteok",
      sourceId: id,
      title: asString(job.position) || asString(job.title),
      company: asString(job.company),
      location: locationFrom(job.location),
      description: asString(job.description),
      sourceUrl: firstUrl(job.apply_url, job.url),
      skills: asStringList(job.tags).filter((tag) => !REMOTEOK_META_TAGS.has(fold(tag))),
      salaryMin: asFiniteNumber(job.salary_min),
      salaryMax: asFiniteNumber(job.salary_max),
      currency: "USD",
      postedAt: asDate(job.date ?? job.epoch),
    });
    if (record) parsed.push(record);
  }
  return parsed;
}

export function parseRemotivePayload(payload: unknown): PublicOpportunity[] {
  const root = asRecord(payload);
  const jobs = Array.isArray(root?.jobs) ? root.jobs : [];
  const parsed: PublicOpportunity[] = [];
  for (const item of jobs) {
    const job = asRecord(item);
    if (!job) continue;
    const id = asString(job.id);
    const record = finalize({
      source: "remotive",
      sourceId: id,
      title: asString(job.title),
      company: asString(job.company_name),
      location: locationFrom(job.candidate_required_location),
      typeBlob: asString(job.job_type),
      description: asString(job.description),
      sourceUrl: firstUrl(job.url),
      skills: asStringList(job.tags),
      currency: "USD",
      postedAt: asDate(job.publication_date),
    });
    if (record) parsed.push(record);
  }
  return parsed;
}

function isInternSignal(job: PublicOpportunity): boolean {
  return hasInternTitle(job.title);
}

function roleTokensFromIntent(intent: SearchIntent): string[] {
  const locationFolds = [intent.location, intent.country]
    .filter((item): item is string => Boolean(item))
    .map(fold);
  return unique(
    [...intent.keywords, ...intent.skills, ...tokenize(intent.query)].filter((token) => {
      const folded = fold(token);
      if (folded.length < 3 || STOP_TOKENS.has(folded)) return false;
      return !locationFolds.some((place) => place.includes(folded) || folded.includes(place));
    }),
  );
}

function internIntent(intent: SearchIntent): boolean {
  return intent.contractType === "internship" || intent.seniority === "intern";
}

export function isRelevantToIntent(job: PublicOpportunity, intent: SearchIntent): boolean {
  if (internIntent(intent) && !isInternSignal(job)) return false;

  if (intent.location || intent.country) {
    const jobPlace = `${job.location} ${job.country ?? ""}`;
    const needles = [intent.location, intent.country].filter((item): item is string => Boolean(item));
    const geoHit = needles.some((place) => placesCompatible(place, jobPlace));
    const worldwide = isUnrestrictedRemoteLocation(job.location);
    if (!geoHit && !worldwide) return false;
  }

  const tokens = roleTokensFromIntent(intent).filter((token) => {
    if (internIntent(intent) && /^(stage|intern|internship|stagiaire|trainee)$/.test(fold(token))) return false;
    return true;
  });
  if (tokens.length === 0) return internIntent(intent) ? isInternSignal(job) : true;

  const haystack = fold(`${job.title} ${job.company} ${job.skills.join(" ")} ${job.description}`);
  const hits = tokens.filter((token) => tokenMatchesHaystack(token, haystack));
  const needed = tokens.length >= 4 ? 2 : 1;
  return hits.length >= needed;
}

export function filterRelevantOpportunities(
  jobs: PublicOpportunity[],
  intent: SearchIntent,
  limit = 25,
): PublicOpportunity[] {
  const seen = new Set<string>();
  const selected: PublicOpportunity[] = [];
  for (const job of jobs) {
    if (seen.has(job.sourceUrl) || seen.has(job.id)) continue;
    if (!isRelevantToIntent(job, intent)) continue;
    seen.add(job.sourceUrl);
    seen.add(job.id);
    selected.push(job);
    if (selected.length >= limit) break;
  }
  return selected;
}

const LOCATION_TAGS = new Set([
  "togo",
  "lome",
  "benin",
  "cotonou",
  "senegal",
  "dakar",
  "ghana",
  "accra",
  "nigeria",
  "lagos",
  "paris",
  "africa",
  "afrique",
]);

export function jobicyTagsForIntent(intent: SearchIntent): string[] {
  const tags: string[] = [];
  if (internIntent(intent)) tags.push("internship");
  const haystack = fold(`${intent.query} ${intent.keywords.join(" ")} ${intent.skills.join(" ")}`);
  if (/(cyber|securite|security|infosec)/.test(haystack)) tags.push("security");
  const extra = [...intent.skills, ...intent.keywords].map(fold).find((token) => {
    return token.length >= 3 && token.length <= 40 && !LOCATION_TAGS.has(token) && !STOP_TOKENS.has(token) && !tags.includes(token);
  });
  if (extra && extra !== "internship" && extra !== "security") tags.push(extra);
  return unique(tags).slice(0, 2);
}

export function jobicyUrlsForIntent(intent: SearchIntent): string[] {
  const tags = jobicyTagsForIntent(intent);
  if (!tags.length) return ["https://jobicy.com/api/v2/remote-jobs?count=50"];
  return tags.map((tag) => `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(tag)}`);
}

export const REMOTE_OK_URL = "https://remoteok.com/api";
export const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";
export const JOBICY_CRON_URLS = [
  "https://jobicy.com/api/v2/remote-jobs?count=50",
  "https://jobicy.com/api/v2/remote-jobs?count=50&tag=internship",
  "https://jobicy.com/api/v2/remote-jobs?count=50&tag=security",
];
