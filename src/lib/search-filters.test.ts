import { describe, expect, it } from "vitest";
import { applySearchFilters } from "./search-filters";
import type { JobRecord } from "./types";

const job = (overrides: Partial<JobRecord> = {}): JobRecord => ({
  id: "1",
  title: "Cybersecurity Intern",
  company: "Northwind",
  companyLogo: null,
  location: "Worldwide",
  country: null,
  remoteType: "remote",
  contractType: "internship",
  seniority: "intern",
  salaryMin: null,
  salaryMax: null,
  currency: "",
  skills: ["security"],
  languages: ["en"],
  description: "Remote internship",
  requirements: null,
  education: null,
  experience: null,
  benefits: null,
  duration: "6 months",
  contactInfo: null,
  sourceUrl: "https://example.com/job",
  applicationUrl: "https://example.com/apply",
  source: "jobicy",
  language: "en",
  postedAt: new Date("2026-09-01T00:00:00Z"),
  deadline: new Date("2026-10-15T00:00:00Z"),
  startDate: null,
  endDate: null,
  status: "published",
  active: true,
  ...overrides,
});

describe("search filters", () => {
  it("keeps matching remote internships and drops others", () => {
    const jobs = [
      job(),
      job({ id: "2", remoteType: "onsite", title: "Onsite intern" }),
      job({ id: "3", contractType: "employee", title: "Engineer" }),
    ];
    const filtered = applySearchFilters(jobs, { remoteType: "remote", contractType: "internship" });
    expect(filtered.map((item) => item.id)).toEqual(["1"]);
  });
});
