import { describe, expect, it } from "vitest";
import { deadlineKind, formatClosesIn } from "./job-lifecycle";
import { groupByTimeline, radarDotsFromJobs } from "./radar-view";

describe("deadline radar copy", () => {
  const now = new Date("2026-09-15T12:00:00Z");

  it("does not invent a deadline", () => {
    expect(formatClosesIn(null, now)).toBe("Deadline: Not specified");
    expect(deadlineKind(null, now)).toBe("unspecified");
  });

  it("uses remaining days only from a real date", () => {
    expect(formatClosesIn(new Date("2026-09-19T12:00:00Z"), now)).toBe("Closes in 4 days");
    expect(formatClosesIn(new Date("2026-09-10T12:00:00Z"), now)).toBe("Expired");
    expect(formatClosesIn(new Date("2026-10-24T12:00:00Z"), now)).toMatch(/24 October 2026/);
  });
});

describe("radar view", () => {
  it("creates one stable dot per real job and none when empty", () => {
    expect(radarDotsFromJobs([])).toEqual([]);
    const a = radarDotsFromJobs([{ id: "job_1", title: "Intern", company: "Acme", deadline: null }]);
    const b = radarDotsFromJobs([{ id: "job_1", title: "Intern", company: "Acme", deadline: null }]);
    expect(a).toHaveLength(1);
    expect(a[0]?.x).toBe(b[0]?.x);
    expect(a[0]?.y).toBe(b[0]?.y);
  });

  it("groups posted dates without inventing counts", () => {
    const now = new Date("2026-09-15T15:00:00Z");
    const groups = groupByTimeline(
      [
        { id: "1", postedAt: new Date("2026-09-15T08:00:00Z") },
        { id: "2", postedAt: new Date("2026-09-14T08:00:00Z") },
      ],
      now,
    );
    expect(groups.today).toHaveLength(1);
    expect(groups.yesterday).toHaveLength(1);
    expect(groups.earlier).toHaveLength(0);
  });
});
