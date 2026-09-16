import { describe, expect, it } from "vitest";
import { extractResumeText, isPdfMagic, isZipMagic } from "./document-text";

describe("resume magic bytes", () => {
  it("accepts a real PDF header", () => {
    expect(isPdfMagic(Buffer.from("%PDF-1.7\n%"))).toBe(true);
    expect(isPdfMagic(Buffer.from("not a pdf"))).toBe(false);
  });

  it("rejects a .pdf name without %PDF- bytes", async () => {
    const file = new File([Buffer.from("hello world not a pdf")], "cv.pdf", { type: "application/pdf" });
    await expect(extractResumeText(file)).rejects.toThrow("UNSUPPORTED_FILE");
  });

  it("rejects a .docx name without ZIP bytes", async () => {
    const file = new File([Buffer.from("plain")], "cv.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(isZipMagic(Buffer.from("plain"))).toBe(false);
    await expect(extractResumeText(file)).rejects.toThrow("UNSUPPORTED_FILE");
  });
});
