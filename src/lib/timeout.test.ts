import { describe, expect, it } from "vitest";
import { withTimeout } from "./timeout";

describe("withTimeout", () => {
  it("returns the fallback when the promise never settles", async () => {
    const result = await withTimeout(new Promise<string>(() => {}), 30, "fallback");
    expect(result).toBe("fallback");
  });

  it("returns the fallback when the promise rejects", async () => {
    const result = await withTimeout(Promise.reject(new Error("boom")), 200, "fallback");
    expect(result).toBe("fallback");
  });

  it("returns the resolved value when it is fast enough", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 200, "fallback");
    expect(result).toBe("ok");
  });
});
