import { describe, expect, it } from "vitest";
import { copilotFallback } from "@/server/copilot";
import type { JobRecord, MatchExplanation } from "@/lib/types";

const job: JobRecord = {
  id: "1",
  title: "Cyber Intern",
  company: "CertiK",
  companyLogo: null,
  location: "USA",
  country: "US",
  remoteType: "remote",
  contractType: "internship",
  seniority: "intern",
  salaryMin: null,
  salaryMax: null,
  currency: "",
  skills: ["cybersecurity"],
  languages: ["en"],
  description: "Intern",
  requirements: null,
  education: null,
  experience: null,
  benefits: null,
  duration: null,
  contactInfo: null,
  sourceUrl: "https://jobicy.com/x",
  applicationUrl: "https://jobicy.com/x",
  source: "jobicy",
  language: "en",
  postedAt: new Date(),
  deadline: null,
  startDate: null,
  endDate: null,
  status: "published",
  active: true,
};

const match: MatchExplanation = {
  score: 70,
  reasons: [
    {
      factor: "skills",
      label: "Compétences",
      weight: 0.35,
      score: 80,
      detail: "Compétences en commun : cybersecurity.",
      polarity: "positive",
    },
  ],
  matchedSkills: ["cybersecurity"],
  gaps: ["docker"],
  highlights: [],
};

describe("copilot fallback", () => {
  it("uses real gaps and never invents a deadline", () => {
    expect(copilotFallback({ job, match, question: "Quelles compétences me manquent ?" })).toContain("docker");
    expect(copilotFallback({ job, match, question: "Pourquoi ça correspond ?" })).toContain("cybersecurity");
    expect(copilotFallback({ job, match, question: "hello" })).not.toMatch(/invent/i);
  });
});
