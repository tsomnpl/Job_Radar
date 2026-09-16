export const REMOTE_TYPES = ["remote", "hybrid", "onsite", "unspecified"] as const;
export const CONTRACT_TYPES = [
  "internship",
  "employee",
  "cdi",
  "cdd",
  "consultant",
  "freelance",
  "mission",
  "apprenticeship",
  "other",
] as const;
export const SENIORITY_LEVELS = ["intern", "junior", "mid", "senior", "lead", "unspecified"] as const;

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
  education?: string | null;
  seniority: Seniority | null;
  yearsExperience: number | null;
  remotePreference: RemoteType | null;
  headline: string | null;
  query: string;
  contractTypes?: string[];
  keywords?: string[];
  domains?: string[];
  cvText?: string | null;
};

export type MatchReason = {
  factor: string;
  label: string;
  weight: number;
  score: number;
  detail: string;
  polarity: "positive" | "neutral" | "negative";
};

export type EligibilityLabel =
  | "Strong match"
  | "Potential match"
  | "Requirements unclear"
  | "Likely not eligible";

export type EligibilityAssessment = {
  label: EligibilityLabel;
  why: string;
};

export type MatchExplanation = {
  score: number;
  reasons: MatchReason[];
  matchedSkills: string[];
  gaps: string[];
  highlights: string[];
  eligibility: EligibilityAssessment;
  educationScore: number | null;
  requirementsScore: number | null;
};

export type ParsedCv = {
  headline: string | null;
  summary: string;
  skills: string[];
  languages: string[];
  locations: string[];
  education: string | null;
  seniority: Seniority | null;
  yearsExperience: number | null;
  remotePreference: RemoteType | null;
  source: "heuristic" | "rodium";
};

export type JobInput = {
  title: string;
  company: string;
  companyLogo?: string | null;
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
  requirements?: string | null;
  education?: string | null;
  experience?: string | null;
  benefits?: string | null;
  duration?: string | null;
  contactInfo?: string | null;
  sourceUrl?: string | null;
  applicationUrl?: string | null;
  source?: string | null;
  category?: string | null;
  language?: string | null;
  postedAt?: string | Date | null;
  deadline?: string | Date | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  status?: string | null;
  active?: boolean | null;
};

export type JobRecord = {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
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
  requirements: string | null;
  education: string | null;
  experience: string | null;
  benefits: string | null;
  duration: string | null;
  contactInfo: string | null;
  sourceUrl: string | null;
  applicationUrl: string | null;
  source: string;
  category?: string | null;
  language: string;
  postedAt: Date;
  deadline: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  active?: boolean;
  importedAt?: Date | null;
};

export type RankedJob = JobRecord & {
  match: MatchExplanation;
};

export type SearchFilters = {
  contractType?: string | null;
  location?: string | null;
  remoteType?: string | null;
  country?: string | null;
  seniority?: string | null;
  skills?: string | null;
  deadline?: "active" | "closing_soon" | "expired" | "unspecified" | null;
  published?: "7d" | "30d" | "90d" | null;
};
