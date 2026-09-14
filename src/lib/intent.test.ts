import { describe, expect, it } from "vitest";
import { parseIntentHeuristic } from "@/lib/intent";

describe("parseIntentHeuristic", () => {
  it("extracts internship, data, remote and Cotonou", () => {
    const intent = parseIntentHeuristic("Je cherche un stage data remote à Cotonou");
    expect(intent.location).toBe("Cotonou");
    expect(intent.country).toBe("BJ");
    expect(intent.remoteType).toBe("remote");
    expect(intent.contractType).toBe("internship");
    expect(intent.seniority).toBe("intern");
    expect(intent.skills).toContain("data");
    expect(intent.source).toBe("heuristic");
  });

  it("extracts product designer hybrid Accra", () => {
    const intent = parseIntentHeuristic("CDI product designer Accra hybride");
    expect(intent.location).toBe("Accra");
    expect(intent.contractType).toBe("cdi");
    expect(intent.remoteType).toBe("hybrid");
    expect(intent.skills).toContain("product");
    expect(intent.skills).toContain("design");
  });
});
