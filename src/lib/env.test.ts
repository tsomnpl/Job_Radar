import { afterEach, describe, expect, it } from "vitest";
import {
  appUrl,
  clerkClientProxyUrl,
  clerkKeysAligned,
  clerkPublishableKind,
  clerkSecretKind,
  isClerkProduction,
  isEmailConfigured,
  isLocalhostOrigin,
  isVercelAppHost,
  parseEmailFrom,
  PRODUCTION_APP_URL,
} from "./env";

const ORIGINAL = {
  publishable: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secret: process.env.CLERK_SECRET_KEY,
  proxy: process.env.NEXT_PUBLIC_CLERK_PROXY_URL,
  resend: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  vercel: process.env.VERCEL,
  vercelUrl: process.env.VERCEL_URL,
  vercelProduction: process.env.VERCEL_PROJECT_PRODUCTION_URL,
};

afterEach(() => {
  restore("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", ORIGINAL.publishable);
  restore("CLERK_SECRET_KEY", ORIGINAL.secret);
  restore("NEXT_PUBLIC_CLERK_PROXY_URL", ORIGINAL.proxy);
  restore("RESEND_API_KEY", ORIGINAL.resend);
  restore("EMAIL_FROM", ORIGINAL.from);
  restore("NEXT_PUBLIC_APP_URL", ORIGINAL.appUrl);
  restore("VERCEL", ORIGINAL.vercel);
  restore("VERCEL_URL", ORIGINAL.vercelUrl);
  restore("VERCEL_PROJECT_PRODUCTION_URL", ORIGINAL.vercelProduction);
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

describe("appUrl", () => {
  it("keeps localhost for local development", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(isLocalhostOrigin(appUrl())).toBe(true);
    expect(appUrl()).toBe("http://localhost:3000");
  });

  it("ignores localhost NEXT_PUBLIC_APP_URL on Vercel", () => {
    process.env.VERCEL = "1";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(appUrl()).toBe(PRODUCTION_APP_URL);
    expect(isLocalhostOrigin(appUrl())).toBe(false);
  });

  it("prefers a real public NEXT_PUBLIC_APP_URL over the fallback host", () => {
    process.env.VERCEL = "1";
    process.env.NEXT_PUBLIC_APP_URL = "https://jobradar.example";
    expect(appUrl()).toBe("https://jobradar.example");
  });

  it("uses VERCEL_PROJECT_PRODUCTION_URL when APP_URL is localhost", () => {
    process.env.VERCEL = "1";
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3000";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "job-radar-six-ochre.vercel.app";
    expect(appUrl()).toBe("https://job-radar-six-ochre.vercel.app");
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
