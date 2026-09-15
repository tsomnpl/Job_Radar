import { describe, expect, it } from "vitest";
import { accountDeleteScope } from "@/server/account";

describe("accountDeleteScope", () => {
  it("defaults to profile and only accepts account when explicit", () => {
    expect(accountDeleteScope(null)).toBe("profile");
    expect(accountDeleteScope("profile")).toBe("profile");
    expect(accountDeleteScope("account")).toBe("account");
    expect(accountDeleteScope("all")).toBe("profile");
  });
});
