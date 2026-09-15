import { describe, expect, it } from "vitest";
import { isAfricanSearch, isUnrestrictedRemoteLocation, placesCompatible } from "@/lib/places";

describe("places", () => {
  it("treats Flexible / Remote as unrestricted", () => {
    expect(isUnrestrictedRemoteLocation("Flexible / Remote")).toBe(true);
    expect(placesCompatible("Togo", "Flexible / Remote")).toBe(true);
    expect(placesCompatible("Togo", "APAC, Europe")).toBe(false);
  });

  it("detects African search intents", () => {
    expect(isAfricanSearch({ location: "Togo", country: "TG", query: "stage cyber" })).toBe(true);
    expect(isAfricanSearch({ location: "Paris", country: "FR", query: "cdi" })).toBe(false);
  });
});
