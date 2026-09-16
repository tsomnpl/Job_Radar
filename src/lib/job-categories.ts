export const JOB_CATEGORIES = [
  "cybersecurity",
  "data",
  "engineering",
  "product",
  "business",
  "ong",
  "international",
  "other",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

const LABELS: Record<JobCategory, string> = {
  cybersecurity: "Cybersecurity",
  data: "Data",
  engineering: "Engineering",
  product: "Product",
  business: "Business",
  ong: "NGO / ONG",
  international: "International",
  other: "Other",
};

export function parseJobCategory(value: string | null | undefined): JobCategory | null {
  const folded = value?.trim().toLowerCase() ?? "";
  if (!folded) return null;
  return (JOB_CATEGORIES as readonly string[]).includes(folded) ? (folded as JobCategory) : "other";
}

export function formatJobCategory(value: string | null | undefined): string | null {
  const parsed = parseJobCategory(value);
  if (!value?.trim() || !parsed) return null;
  return LABELS[parsed];
}
