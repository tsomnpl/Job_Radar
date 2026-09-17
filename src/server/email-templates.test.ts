import { describe, expect, it } from "vitest";
import { testEmail, welcomeEmail } from "./email-templates";

describe("email templates", () => {
  it("never invents an opportunity in welcome or test copy", () => {
    const welcome = welcomeEmail("fr", "Isaac");
    expect(welcome.subject).toMatch(/Bienvenue/);
    expect(welcome.html).not.toMatch(/CertiK|deadline invent/i);
    const test = testEmail("en");
    expect(test.html.toLowerCase()).toContain("not an opportunity alert");
  });
});
