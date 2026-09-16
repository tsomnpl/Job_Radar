import type { AppLang } from "@/i18n/messages";
import { parseLang } from "@/i18n/messages";
import { testEmailRecipient } from "@/lib/email-config";
import { sendIdempotentEmail } from "@/server/email-log";
import { testEmail, welcomeEmail } from "@/server/email-templates";

export async function sendWelcomeEmail(input: {
  userId: string;
  email: string | null;
  name: string | null;
  locale?: string | null;
}): Promise<void> {
  if (!input.email) return;
  const lang: AppLang = parseLang(input.locale);
  const template = welcomeEmail(lang, input.name);
  await sendIdempotentEmail({
    eventKey: `welcome:${input.userId}`,
    type: "welcome",
    userId: input.userId,
    to: input.email,
    lang,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendAdminTestEmail(to?: string | null, locale?: string | null) {
  const recipient = to?.trim() || testEmailRecipient();
  if (!recipient) return { sent: false, skipped: false, error: "EMAIL_NOT_CONFIGURED" as const };
  const lang: AppLang = parseLang(locale);
  const template = testEmail(lang);
  return sendIdempotentEmail({
    eventKey: `test:${recipient}:${new Date().toISOString().slice(0, 16)}`,
    type: "test",
    to: recipient,
    lang,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
