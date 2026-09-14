import { describe, expect, it } from "vitest";
import { buildCandidate, explainMatch } from "@/lib/matching";
import { parseIntentHeuristic } from "@/lib/intent";
import type { JobRecord } from "@/lib/types";

const baseJob: JobRecord = {
  id: "1",
  title: "Stage Data / Business Intelligence",
  company: "Sahel Analytics",
  location: "Cotonou",
  country: "BJ",
  remoteType: "remote",
  contractType: "internship",
  seniority: "intern",
  salaryMin: 75000,
  salaryMax: 120000,
  currency: "XOF",
  skills: ["sql", "excel", "data"],
  languages: ["fr"],
  description: "Stage data remote Cotonou, SQL Excel Python.",
  sourceUrl: null,
  source: "seed",
  language: "fr",
  postedAt: new Date(),
};

describe("explainMatch", () => {
  it("scores a strong profile+intent match highly and lists shared skills", () => {
    const intent = parseIntentHeuristic("stage data remote Cotonou");
    const candidate = buildCandidate(intent, {
      skills: ["sql", "excel", "python", "data"],
      languages: ["fr"],
      locations: ["Cotonou"],
      seniority: "intern",
      yearsExperience: 1,
      remotePreference: "remote",
      headline: "Étudiant data",
      query: intent.query,
    });
    const match = explainMatch(baseJob, candidate);
    expect(match.score).toBeGreaterThanOrEqual(75);
    expect(match.reasons.some((reason) => reason.factor === "skills" && reason.polarity === "positive")).toBe(
      true,
    );
    expect(match.gaps).not.toContain("sql");
  });

  it("penalizes onsite vs remote preference and missing skills", () => {
    const onsiteJob: JobRecord = {
      ...baseJob,
      id: "2",
      title: "Comptable junior",
      remoteType: "onsite",
      seniority: "junior",
      skills: ["comptabilite", "finance"],
      location: "Lomé",
      country: "TG",
    };
    const intent = parseIntentHeuristic("data remote Cotonou");
    const candidate = buildCandidate(intent, {
      skills: ["python", "sql"],
      languages: ["fr"],
      locations: ["Cotonou"],
      seniority: "junior",
      yearsExperience: 2,
      remotePreference: "remote",
      headline: "Data analyst",
      query: intent.query,
    });
    const match = explainMatch(onsiteJob, candidate);
    expect(match.score).toBeLessThan(55);
    expect(match.gaps.length).toBeGreaterThan(0);
    const remoteReason = match.reasons.find((reason) => reason.factor === "remote");
    expect(remoteReason?.polarity).toBe("negative");
  });
});
