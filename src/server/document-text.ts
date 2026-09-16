const MAX_BYTES = 5 * 1024 * 1024;
const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TEXT = "text/plain";

export function isPdfMagic(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

export function isZipMagic(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

export function isAllowedResumeFile(file: File): boolean {
  if (file.size > MAX_BYTES) return false;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === PDF ||
    type === DOCX ||
    type === TEXT ||
    name.endsWith(".pdf") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt")
  );
}

export async function extractResumeText(file: File): Promise<string> {
  if (!isAllowedResumeFile(file)) {
    throw new Error("UNSUPPORTED_FILE");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (type === TEXT || name.endsWith(".txt")) {
    return buffer.toString("utf8");
  }

  if (type === DOCX || name.endsWith(".docx")) {
    if (!isZipMagic(buffer)) throw new Error("UNSUPPORTED_FILE");
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (type === PDF || name.endsWith(".pdf")) {
    if (!isPdfMagic(buffer)) throw new Error("UNSUPPORTED_FILE");
    try {
      const unpdf = await import("unpdf");
      const data = new Uint8Array(buffer);
      const pdf = await unpdf.getDocumentProxy(data);
      const extracted = await unpdf.extractText(pdf, { mergePages: true });
      const text = Array.isArray(extracted.text) ? extracted.text.join("\n") : extracted.text;
      return String(text ?? "").trim();
    } catch {
      throw new Error("PDF_PARSE_FAILED");
    }
  }

  throw new Error("UNSUPPORTED_FILE");
}
