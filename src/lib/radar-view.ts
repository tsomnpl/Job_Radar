import { jobLifecycle } from "@/lib/job-lifecycle";

export type TimelineBucket = "today" | "yesterday" | "earlier";

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function timelineBucket(postedAt: Date | string, now = new Date()): TimelineBucket {
  const posted = postedAt instanceof Date ? postedAt : new Date(postedAt);
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (posted >= today) return "today";
  if (posted >= yesterday) return "yesterday";
  return "earlier";
}

export function groupByTimeline<T extends { postedAt: Date | string }>(
  jobs: T[],
  now = new Date(),
): Record<TimelineBucket, T[]> {
  const groups: Record<TimelineBucket, T[]> = { today: [], yesterday: [], earlier: [] };
  for (const job of jobs) groups[timelineBucket(job.postedAt, now)].push(job);
  return groups;
}

export type RadarDot = {
  id: string;
  x: number;
  y: number;
  title: string;
  company: string;
  score?: number;
  lifecycle: ReturnType<typeof jobLifecycle> | "unspecified";
};

function hashId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Stable coordinates from a real job id — never random fake blips. */
export function radarDotsFromJobs(
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    deadline?: Date | string | null;
    match?: { score: number };
  }>,
  now = new Date(),
): RadarDot[] {
  return jobs.map((job, index) => {
    const hash = hashId(job.id);
    const angle = ((hash % 360) + index * 11) * (Math.PI / 180);
    const radius = 18 + (hash % 28);
    return {
      id: job.id,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      title: job.title,
      company: job.company,
      score: job.match?.score,
      lifecycle: job.deadline ? jobLifecycle(job.deadline, now) : "unspecified",
    };
  });
}
