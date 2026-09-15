import { afterEach, describe, expect, it } from "vitest";
import { adminEmail, isAdminDisabled, isAdminEmail, isConfiguredAdmin } from "./env";

const ORIGINAL = {
  email: process.env.ADMIN_EMAIL,
  ids: process.env.ADMIN_CLERK_USER_IDS,
};

afterEach(() => {
  restore("ADMIN_EMAIL", ORIGINAL.email);
  restore("ADMIN_CLERK_USER_IDS", ORIGINAL.ids);
});

function restore(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("admin access is fail-closed", () => {
  it("grants nobody when ADMIN_EMAIL and ADMIN_CLERK_USER_IDS are empty", () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_CLERK_USER_IDS;
    expect(adminEmail()).toBeNull();
    expect(isAdminDisabled()).toBe(true);
    expect(isConfiguredAdmin({ email: "anyone@example.com", clerkUserId: "user_1" })).toBe(false);
  });

  it("matches only the configured verified email", () => {
    process.env.ADMIN_EMAIL = "owner@jobradar.app";
    delete process.env.ADMIN_CLERK_USER_IDS;
    expect(isAdminEmail("owner@jobradar.app")).toBe(true);
    expect(isAdminEmail("OWNER@jobradar.app")).toBe(true);
    expect(isAdminEmail("other@jobradar.app")).toBe(false);
    expect(isConfiguredAdmin({ verifiedEmails: ["owner@jobradar.app"] })).toBe(true);
    expect(isConfiguredAdmin({ email: "other@jobradar.app" })).toBe(false);
  });

  it("does not treat an empty Clerk id list as everyone-is-admin", () => {
    delete process.env.ADMIN_EMAIL;
    process.env.ADMIN_CLERK_USER_IDS = "";
    expect(isConfiguredAdmin({ clerkUserId: "user_abc" })).toBe(false);
  });
});
