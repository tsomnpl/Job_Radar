import { describe, expect, it } from "vitest";
import { CATALOG_JOBS, catalogJobId, catalogJobRecords, catalogFingerprint } from "@/lib/job-catalog";

describe("job catalog", () => {
  it("exposes unique stable ids for every seed offer", () => {
    const records = catalogJobRecords();
    const ids = records.map((job) => job.id);
    expect(records).toHaveLength(CATALOG_JOBS.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("cat_"))).toBe(true);
  });

  it("keeps fingerprints aligned with title/company/location", () => {
    const job = CATALOG_JOBS[0];
    const fingerprint = catalogFingerprint(job);
    expect(catalogJobId(fingerprint)).toBe(`cat_${fingerprint.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80)}`);
    expect(catalogJobRecords()[0].title).toBe(job.title);
  });
});
