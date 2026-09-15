import { describe, expect, it } from "vitest";
import { stripHtml } from "@/lib/html";
import { parseIntentHeuristic } from "@/lib/intent";
import {
  filterRelevantOpportunities,
  isRelevantToIntent,
  jobicyTagsForIntent,
  jobicyUrlsForIntent,
  parseHimalayasPayload,
  parseJobicyPayload,
  parseRemoteOkPayload,
  parseRemotivePayload,
  parseTheMusePayload,
} from "@/server/public-sources";

const jobicyPayload = {
  jobs: [
    {
      id: 153136,
      url: "https://jobicy.com/jobs/153136-compliance-engineer-intern",
      jobTitle: "Compliance Engineer Intern",
      companyName: "CertiK",
      jobType: ["Internship"],
      jobGeo: "APAC,  Europe",
      jobLevel: "Entry-Level, Junior",
      jobIndustry: ["Legal & Compliance"],
      jobDescription: "<p>Web3 <strong>security</strong> internship with smart contract audits.</p>",
      pubDate: "2026-09-01T00:00:00+00:00",
    },
    {
      id: 99,
      jobTitle: "Missing URL intern",
      companyName: "Ghost Corp",
      jobDescription: "Internship in cybersecurity",
    },
  ],
};

const remoteOkPayload = [
  { legal: "please include attribution" },
  {
    id: "1137391",
    position: "Junior Payroll Assistant",
    company: "Sleek",
    url: "https://remoteok.com/remote-jobs/remote-junior-payroll-assistant-sleek-1137391",
    apply_url: "https://remoteok.com/l/1137391",
    description: "<p>Payroll operations for a remote team.</p>",
    tags: ["junior", "finance", "excel"],
    date: "2026-09-14T00:00:12+00:00",
    location: "",
  },
  {
    id: "cyber-intern",
    position: "Cybersecurity Intern",
    company: "Northwind Labs",
    url: "https://remoteok.com/remote-jobs/remote-cybersecurity-intern-northwind-cyber-intern",
    apply_url: "https://careers.northwind.example/intern-cyber",
    description: "<p>Global remote internship in cybersecurity and threat detection.</p>",
    tags: ["security", "intern"],
    date: "2026-09-10T00:00:00+00:00",
    location: "Worldwide",
  },
];

const remotivePayload = {
  jobs: [
    {
      id: 1680495,
      url: "https://remotive.com/remote-jobs/marketing/remote-office-assistant-1680495",
      title: "Remote Office Assistant",
      company_name: "Coalition Technologies",
      candidate_required_location: "Worldwide",
      job_type: "full_time",
      description: "<p>Administrative support</p>",
      publication_date: "2026-09-11T20:16:48",
      tags: ["marketing"],
    },
  ],
};

