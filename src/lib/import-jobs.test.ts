import { describe, expect, it } from "vitest";
import { jobsFromCsv, normalizeJobInput, parseCsv } from "@/lib/import-jobs";

const csv = `title,company,location,description,skills
Data Engineer,Volta Lake Data,Accra,Pipelines batch,python;sql
Stage Product,Open Sahel,Dakar,User interviews,product`;

describe("job import", () => {
  it("parses CSV rows", () => {
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("Data Engineer");
  });

  it("normalizes jobs and fingerprints duplicates by sourceUrl", () => {
    const jobs = jobsFromCsv(csv);
    const first = normalizeJobInput(jobs[0]);
    expect(first.remoteType).toBe("unspecified");
    expect(JSON.parse(first.skillsJson)).toContain("python");
    const withUrl = normalizeJobInput({
      ...jobs[0],
      sourceUrl: "https://example.com/job-1",
    });
    const again = normalizeJobInput({
      title: "Autre titre",
      company: "Autre",
      location: "Lomé",
      description: "desc",
      sourceUrl: "https://example.com/job-1",
    });
    expect(withUrl.fingerprint).toBe(again.fingerprint);
    const tracked = normalizeJobInput({
      ...jobs[0],
      sourceUrl: "https://www.example.com/job-1?utm_source=board",
    });
    expect(tracked.fingerprint).toBe(withUrl.fingerprint);
  });
});
