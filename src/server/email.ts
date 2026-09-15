import "server-only";

import { Resend } from "resend";
import { isEmailConfigured, parseEmailFrom } from "@/lib/env";

export type EmailKind = "match_alert" | "daily_digest" | "notice";

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  kind: EmailKind;
};

export type EmailSendResult =
  | { ok: true; id: string }
  | { ok: false; error: "EMAIL_NOT_CONFIGURED" | "INVALID_RECIPIENT" | "RESEND_ERROR"; detail?: string };

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export function emailStatus(): {
  configured: boolean;
  functional: boolean;
  from: string | null;
  reason: string | null;
} {
  const from = parseEmailFrom(process.env.EMAIL_FROM);
  if (!process.env.RESEND_API_KEY?.trim()) {
    return {
      configured: false,
      functional: false,
      from,
      reason: "RESEND_API_KEY is missing (server-only). Emails are not sent.",
    };
  }
  if (!from) {
    return {
      configured: false,
      functional: false,
      from: null,
      reason: "EMAIL_FROM is missing or invalid. Use a verified Resend domain, not @example.com.",
    };
  }
  return {
    configured: true,
    functional: true,
    from,
    reason: "Both RESEND_API_KEY and EMAIL_FROM are set. Resend will still reject sends until the from domain is verified.",
  };
}

export async function sendJobRadarEmail(input: OutboundEmail): Promise<EmailSendResult> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" };
  }
  const to = input.to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "INVALID_RECIPIENT" };
  }
  const from = parseEmailFrom(process.env.EMAIL_FROM);
  const client = resendClient();
  if (!from || !client) {
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: [to],
      subject: input.subject,
      text: input.text,
      tags: [{ name: "jobradar_kind", value: input.kind }],
    });
    if (error) {
      return { ok: false, error: "RESEND_ERROR", detail: error.message };
    }
    return { ok: true, id: data?.id ?? "sent" };
  } catch (error) {
    return {
      ok: false,
      error: "RESEND_ERROR",
      detail: error instanceof Error ? error.message : "unknown",
    };
  }
}
