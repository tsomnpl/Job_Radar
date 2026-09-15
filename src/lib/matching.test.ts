import { describe, expect, it } from "vitest";
import { buildCandidate, explainMatch, jobFitsSearchIntent } from "@/lib/matching";
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

  it("does not treat a geo-restricted remote job as a Togo match", () => {
    const restricted: JobRecord = {
      ...baseJob,
      id: "3",
      title: "Cybersecurity Intern",
      company: "CertiK",
      location: "APAC, Europe",
      country: null,
      remoteType: "remote",
      contractType: "internship",
      seniority: "intern",
      skills: ["security"],
      description: "Remote internship in cybersecurity, APAC or Europe only.",
      source: "jobicy",
      sourceUrl: "https://jobicy.com/jobs/153136-compliance-engineer-intern",
    };
    const intent = parseIntentHeuristic("stage cybersécurité Togo");
    const candidate = buildCandidate(intent, {
      skills: ["cybersecurity"],
      languages: ["fr"],
      locations: ["Togo"],
      seniority: "intern",
      yearsExperience: 0,
      remotePreference: "remote",
      headline: null,
      query: intent.query,
    });
    const match = explainMatch(restricted, candidate);
    const locationReason = match.reasons.find((reason) => reason.factor === "location");
    expect(locationReason?.polarity).toBe("negative");
    expect(match.score).toBeLessThan(55);
  });

  it("matches French internship wording to an English cybersecurity intern title", () => {
    const worldwide: JobRecord = {
      ...baseJob,
      id: "4",
      title: "Cybersecurity Intern",
      company: "Northwind Labs",
      location: "Worldwide",
      country: null,
      remoteType: "remote",
      contractType: "internship",
      seniority: "intern",
      skills: ["security"],
      description: "Global remote internship in cybersecurity.",
      source: "remoteok",
      sourceUrl: "https://careers.northwind.example/intern-cyber",
    };
    const intent = parseIntentHeuristic("stage cybersécurité");
    const candidate = buildCandidate(intent);
    const match = explainMatch(worldwide, candidate);
    const queryReason = match.reasons.find((reason) => reason.factor === "query");
    expect(queryReason?.score).toBeGreaterThanOrEqual(70);
    expect(match.score).toBeGreaterThanOrEqual(55);
  });

  it("keeps internship search on titles that are actually internships", () => {
    const intent = parseIntentHeuristic("internship cybersecurity remote");
    expect(jobFitsSearchIntent({ title: "Cybersecurity Intern", source: "jobicy" }, intent)).toBe(true);
    expect(jobFitsSearchIntent({ title: "Healthcare Virtual Assistant", source: "remoteok" }, intent)).toBe(false);
  });
});
