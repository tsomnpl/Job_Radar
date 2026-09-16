import { NextResponse } from "next/server";
import { isPersistedUser, requireUser } from "@/lib/auth";
import { asJsonArray } from "@/lib/normalize";
import { withDb } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { rejectIfRateLimited } from "@/lib/rate-limit";
import { answerOpportunityCopilot } from "@/server/copilot";
import { matchOneJob } from "@/server/rank";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const limited = rejectIfRateLimited(request, "copilot", 15);
    if (limited) return limited;
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { question?: string } | null;
    const question = body?.question?.trim() ?? "";
    if (question.length < 4) {
      return NextResponse.json({ error: "QUESTION_REQUIRED" }, { status: 400 });
    }

    const matched = await matchOneJob({ jobId: id, userId: user.id });
    if (!matched) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const profile = isPersistedUser(user)
      ? await withDb("copilot.profile", () => prisma.profile.findUnique({ where: { userId: user.id } }), null)
      : null;

    const result = await answerOpportunityCopilot({
      job: matched.job,
      match: matched.match,
      profile: profile
        ? {
            headline: profile.headline,
            summary: profile.summary ?? "",
            skills: asJsonArray(profile.skillsJson),
            languages: asJsonArray(profile.languagesJson),
            locations: asJsonArray(profile.locationsJson),
            education: profile.education,
            seniority: profile.seniority,
          }
        : null,
      question,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: "COPILOT_FAILED" }, { status: 500 });
  }
}
