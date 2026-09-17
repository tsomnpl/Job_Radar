import "server-only";

import { parseLang } from "@/i18n/messages";
import { withDb } from "@/lib/db";
import { absoluteAppUrl } from "@/lib/email-config";
import { officialApplicationUrl } from "@/lib/jobs";
import { formatDeadline, jobLifecycle } from "@/lib/job-lifecycle";
import { parseIntentHeuristic } from "@/lib/intent";
import { isEmailConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { rankJobsForUser } from "@/server/rank";
import { sendIdempotentEmail } from "@/server/email-log";
import { deadlineReminderEmail, newOpportunityEmail, weeklyDigestEmail } from "@/server/email-templates";
import { notifyUser } from "@/server/notifications";
import type { RankedJob } from "@/lib/types";

const ALERT_SCORE = 70;
const DAY_MS = 24 * 60 * 60 * 1000;

function officialMatches(jobs: RankedJob[]): RankedJob[] {
  return jobs.filter((job) => job.match.score >= ALERT_SCORE && officialApplicationUrl(job.sourceUrl));
}

function userLang(locale?: string | null) {
  return parseLang(locale);
}

export async function notifyOfficialApplication(input: {
  userId?: string;
  email: string | null;
  title: string;
  company: string;
  officialUrl: string;
}): Promise<void> {
  if (!isEmailConfigured() || !input.email) return;
  await sendIdempotentEmail({
    eventKey: input.userId ? `apply:${input.userId}:${input.officialUrl}` : `apply:${input.email}:${input.officialUrl}`,
    type: "application",
    userId: input.userId ?? null,
    to: input.email,
    lang: "fr",
    subject: `Candidature enregistrée — ${input.title}`,
    html: `<p>JobRadar a enregistré votre suivi pour ${input.title} chez ${input.company}.</p><p>Lien officiel : <a href="${input.officialUrl}">${input.officialUrl}</a></p>`,
    text: `JobRadar a enregistré votre suivi pour ${input.title} chez ${input.company}.\nLien officiel : ${input.officialUrl}`,
  });
}

async function radarQueryFor(user: {
  searches: { query: string }[];
  profile: { headline: string | null; keywordsJson?: string | null } | null;
}): Promise<string> {
  return user.searches[0]?.query || user.profile?.headline || "";
}

export async function sendNewOpportunityAlerts(): Promise<{ considered: number; sent: number; skipped: number }> {
  if (!isEmailConfigured()) return { considered: 0, sent: 0, skipped: 0 };

  const users = await withDb(
    "alerts.new.users",
    () =>
      prisma.user.findMany({
        where: {
          email: { not: null },
          emailNotifications: true,
          newOpportunityAlerts: true,
        },
        include: { profile: true, searches: { orderBy: { createdAt: "desc" }, take: 1 } },
        take: 80,
      }),
    [],
  );

  let sent = 0;
  let skipped = 0;
  const since = new Date(Date.now() - DAY_MS);

  for (const user of users) {
    if (!user.email) {
      skipped += 1;
      continue;
    }
    const query = await radarQueryFor(user);
    if (!query.trim()) {
      skipped += 1;
      continue;
    }
    const ranked = officialMatches(
      await rankJobsForUser({
        intent: parseIntentHeuristic(query),
        userId: user.id,
        limit: 8,
        minScore: ALERT_SCORE,
      }),
    ).filter((job) => job.postedAt >= since || (job.importedAt && job.importedAt >= since));
    if (!ranked.length) {
      skipped += 1;
      continue;
    }

    const lang = userLang(user.locale);
    const jobs = ranked.slice(0, 5).map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      score: job.match.score,
      href: absoluteAppUrl(`/jobs/${job.id}`),
      deadline: job.deadline ? formatDeadline(job.deadline) : null,
    }));
    const template = newOpportunityEmail(lang, jobs);
    const result = await sendIdempotentEmail({
      eventKey: `new:${user.id}:${since.toISOString().slice(0, 10)}`,
      type: "new_opportunity",
      userId: user.id,
      to: user.email,
      lang,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    if (!result.sent) {
      skipped += 1;
      continue;
    }
    await notifyUser({
      userId: user.id,
      type: "NEW_OPPORTUNITY",
      title: lang === "fr" ? "Nouvelles opportunités" : "New opportunities",
      body: template.subject,
      href: "/dashboard",
    });
    sent += 1;
  }

  return { considered: users.length, sent, skipped };
}

