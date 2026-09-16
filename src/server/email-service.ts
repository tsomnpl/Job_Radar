import "server-only";

import nodemailer from "nodemailer";
import {
  emailFromAddress,
  gmailAppPassword,
  gmailUser,
  isGmailConfigured,
} from "@/lib/email-config";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailSendResult =
  | { ok: true }
  | { ok: false; error: "EMAIL_NOT_CONFIGURED" | "INVALID_RECIPIENT" | "SMTP_ERROR"; detail?: string };

function validTo(to: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());
}

export async function sendEmail(to: string, subject: string, htmlBody: string, textBody?: string): Promise<EmailSendResult> {
  if (!isGmailConfigured()) return { ok: false, error: "EMAIL_NOT_CONFIGURED" };
  const recipient = to.trim();
  if (!validTo(recipient)) return { ok: false, error: "INVALID_RECIPIENT" };

  const user = gmailUser();
  const pass = gmailAppPassword();
  if (!user || !pass) return { ok: false, error: "EMAIL_NOT_CONFIGURED" };

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: emailFromAddress(),
      to: recipient,
      subject,
      html: htmlBody,
      text: textBody ?? htmlBody.replace(/<[^>]+>/g, " "),
    });
    return { ok: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "smtp_failed";
    console.error("[email]", "SMTP_ERROR", recipient, detail);
    return { ok: false, error: "SMTP_ERROR", detail };
  }
}
