import { describe, expect, it } from "vitest";
import { searchNeedsAiProposals } from "@/server/propose";
import type { RankedJob } from "@/lib/types";

function fake(score: number, source = "seed"): RankedJob {
  return {
    id: `j-${score}-${source}`,
    title: "t",
    company: "c",
    location: "Lomé",
    country: "TG",
    remoteType: "remote",
    contractType: "internship",
    seniority: "intern",
    salaryMin: null,
    salaryMax: null,
    currency: "XOF",
    skills: [],
    languages: ["fr"],
    description: "d",
    sourceUrl: null,
    source,
    language: "fr",
    postedAt: new Date(),
    match: { score, reasons: [], gaps: [], highlights: [] },
  };
}

describe("AI proposals trigger", () => {
  it("asks the AI when the stock is empty", () => {
    expect(searchNeedsAiProposals([])).toBe(true);
  });

  it("asks the AI when fewer than 3 strong stock matches exist", () => {
    expect(searchNeedsAiProposals([fake(40), fake(42)])).toBe(true);
    expect(searchNeedsAiProposals([fake(80), fake(70)])).toBe(true);
    expect(searchNeedsAiProposals([fake(80), fake(70), fake(60)])).toBe(false);
  });

  it("ignores existing AI pistes when counting strong stock matches", () => {
    expect(searchNeedsAiProposals([fake(90, "ai-proposal"), fake(88, "ai-proposal"), fake(87, "ai-proposal")])).toBe(
      true,
    );
  });
});
