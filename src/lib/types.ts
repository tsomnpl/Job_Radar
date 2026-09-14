export const REMOTE_TYPES = ["remote", "hybrid", "onsite"] as const;
export const CONTRACT_TYPES = ["cdi", "cdd", "freelance", "internship", "apprenticeship", "other"] as const;
export const SENIORITY_LEVELS = ["intern", "junior", "mid", "senior", "lead"] as const;

export type RemoteType = (typeof REMOTE_TYPES)[number];
export type ContractType = (typeof CONTRACT_TYPES)[number];
export type Seniority = (typeof SENIORITY_LEVELS)[number];

export type SearchIntent = {
  query: string;
  keywords: string[];
  skills: string[];
  location: string | null;
  country: string | null;
  remoteType: RemoteType | null;
  contractType: ContractType | null;
  seniority: Seniority | null;
  language: string | null;
  source: "heuristic" | "rodium";
};

export type CandidateSnapshot = {
  skills: string[];
  languages: string[];
  locations: string[];
  seniority: Seniority | null;
  yearsExperience: number | null;
  remotePreference: RemoteType | null;
  headline: string | null;
  query: string;
};

export type MatchReason = {
  factor: string;
  label: string;
  weight: number;
  score: number;
  detail: string;
  polarity: "positive" | "neutral" | "negative";
};

export type MatchExplanation = {
  score: number;
  reasons: MatchReason[];
  gaps: string[];
  highlights: string[];
};

export type ParsedCv = {
  headline: string | null;
  summary: string;
  skills: string[];
  languages: string[];
  locations: string[];
  seniority: Seniority | null;
  yearsExperience: number | null;
  remotePreference: RemoteType | null;
  source: "heuristic" | "rodium";
};

export type JobInput = {
  title: string;
  company: string;
  location: string;
  country?: string | null;
  remoteType?: string | null;
  contractType?: string | null;
  seniority?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  skills?: string[] | string | null;
  languages?: string[] | string | null;
  description: string;
  sourceUrl?: string | null;
  source?: string | null;
  language?: string | null;
  postedAt?: string | Date | null;
};

export type JobRecord = {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string | null;
  remoteType: string;
  contractType: string;
  seniority: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skills: string[];
  languages: string[];
  description: string;
  sourceUrl: string | null;
  source: string;
  language: string;
  postedAt: Date;
};

export type RankedJob = JobRecord & {
  match: MatchExplanation;
};
