import { NOT_SPECIFIED } from "@/lib/jobs";

export const JOB_STATUSES = ["pending", "published", "unpublished", "archived", "expired"] as const;
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

export function deadlineKind(
  deadline: Date | string | null | undefined,
  now = new Date(),
): "unspecified" | JobLifecycle {
  if (!parseOptionalDate(deadline)) return "unspecified";
  return jobLifecycle(deadline, now);
}

/** Real deadline copy only. Never invents a close date. */
export function formatClosesIn(deadline: Date | string | null | undefined, now = new Date()): string {
  const date = parseOptionalDate(deadline);
  if (!date) return `Deadline: ${NOT_SPECIFIED}`;
  const life = jobLifecycle(date, now);
  if (life === "expired") return "Expired";
  const days = Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return "Expired";
  if (days === 1) return "Closes in 1 day";
  if (days <= 14) return `Closes in ${days} days`;
  return `Deadline: ${formatDeadline(date)}`;
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
  if (job.status === "archived" || job.status === "unpublished") return false;
  if (job.active === false) return false;
  return !isExpiredJob(job.deadline);
}

/** Live search may include pending public-board hits; never unpublished or expired. */
export function isExcludedFromSearch(
  job: {
    status?: string | null;
    deadline?: Date | string | null;
  },
  now = new Date(),
): boolean {
  if (job.status === "unpublished" || job.status === "archived" || job.status === "expired") return true;
  return isExpiredJob(job.deadline, now);
}
