import { describe, expect, it } from "vitest";
import { formatJobCategory, parseJobCategory } from "./job-categories";

describe("job categories", () => {
  it("parses known categories and leaves empty as unspecified", () => {
    expect(parseJobCategory("")).toBeNull();
    expect(parseJobCategory("cybersecurity")).toBe("cybersecurity");
    expect(parseJobCategory("unknown-tag")).toBe("other");
    expect(formatJobCategory(null)).toBeNull();
    expect(formatJobCategory("data")).toBe("Data");
  });
});
