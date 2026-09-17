import { describe, expect, it } from "vitest";
import { formatDeadline, isExpiredJob, jobLifecycle, isPubliclyListed, isExcludedFromSearch } from "./job-lifecycle";

describe("job lifecycle", () => {
  it("formats a deadline in English long form", () => {
    expect(formatDeadline(new Date("2026-10-15T12:00:00Z"))).toMatch(/15 October 2026/);
  });

  it("returns Not specified without inventing a date", () => {
    expect(formatDeadline(null)).toBe("Not specified");
  });

  it("flags expired vs closing soon vs active", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    expect(jobLifecycle(new Date("2026-09-10T12:00:00Z"), now)).toBe("expired");
    expect(jobLifecycle(new Date("2026-09-16T12:00:00Z"), now)).toBe("closing_soon");
    expect(jobLifecycle(new Date("2026-10-15T12:00:00Z"), now)).toBe("active");
    expect(isExpiredJob(new Date("2026-09-10T12:00:00Z"), now)).toBe(true);
    expect(
      isPubliclyListed({
        active: true,
        status: "published",
        deadline: new Date("2026-09-10T12:00:00Z"),
      }),
    ).toBe(false);
    expect(isExcludedFromSearch({ status: "unpublished" })).toBe(true);
    expect(isExcludedFromSearch({ status: "archived" })).toBe(true);
    expect(isPubliclyListed({ active: true, status: "archived", deadline: null })).toBe(false);
    expect(isExcludedFromSearch({ status: "pending", deadline: null }, now)).toBe(false);
    expect(isExcludedFromSearch({ status: "pending", deadline: new Date("2026-09-10T12:00:00Z") }, now)).toBe(true);
  });
});
