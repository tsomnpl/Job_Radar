import { afterEach, describe, expect, it } from "vitest";
import { isGmailConfigured, gmailUser } from "./email-config";

const ORIGINAL = {
  user: process.env.GMAIL_USER,
  pass: process.env.GMAIL_APP_PASSWORD,
};

afterEach(() => {
  if (ORIGINAL.user === undefined) delete process.env.GMAIL_USER;
  else process.env.GMAIL_USER = ORIGINAL.user;
  if (ORIGINAL.pass === undefined) delete process.env.GMAIL_APP_PASSWORD;
  else process.env.GMAIL_APP_PASSWORD = ORIGINAL.pass;
});

describe("gmail config", () => {
  it("requires both user and app password", () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    expect(isGmailConfigured()).toBe(false);
    process.env.GMAIL_USER = "owner@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
    expect(isGmailConfigured()).toBe(true);
    expect(gmailUser()).toBe("owner@gmail.com");
  });
});