describe("public source parsers", () => {
  it("parses Jobicy jobs and drops rows without an official URL", () => {
    const jobs = parseJobicyPayload(jobicyPayload);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("pub_jobicy_153136");
    expect(jobs[0].title).toBe("Compliance Engineer Intern");
    expect(jobs[0].company).toBe("CertiK");
    expect(jobs[0].contractType).toBe("internship");
    expect(jobs[0].sourceUrl).toBe("https://jobicy.com/jobs/153136-compliance-engineer-intern");
    expect(jobs[0].description).toContain("Web3 security internship");
    expect(jobs[0].description).not.toContain("<p>");
  });

  it("skips Remote OK legal notices and prefers apply_url", () => {
    const jobs = parseRemoteOkPayload(remoteOkPayload);
    expect(jobs.map((job) => job.id)).toEqual(["pub_remoteok_1137391", "pub_remoteok_cyber-intern"]);
    expect(jobs[0].sourceUrl).toBe("https://remoteok.com/l/1137391");
    expect(jobs[1].contractType).toBe("internship");
    expect(jobs[1].location).toBe("Worldwide");
  });

  it("parses Remotive jobs with worldwide location", () => {
    const jobs = parseRemotivePayload(remotivePayload);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].company).toBe("Coalition Technologies");
    expect(jobs[0].sourceUrl).toContain("https://");
  });

  it("parses The Muse internships with official landing URLs", () => {
    const jobs = parseTheMusePayload({
      results: [
        {
          id: 4401,
          name: "Intern AI & Management Consulting",
          contents: "<p>Internship in value engineering.</p>",
          publication_date: "2026-09-01T00:00:00Z",
          locations: [{ name: "Flexible / Remote" }],
          company: { name: "Celonis" },
          refs: { landing_page: "https://www.themuse.com/jobs/celonis/intern-ai-management" },
          levels: [{ name: "Internship" }],
          categories: [{ name: "Data Science" }],
        },
        {
          id: 9,
          name: "Missing URL intern",
          contents: "Internship",
          company: { name: "Ghost" },
        },
      ],
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("pub_themuse_4401");
    expect(jobs[0].contractType).toBe("internship");
    expect(jobs[0].location).toBe("Flexible / Remote");
    expect(jobs[0].remoteType).toBe("remote");
    expect(jobs[0].sourceUrl).toBe("https://www.themuse.com/jobs/celonis/intern-ai-management");
  });

  it("parses Himalayas jobs and skips listings without an apply URL", () => {
    const jobs = parseHimalayasPayload({
      jobs: [
        {
          guid: "222",
          title: "Cybersecurity Intern",
          companyName: "Northwind",
          applicationLink: "https://himalayas.app/companies/northwind/jobs/cybersecurity-intern",
          locationRestrictions: [],
          employmentType: "Internship",
          seniority: ["Intern"],
          description: "<p>Global remote internship in cybersecurity.</p>",
          pubDate: "2026-09-10T00:00:00Z",
          categories: ["Cybersecurity"],
        },
      ],
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].source).toBe("himalayas");
    expect(jobs[0].location).toBe("Not specified");
    expect(jobs[0].contractType).toBe("internship");
  });
});

describe("relevance", () => {
  it("does not keep APAC-only internships for a Togo search", () => {
    const intent = parseIntentHeuristic("stage cybersécurité Togo");
    const [apacIntern, worldwideIntern] = [
      ...parseJobicyPayload(jobicyPayload),
      ...parseRemoteOkPayload(remoteOkPayload),
    ].filter((job) => /intern/i.test(job.title));
    expect(isRelevantToIntent(apacIntern, intent)).toBe(false);
    expect(isRelevantToIntent(worldwideIntern, intent)).toBe(true);
    expect(filterRelevantOpportunities([apacIntern, worldwideIntern], intent).map((job) => job.company)).toEqual([
      "Northwind Labs",
    ]);
  });

  it("maps internship + security intent to Jobicy tags", () => {
    const intent = parseIntentHeuristic("stage cybersécurité Togo");
    expect(jobicyTagsForIntent(intent)).toEqual(["internship", "security"]);
    expect(jobicyUrlsForIntent(intent).some((url) => url.includes("geo=emea"))).toBe(true);
  });

  it("does not treat internal/international + HIPAA security as a cyber internship", () => {
    const intent = parseIntentHeuristic("internship cybersecurity remote");
    const jobs = parseRemoteOkPayload([
      {
        id: "va-1",
        position: "Healthcare Virtual Assistant Athena EMR Experience",
        company: "Snapscale Philippines",
        url: "https://remoteok.com/remote-jobs/remote-healthcare-virtual-assistant-athena-emr-experience-1",
        description:
          "<p>Support internal operations for an international team. Follow HIPAA security policies.</p>",
        tags: ["healthcare", "assistant"],
        location: "Worldwide",
      },
    ]);
    expect(jobs).toHaveLength(1);
    expect(isRelevantToIntent(jobs[0], intent)).toBe(false);
  });
});

describe("stripHtml", () => {
  it("removes tags without inventing text", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });
});
