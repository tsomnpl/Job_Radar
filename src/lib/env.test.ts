import { afterEach, describe, expect, it } from "vitest";
import {
  clerkClientProxyUrl,
  clerkKeysAligned,
  clerkPublishableKind,
  clerkSecretKind,
  isClerkProduction,
  isEmailConfigured,
  isVercelAppHost,
  parseEmailFrom,
} from "./env";

const ORIGINAL = {
  publishable: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secret: process.env.CLERK_SECRET_KEY,
  proxy: process.env.NEXT_PUBLIC_CLERK_PROXY_URL,
  resend: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM,
};

afterEach(() => {
  restore("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", ORIGINAL.publishable);
  restore("CLERK_SECRET_KEY", ORIGINAL.secret);
  restore("NEXT_PUBLIC_CLERK_PROXY_URL", ORIGINAL.proxy);
  restore("RESEND_API_KEY", ORIGINAL.resend);
  restore("EMAIL_FROM", ORIGINAL.from);
});

function restore(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("clerkPublishableKind", () => {
  it("detects production keys without treating them as test keys", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_example";
    expect(clerkPublishableKind()).toBe("pk_live");
    expect(isClerkProduction()).toBe(true);
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_example";
    expect(clerkPublishableKind()).toBe("pk_test");
    expect(isClerkProduction()).toBe(false);
  });
});

describe("clerkKeysAligned", () => {
  it("requires pk_live with sk_live and pk_test with sk_test", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_example";
    process.env.CLERK_SECRET_KEY = "sk_live_example";
    expect(clerkSecretKind()).toBe("sk_live");
    expect(clerkKeysAligned()).toBe(true);
    process.env.CLERK_SECRET_KEY = "sk_test_example";
    expect(clerkKeysAligned()).toBe(false);
  });
});

describe("clerkClientProxyUrl", () => {
  it("is unset for Development so pk_test_ keeps using accounts.dev", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_example";
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL = "https://job-radar-six-ochre.vercel.app/__clerk";
    expect(clerkClientProxyUrl()).toBeUndefined();
  });

  it("defaults to /__clerk only for Production keys", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_example";
    delete process.env.NEXT_PUBLIC_CLERK_PROXY_URL;
    expect(clerkClientProxyUrl()).toBe("/__clerk");
  });
});

describe("isVercelAppHost", () => {
  it("flags vercel.app hosts that cannot be Clerk Production DNS", () => {
    expect(isVercelAppHost("https://job-radar-six-ochre.vercel.app")).toBe(true);
    expect(isVercelAppHost("https://jobradar.example")).toBe(false);
  });
});

describe("parseEmailFrom", () => {
  it("accepts a branded from address", () => {
    expect(parseEmailFrom("JobRadar <alerts@jobradar.app>")).toBe("JobRadar <alerts@jobradar.app>");
  });

  it("rejects empty or placeholder senders", () => {
    expect(parseEmailFrom("")).toBeNull();
    expect(parseEmailFrom("JobRadar <noreply@example.com>")).toBeNull();
  });
});

describe("isEmailConfigured", () => {
  it("is not functional until RESEND_API_KEY and a valid EMAIL_FROM exist", () => {
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = "JobRadar <alerts@jobradar.app>";
    expect(isEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@example.com";
    expect(isEmailConfigured()).toBe(false);
    process.env.EMAIL_FROM = "JobRadar <alerts@jobradar.app>";
    expect(isEmailConfigured()).toBe(true);
  });
});
