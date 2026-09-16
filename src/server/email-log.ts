import { logDbError } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/server/email-service";
import type { AppLang } from "@/i18n/messages";

export async function sendIdempotentEmail(input: {
  eventKey: string;
  type: string;
  userId?: string | null;
  jobId?: string | null;
  to: string;
  lang: AppLang;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; skipped: boolean; error?: string }> {
  try {
    const existing = await prisma.emailLog.findUnique({ where: { eventKey: input.eventKey } });
    if (existing?.status === "sent") return { sent: false, skipped: true };
  } catch (error) {
    logDbError("emailLog.lookup", error);
  }

  const result = await sendEmail(input.to, input.subject, input.html, input.text);
  const status = result.ok ? "sent" : "failed";
  try {
    await prisma.emailLog.upsert({
      where: { eventKey: input.eventKey },
      update: {
        status,
        error: result.ok ? null : result.error,
        sentAt: result.ok ? new Date() : null,
      },
      create: {
        eventKey: input.eventKey,
        type: input.type,
        userId: input.userId ?? null,
        jobId: input.jobId ?? null,
        status,
        error: result.ok ? null : result.error,
        sentAt: result.ok ? new Date() : null,
      },
    });
  } catch (error) {
    logDbError("emailLog.write", error);
  }
  if (!result.ok) return { sent: false, skipped: false, error: result.error };
  return { sent: true, skipped: false };
}
