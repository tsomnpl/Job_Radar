import "server-only";

import { withDb } from "@/lib/db";
import { officialApplicationUrl } from "@/lib/jobs";
import { parseIntentHeuristic } from "@/lib/intent";
import { prisma } from "@/lib/prisma";
import { rankJobsForUser } from "@/server/rank";
import { sendJobRadarEmail } from "@/server/email";
import { isEmailConfigured } from "@/lib/env";
import type { RankedJob } from "@/lib/types";

const ALERT_SCORE = 70;
const ALERT_COOLDOWN_MS = 20 * 60 * 60 * 1000;

function officialMatches(jobs: RankedJob[]): RankedJob[] {
  return jobs.filter((job) => job.match.score >= ALERT_SCORE && officialApplicationUrl(job.sourceUrl));
}

function digestText(jobs: RankedJob[]): string {
  const lines = jobs.slice(0, 8).map((job) => {
    const url = officialApplicationUrl(job.sourceUrl);
    return `- ${job.title} · ${job.company} (${job.match.score}%)\n  ${url}`;
  });
  return [
    "JobRadar — Your next opportunity, before you miss it.",
    "",
    "Offres vérifiées qui matchent votre profil. JobRadar n'invente aucune offre.",
    "",
    ...lines,
    "",
    "Postuler uniquement via l'URL officielle ci-dessus.",
  ].join("\n");
}

export async function notifyOfficialApplication(input: {
  email: string | null;
  title: string;
  company: string;
  officialUrl: string;
}): Promise<void> {
  if (!isEmailConfigured() || !input.email) return;
  await sendJobRadarEmail({
    kind: "notice",
    to: input.email,
    subject: `Candidature enregistrée — ${input.title}`,
    text: [
      `JobRadar a enregistré votre suivi pour ${input.title} chez ${input.company}.`,
      "",
      "Le formulaire de candidature n'est pas sur JobRadar. Lien officiel :",
      input.officialUrl,
    ].join("\n"),
  });
}

export async function sendDailyMatchDigests(): Promise<{ considered: number; sent: number; skipped: number }> {
  if (!isEmailConfigured()) {
    return { considered: 0, sent: 0, skipped: 0 };
  }

  const users = await withDb(
    "alerts.users",
    () =>
      prisma.user.findMany({
        where: { email: { not: null } },
        include: { profile: true, searches: { orderBy: { createdAt: "desc" }, take: 1 } },
        take: 50,
      }),
    [],
  );

  let sent = 0;
  let skipped = 0;
  const now = Date.now();

  for (const user of users) {
    if (!user.email) {
      skipped += 1;
      continue;
    }
    if (user.lastAlertEmailAt && now - user.lastAlertEmailAt.getTime() < ALERT_COOLDOWN_MS) {
      skipped += 1;
      continue;
    }

    const query = user.searches[0]?.query || user.profile?.headline || "";
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
    );
    if (!ranked.length) {
      skipped += 1;
      continue;
    }

    const result = await sendJobRadarEmail({
      kind: "daily_digest",
      to: user.email,
      subject: `${ranked.length} opportunité${ranked.length > 1 ? "s" : ""} sur votre radar`,
      text: digestText(ranked),
    });
    if (!result.ok) {
      skipped += 1;
      continue;
    }
    await withDb(
      "alerts.stamp",
      () => prisma.user.update({ where: { id: user.id }, data: { lastAlertEmailAt: new Date() } }),
      null,
    );
    sent += 1;
  }

  return { considered: users.length, sent, skipped };
}
