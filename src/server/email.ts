import "server-only";

import { emailFromAddress, isGmailConfigured } from "@/lib/email-config";
import { sendEmail } from "@/server/email-service";

export type EmailKind = "match_alert" | "daily_digest" | "notice" | "welcome" | "deadline" | "test";

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  kind: EmailKind;
};

export type EmailSendResult =
  | { ok: true }
  | { ok: false; error: "EMAIL_NOT_CONFIGURED" | "INVALID_RECIPIENT" | "SMTP_ERROR"; detail?: string };

export function emailStatus(): {
  configured: boolean;
  functional: boolean;
  from: string | null;
  transport: "gmail-smtp" | "none";
  reason: string | null;
} {
  if (!isGmailConfigured()) {
    return {
      configured: false,
      functional: false,
      from: null,
      transport: "none",
      reason: "GMAIL_USER and GMAIL_APP_PASSWORD are missing. Emails are not sent.",
    };
  }
  return {
    configured: true,
    functional: true,
    from: emailFromAddress(),
    transport: "gmail-smtp",
    reason: "Gmail SMTP smtp.gmail.com:587. Requires a Google App Password, not the account login password.",
  };
}

export async function sendJobRadarEmail(input: OutboundEmail): Promise<EmailSendResult> {
  return sendEmail(input.to, input.subject, input.html ?? input.text.replace(/\n/g, "<br/>"), input.text);
}
