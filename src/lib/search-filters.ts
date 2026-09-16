import { jobLifecycle } from "@/lib/job-lifecycle";
import type { JobRecord, SearchFilters } from "@/lib/types";
import { fold } from "@/lib/normalize";

export function readSearchFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const one = (key: string) => {
    const value = params[key];
    const raw = Array.isArray(value) ? value[0] : value;
    return raw?.trim() || null;
  };
  const deadline = one("deadline");
  const published = one("published");
  return {
    contractType: one("type"),
    location: one("location"),
    remoteType: one("remote"),
    country: one("country"),
    seniority: one("experience"),
    skills: one("skills"),
    deadline:
      deadline === "active" || deadline === "closing_soon" || deadline === "expired" || deadline === "unspecified"
        ? deadline
        : null,
    published: published === "7d" || published === "30d" || published === "90d" ? published : null,
  };
}

export function applySearchFilters<T extends JobRecord>(jobs: T[], filters: SearchFilters, now = new Date()): T[] {
  return jobs.filter((job) => {
    if (filters.contractType && job.contractType !== filters.contractType) {
      const employee = filters.contractType === "employee" && (job.contractType === "cdi" || job.contractType === "cdd");
      if (!employee) return false;
    }
    if (filters.remoteType && job.remoteType !== filters.remoteType) return false;
    if (filters.seniority && job.seniority !== filters.seniority) return false;
    if (filters.location && !fold(`${job.location} ${job.country ?? ""}`).includes(fold(filters.location))) return false;
    if (filters.country && !fold(job.country ?? job.location).includes(fold(filters.country))) return false;
    if (filters.skills) {
      const needles = filters.skills.split(/[,;]/).map((item) => fold(item)).filter(Boolean);
      const hay = fold(job.skills.join(" "));
      if (!needles.every((needle) => hay.includes(needle) || fold(job.title).includes(needle))) return false;
    }
    if (filters.deadline) {
      const life = jobLifecycle(job.deadline, now);
      if (filters.deadline === "unspecified" && job.deadline) return false;
      if (filters.deadline !== "unspecified" && life !== filters.deadline) return false;
    }
    if (filters.published) {
      const days = filters.published === "7d" ? 7 : filters.published === "30d" ? 30 : 90;
      const age = now.getTime() - job.postedAt.getTime();
      if (age > days * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });
}
