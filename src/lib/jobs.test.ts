import { describe, expect, it } from "vitest";
import { officialApplicationUrl, isVerifiedOpportunity, displayField, hasInternTitle, NOT_SPECIFIED } from "@/lib/jobs";
import { selectVerifiedMatches } from "@/lib/matching";

describe("officialApplicationUrl", () => {
  it("accepts real http(s) URLs only", () => {
    expect(officialApplicationUrl("https://careers.unicef.org/job/123")).toBe("https://careers.unicef.org/job/123");
    expect(officialApplicationUrl("http://example.org/apply")).toBe("http://example.org/apply");
  });

  it("rejects invented or unsafe URLs", () => {
    expect(officialApplicationUrl(null)).toBeNull();
    expect(officialApplicationUrl("")).toBeNull();
    expect(officialApplicationUrl("ai://proposal/1")).toBeNull();
    expect(officialApplicationUrl("javascript:alert(1)")).toBeNull();
    expect(officialApplicationUrl("not-a-url")).toBeNull();
  });
});

describe("verified opportunities", () => {
  it("never treats AI pistes as verified", () => {
    expect(isVerifiedOpportunity({ source: "ai-proposal" })).toBe(false);
    expect(isVerifiedOpportunity({ source: "manual" })).toBe(true);
    expect(isVerifiedOpportunity({ source: "extract" })).toBe(true);
    expect(isVerifiedOpportunity({ source: "jobicy" })).toBe(true);
    expect(isVerifiedOpportunity({ source: "remoteok" })).toBe(true);
  });

  it("detects internships from the title only", () => {
    expect(hasInternTitle("Cybersecurity Intern")).toBe(true);
    expect(hasInternTitle("Healthcare Virtual Assistant")).toBe(false);
    expect(hasInternTitle("International Sales Lead")).toBe(false);
  });

  it("drops invented and weak matches from search results", () => {
    const rows = [
      { source: "ai-proposal", match: { score: 97 } },
      { source: "manual", match: { score: 40 } },
      { source: "extract", match: { score: 80 } },
      { source: "jobicy", match: { score: 70 } },
    ];
    expect(selectVerifiedMatches(rows).map((row) => row.source)).toEqual(["extract", "jobicy"]);
  });
});

describe("displayField", () => {
  it("uses Not specified instead of inventing a value", () => {
    expect(displayField(null)).toBe(NOT_SPECIFIED);
    expect(displayField("  ")).toBe(NOT_SPECIFIED);
    expect(displayField("UNICEF")).toBe("UNICEF");
  });
});
