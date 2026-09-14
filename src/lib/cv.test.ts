import { describe, expect, it } from "vitest";
import { parseCvHeuristic } from "@/lib/cv";

describe("parseCvHeuristic", () => {
  it("extracts skills, languages, years and location", () => {
    const parsed = parseCvHeuristic(`
Isaac Tchiwanou
Data Analyst junior — 2 ans d'expérience
Cotonou, Bénin
Compétences : Python, SQL, Excel, Power BI
Langues : Français, Anglais
Recherche un poste remote.
`);
    expect(parsed.skills).toEqual(expect.arrayContaining(["python", "sql", "excel", "powerbi"]));
    expect(parsed.languages).toEqual(expect.arrayContaining(["fr", "en"]));
    expect(parsed.yearsExperience).toBe(2);
    expect(parsed.locations.some((place) => place.includes("cotonou") || place.includes("benin"))).toBe(true);
    expect(parsed.remotePreference).toBe("remote");
    expect(parsed.seniority).toBe("junior");
  });
});
