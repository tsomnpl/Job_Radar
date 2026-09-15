import { NOT_SPECIFIED } from "@/lib/jobs";

export const JOB_STATUSES = ["pending", "published", "unpublished", "expired"] as const;
export type JobPublishStatus = (typeof JOB_STATUSES)[number];

export const LIFECYCLE_LABELS = {
  active: "Active",
  closing_soon: "Closing soon",
  expired: "Expired",
} as const;

export type JobLifecycle = keyof typeof LIFECYCLE_LABELS;

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function parseOptionalDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function jobLifecycle(deadline: Date | string | null | undefined, now = new Date()): JobLifecycle {
  const date = parseOptionalDate(deadline);
  if (!date) return "active";
  const remaining = date.getTime() - now.getTime();
  if (remaining < 0) return "expired";
  if (remaining <= THREE_DAYS_MS) return "closing_soon";
  return "active";
}

export function isExpiredJob(deadline: Date | string | null | undefined, now = new Date()): boolean {
  return jobLifecycle(deadline, now) === "expired";
}

export function formatDeadline(deadline: Date | string | null | undefined): string {
  const date = parseOptionalDate(deadline);
  if (!date) return NOT_SPECIFIED;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateField(value: Date | string | null | undefined): string {
  return formatDeadline(value);
}

export function isPubliclyListed(job: {
  active?: boolean;
  status?: string | null;
  deadline?: Date | string | null;
}): boolean {
  if (job.status && job.status !== "published") return false;
  if (job.active === false) return false;
  return !isExpiredJob(job.deadline);
}