export async function sendDeadlineReminders(): Promise<{ considered: number; sent: number; skipped: number }> {
  if (!isEmailConfigured()) return { considered: 0, sent: 0, skipped: 0 };

  const users = await withDb(
    "alerts.deadline.users",
    () =>
      prisma.user.findMany({
        where: {
          email: { not: null },
          emailNotifications: true,
          deadlineAlerts: true,
        },
        include: {
          savedJobs: { include: { job: true } },
          applications: { include: { job: true } },
        },
        take: 80,
      }),
    [],
  );

  let sent = 0;
  let skipped = 0;
  const now = new Date();

  for (const user of users) {
    if (!user.email) {
      skipped += 1;
      continue;
    }
    const jobs = [...user.savedJobs, ...user.applications]
      .map((row) => row.job)
      .filter((job) => jobLifecycle(job.deadline, now) === "closing_soon");
    const unique = new Map(jobs.map((job) => [job.id, job]));
    if (!unique.size) {
      skipped += 1;
      continue;
    }
    const lang = userLang(user.locale);
    for (const job of unique.values()) {
      if (!job.deadline) continue;
      const template = deadlineReminderEmail(lang, {
        title: job.title,
        company: job.company,
        href: absoluteAppUrl(`/jobs/${job.id}`),
        deadline: formatDeadline(job.deadline),
      });
      const result = await sendIdempotentEmail({
        eventKey: `deadline:${user.id}:${job.id}:${job.deadline.toISOString().slice(0, 10)}`,
        type: "deadline",
        userId: user.id,
        jobId: job.id,
        to: user.email,
        lang,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      if (result.sent) {
        sent += 1;
        await notifyUser({
          userId: user.id,
          type: "DEADLINE",
          title: template.subject,
          body: `${job.title} · ${job.company}`,
          href: `/jobs/${job.id}`,
        });
      } else {
        skipped += 1;
      }
    }
  }

  return { considered: users.length, sent, skipped };
}

export async function sendWeeklyDigests(): Promise<{ considered: number; sent: number; skipped: number }> {
  if (!isEmailConfigured()) return { considered: 0, sent: 0, skipped: 0 };

  const users = await withDb(
    "alerts.digest.users",
    () =>
      prisma.user.findMany({
        where: {
          email: { not: null },
          emailNotifications: true,
          weeklyDigest: true,
        },
        include: { profile: true, searches: { orderBy: { createdAt: "desc" }, take: 1 } },
        take: 80,
      }),
    [],
  );

  let sent = 0;
  let skipped = 0;
  const weekKey = new Date().toISOString().slice(0, 10);

  for (const user of users) {
    if (!user.email) {
      skipped += 1;
      continue;
    }
    const query = await radarQueryFor(user);
    const ranked = query.trim()
      ? officialMatches(
          await rankJobsForUser({
            intent: parseIntentHeuristic(query),
            userId: user.id,
            limit: 8,
            minScore: ALERT_SCORE,
          }),
        )
      : [];
    const lang = userLang(user.locale);
    const template = weeklyDigestEmail(
      lang,
      ranked.slice(0, 8).map((job) => ({
        title: job.title,
        company: job.company,
        score: job.match.score,
        href: absoluteAppUrl(`/jobs/${job.id}`),
      })),
    );
    const result = await sendIdempotentEmail({
      eventKey: `digest:${user.id}:${weekKey}`,
      type: "weekly_digest",
      userId: user.id,
      to: user.email,
      lang,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    if (result.sent) sent += 1;
    else skipped += 1;
  }

  return { considered: users.length, sent, skipped };
}

/** @deprecated Use sendNewOpportunityAlerts */
export const sendDailyMatchDigests = sendNewOpportunityAlerts;
