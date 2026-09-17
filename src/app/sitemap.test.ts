import { afterEach, describe, expect, it } from "vitest";
import { PRODUCTION_APP_URL } from "@/lib/env";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

const ORIGINAL = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  vercel: process.env.VERCEL,
  vercelUrl: process.env.VERCEL_URL,
  vercelProduction: process.env.VERCEL_PROJECT_PRODUCTION_URL,
};

afterEach(() => {
  restore("NEXT_PUBLIC_APP_URL", ORIGINAL.appUrl);
  restore("VERCEL", ORIGINAL.vercel);
  restore("VERCEL_URL", ORIGINAL.vercelUrl);
  restore("VERCEL_PROJECT_PRODUCTION_URL", ORIGINAL.vercelProduction);
});

function restore(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("production SEO origins", () => {
  it("sitemap and robots never emit localhost on Vercel", () => {
    process.env.VERCEL = "1";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

    const urls = sitemap().map((entry) => entry.url);
    expect(urls.every((url) => url.startsWith(PRODUCTION_APP_URL))).toBe(true);
    expect(urls.some((url) => url.includes("localhost"))).toBe(false);
    expect(robots().sitemap).toBe(`${PRODUCTION_APP_URL}/sitemap.xml`);
  });
});
