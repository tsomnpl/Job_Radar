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
  source: "jobicy",
  language: "fr",
  postedAt: new Date(),
  companyLogo: null,
  applicationUrl: null,
  requirements: null,
  education: null,
  experience: null,
  benefits: null,
  duration: null,
  contactInfo: null,
  deadline: null,
  startDate: null,
  endDate: null,
  status: "published",
  active: true,
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
    expect(match.matchedSkills).toEqual(expect.arrayContaining(["sql", "excel", "data"]));
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
    const internJob = {
      title: "Cybersecurity Intern",
      source: "jobicy",
      location: "Worldwide",
      country: null,
      company: "Northwind",
      skills: ["security"],
      description: "Global remote internship in cybersecurity.",
    };
    const pharmacy = {
      title: "Pharmacy Intern",
      source: "themuse",
      location: "Richmond Heights, OH",
      country: null,
      company: "CVS Health",
      skills: [],
      description: "HIPAA security policies for pharmacy operations.",
    };
    expect(jobFitsSearchIntent(internJob, intent)).toBe(true);
    expect(jobFitsSearchIntent(pharmacy, intent)).toBe(false);
    expect(jobFitsSearchIntent(pharmacy, parseIntentHeuristic("stage cybersécurité Togo"))).toBe(false);
  });

  it("labels eligibility without promising a hire", () => {
    const intent = parseIntentHeuristic("stage data remote Cotonou");
    const candidate = buildCandidate(intent, {
      skills: ["sql", "excel", "python", "data"],
      languages: ["fr"],
      locations: ["Cotonou"],
      seniority: "intern",
      yearsExperience: 1,
      remotePreference: "remote",
      headline: "Étudiant data",
      education: "Licence informatique",
      query: intent.query,
    });
    const match = explainMatch(baseJob, candidate);
    expect(match.eligibility.label).toBe("Requirements unclear");
    expect(match.eligibility.why.toLowerCase()).not.toContain("definitely");
    expect(match.educationScore).toBeNull();
    expect(match.requirementsScore).toBeNull();
  });

  it("keeps list and detail scores aligned when the same query is parsed", () => {
    const query = "internship cybersecurity remote";
    const job: JobRecord = {
      ...baseJob,
      title: "Blockchain Security Expert Intern - AI Track",
      company: "CertiK",
      location: "USA",
      country: "US",
      skills: ["cybersecurity"],
      description: "Remote internship in cybersecurity.",
    };
    const rawIntent = {
      query,
      keywords: [] as string[],
      skills: [] as string[],
      location: null,
      country: null,
      remoteType: null,
      contractType: null,
      seniority: null,
      language: null,
      source: "heuristic" as const,
    };
    const rawScore = explainMatch(job, buildCandidate(rawIntent)).score;
    const parsedScore = explainMatch(job, buildCandidate(parseIntentHeuristic(query))).score;
    expect(parsedScore).toBeGreaterThanOrEqual(rawScore);
    expect(parsedScore).toBeGreaterThanOrEqual(70);
  });

  it("merges profile keywords and domains into the candidate query", () => {
    const intent = parseIntentHeuristic("stage");
    const candidate = buildCandidate(intent, {
      skills: ["sql"],
      languages: ["fr"],
      locations: ["Cotonou"],
      seniority: "intern",
      yearsExperience: 1,
      remotePreference: "remote",
      headline: "Étudiant",
      query: intent.query,
      keywords: ["python"],
      domains: ["data"],
    });
    expect(candidate.skills).toEqual(expect.arrayContaining(["sql", "python"]));
    expect(candidate.query).toMatch(/python/);
    expect(candidate.query).toMatch(/data/);
  });
});
